#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N310 mouth v2：原廠 3D 立體兔嘴三階段 + 雙腳落地重出成片。

輸入：
  D:/NAS/XX.CF995/8.下載/Gemini_Generated_Image_88lc5488lc5488lc.jpg      (微張嘴)
  D:/NAS/XX.CF995/8.下載/Gemini_Generated_Image_88lc5488lc5488lc (1).jpg  (大張嘴)
  ready/mimi_apose_closed.png                                              (閉嘴基準)
輸出：
  ../g3_mimi/raw/mimi_mouth_half_ref.png, ../g3_mimi/raw/mimi_mouth_open_ref.png
  ready/mouth_frames_v2/{mouth_closed,mouth_half,mouth_open}.png
  app/assets/classroom_videos/N310_Final.mp4
  _scratch/mimi_n310/mouth_v2_check.png

延用 002 的算術斷言、TTS、黑板、去背、seamlessClone 元件；不呼叫視覺模型 / ComfyUI。
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import wave
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BASE = importlib.util.spec_from_file_location(
    "n310base", ROOT / "tools" / "mimi_classroom" / "20261120_002_n310_build.py")
B = importlib.util.module_from_spec(BASE)
BASE.loader.exec_module(B)

READY = (ROOT / ".." / "036_local_painter" / "theater" / "assets_hosts" / "g3_mimi" / "ready").resolve()
CFG_PATH = ROOT / "docs" / "mimi_classroom" / "N310_script.json"
DOWNLOADS = Path("D:/NAS/XX.CF995/8.下載")
REF_HALF = DOWNLOADS / "Gemini_Generated_Image_88lc5488lc5488lc.jpg"
REF_OPEN = DOWNLOADS / "Gemini_Generated_Image_88lc5488lc5488lc (1).jpg"

# 仿射地標：ref(左眼,右眼,鼻尖) → ready closed(897,798 / 1156,797 / 1021,876)
DST_LM = np.float32([[897, 798], [1156, 797], [1021, 876]])
SRC_HALF = np.float32([[750, 928], [1049, 931], [894, 1018]])
SRC_OPEN = np.float32([[747, 911], [1051, 911], [894, 991]])
MOUTH_BOX = (821, 900, 1221, 1068)  # 鼻孔下 → 下巴，含完整兔吻與臉頰弧度


