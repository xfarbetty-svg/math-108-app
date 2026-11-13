#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/release.py — 028-1 專屬一鍵發布硬閘門（方案 A 全新部署）
S0 前置檢查 -> S1 本地全域守門員全檢 -> S2 推送至 GitHub math-108-app -> S3 發布收工
"""

import os
import subprocess
import sys
import time

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_cmd(cmd, check=True):
    print(f"▶ 執行: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    proc = subprocess.run(cmd, cwd=ROOT, shell=isinstance(cmd, str), capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.stdout:
        print(proc.stdout.strip())
    if proc.returncode != 0:
        if proc.stderr:
            print(f"[ERROR] {proc.stderr.strip()}", file=sys.stderr)
        if check:
            print(f"❌ 命令失敗 (Exit Code {proc.returncode})，發布中斷！", file=sys.stderr)
            sys.exit(proc.returncode)
    return proc.returncode

def main():
    print("=" * 60)
    print("🚀 028-1 小數學冒險 — 發布硬閘門啟動 (方案 A 全新站點)")
    print("=" * 60)

    # S1: 全量守門員測試
    print("\n[S1] 執行全量確定性守門員檢驗...")
    gates = [
        ["node", "tools/verify_curriculum_131.js"],
        ["node", "tools/verify_app_shell.js"],
        ["node", "tools/verify_s12.js"],
        ["node", "tools/verify_r11_r12.js"],
        ["node", "tools/verify_d11.js"],
        ["node", "tools/ac_gate.js"]
    ]
    for g in gates:
        code = run_cmd(g, check=True)
        if code != 0:
            print(f"❌ 守門員未通過: {g}", file=sys.stderr)
            sys.exit(1)
    print("✅ [S1] 所有守門員全部綠燈（Exit Code 0）！")

    # S2: Git 鋼印與推送
    print("\n[S2] 提交變更並推送至 GitHub 專屬倉庫...")
    run_cmd(["git", "add", "."])
    # 檢查是否有變動需要 commit
    status_proc = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True)
    if status_proc.stdout.strip():
        msg = f"release: 發布新版 (108課綱一年級全量50題真題+PWA更新) - {time.strftime('%Y-%m-%d %H:%M')}"
        run_cmd(["git", "commit", "-m", msg])
    
    # 推送至 main 分支
    print("正在推送至 origin main (xfarbetty-svg/math-108-app)...")
    code = run_cmd(["git", "push", "-u", "origin", "main"], check=False)
    if code != 0:
        # 如果遠端沒有 main，嘗試 push -u origin HEAD:main
        run_cmd(["git", "push", "-u", "origin", "HEAD:main"])

    # S3: 部署至 Cloudflare Pages (math-108)
    print("\n[S3] 部署至 Cloudflare Pages (math-108)...")
    run_cmd(["npx", "wrangler", "pages", "deploy", ".", "--project-name=math-108", "--branch=main", "--commit-dirty=true"])

    print("\n" + "=" * 60)
    print("🎉 [RELEASE PASS] 028-1 全新部署發布成功！")
    print("🔗 倉庫網址: https://github.com/xfarbetty-svg/math-108-app")
    print("🌐 正式上線網址: https://math-108.pages.dev")
    print("=" * 60)

if __name__ == "__main__":
    main()
