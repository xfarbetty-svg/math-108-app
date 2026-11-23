"""
tools/normalize_video_loudness.py
批次將概念小教室影片音軌響度標準化至 YouTube -14 LUFS。

- 掃描 app/assets/classroom_videos/*.mp4
- 以 loudnorm=I=-14:TP=-1.5:LRA=11 量測 input_i
- 凡低於 --threshold（預設 -16 LUFS）者，以 -c:v copy 無損視訊流重新封裝覆蓋音軌
- 重新驗證輸出響度與 AV 同步，任一失敗即 Exit 1

Run: python tools/normalize_video_loudness.py
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

LOUDNORM_FILTER = "loudnorm=I=-14:TP=-1.5:LRA=11"


def measure_loudnorm_json(path: Path, ffmpeg: str) -> dict[str, str]:
    """First loudnorm pass: return the full measurement JSON (two-pass accurate mode)."""
    cmd = [
        ffmpeg, "-nostats", "-i", str(path),
        "-af", f"{LOUDNORM_FILTER}:print_format=json",
        "-f", "null", "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"loudnorm 量測失敗 {path.name}: {res.stderr[-500:]}")
    start = res.stderr.rfind("{")
    end = res.stderr.rfind("}")
    if start < 0 or end < start:
        raise RuntimeError(f"無法解析 loudnorm JSON: {path.name}")
    return json.loads(res.stderr[start:end + 1])


def measure_lufs(path: Path, ffmpeg: str, ffprobe: str) -> float:
    return float(measure_loudnorm_json(path, ffmpeg)["input_i"])


def accurate_filter(measurement: dict[str, str]) -> str:
    """Build the second (linear, two-pass) loudnorm filter from pass-1 measurements."""
    # 此 FFmpeg build 以 input_* / target_offset 返回量測值，即 two-pass 的 measured_* / offset
    parts = [
        f"measured_I={measurement['input_i']}",
        f"measured_TP={measurement['input_tp']}",
        f"measured_LRA={measurement['input_lra']}",
        f"measured_thresh={measurement['input_thresh']}",
        f"offset={measurement['target_offset']}",
    ]
    return f"{LOUDNORM_FILTER}:{':'.join(parts)}:linear=true"


def probe_av_diff(path: Path, ffprobe: str) -> float:
    cmd = [
        ffprobe, "-v", "error",
        "-show_entries", "stream=codec_type,duration",
        "-of", "json", str(path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    streams = {}
    for s in json.loads(res.stdout).get("streams", []):
        streams[s["codec_type"]] = float(s.get("duration", 0))
    if "video" not in streams or "audio" not in streams:
        raise RuntimeError(f"缺影音流: {path.name}")
    return abs(streams["video"] - streams["audio"])


def normalize_one(path: Path, ffmpeg: str, ffprobe: str, before: float,
                  measurement: dict[str, str]) -> float:
    tmp = path.with_name(f".{path.stem}.loudnorm.tmp.mp4")
    base_filter = accurate_filter(measurement)
    correction_db = 0.0
    after = -999.0
    try:
        # 極安靜音軌的 loudnorm 會過衝，迭代微調 volume 精準落到 -14 LUFS
        for attempt in range(5):
            af = base_filter
            if abs(correction_db) > 0.01:
                af = f"{base_filter},volume={correction_db:.2f}dB"
            cmd = [
                ffmpeg, "-y", "-v", "error",
                "-i", str(path),
                "-map", "0:v:0", "-map", "0:a:0",
                "-c:v", "copy",
                "-af", af,
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                str(tmp),
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0 or not tmp.exists():
                raise RuntimeError(f"重新封裝失敗 {path.name}: {res.stderr[-500:]}")
            after = measure_lufs(tmp, ffmpeg, ffprobe)
            if abs(after - (-14.0)) <= 0.20:
                break
            correction_db += (-14.0 - after)
            correction_db = max(-20.0, min(20.0, correction_db))

        if not (-15.0 <= after <= -13.0):
            raise RuntimeError(f"響度未達標 {path.name}: {after:.2f} LUFS（目標 -14 ±1）")
        av_diff = probe_av_diff(tmp, ffprobe)
        if av_diff > 0.15:
            raise RuntimeError(f"AV 漂移過大 {path.name}: {av_diff:.3f}s")

        os.replace(tmp, path)
        size_mib = path.stat().st_size / 1048576
        if size_mib > 24.5:
            raise RuntimeError(f"檔案超過 25MiB 上限 {path.name}: {size_mib:.2f} MiB")
        print(f"  {path.name:20s} {before:7.2f} -> {after:6.2f} LUFS | "
              f"修正 {correction_db:+.2f}dB | AV diff {av_diff:.3f}s | "
              f"{size_mib:.2f} MiB  OK")
        return after
    finally:
        if tmp.exists():
            tmp.unlink()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="app/assets/classroom_videos")
    ap.add_argument("--threshold", type=float, default=-16.0)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    ffmpeg, ffprobe = shutil.which("ffmpeg"), shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        print("FAIL: ffmpeg/ffprobe 不在 PATH", file=sys.stderr)
        return 1

    target_dir = Path(args.dir)
    files = sorted(target_dir.glob("*.mp4"))
    if not files:
        print(f"FAIL: {target_dir} 找不到 MP4", file=sys.stderr)
        return 1

    changed = skipped = 0
    print(f"掃描 {len(files)} 支影片，門檻 {args.threshold:.1f} LUFS")
    for f in files:
        measurement = measure_loudnorm_json(f, ffmpeg)
        lufs = float(measurement["input_i"])
        if lufs >= args.threshold:
            print(f"  {f.name:20s} {lufs:7.2f} LUFS  SKIP（已達標）")
            skipped += 1
            continue
        if args.dry_run:
            print(f"  {f.name:20s} {lufs:7.2f} LUFS  WOULD-NORMALIZE")
            changed += 1
            continue
        normalize_one(f, ffmpeg, ffprobe, lufs, measurement)
        changed += 1

    print(f"PASS: 批次響度標準化完成，重新封裝 {changed} 支、跳過 {skipped} 支")
    return 0


if __name__ == "__main__":
    sys.exit(main())
