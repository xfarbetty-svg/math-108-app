# -*- coding: utf-8 -*-
import os, sys, glob

base = 'D:/CCY/ANTIGRAVITY'
print("=== 探索 A-SERVER 算力調度相關檔案 ===")
for root, dirs, files in os.walk(base):
    # 只看前 2 層
    depth = root[len(base):].count(os.sep)
    if depth > 2:
        continue
    for f in files:
        if any(x in f.lower() for x in ['pool', 'gemini', 'channel', 'key', 'tunnel', 'proxy', 'api_key']):
            print("Found file:", os.path.join(root, f))
    if depth == 1:
        # 列出目錄
        dname = os.path.basename(root)
        if any(x in dname for x in ['21', '32', '27', '98']):
            print(f"Dir [{dname}] files:", files[:8])