def prepare_assets() -> dict:
    raw = READY.parent / "raw"  # g3_mimi/raw/（與 ready/ 同級，符合 SSOT 規範）
    v2 = READY / "mouth_frames_v2"
    raw.mkdir(parents=True, exist_ok=True)
    v2.mkdir(parents=True, exist_ok=True)

    for src, name in ((REF_HALF, "mimi_mouth_half_ref.png"),
                      (REF_OPEN, "mimi_mouth_open_ref.png")):
        if not src.is_file():
            raise FileNotFoundError(src)
        Image.open(src).convert("RGB").save(raw / name)
        print(f"[raw] {name}")

    closed = np.array(Image.open(READY / "mimi_apose_closed.png").convert("RGB"))
    stages = [("mouth_closed.png", closed)]
    for src, lm in ((REF_HALF, SRC_HALF), (REF_OPEN, SRC_OPEN)):
        img = cv2.cvtColor(np.array(Image.open(src).convert("RGB")), cv2.COLOR_RGB2BGR)
        M = cv2.getAffineTransform(lm, DST_LM)
        warped = cv2.warpAffine(img, M, (closed.shape[1], closed.shape[0]),
                                flags=cv2.INTER_LANCZOS4, borderValue=(255, 255, 255))
        stages.append((f"mouth_{'half' if lm is SRC_HALF else 'open'}.png",
                       cv2.cvtColor(warped, cv2.COLOR_BGR2RGB)))

    x0, y0, x1, y1 = MOUTH_BOX
    h, w = y1 - y0, x1 - x0
    feather = np.zeros((h, w), dtype=np.float32)
    feather[10:h - 10, 10:w - 10] = 255
    feather = cv2.GaussianBlur(feather, (0, 0), 11)
    for name, img in stages:
        crop = img[y0:y1, x0:x1]
        rgba = np.dstack([crop, feather.astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(v2 / name)
        print(f"[v2] {name} {w}x{h}")
    return {"raw": [str(raw / n) for n in ("mimi_mouth_half_ref.png", "mimi_mouth_open_ref.png")],
            "frames": [str(v2 / n) for n, _ in stages], "size": [w, h], "box": MOUTH_BOX}


def prep_mouths_v2(cfg: dict) -> dict[int, tuple[np.ndarray, np.ndarray]]:
    layer = cfg["layers"]["layer3_mimi"]
    scale = float(layer["scale_from_2048"])
    pw, ph = [int(round(v * scale)) for v in layer["mouth_patch_size_2048"]]
    out = {}
    v2 = READY / "mouth_frames_v2"
    for i, name in enumerate(layer["mouth_stages"]):
        p = v2 / name
        if not p.is_file():
            raise FileNotFoundError(p)
        arr = np.array(Image.open(p).convert("RGBA").resize((pw, ph), Image.LANCZOS))
        out[i] = (cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR), arr[:, :, 3])
    return out


def audio_openness(mix_path: Path, timeline: dict, cfg: dict) -> np.ndarray:
    """語音音量包絡線 → 0(閉) ~ 1(大張)，平滑融合。"""
    gate = cfg["layers"]["layer3_mimi"]["rms_gate"]
    sr, fps = timeline["sample_rate_hz"], cfg["video_spec"]["fps"]
    step = sr // fps
    with wave.open(str(mix_path), "rb") as w:
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768.0
    n = timeline["total_frames"]
    rms = np.zeros(n, dtype=np.float32)
    for i in range(n):
        seg = pcm[i * step:(i + 1) * step]
        if len(seg):
            rms[i] = np.sqrt(np.mean(seg ** 2))
    thr = float(gate["open_threshold"])
    hyst = int(gate["hysteresis_frames"])
    speaking = np.zeros(n, dtype=bool)
    low = 0
    for i in range(n):
        if rms[i] > thr:
            speaking[i], low = True, 0
        else:
            low += 1
            speaking[i] = low <= hyst and i > 0 and speaking[i - 1]
    for t in timeline["scenes"]:
        s = int(round(t["visual_start"] * fps))
        a = int(round(t["audio_start"] * fps))
        speaking[s:min(s + int(gate["lead_in_frames"]), a)] = True

    active = rms[speaking] if speaking.any() else np.array([0.0])
    lo = float(np.percentile(active, 8))
    hi = max(float(np.percentile(active, 92)), 1e-6)
    p = np.clip((rms - lo) / (hi - lo), 0, 1)
    p[~speaking] = 0.0
    k = int(gate.get("smooth_frames", 5))
    kernel = np.ones(k, dtype=np.float32) / k
    smooth = np.convolve(p, kernel, mode="same")
    smooth[:k] = p[:k]
    smooth[-k:] = p[-k:]
    return smooth.astype(np.float32)


def draw_foot_shadow(frame: np.ndarray, cx: int, feet_y: int) -> None:
    layer = Image.new("RGBA", (frame.shape[1], frame.shape[0]), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - 130, feet_y - 20, cx + 130, feet_y + 18), fill=(20, 16, 12, 105))
    layer = layer.filter(ImageFilter.GaussianBlur(16))
    shadow = np.array(layer)
    a = (shadow[:, :, 3].astype(np.float32) / 255)[:, :, None]
    frame[:] = (shadow[:, :, :3] * a + frame.astype(np.float32) * (1 - a)).astype(np.uint8)


