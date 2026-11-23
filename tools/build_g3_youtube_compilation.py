"""
tools/build_g3_youtube_compilation.py
把 G3 全冊 24 單元的概念小教室影片（23 支不重複成片，S-3-1 與 N-3-13 共用
N313_Final.mp4 只收一次）統一轉碼為 1920x1080 / 30fps / AAC 48kHz / -14 LUFS，
無縫串接成一支 YouTube 總合集，並依實際時長產生章節時間軸 txt。

Run: python tools/build_g3_youtube_compilation.py
Outputs:
  _scratch/G3_Math_All24_YouTube_Compilation.mp4
  reports/20261123_G3_YOUTUBE_CHAPTERS.txt
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SHELL = REPO_ROOT / "app" / "shell.js"
VIDEO_ORDER = [
    "N-3-1", "N-3-2", "N-3-3", "N-3-4", "N-3-5", "N-3-6", "N-3-7",
    "N-3-8", "N-3-9", "N-3-10", "N-3-11", "N-3-12", "N-3-13", "N-3-14",
    "N-3-15", "N-3-16", "N-3-17",
    "S-3-1", "S-3-2", "S-3-3", "S-3-4",
    "R-3-1", "R-3-2",
    "D-3-1",
]
OUT_MP4 = REPO_ROOT / "_scratch" / "G3_Math_All24_YouTube_Compilation.mp4"
CHAPTERS_TXT = REPO_ROOT / "reports" / "20261123_G3_YOUTUBE_CHAPTERS.txt"
PARTS_DIR = REPO_ROOT / "_scratch" / "youtube_parts"


def run(cmd: list[str]) -> str:
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return res.stdout


def read_shell_movies() -> dict[str, str]:
    text = SHELL.read_text(encoding="utf-8")
    m = re.search(
        r"const\s+UNIT_CONCEPT_MOVIES\s*=\s*\{([\s\S]*?)\};", text
    )
    if not m:
        raise RuntimeError("找不到 shell.js 的 UNIT_CONCEPT_MOVIES")
    pairs = re.findall(r'"([A-Z]-\d-\d+)":\s*"([^"]+)"', m.group(1))
    return dict(pairs)


def read_unit_titles() -> dict[str, str]:
    titles: dict[str, str] = {}
    for code in VIDEO_ORDER:
        p = REPO_ROOT / "data" / "units" / "G3" / f"{code}.json"
        if p.exists():
            data = json.loads(p.read_text(encoding="utf-8"))
            titles[code] = data.get("title", code)
        else:
            titles[code] = code
    return titles


def probe_duration(path: Path) -> float:
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ]).strip()
    return float(out)


def mmss(seconds: float) -> str:
    total = int(round(seconds))
    return f"{total // 60:02d}:{total % 60:02d}"


def lufs_of(path: Path) -> float:
    res = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner", "-v", "info", "-i", str(path),
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
        check=True,
        encoding="utf-8",
        errors="replace",
    )
    blocks = re.findall(r'\{[\s\S]*?"input_i"[\s\S]*?\}', res.stderr + res.stdout)
    if not blocks:
        raise RuntimeError(f"loudnorm 無 input_i: {path}")
    return float(json.loads(blocks[-1])["input_i"])


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg 不在 PATH")
    if not shutil.which("ffprobe"):
        raise RuntimeError("ffprobe 不在 PATH")

    mapping = read_shell_movies()
    titles = read_unit_titles()
    for code in VIDEO_ORDER:
        if code not in mapping:
            raise RuntimeError(f"shell.js 缺少 {code} 影片映射")

    # 去重：S-3-1 與 N-3-13 共用 N313_Final.mp4，只收一次
    seen_paths: set[str] = set()
    selected: list[tuple[str, str, Path]] = []
    duplicates: list[str] = []
    for code in VIDEO_ORDER:
        rel = mapping[code]
        if rel in seen_paths:
            duplicates.append(f"{code} → {rel}（與前一支重複，略過）")
            continue
        seen_paths.add(rel)
        src = REPO_ROOT / "app" / rel
        if not src.exists():
            raise RuntimeError(f"影片不存在：{src}")
        selected.append((code, titles[code], src))

    print(f"[1/4] 順序清單 {len(VIDEO_ORDER)} 單元 → 不重複成片 {len(selected)} 支")
    for d in duplicates:
        print("      去重：" + d)

    PARTS_DIR.mkdir(parents=True, exist_ok=True)
    part_lines: list[str] = []
    chapters: list[str] = []
    cursor = 0.0
    for idx, (code, title, src) in enumerate(selected, start=1):
        part = PARTS_DIR / f"{idx:02d}_{code.replace('-', '')}.mp4"
        print(f"[{idx}/{len(selected)}] 正規化 {code} ← {src.name}")
        run([
            ffmpeg, "-y", "-v", "error", "-i", str(src),
            "-vf", (
                "scale=1920:1080:force_original_aspect_ratio=decrease,"
                "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30"
            ),
            "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000",
            "-c:v", "libx264", "-preset", "medium", "-crf", "21",
            "-pix_fmt", "yuv420p", "-r", "30", "-video_track_timescale", "30000",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-movflags", "+faststart", str(part),
        ])
        dur = probe_duration(part)
        chapters.append(f"{mmss(cursor)} {code} {title}")
        cursor += dur
        # concat demuxer 用相對檔名，.Collections 目錄固定
        part_lines.append(f"file '{part.as_posix()}'")

    list_file = PARTS_DIR / "concat_list.txt"
    list_file.write_text("\n".join(part_lines) + "\n", encoding="utf-8")

    print("[2/4] 無縫串接為單一 MP4 ...")
    OUT_MP4.parent.mkdir(parents=True, exist_ok=True)
    tmp_out = OUT_MP4.with_suffix(".tmp.mp4")
    run([
        ffmpeg, "-y", "-v", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c", "copy", "-movflags", "+faststart", str(tmp_out),
    ])
    shutil.move(str(tmp_out), str(OUT_MP4))

    print("[3/4] 驗證總合集串流與響度 ...")
    concat_dur = probe_duration(OUT_MP4)
    info = json.loads(run([
        "ffprobe", "-v", "error",
        "-show_entries", "stream=codec_type,width,height,r_frame_rate,sample_rate",
        "-of", "json", str(OUT_MP4),
    ]))
    streams = {s["codec_type"]: s for s in info["streams"]}
    v, a = streams["video"], streams["audio"]
    if int(v["width"]) != 1920 or int(v["height"]) != 1080:
        raise RuntimeError("總合集解析度錯誤")
    if v["r_frame_rate"] != "30/1":
        raise RuntimeError("總合集幀率錯誤：" + v["r_frame_rate"])
    if int(a["sample_rate"]) != 48000:
        raise RuntimeError("總合集音訊取樣率錯誤")
    if abs(concat_dur - cursor) > 0.5:
        raise RuntimeError(f"串接時長異常：{concat_dur:.3f} vs 預期 {cursor:.3f}")
    lufs = lufs_of(OUT_MP4)
    if not (-14.8 <= lufs <= -13.2):
        raise RuntimeError(f"總合集響度異常 {lufs} LUFS")
    print(f"      驗證：{concat_dur:.3f}s / -14 LUFS（{lufs:.2f}）/ 1920x1080@30fps / AAC 48kHz")

    print("[4/4] 寫入 YouTube 章節時間軸 ...")
    lines = [
        "# YouTube 章節時間軸 — 三年級數學全冊概念小教室（24/24 單元）",
        "# 直接複製貼進 YouTube 說明欄（每行需 ≥00:00，首章從 00:00 開始）",
        f"# 總時長 {mmss(concat_dur)}　|　合集 {OUT_MP4.name}",
        "",
    ] + chapters
    CHAPTERS_TXT.parent.mkdir(parents=True, exist_ok=True)
    CHAPTERS_TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"      已寫入 {CHAPTERS_TXT}")
    print("\n".join(chapters))
    print(f"\n=== SUCCESS: {OUT_MP4} ({OUT_MP4.stat().st_size / 1048576:.1f} MiB) ===")


if __name__ == "__main__":
    main()
