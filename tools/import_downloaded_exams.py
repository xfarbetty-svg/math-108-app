#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import_downloaded_exams.py
將使用者從瀏覽器下載的臺北市內湖國小等名校段考試卷，自動整理並安全搬移至 EXAM REAL/G2/。
"""

import os
import sys
import shutil
import glob
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    target_dir = repo_root / "EXAM REAL" / "G2"
    target_dir.mkdir(parents=True, exist_ok=True)

    # 偵測使用者的 Downloads 目錄
    user_home = Path.home()
    downloads_dir = user_home / "Downloads"

    print("=" * 60)
    print("  臺北市國小 G2 段考試卷導入守門員")
    print(f"  來源目錄: {downloads_dir}")
    print(f"  目標目錄: {target_dir}")
    print("=" * 60)

    if not downloads_dir.exists():
        print(f"[ERROR] 找不到 Downloads 目錄: {downloads_dir}")
        sys.exit(1)

    # 搜尋 Downloads 目錄下的 PDF
    candidates = []
    for p in downloads_dir.glob("*.pdf"):
        # 匹配常見下載名稱，或使用者下載的段考 PDF
        name = p.name
        if any(k in name for k in ["內湖", "民權", "南湖", "數學", "111", "112", "113", "114", "exam", "grade"]):
            candidates.append(p)

    if not candidates:
        print("[INFO] 目前 Downloads 目錄中未發現待整理的試卷 PDF。")
        print("  提示：請先透過 tools/neihu_g2_exams_collector.html 下載試卷。")
        sys.exit(0)

    print(f"[FOUND] 發現 {len(candidates)} 個疑似試卷檔案：")
    imported_count = 0
    for p in candidates:
        dest = target_dir / p.name
        if dest.exists():
            print(f"  [-] 已存在略過: {p.name}")
        else:
            shutil.copy2(p, dest)
            print(f"  [+] 成功導入: {p.name} -> {dest.name}")
            imported_count += 1

    print("-" * 60)
    print(f"[DONE] 導入完成，本次新增 {imported_count} 份段考試卷。")
    sys.exit(0)

if __name__ == "__main__":
    main()
