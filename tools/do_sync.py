# -*- coding: utf-8 -*-
import glob, shutil

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/.env', recursive=True)
if matches:
    target = matches[0]
    print(f"正在更新 A-SERVER 的 Key Pool 目標: {target}")
    shutil.copyfile('C:/Users/xfarb/synced.env', target)
    print("✅ .env 成功同步!")
else:
    print("❌ 找不到目標 .env")
