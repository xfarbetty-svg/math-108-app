#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
crawl_nhes_g2_exams.py
自動爬取臺北市南湖國小（NHES）111、112、113 三個學年度二年級數學定期評量試卷。
資料來源：南湖國小註冊組官方公開題庫（Google Sites / Google Drive）
"""

import os
import sys
import ssl
import re
import urllib.request
import urllib.parse
from pathlib import Path

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

FOLDER_MAP = {
    "111-1期中": "1fakcErKi9GGOPLOmBiJgTPj0evPAKAZT",
    "111-1期末": "1XbKJZDPspVE1KxQ_Wi8vs8avYtxi3MHD",
    "111-2期中": "1tBx5E_blO2ULWghqIuREv_F9lnO-7PGX",
    "111-2期末": "1lJ2mhKh_dQfO0SjH5kRKmUrGlC_DEgdU",
    "112-1期中": "1_3yIizDNgdWBwAvERD0NBaMVb5xCj70W",
    "112-1期末": "1JpUisZSUlhLkEukQ26GYR2JemAbwOJHP",
    "112-2期中": "14Fj19PMKraYWu70TXMKqCCMXFAHSpai0",
    "112-2期末": "1rUsKQ36gLXwwLsFcOcbEZ811ilCvMd5v",
    "113-1期中": "1ZoGCG3GxBago_i6FS2iYT9ryBFWxSxS7",
    "113-1期末": "1BOZnVJzYGXmgRK_FYRSgeoLNm_c3XtEu",
    "113-2期中": "1h3M5lc9GpvZt8LUjGlgJQr66_ik7TzgB",
    "113-2期末": "1fd3uloVS1suvbKFhNkdArLNaii4eMPJo"
}

def get_folder_files(folder_id):
    url = f"https://drive.google.com/drive/folders/{folder_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=12) as r:
            html = r.read().decode('utf-8', errors='ignore')
            # 匹配 (filename, fid)
            # 模式 1: data-id 與 aria-label
            items = []
            pattern = re.findall(r'aria-label="([^"]+\.pdf)[^"]*"[\s\S]*?data-id="([a-zA-Z0-9_-]{25,})"', html)
            for fname, fid in pattern:
                items.append((fname, fid))
            
            # 模式 2: JSON-like dump in page
            if not items:
                raw_matches = re.findall(r'\\x5b\\x22([a-zA-Z0-9_-]{28,})\\x22,[\s\S]*?\\x22([^"\\]+\.pdf)\\x22', html)
                for fid, fname in raw_matches:
                    items.append((fname, fid))
            return items
    except Exception as e:
        print(f"Error fetching folder {folder_id}: {e}")
        return []

def download_file(fid, dest_path):
    url = f"https://drive.google.com/uc?export=download&id={fid}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
            content = r.read()
            if len(content) < 1000 and b"<!DOCTYPE html>" in content:
                print(f"  [WARN] Downloaded HTML instead of PDF for {dest_path.name}")
                return False
            with open(dest_path, "wb") as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"  [ERROR] Download failed: {e}")
        return False

def main():
    repo_root = Path(__file__).resolve().parent.parent
    target_dir = repo_root / "EXAM REAL" / "G2"
    target_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  南湖國小 G2 數學歷年段考爬蟲 (111 ~ 113 學年度)")
    print(f"  目標目錄: {target_dir}")
    print("=" * 60)

    downloaded = 0
    for period_name, folder_id in FOLDER_MAP.items():
        print(f"\n[SCAN] 掃描 {period_name} (Folder: {folder_id})...")
        files = get_folder_files(folder_id)
        print(f"  發現 {len(files)} 個檔案")
        
        # 篩選二年級數學
        math2_files = []
        for fname, fid in files:
            # 排除非二 / 非數
            if any(k in fname for k in ['二', '2']) and any(k in fname for k in ['數']):
                math2_files.append((fname, fid))
        
        if not math2_files:
            print(f"  [-] 未發現二年級數學檔案")
            continue
            
        for fname, fid in math2_files:
            # 標準化檔名
            clean_name = f"臺北市南湖國小_{period_name}_G2_數學_{fname}"
            # 避免重複副檔名
            if clean_name.endswith(".pdf.pdf"):
                clean_name = clean_name[:-4]
            dest = target_dir / clean_name
            
            if dest.exists() and dest.stat().st_size > 1000:
                print(f"  [*] 已存在: {dest.name} ({dest.stat().st_size // 1024} KB)")
            else:
                print(f"  [+] 下載中: {fname} -> {dest.name}")
                ok = download_file(fid, dest)
                if ok:
                    print(f"      下載成功: {dest.stat().st_size // 1024} KB")
                    downloaded += 1

    print("\n" + "=" * 60)
    print(f"  [DONE] 爬取完畢！本次成功新增下載 {downloaded} 份真題試卷。")
    print("=" * 60)
    sys.exit(0)

if __name__ == "__main__":
    main()
