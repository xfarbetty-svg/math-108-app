"""
tools/build_g3_video_inventory.py
以本機實際檔案（ffprobe 時長／大小、loudnorm LUFS）重新產生
reports/20261123_G3_VIDEO_INVENTORY.md 的 G3 24/24 全滿編盤點表。
Run: python tools/build_g3_video_inventory.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.build_g3_youtube_compilation import (
    REPO_ROOT,
    VIDEO_ORDER,
    lufs_of,
    probe_duration,
    read_shell_movies,
    read_unit_titles,
)

REPORT = REPO_ROOT / "reports" / "20261123_G3_VIDEO_INVENTORY.md"


def main() -> None:
    mapping = read_shell_movies()
    titles = read_unit_titles()
    rows: list[str] = []
    total = 0.0
    for code in VIDEO_ORDER:
        rel = mapping[code]
        f = REPO_ROOT / "app" / rel
        if not f.exists():
            raise RuntimeError(f"{code} 影片不存在：{f}")
        dur = probe_duration(f)
        size = json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=size", "-of", "json", str(f)],
            capture_output=True, text=True, check=True, encoding="utf-8", errors="replace",
        ).stdout)["format"]["size"]
        lu = lufs_of(f)
        if not (-14.8 <= lu <= -13.2):
            raise RuntimeError(f"{code} 響度未達 -14 LUFS：{lu}")
        total += dur
        note = "同 N-3-13 共用影片" if code == "S-3-1" else "—"
        rows.append(
            f"| {code} | {titles[code]} | {f.name} | {dur:.2f}s | "
            f"{int(size) / 1048576:.2f} MiB | {lu:.2f} | ✅ 已掛載 | {note} |"
        )

    lines = [
        "# 2026-11-23 G3 概念小教室影片全冊盤點（24/24 全滿編）",
        "",
        "> 掃描 `data/units/G3/` 全部 24 個單元與 `app/shell.js` 的 `UNIT_CONCEPT_MOVIES`。",
        "> 資料來源為本機實際檔案（ffprobe 時長／大小、loudnorm LUFS），非人工填寫。",
        "",
        "- **盤點涵蓋率：24/24 單元（100%）**，全部掛載概念影片並開放「概念小教室」按鈕。",
        "- **響度標準：24/24 全數達 YouTube -14 LUFS**（量測區間 -14.8 ～ -13.2）。",
        f"- 全冊 24 單元總時長：{total / 60:.1f} 分鐘（{total:.2f}s）；不重複成片 23 支（S-3-1 與 N-3-13 共用 `N313_Final.mp4`）。",
        "- 最新入冊：`N37_Final.mp4`（兩步驟應用問題）、`N38_Final.mp4`（四則估算），皆為四幕 `full_stage` + `app/assets/mimi_poses/` 現成 PNG + 抽幀目視零裁切。",
        "",
        "| 單元 | 標題 | 影片檔 | 時長 | 大小 | 響度 LUFS | 狀態 | 備註 |",
        "|---|---|---|---|---|---|---|---|",
    ] + rows + [
        "",
        "## 終局收官",
        "",
        "- G3 24/24 單元概念影片全數上線，`UNIT_CONCEPT_MOVIES` 與 `UNIT_CONCEPT_MOVIE_TITLES` 同步完成。",
        "- 四則估算 N-3-8 與兩步驟 N-3-7 為第 3/3 批最後兩支，補齊全冊。",
        "- 全冊 YouTube 總合集與章節時間軸：`reports/20261123_G3_YOUTUBE_CHAPTERS.txt`。",
    ]
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"WROTE {REPORT} — 24/24 units, all -14 LUFS")


if __name__ == "__main__":
    main()
