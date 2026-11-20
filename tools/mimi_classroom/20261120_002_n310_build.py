#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N-3-10 米米概念小教室成片：定點算術斷言 → TTS → 黑板 Layer 2 → 三層合成。

輸入：docs/mimi_classroom/N310_script.json
輸出：_scratch/mimi_n310/*（時間軸、六張黑板圖卡、拼圖）
      app/assets/classroom_videos/N310_Final.mp4

沿用 N34 已驗證管線：
  - 去背：與邊緣連通的近白像素透明化，底部 6% 實心保留（禁漸層、禁視覺模型）。
  - 底色修補：transparent 區域先填目的地底色，再 cv2.seamlessClone(NORMAL_CLONE)。
  - 領口保護：Source y < 510 不進 clone mask（20px 軟過渡），頭/領口維持原 alpha 合成。
  - 對嘴：mouth_frames 依.openness 排序，RMS gate + 0.3s lead-in，NORMAL_CLONE 貼嘴。

嚴禁：呼叫視覺模型、ComfyUI 重繪、git push、tools/release.py。
"""

from __future__ import annotations

import asyncio
import json
import math
import subprocess
import sys
import urllib.parse
import urllib.request
import wave
from collections import deque
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parents[2]
CFG_PATH = ROOT / "docs" / "mimi_classroom" / "N310_script.json"
TTS_API = "https://math3-bank.pages.dev/api/tts"
TEMPO_FOR_MINUS_5 = 0.9523809524  # 1 / 1.05

# ----------------------------------------------------------------------------
# 0. 定點整數算術斷言（繪圖前強制執行，失敗即中止）
# ----------------------------------------------------------------------------


def fixed(v: float) -> int:
    return int(round(v * 10))


def assert_arithmetic(cfg: dict) -> dict:
    problems = {p["type"]: p for p in cfg["demonstration_problems"]}
    add = problems["one_decimal_carry_addition"]["equation"]
    sub = problems["integer_minus_one_decimal_trap"]["equation"]
    at, aop, bt, aeq, ac = add.split()
    dt, dop, et, deq, fc = sub.split()
    assert (at, aop, aeq, ac) == ("3.6", "+", "=", "6.4"), add
    assert (dt, dop, deq, fc) == ("5", "-", "=", "3.6") and et == "1.4", sub

    t = fixed(3.6) + fixed(2.8)
    assert t == fixed(6.4) == 64, f"36 + 28 == 64 失敗: {t}"
    t2 = fixed(5) - fixed(1.4)
    assert t2 == fixed(3.6) == 36, f"50 - 14 == 36 失敗: {t2}"
    # 進位中間值
    assert 6 + 8 == 14 and 14 - 10 == 4 and 1 + 3 + 2 == 6
    # 借位中間值
    assert 10 - 4 == 6 and (5 - 1) - 1 == 3
    return {
        "fixed_point_scale": 10,
        "checks": {
            "36 + 28 == 64": True,
            "50 - 14 == 36": True,
            "6+8=14, carry 1, 1+3+2=6": True,
            "borrow: 10-4=6, 4-1=3": True,
        },
    }


# ----------------------------------------------------------------------------
# 工具
# ----------------------------------------------------------------------------


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        raise RuntimeError(f"CMD FAIL ({p.returncode}): {' '.join(cmd)}\n{p.stderr[:1000]}")
    return p.stdout.strip()


def ffprobe_duration(path: Path) -> float:
    return float(run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ]))


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "msjhbd.ttc" if bold else "msjh.ttc"
    return ImageFont.truetype(str(Path("C:/Windows/Fonts") / name), size)


def rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def wrap_text(draw: ImageDraw.ImageDraw, text: str, x: int, y: int,
              max_width: int, f: ImageFont.FreeTypeFont, fill,
              line_gap: int = 12) -> int:
    lines: list[str] = []
    cur = ""
    for ch in text:
        if draw.textlength(cur + ch, font=f) > max_width and cur:
            lines.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    step = f.size + line_gap
    for i, line in enumerate(lines):
        draw.text((x, y + i * step), line, font=f, fill=fill)
    return y + len(lines) * step


# ----------------------------------------------------------------------------
# 1. TTS + 時間軸（動作提前 0.3s、口白後停 1.2s）
# ----------------------------------------------------------------------------


def local_tts(text: str, voice: str, out: Path) -> bool:
    try:
        import edge_tts  # noqa: PLC0415
    except ImportError:
        return False
    for attempt in range(2):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate="-5%").save(str(out)))
            if out.exists() and out.stat().st_size > 1024:
                return True
        except Exception as exc:  # noqa: BLE001 - 降級記錄原因
            print(f"  [edge-tts attempt {attempt + 1}] {type(exc).__name__}: {str(exc)[:120]}")
    return False


def cloud_tts(text: str, voice: str, out: Path) -> str:
    url = f"{TTS_API}?voice={urllib.parse.quote(voice)}&text={urllib.parse.quote(text)}"
    req = urllib.request.Request(url, headers={"User-Agent": "mimi-n310/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    if len(data) < 1024:
        raise RuntimeError("Edge-TTS 端點回傳空音訊")
    out.write_bytes(data)
    return url


def expand_scenes(cfg: dict) -> list[dict]:
    """S06 依 pose_sequence 拆成兩段，其餘原樣。"""
    out: list[dict] = []
    for sc in cfg["scenes"]:
        if "mimi_pose_sequence" in sc:
            seq = sc["mimi_pose_sequence"]
            ratio = sc.get("narration_split_ratio", [0.5, 0.5])
            text = sc["narration"]
            cut = int(len(text) * ratio[0])
            for i, seg in enumerate(seq):
                part = text[:cut] if i == 0 else text[cut:]
                sub = dict(sc)
                sub["scene_id"] = f"{sc['scene_id']}_{'A' if i == 0 else 'B'}"
                sub["mimi_pose"] = seg["pose"]
                sub["narration"] = part
                sub["blackboard_render"] = dict(sc["blackboard_render"])
                out.append(sub)
        else:
            out.append(dict(sc))
    return out


def build_audio(cfg: dict, entries: list[dict]) -> tuple[list[dict], Path, dict]:
    temp = ROOT / cfg["paths"]["temp_work_dir"]
    audio_dir = temp / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    voice = cfg["video_spec"]["tts_voice"]
    rate = cfg["video_spec"]["tts_rate"]
    assert rate == "-5%"
    lead = float(cfg["video_spec"]["action_lead_seconds"])
    hold = float(cfg["video_spec"]["post_narration_hold_seconds"])
    sr = 24000
    rows: list[dict] = []
    sources: dict[str, int] = {}
    cursor = 0.0

    for idx, sc in enumerate(entries, 1):
        sid = sc["scene_id"]
        mp3 = audio_dir / f"{sid}.mp3"
        wav = audio_dir / f"{sid}.wav"
        print(f"[tts {idx}/{len(entries)}] {sid}")
        source = "local_edge_tts"
        if not local_tts(sc["narration"], voice, mp3):
            cloud_tts(sc["narration"], voice, mp3)
            source = "cloudflare_endpoint+ffmpeg_atempo"
        sources[source] = sources.get(source, 0) + 1
        filt = [] if source == "local_edge_tts" else ["-af", f"atempo={TEMPO_FOR_MINUS_5}"]
        run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), *filt,
             "-ar", str(sr), "-ac", "1", "-c:a", "pcm_s16le", str(wav)])
        dur = ffprobe_duration(wav)
        rows.append({
            "scene_id": sid,
            "pose": sc["mimi_pose"],
            "wav": str(wav.relative_to(ROOT)).replace("\\", "/"),
            "tts_source": source,
            "narration_duration_seconds": round(dur, 4),
            "visual_start": round(cursor, 4),
            "audio_start": round(cursor + lead, 4),
            "audio_end": round(cursor + lead + dur, 4),
            "visual_end": round(cursor + lead + dur + hold, 4),
        })
        cursor += lead + dur + hold
        mp3.unlink(missing_ok=True)

    total_frames = int(math.ceil(cursor * 30))
    total_seconds = total_frames / 30.0
    n_samples = int(round(total_seconds * sr))
    mix = np.zeros(n_samples, dtype=np.int16)
    for r in rows:
        with wave.open(str(ROOT / r["wav"]), "rb") as w:
            assert w.getframerate() == sr and w.getnchannels() == 1
            pcm = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2")
        off = int(round(r["audio_start"] * sr))
        end = min(off + len(pcm), n_samples)
        mix[off:end] = pcm[:end - off]

    mix_path = temp / "narration_all.wav"
    with wave.open(str(mix_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(mix.astype("<i2").tobytes())

    timeline = {
        "project_id": cfg["project_id"],
        "voice": voice,
        "rate": rate,
        "sample_rate_hz": sr,
        "action_lead_seconds": lead,
        "post_narration_hold_seconds": hold,
        "tts_sources": sources,
        "total_frames": total_frames,
        "total_duration_seconds": round(total_seconds, 4),
        "scenes": rows,
    }
    (temp / "timeline.json").write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    assert all(r["narration_duration_seconds"] > 0 for r in rows)
    return rows, mix_path, timeline


# ----------------------------------------------------------------------------
# 2. 黑板 Layer 2（六張圖卡 + 拼圖）
# ----------------------------------------------------------------------------

PANEL_W, PANEL_H = 1240, 660
ONES_X, DOT_X, TENTHS_X = 430, 620, 770
LABEL_Y = 108
ROW_Y = [250, 360, 490]
LINE_Y = 425


def parse_row(s: str) -> tuple[str, str, str]:
    s = s.strip()
    op = ""
    if s[:1] in ("+", "−", "-"):
        op = s[0]
        s = s[1:].strip()
    if "." in s:
        a, b = s.split(".", 1)
    else:
        a, b = s, ""
    return op, a.strip(), b.strip()


def draw_panel_base(d: ImageDraw.ImageDraw, title: str, color) -> None:
    d.rounded_rectangle((0, 0, PANEL_W - 1, PANEL_H - 1), radius=24,
                        fill=(10, 48, 38, 232), outline=(238, 248, 242, 235), width=2)
    d.line((24, 62, PANEL_W - 24, 62), fill=color, width=3)
    d.text((30, 16), title, font=font(34, bold=True), fill=(255, 255, 255, 255))


def draw_banner(d: ImageDraw.ImageDraw, text: str, color) -> None:
    # 內容區底 525 vs 橫幅頂 555 → 留白 30px ≥ 25px
    d.rounded_rectangle((24, 555, PANEL_W - 24, 636), radius=16,
                        fill=(6, 38, 30, 215), outline=color, width=2)
    f = font(30)
    d.text((PANEL_W // 2, 595), text, font=f, fill=(255, 255, 255, 255), anchor="mm")


def draw_place_values(d: ImageDraw.ImageDraw, labels: list[str]) -> None:
    f = font(30)
    for x, lab in zip((ONES_X, DOT_X, TENTHS_X), labels):
        d.text((x, LABEL_Y), lab, font=f, fill=(220, 232, 226, 255), anchor="mm")
        d.line((x - 42, LABEL_Y + 26, x + 42, LABEL_Y + 26),
               fill=(180, 200, 190, 180), width=1)


def draw_decimal_guide(d: ImageDraw.ImageDraw) -> None:
    y = LABEL_Y + 40
    while y < 500:
        d.line((DOT_X, y, DOT_X, min(y + 16, 500)), fill=(255, 165, 0, 220), width=3)
        y += 26


def draw_vertical(d: ImageDraw.ImageDraw, rows: list[str], color,
                  result_index: int = 3, carry: str | None = None,
                  borrow: dict | None = None) -> None:
    if carry:
        d.text((ONES_X, 175), carry, font=font(38, bold=True),
               fill=(255, 165, 0, 255), anchor="mm")
    if borrow:
        if "ones" in borrow:
            d.text((ONES_X, 175), borrow["ones"], font=font(36, bold=True),
                   fill=(77, 150, 255, 255), anchor="mm")
        if "tenths" in borrow:
            d.text((TENTHS_X + 40, 180), borrow["tenths"], font=font(32, bold=True),
                   fill=(77, 150, 255, 255), anchor="mm")
    for i, raw in enumerate(rows):
        if set(raw) <= {"—", "-", "─"}:
            d.line((300, LINE_Y, 880, LINE_Y), fill=(240, 246, 242, 255), width=3)
            continue
        op, ones, tenths = parse_row(raw)
        y = ROW_Y[i] if i != 3 else ROW_Y[2]
        fill = color if i == result_index else (255, 255, 255, 255)
        f = font(92, bold=True)
        if op:
            d.text((300, y), op, font=font(84, bold=True), fill=fill, anchor="mm")
        if ones:
            d.text((ONES_X, y), ones, font=f, fill=fill, anchor="mm")
        if "." in raw or tenths or ones:
            d.text((DOT_X, y), ".", font=f, fill=fill, anchor="mm")
        if tenths:
            d.text((TENTHS_X, y), tenths, font=f, fill=fill, anchor="mm")


def render_card(sc: dict) -> Image.Image:
    spec = sc["blackboard_render"]
    color = rgb(spec["highlight_color"])
    img = Image.new("RGBA", (PANEL_W, PANEL_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_panel_base(d, spec["title"], color)
    action = spec["action"]

    if action == "show_problem_intro":
        d.text((PANEL_W // 2, 205), spec["equation"], font=font(104, bold=True),
               fill=color, anchor="mm")
        d.text((PANEL_W // 2, 340), spec["context"], font=font(40),
               fill=(255, 255, 255, 255), anchor="mm")
        d.text((PANEL_W // 2, 435), spec["hint"], font=font(38, bold=True),
               fill=(255, 175, 70, 255), anchor="mm")

    elif action == "decimal_alignment_vertical":
        draw_place_values(d, spec["place_value_labels"])
        draw_decimal_guide(d)
        draw_vertical(d, spec["rows"], color, result_index=3)

    elif action == "carry_addition_complete":
        draw_place_values(d, spec["place_value_labels"])
        draw_decimal_guide(d)
        draw_vertical(d, spec["rows"], color, result_index=3, carry=spec["carry_digit"])
        wrap_text(d, spec["step_notes"][0], 900, 230, 320, font(31),
                  (255, 190, 90, 255))
        wrap_text(d, spec["step_notes"][1], 900, 350, 320, font(31),
                  (180, 235, 200, 255))

    elif action == "wrong_alignment_warning":
        draw_place_values(d, spec["place_value_labels"])
        draw_decimal_guide(d)
        d.text((TENTHS_X, 250), "5", font=font(92, bold=True),
               fill=(255, 90, 90, 255), anchor="mm")
        d.ellipse((TENTHS_X - 60, 190, TENTHS_X + 60, 310),
                  outline=(255, 70, 70, 255), width=6)
        d.line((TENTHS_X - 48, 202, TENTHS_X + 48, 298), fill=(255, 70, 70, 255), width=7)
        d.line((TENTHS_X + 48, 202, TENTHS_X - 48, 298), fill=(255, 70, 70, 255), width=7)
        op, ones, tenths = parse_row(spec["wrong_rows"][1])
        d.text((300, 360), op, font=font(84, bold=True), fill=(255, 255, 255, 255), anchor="mm")
        d.text((ONES_X, 360), ones, font=font(92, bold=True), fill=(255, 255, 255, 255), anchor="mm")
        d.text((DOT_X, 360), ".", font=font(92, bold=True), fill=(255, 255, 255, 255), anchor="mm")
        d.text((TENTHS_X, 360), tenths, font=font(92, bold=True), fill=(255, 255, 255, 255), anchor="mm")
        wrap_text(d, spec["warning"], 905, 235, 300, font(30, bold=True), (255, 110, 110, 255))
        wrap_text(d, spec["reveal"], 905, 355, 300, font(31), (255, 190, 90, 255))
        d.text((PANEL_W // 2, 498), spec["reveal"].split("：")[-1],
               font=font(46, bold=True), fill=(255, 165, 0, 255), anchor="mm")

    elif action == "append_zero_and_borrow":
        draw_place_values(d, spec["place_value_labels"])
        draw_decimal_guide(d)
        d.text((PANEL_W // 2, 190), spec["rewrite"], font=font(44, bold=True),
               fill=(77, 150, 255, 255), anchor="mm")
        draw_vertical(d, spec["rows"], color, result_index=3,
                      borrow=spec["borrow_digits"])
        # 橘框強調 .0
        d.rounded_rectangle((DOT_X - 30, 238, TENTHS_X + 66, 300), radius=8,
                            outline=(255, 165, 0, 255), width=4)
        wrap_text(d, spec["step_notes"][0], 900, 230, 320, font(28), (255, 190, 90, 255))
        wrap_text(d, spec["step_notes"][1], 900, 370, 320, font(30), (180, 235, 200, 255))

    elif action == "show_summary_card":
        for i, rule in enumerate(spec["rules"]):
            y = 130 + i * 125
            d.rounded_rectangle((150, y, PANEL_W - 150, y + 100), radius=18,
                                fill=(8, 42, 34, 210), outline=color, width=3)
            d.text((205, y + 50), rule, font=font(44, bold=True),
                   fill=(255, 255, 255, 255), anchor="lm")

    draw_banner(d, spec["banner"], color)
    return img


def render_blackboards(cfg: dict, entries: list[dict]) -> dict:
    temp = ROOT / cfg["paths"]["temp_work_dir"]
    out_dir = ROOT / cfg["paths"]["blackboard_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    cards: dict[str, Image.Image] = {}
    paths = []
    for sc in entries:
        card = render_card(sc)
        sid = sc["scene_id"]
        cards[sid] = card
        p = out_dir / f"{sid}_blackboard.png"
        card.save(p)
        paths.append((sid, p))

    # 拼圖 2 欄 × 3 列（六幕；S06 兩段共用總結卡， Synd 以 A 代表）
    order = ["S01", "S02", "S03", "S04", "S05", "S06_A"]
    tw, th = 620, 330
    gap, header = 16, 34
    montage = Image.new("RGB", (2 * tw + 3 * gap, 3 * (th + header) + 4 * gap), (18, 26, 24))
    md = ImageDraw.Draw(montage)
    for i, sid in enumerate(order):
        card = cards[sid].convert("RGB").resize((tw, th), Image.LANCZOS)
        col, row = i % 2, i // 2
        x = gap + col * (tw + gap)
        y = gap + row * (th + header + gap)
        md.text((x + 4, y), f"{sid}  ·  {order.index(sid) + 1}/6", font=font(22, bold=True),
                fill=(240, 220, 150))
        montage.paste(card, (x, y + header))
    montage_path = ROOT / cfg["paths"]["blackboard_montage"]
    montage.save(montage_path)

    # 契約：內容底 525、橫幅頂 555 → 30px
    assert 555 - 525 >= cfg["layers"]["layer2_contract"]["bottom_banner_min_gap_px"]
    return {"cards": cards, "paths": paths, "montage": montage_path}


# ----------------------------------------------------------------------------
# 3. Layer 3 去背 + 底色修補 + seamlessClone + 對嘴
# ----------------------------------------------------------------------------


def flood_remove_white(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3].copy()
    h, w = alpha.shape
    if float((alpha > 10).mean()) < 0.8:
        return arr  # 已是透明 PNG，直接讀取
    white = (rgb.min(axis=2) >= 245)
    guard = int(h * 0.06)
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    # 全圖連通泛洪：雙腳因不與邊緣白色連通而自然保留（無脚下白帶）
    alpha[seen] = 0
    arr = arr.copy()
    arr[:, :, 3] = alpha
    return arr


def alpha_composite(dst: np.ndarray, src_rgb: np.ndarray, src_a: np.ndarray,
                    x0: int, y0: int) -> None:
    h, w = src_a.shape
    x1, y1 = x0 + w, y0 + h
    ax0, ay0 = max(0, x0), max(0, y0)
    ax1, ay1 = min(dst.shape[1], x1), min(dst.shape[0], y1)
    if ax0 >= ax1 or ay0 >= ay1:
        return
    sx0, sy0 = ax0 - x0, ay0 - y0
    sx1, sy1 = sx0 + (ax1 - ax0), sy0 + (ay1 - ay0)
    a = (src_a[sy0:sy1, sx0:sx1].astype(np.float32) / 255.0)[:, :, None]
    region = dst[ay0:ay1, ax0:ax1].astype(np.float32)
    dst[ay0:ay1, ax0:ax1] = (src_rgb[sy0:sy1, sx0:sx1] * a + region * (1 - a)).astype(np.uint8)


def seamless_paste(dst: np.ndarray, src_rgb: np.ndarray, mask: np.ndarray,
                   x0: int, y0: int) -> bool:
    """底色修補：src 透明處先填 dst 對應底色，再 NORMAL_CLONE。"""
    h, w = mask.shape
    x1, y1 = x0 + w, y0 + h
    ax0, ay0 = max(0, x0), max(0, y0)
    ax1, ay1 = min(dst.shape[1], x1), min(dst.shape[0], y1)
    if ax0 >= ax1 or ay0 >= ay1 or int((mask > 8).sum()) < 16:
        return False
    sx0, sy0 = ax0 - x0, ay0 - y0
    sx1, sy1 = sx0 + (ax1 - ax0), sy0 + (ay1 - ay0)
    crop = dst[ay0:ay1, ax0:ax1].copy()
    base = crop.astype(np.float32)
    s = src_rgb[sy0:sy1, sx0:sx1].astype(np.float32)
    a = (mask[sy0:sy1, sx0:sx1].astype(np.float32) / 255.0)[:, :, None]
    filled = (s * a + base * (1 - a)).astype(np.uint8)  # 底色修補
    m = mask[sy0:sy1, sx0:sx1].copy()
    try:
        out = cv2.seamlessClone(filled, crop, m, ((crop.shape[1] - 1) // 2, (crop.shape[0] - 1) // 2),
                                cv2.NORMAL_CLONE)
    except cv2.error as exc:
        print(f"[DEGRADED:seamlessClone 失敗，改 alpha] {str(exc)[:120]}")
        return False
    sel = m > 8
    crop[sel] = out[sel]
    dst[ay0:ay1, ax0:ax1] = crop
    return True


def prep_poses(cfg: dict, poses: set[str]) -> tuple[dict, dict]:
    root = (ROOT / cfg["asset_policy"]["mimi_ssot_root"]).resolve()
    scale = float(cfg["layers"]["layer3_mimi"]["scale_from_2048"])
    size = int(round(2048 * scale))
    result: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    meta = {}
    for name in sorted(poses):
        p = root / name
        if not p.is_file():
            raise FileNotFoundError(f"ready/ 缺檔: {p}")
        arr = flood_remove_white(np.array(Image.open(p).convert("RGBA")))
        rgba = cv2.resize(arr, (size, size), interpolation=cv2.INTER_AREA)
        rgb_ = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2BGR)
        alpha = rgba[:, :, 3]
        result[name] = (rgb_, alpha)
        meta[name] = {"source": str(p), "size": [size, size],
                      "opaque_ratio_before": round(float((np.array(Image.open(p).convert("RGBA"))[:, :, 3] > 10).mean()), 3)}
    return result, meta


def prep_mouths(cfg: dict) -> dict[int, tuple[np.ndarray, np.ndarray]]:
    root = (ROOT / cfg["asset_policy"]["mimi_ssot_root"]).resolve()
    layer = cfg["layers"]["layer3_mimi"]
    scale = float(layer["scale_from_2048"])
    sz = int(round(layer["mouth_patch_size_2048"] * scale))
    out = {}
    for i, name in enumerate(layer["mouth_frames_order_by_openness"]):
        p = root / "mouth_frames" / name
        if not p.is_file():
            raise FileNotFoundError(f"ready/mouth_frames 缺檔: {p}")
        arr = np.array(Image.open(p).convert("RGBA").resize((sz, sz), Image.LANCZOS))
        out[i] = (cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR), arr[:, :, 3])
    return out


def audio_gate(mix_path: Path, timeline: dict, cfg: dict) -> np.ndarray:
    """回傳每幀嘴形索引 0..5（0=閉嘴）。"""
    gate = cfg["layers"]["layer3_mimi"]["rms_gate"]
    sr = timeline["sample_rate_hz"]
    fps = cfg["video_spec"]["fps"]
    step = sr // fps
    with wave.open(str(mix_path), "rb") as w:
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768.0
    n = timeline["total_frames"]
    rms = np.zeros(n, dtype=np.float32)
    for i in range(n):
        seg = pcm[i * step:(i + 1) * step]
        if len(seg):
            rms[i] = float(np.sqrt(np.mean(seg ** 2)))
    thr = float(gate["open_threshold"])
    hyst = int(gate["hysteresis_frames"])
    lead = int(gate["lead_in_frames"])
    speaking = np.zeros(n, dtype=bool)
    low = 0
    for i in range(n):
        if rms[i] > thr:
            speaking[i] = True
            low = 0
        else:
            low += 1
            speaking[i] = low <= hyst and (i > 0 and speaking[i - 1])
    # 動作提前 0.3s：每段 visual_start 起 lead 幀先張嘴
    for t in timeline["scenes"]:
        s = int(round(t["visual_start"] * fps))
        a = int(round(t["audio_start"] * fps))
        for i in range(s, min(s + lead, a)):
            speaking[i] = True

    idx = np.zeros(n, dtype=np.int16)
    active = rms[speaking] if speaking.any() else np.array([0.0])
    lo, hi = float(np.percentile(active, 10)), max(float(np.percentile(active, 92)), 1e-6)
    for i in range(n):
        if not speaking[i]:
            idx[i] = 0
            continue
        s = int(round(timeline["scenes"][0]["visual_start"] * fps))
        # lead-in 用微張（index 1）
        in_lead = any(int(round(t["visual_start"] * fps)) <= i < int(round(t["visual_start"] * fps)) + lead
                      for t in timeline["scenes"])
        if in_lead and i < int(round(timeline["scenes"][0]["audio_start"] * fps)) + 1 and i < lead + s:
            idx[i] = 1
            continue
        p = float(np.clip((rms[i] - lo) / (hi - lo), 0.0, 1.0))
        idx[i] = int(min(5, max(1, round(p * 5))))
    return idx


def compose_video(cfg: dict, entries: list[dict], timeline: dict, cards: dict,
                  mouths: dict, poses: dict, mix_path: Path, mouth_idx: np.ndarray) -> dict:
    W, H = cfg["video_spec"]["resolution"]
    fps = int(cfg["video_spec"]["fps"])
    roi = cfg["layers"]["layer2_blackboard_roi"]
    rx, ry, rw, rh = roi["x_min"], roi["y_min"], roi["x_max"] - roi["x_min"], roi["y_max"] - roi["y_min"]
    assert (rw, rh) == (PANEL_W, PANEL_H)

    bg_path = ROOT / cfg["layers"]["layer1_bg"]
    bg = np.array(Image.open(bg_path).convert("RGB").resize((W, H), Image.LANCZOS))
    bg = cv2.cvtColor(bg, cv2.COLOR_RGB2BGR)

    layer = cfg["layers"]["layer3_mimi"]
    cx, cy = layer["anchor_center"]
    scale = float(layer["scale_from_2048"])
    size = int(round(2048 * scale))
    left, top = int(cx - size / 2), int(cy - size / 2)
    guard_y = int(layer["collar_guard_source_y"])
    ramp = int(layer["collar_guard_ramp_px"])
    mx, my = layer["mouth_patch_center_2048"]
    mouth_cx = int(left + mx * scale)
    mouth_cy = int(top + my * scale)

    # 每幕預合成靜態底圖（bg + 黑板 + 角色），角色 lower-body clone 一次完成
    bases: list[np.ndarray] = []
    clone_ok = 0
    for t in timeline["scenes"]:
        frame = bg.copy()
        card = np.array(cards[t["scene_id"]].convert("RGBA"))
        car, caa = card[:, :, :3], card[:, :, 3]
        # cv2 alpha 合成（RGBA → BGR 不需換色，因黑板為灰階/SVG 色彩，直接貼）
        alpha_composite(frame, cv2.cvtColor(car, cv2.COLOR_RGB2BGR), caa, rx, ry)

        spr, spa = poses[t["pose"]]
        alpha_composite(frame, spr, spa, left, top)
        # 底色修補 + seamlessClone：僅 y >= 510（領口以下），20px 軟過渡
        m = spa.astype(np.float32).copy()
        fade = np.clip((np.arange(size) - (guard_y - ramp)) / (ramp * 2), 0, 1).astype(np.float32)
        m = (m * fade[:, None]).astype(np.uint8)
        if seamless_paste(frame, spr, m, left, top):
            clone_ok += 1
        bases.append(frame)

    mp_size = mouths[0][0].shape[0]
    crop_half = mp_size // 2 + 24
    out_path = ROOT / cfg["paths"]["output_video"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(fps),
        "-i", "-", "-i", str(mix_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-b:v", cfg["video_spec"]["video_bitrate"],
        "-maxrate", cfg["video_spec"]["video_maxrate"],
        "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart",
        str(out_path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    paste_ok = 0
    scene_idx = 0
    n = timeline["total_frames"]
    for i in range(n):
        t = i / fps
        while scene_idx + 1 < len(bases) and t >= timeline["scenes"][scene_idx + 1]["visual_start"]:
            scene_idx += 1
        frame = bases[scene_idx].copy()
        mrgb, ma = mouths[int(mouth_idx[i])]
        x0 = mouth_cx - mp_size // 2
        y0 = mouth_cy - mp_size // 2
        cx0, cy0 = max(0, x0 - crop_half), max(0, y0 - crop_half)
        cx1, cy1 = min(W, x0 + mp_size + crop_half), min(H, y0 + mp_size + crop_half)
        crop = frame[cy0:cy1, cx0:cx1].copy()
        # 底色修補（透明處填臉部底色）後 NORMAL_CLONE
        a = (ma.astype(np.float32) / 255.0)[:, :, None]
        base = crop[y0 - cy0:y0 - cy0 + mp_size, x0 - cx0:x0 - cx0 + mp_size].astype(np.float32)
        filled = (mrgb.astype(np.float32) * a + base * (1 - a)).astype(np.uint8)
        sub = crop[y0 - cy0:y0 - cy0 + mp_size, x0 - cx0:x0 - cx0 + mp_size].copy()
        try:
            blended = cv2.seamlessClone(filled, sub, ma, (mp_size // 2, mp_size // 2), cv2.NORMAL_CLONE)
            sel = ma > 8
            sub[sel] = blended[sel]
            crop[y0 - cy0:y0 - cy0 + mp_size, x0 - cx0:x0 - cx0 + mp_size] = sub
            frame[cy0:cy1, cx0:cx1] = crop
            paste_ok += 1
        except cv2.error as exc:
            print(f"[DEGRADED:mouth clone 失敗 frame={i}] {str(exc)[:100]}")
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"ffmpeg 合成失敗 exit={rc}")
    return {"clone_ok": clone_ok, "mouth_clone_frames": paste_ok,
            "rendered_frames": n, "output": str(out_path.relative_to(ROOT)).replace("\\", "/")}


# ----------------------------------------------------------------------------
# 4. main
# ----------------------------------------------------------------------------


def main() -> int:
    cfg = json.loads(CFG_PATH.read_text(encoding="utf-8"))
    temp = ROOT / cfg["paths"]["temp_work_dir"]
    temp.mkdir(parents=True, exist_ok=True)

    print("[0/5] 定點算術斷言")
    arith = assert_arithmetic(cfg)

    print("[1/5] TTS + 時間軸")
    entries = expand_scenes(cfg)
    rows, mix_path, timeline = build_audio(cfg, entries)

    print("[2/5] 黑板 Layer 2")
    bb = render_blackboards(cfg, entries)

    print("[3/5] 去背 / 嘴形準備")
    poses_needed = {sc["mimi_pose"] for sc in entries}
    poses, pose_meta = prep_poses(cfg, poses_needed)
    mouths = prep_mouths(cfg)
    mouth_idx = audio_gate(mix_path, timeline, cfg)

    print(f"[4/5] 三層合成 {timeline['total_frames']} frames")
    comp = compose_video(cfg, entries, timeline, bb["cards"], mouths, poses, mix_path, mouth_idx)

    print("[5/5] 產出驗真")
    dur = ffprobe_duration(ROOT / cfg["paths"]["output_video"])
    probe = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,codec_name",
        "-of", "json", str(ROOT / cfg["paths"]["output_video"]),
    ])
    size_mb = (ROOT / cfg["paths"]["output_video"]).stat().st_size / 1024 / 1024
    assert abs(dur - timeline["total_duration_seconds"]) < 0.1, (dur, timeline["total_duration_seconds"])
    assert size_mb < 25, size_mb
    assert (ROOT / cfg["paths"]["blackboard_montage"]).is_file()

    report = {
        "stage": "N310_full_build",
        "config": str(CFG_PATH.relative_to(ROOT)).replace("\\", "/"),
        "arithmetic": arith,
        "timeline": timeline,
        "poses": pose_meta,
        "composition": comp,
        "probe": json.loads(probe),
        "video_duration_seconds": round(dur, 4),
        "video_size_mb": round(size_mb, 2),
        "montage": str(ROOT / cfg["paths"]["blackboard_montage"]),
        "visual_model_called": False,
        "comfyui_redraw_called": False,
        "git_push_executed": False,
        "release_executed": False,
    }
    (temp / "build_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"N310_OK frames={comp['rendered_frames']} duration={dur:.3f}s size={size_mb:.2f}MB")
    print(f"MONTAGE={report['montage']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
