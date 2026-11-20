#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""N34 米米概念小教室 - 第一階段資產建置（語音 + 去背 + 時間軸）。

使用方式：
  python tools/mimi_classroom/20261120_001_stage1_build.py

輸入：docs/mimi_classroom/N34_script.json
輸出：_scratch/mimi_n34/audio/*.wav
      _scratch/mimi_n34/timeline.json
      _scratch/mimi_n34/nobg/*.png
      _scratch/mimi_n34/stage1_report.json

禁止事項：不讀取圖片語義、不呼叫視覺模型、不重新繪製角色。
去背僅做「與影像邊緣連通的純白像素」透明化，底部 6% 保留實心、不加漸層。
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "docs" / "mimi_classroom" / "N34_script.json"
TEMP = ROOT / "_scratch" / "mimi_n34"
AUDIO = TEMP / "audio"
NOBG = TEMP / "nobg"

TTS_API = "https://math3-bank.pages.dev/api/tts"
RATE = "-5%"
TEMPO_FOR_MINUS_5 = 0.9523809524  # ffmpeg atempo = 1 / 1.05

# 底部保留帶：永不透明化，確保實心雙腳不被鑿空、不加透明漸層。
FOOT_GUARD_RATIO = 0.06
WHITE_MIN = 250


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        raise RuntimeError(f"CMD FAIL ({p.returncode}): {' '.join(cmd)}\n{p.stderr[:800]}")
    return p.stdout.strip()


def local_edge_tts(text: str, voice: str, out_mp3: Path) -> bool:
    try:
        import edge_tts  # noqa: PLC0415
    except ImportError:
        return False
    for attempt in range(2):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=RATE).save(str(out_mp3)))
            if out_mp3.exists() and out_mp3.stat().st_size > 1024:
                return True
        except Exception as exc:  # noqa: BLE001 - 降級必須記錄原因
            print(f"  [edge-tts local attempt {attempt + 1}] {type(exc).__name__}: {str(exc)[:120]}")
        time.sleep(1.5 * (attempt + 1))
    return False


def api_edge_tts(text: str, voice: str, out_mp3: Path) -> str:
    url = f"{TTS_API}?voice={urllib.parse.quote(voice)}&text={urllib.parse.quote(text)}"
    req = urllib.request.Request(url, headers={"User-Agent": "mimi-stage1/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    if not data or len(data) < 1024:
        raise RuntimeError("Edge-TTS API 回傳空音訊")
    out_mp3.write_bytes(data)
    return url


def wav_duration(wav: Path) -> float:
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(wav),
    ])
    return round(float(out), 4)


def build_audio(scenes: list[dict], voice: str) -> tuple[list[dict], dict]:
    AUDIO.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    cursor = 0.0
    sources: dict[str, int] = {}

    for idx, scene in enumerate(scenes, 1):
        sid = scene["scene_id"]
        text = scene["narration"]
        mp3 = AUDIO / f"{sid}.mp3"
        wav = AUDIO / f"{sid}.wav"
        print(f"[audio {idx}/{len(scenes)}] {sid}")

        used = "local_edge_tts"
        if not local_edge_tts(text, voice, mp3):
            api_edge_tts(text, voice, mp3)
            used = "cloudflare_edge_tts_endpoint+ffmpeg_atempo"
            print("  [DEGRADED] 本機 edge-tts 無音訊回傳，改走專案 Edge-TTS 端點並補 -5% 語速")
        sources[used] = sources.get(used, 0) + 1

        filt = ["-af", f"atempo={TEMPO_FOR_MINUS_5}"] if used != "local_edge_tts" else []
        run([
            "ffmpeg", "-y", "-v", "error", "-i", str(mp3), *filt,
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(wav),
        ])
        if not wav.exists() or wav.stat().st_size < 1024:
            raise RuntimeError(f"WAV 產出失敗: {wav}")

        dur = wav_duration(wav)
        rows.append({
            "scene_id": sid,
            "wav": f"_scratch/mimi_n34/audio/{sid}.wav",
            "tts_source": used,
            "duration_seconds": dur,
            "start_seconds": round(cursor, 4),
            "end_seconds": round(cursor + dur, 4),
        })
        cursor += dur
        mp3.unlink(missing_ok=True)

    timeline = {
        "project_id": "N34",
        "voice": voice,
        "rate": RATE,
        "sample_rate_hz": 24000,
        "channels": 1,
        "tts_sources": sources,
        "total_duration_seconds": round(cursor, 4),
        "scenes": rows,
    }
    (TEMP / "timeline.json").write_text(
        json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return rows, sources


def remove_white_bg(assets_root: Path) -> list[dict]:
    NOBG.mkdir(parents=True, exist_ok=True)
    report: list[dict] = []

    for src in sorted(assets_root.glob("*.png")):
        img = Image.open(src).convert("RGBA")
        arr = np.array(img)
        h, w = arr.shape[:2]
        guard_rows = int(h * FOOT_GUARD_RATIO)

        rgb = arr[:, :, :3]
        white = (rgb >= WHITE_MIN).all(axis=2) & (arr[:, :, 3] > 0)
        white[guard_rows:, :] = False  # 底部保留帶：雙腳實心

        visited = np.zeros((h, w), dtype=bool)
        q: deque[tuple[int, int]] = deque()
        for x in range(w):
            if white[0, x]:
                visited[0, x] = True
                q.append((0, x))
        for x in range(w):
            if white[guard_rows - 1, x] and not visited[guard_rows - 1, x]:
                visited[guard_rows - 1, x] = True
                q.append((guard_rows - 1, x))
        for y in range(guard_rows):
            if white[y, 0] and not visited[y, 0]:
                visited[y, 0] = True
                q.append((y, 0))
            if white[y, w - 1] and not visited[y, w - 1]:
                visited[y, w - 1] = True
                q.append((y, w - 1))

        while q:
            y, x = q.popleft()
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < guard_rows and 0 <= nx < w and white[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

        removed = int(visited.sum())
        arr[visited, 3] = 0
        out = NOBG / src.name
        Image.fromarray(arr, "RGBA").save(out, "PNG")

        report.append({
            "source": src.name,
            "output": f"_scratch/mimi_n34/nobg/{src.name}",
            "size": [w, h],
            "white_pixels_cleared": removed,
            "foot_guard_rows": guard_rows,
            "bottom_gradient": False,
        })
        print(f"[nobg] {src.name}: cleared={removed} guard_rows={guard_rows}")
    return report


def main() -> int:
    cfg = json.loads(SCRIPT.read_text(encoding="utf-8"))
    TEMP.mkdir(parents=True, exist_ok=True)
    scenes = cfg["scenes"]
    voice = cfg["video_spec"]["tts_voice"]

    rows, sources = build_audio(scenes, voice)
    nobg = remove_white_bg(ROOT / cfg["paths"]["assets_root"])

    report = {
        "stage": 1,
        "config": str(SCRIPT.relative_to(ROOT)).replace("\\", "/"),
        "audio_count": len(rows),
        "nobg_count": len(nobg),
        "tts_sources": sources,
        "foot_guard_ratio": FOOT_GUARD_RATIO,
        "bottom_gradient": False,
        "visual_model_called": False,
        "comfyui_redraw_called": False,
        "scenes": rows,
        "nobg": nobg,
    }
    (TEMP / "stage1_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    assert len(rows) == len(scenes) == 6, "場景數不符"
    assert len(nobg) >= 1, "去背產出為空"
    assert all(r["duration_seconds"] > 0 for r in rows), "有零長度音訊"
    print(f"STAGE1_OK scenes={len(rows)} nobg={len(nobg)} total={report.get('total', '-')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