def compose_v2(cfg, timeline, cards, mouths, poses, mix_path, openness, meta) -> dict:
    W, H = cfg["video_spec"]["resolution"]
    fps = int(cfg["video_spec"]["fps"])
    roi = cfg["layers"]["layer2_blackboard_roi"]
    rx, ry = roi["x_min"], roi["y_min"]
    bg = np.array(Image.open(ROOT / cfg["layers"]["layer1_bg"]).convert("RGB").resize((W, H), Image.LANCZOS))
    bg = cv2.cvtColor(bg, cv2.COLOR_RGB2BGR)

    layer = cfg["layers"]["layer3_mimi"]
    cx, cy = layer["anchor_center"]
    scale = float(layer["scale_from_2048"])
    size = int(round(2048 * scale))
    left, top = int(cx - size / 2), int(cy - size / 2)
    guard_y, ramp = int(layer["collar_guard_source_y"]), int(layer["collar_guard_ramp_px"])
    mx, my = layer["mouth_patch_center_2048"]
    mouth_cx, mouth_cy = int(left + mx * scale), int(top + my * scale)
    pw, ph = mouths[0][0].shape[1], mouths[0][0].shape[0]
    ma = mouths[0][1]

    bases = []
    clone_ok = 0
    for t in timeline["scenes"]:
        frame = bg.copy()
        card = np.array(cards[t["scene_id"]].convert("RGBA"))
        B.alpha_composite(frame, cv2.cvtColor(card[:, :, :3], cv2.COLOR_RGB2BGR), card[:, :, 3], rx, ry)
        draw_foot_shadow(frame, cx, int(cy + size * 0.5) - 18)
        spr, spa = poses[t["pose"]]
        B.alpha_composite(frame, spr, spa, left, top)
        m = spa.astype(np.float32).copy()
        fade = np.clip((np.arange(size) - (guard_y - ramp)) / (ramp * 2), 0, 1).astype(np.float32)
        m = (m * fade[:, None]).astype(np.uint8)
        if B.seamless_paste(frame, spr, m, left, top):
            clone_ok += 1
        bases.append(frame)

    out_path = ROOT / cfg["paths"]["output_video"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
           "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", str(mix_path),
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", cfg["video_spec"]["video_bitrate"],
           "-maxrate", cfg["video_spec"]["video_maxrate"], "-c:a", "aac", "-b:a", "128k",
           "-shortest", "-movflags", "+faststart", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    assert proc.stdin is not None
    paste_ok, si = 0, 0
    closed, half, full = mouths[0][0], mouths[1][0], mouths[2][0]
    for i in range(timeline["total_frames"]):
        t = i / fps
        while si + 1 < len(bases) and t >= timeline["scenes"][si + 1]["visual_start"]:
            si += 1
        frame = bases[si].copy()
        p = float(openness[i])
        if p < 0.5:
            blended = (closed * (1 - 2 * p) + half * (2 * p)).astype(np.uint8)
        else:
            blended = (half * (1 - (2 * p - 1)) + full * (2 * p - 1)).astype(np.uint8)
        x0 = mouth_cx - pw // 2
        y0 = mouth_cy - ph // 2
        pad = 24
        ax0, ay0 = max(0, x0 - pad), max(0, y0 - pad)
        ax1, ay1 = min(W, x0 + pw + pad), min(H, y0 + ph + pad)
        crop = frame[ay0:ay1, ax0:ax1].copy()
        oy, ox = y0 - ay0, x0 - ax0
        sub = crop[oy:oy + ph, ox:ox + pw].copy()
        base = sub.astype(np.float32)
        a = (ma.astype(np.float32) / 255)[:, :, None]
        filled = (blended.astype(np.float32) * a + base * (1 - a)).astype(np.uint8)
        try:
            out = cv2.seamlessClone(filled, sub, ma, (pw // 2, ph // 2), cv2.NORMAL_CLONE)
            sel = ma > 8
            sub[sel] = out[sel]
            crop[oy:oy + ph, ox:ox + pw] = sub
            frame[ay0:ay1, ax0:ax1] = crop
            paste_ok += 1
        except cv2.error as exc:
            print(f"[DEGRADED:mouth clone f={i}] {str(exc)[:90]}")
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"ffmpeg exit={rc}")
    return {"clone_ok": clone_ok, "mouth_clone_frames": paste_ok,
            "rendered_frames": timeline["total_frames"], "patch_size": [pw, ph],
            "mouth_center": [mouth_cx, mouth_cy], "anchor": [cx, cy]}


def make_check_montage(cfg, meta) -> Path:
    v2 = READY / "mouth_frames_v2"
    patch = Image.new("RGB", (400 * 4, 250), "white")
    d = ImageDraw.Draw(patch)
    for i, name in enumerate(("mouth_closed.png", "mouth_half.png", "mouth_open.png")):
        im = Image.open(v2 / name).convert("RGBA")
        bg = Image.new("RGBA", im.size, (250, 250, 250, 255))
        bg.alpha_composite(im)
        patch.paste(bg.convert("RGB"), (i * 400 + 20, 40))
        d.text((i * 400 + 20, 12), name.replace("mouth_", "").replace(".png", ""), fill="black")
    tmp = ROOT / "_scratch" / "n310_stance_check.png"
    B.run(["ffmpeg", "-y", "-v", "error", "-ss", "40", "-i",
           str(ROOT / cfg["paths"]["output_video"]), "-frames:v", "1", str(tmp)])
    stance = Image.open(tmp).convert("RGB").crop((80, 430, 760, 1060)).resize((340, 315))
    patch.paste(stance, (1210, 40))
    d.text((1210, 12), "desk stance", fill="black")
    out = ROOT / cfg["paths"].get("mouth_v2_check", "_scratch/mimi_n310/mouth_v2_check.png")
    patch.save(out)
    return out


def main() -> int:
    cfg = json.loads(CFG_PATH.read_text(encoding="utf-8"))
    print("[0] 算術斷言")
    B.assert_arithmetic(cfg)
    print("[1] 歸位 + 仿射對齊 + 裁切 v2 兔嘴")
    assets = prepare_assets()
    print("[2] TTS + 時間軸")
    entries = B.expand_scenes(cfg)
    rows, mix_path, timeline = B.build_audio(cfg, entries)
    print("[3] 黑板 Layer 2")
    bb = B.render_blackboards(cfg, entries)
    print("[4] 準備嘴形 / 角色")
    mouths = prep_mouths_v2(cfg)
    poses, pose_meta = B.prep_poses(cfg, {s["mimi_pose"] for s in entries})
    openness = audio_openness(mix_path, timeline, cfg)
    print("[5] 三層合成 + 落地脚影")
    comp = compose_v2(cfg, timeline, bb["cards"], mouths, poses, mix_path, openness, assets)
    print("[6] 對比拼圖 + 驗真")
    check = make_check_montage(cfg, assets)
    dur = B.ffprobe_duration(ROOT / cfg["paths"]["output_video"])
    size_mb = (ROOT / cfg["paths"]["output_video"]).stat().st_size / 1024 / 1024
    assert abs(dur - timeline["total_duration_seconds"]) < 0.1
    assert size_mb < 25.0
    report = {
        "stage": "N310_mouth_v2_rerender", "assets": assets, "timeline": timeline,
        "composition": comp, "poses": pose_meta, "video_duration_seconds": round(dur, 4),
        "video_size_mb": round(size_mb, 2), "check_montage": str(check),
        "visual_model_called": False, "comfyui_redraw_called": False,
        "git_push_executed": False, "release_executed": False,
    }
    (ROOT / cfg["paths"]["temp_work_dir"] / "mouth_v2_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"N310_V2_OK frames={comp['rendered_frames']} duration={dur:.3f}s size={size_mb:.2f}MB")
    print(f"CHECK={check}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
