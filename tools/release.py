#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/release.py — 028-1 專屬一鍵實體發布硬閘門（鋼鐵閉環版）
流程：
  S0: 快取破除 (自動更新 VERSION 與 app/index.html 的時間戳版號)
  S1: 本地全量守門員檢驗 (Exit 0 才能推進)
  S2: Git 鋼印提交與遠端推送 (git commit & git push)
  S3: 實體部署至 Cloudflare Pages (wrangler pages deploy)
  S4: 遠端邊緣節點線上實測驗真 (HTTP 探測確認已生效)
"""

import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_cmd(cmd, check=True):
    if isinstance(cmd, list):
        exe = shutil.which(cmd[0])
        exec_cmd = [exe] + cmd[1:] if exe else cmd
        cmd_display = subprocess.list2cmdline(cmd)
    else:
        exec_cmd = cmd
        cmd_display = cmd
    print(f"▶ 執行: {cmd_display}")
    proc = subprocess.run(
        exec_cmd,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    if proc.stdout:
        # 只輸出前 15 行與末尾，保持乾淨
        lines = proc.stdout.strip().splitlines()
        if len(lines) > 20:
            for l in lines[:10]:
                print(f"   {l}")
            print(f"   ... (中略 {len(lines) - 15} 行) ...")
            for l in lines[-5:]:
                print(f"   {l}")
        else:
            for l in lines:
                print(f"   {l}")
    if proc.returncode != 0:
        if proc.stderr:
            print(f"[ERROR] {proc.stderr.strip()}", file=sys.stderr)
        if check:
            print(f"❌ 命令失敗 (Exit Code {proc.returncode})，發布中斷！", file=sys.stderr)
            sys.exit(proc.returncode)
    return proc.returncode

def bump_version_and_cache():
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    print(f"\n[S0] 快取破除：注入全新發布版號 v={timestamp}...")

    # 1. 更新 VERSION 檔案
    ver_path = os.path.join(ROOT, "VERSION")
    try:
        with open(ver_path, "w", encoding="utf-8") as f:
            f.write(timestamp + "\n")
        print(f"   ✓ 更新 VERSION -> {timestamp}")
    except Exception as e:
        print(f"   [WARN] VERSION 更新失敗: {e}")

    # 2. 更新 app/index.html 中的 script src 版本號
    index_path = os.path.join(ROOT, "app", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # 替換 shell.js?v=... 或 shell.js
        new_content = re.sub(
            r'src="shell\.js(?:\?v=[^"]*)?"',
            f'src="shell.js?v={timestamp}"',
            content
        )
        if new_content != content:
            with open(index_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"   ✓ app/index.html 腳本快取標籤已替換為 shell.js?v={timestamp}")
        else:
            print(f"   - app/index.html 腳本標籤未變更")

    # 3. 更新 app/sw.js 中的 CACHE_NAME
    sw_path = os.path.join(ROOT, "app", "sw.js")
    if os.path.exists(sw_path):
        with open(sw_path, "r", encoding="utf-8") as f:
            sw_content = f.read()
        new_sw = re.sub(
            r'const CACHE_NAME = "math108-[^"]*";',
            f'const CACHE_NAME = "math108-v{timestamp}";',
            sw_content
        )
        if new_sw != sw_content:
            with open(sw_path, "w", encoding="utf-8") as f:
                f.write(new_sw)
            print(f"   ✓ app/sw.js 快取名稱已替換為 math108-v{timestamp}")
        else:
            print(f"   - app/sw.js 快取名稱未變更")
    return timestamp

def main():
    print("=" * 65)
    print("🚀 028-1 國小數學APP — 鋼鐵自動化實體發布系統啟動")
    print("=" * 65)

    # S0: 快取破除與版號更新
    build_version = bump_version_and_cache()

    # S1: 全量守門員測試
    print("\n[S1] 執行全量確定性守門員檢驗...")
    gates = [
        ["node", "tools/verify_curriculum_131.js"],
        ["node", "tools/verify_g2_s23_cdp.js"],
        ["node", "tools/verify_g2_s24_cdp.js"],
        ["node", "tools/verify_g2_s25_cdp.js"],
        ["node", "tools/verify_g2_r21_cdp.js"],
        ["node", "tools/verify_g2_n29_n210_cdp.js"],
        ["node", "tools/verify_g2_n211_n212_cdp.js"],
        ["node", "tools/verify_app_shell.js"],
        ["node", "tools/verify_audio_singleton.js"],
        ["node", "tools/verify_g2_n21_cdp.js"],
        ["node", "tools/verify_g2_n22_cdp.js"],
        ["node", "tools/verify_g2_n23_cdp.js"],
        ["node", "tools/verify_g2_n24_cdp.js"],
        ["node", "tools/verify_circle_concept.js"],
        ["node", "tools/verify_g3_new_concepts.js"],
        ["node", "tools/verify_g3_remaining_concepts.js"],
        ["node", "tools/verify_g2_concept_labs.js"],
        ["node", "tests/verify_concept_hub_cdp.js"],
        ["node", "tests/verify_g3_n39_theater_cdp.js"],
        ["python", "tests/test_tts_endpoint.py"]
    ]
    for g in gates:
        code = run_cmd(g, check=True)
        if code != 0:
            print(f"❌ 守門員未通過: {' '.join(g)}", file=sys.stderr)
            sys.exit(1)
    print("✅ [S1] 所有守門員全部綠燈（Exit Code 0）！")

    # S2: Git 鋼印與推送
    print("\n[S2] 提交變更並推送至 GitHub 專屬倉庫...")
    run_cmd(["git", "add", "."])
    status_proc = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True)
    if status_proc.stdout.strip():
        commit_msg = f"release: 發布新版 (Build {build_version}) - 裝配 G3 N-3-9 Wan 2.2 四幕擬物黏土視訊與曉臻雙軌劇院 (開放 59/131)"
        run_cmd(["git", "commit", "-m", commit_msg])
    else:
        print("   (無新增變更，跳過 commit)")

    print("正在推送至 origin main...")
    run_cmd(["git", "push", "origin", "main"], check=True)
    print("✅ [S2] GitHub 倉庫推送完成！")

    # S3: 部署至 Cloudflare Pages (math-108)
    print("\n[S3] 實體部署至 Cloudflare Pages 邊緣節點 (math-108)...")
    run_cmd([
        "npx", "wrangler", "pages", "deploy", ".",
        "--project-name=math-108",
        "--branch=main",
        "--commit-dirty=true"
    ])
    print("✅ [S3] Cloudflare Pages 實體部署上傳成功！")

    # S4: 遠端邊緣節點實測驗真
    print("\n[S4] 遠端邊緣節點線上驗真 (HTTPS 探測)...")
    verify_url = f"https://math-108.pages.dev/app/index.html?t={int(time.time())}"
    success = False
    for attempt in range(1, 4):
        try:
            print(f"   探測第 {attempt}/3 次: {verify_url} ...")
            req = urllib.request.Request(
                verify_url,
                headers={"User-Agent": "ReleaseVerifier/1.0", "Cache-Control": "no-cache"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                body = resp.read().decode("utf-8", errors="replace")
                if status == 200 and f"shell.js?v={build_version}" in body:
                    print(f"   🎯 遠端節點確認已同步生效！(HTTP 200, 版號 {build_version} 吻合)")
                    success = True
                    break
                else:
                    print(f"   ⏳ 邊緣尚未完全更新 (HTTP {status})，等待 2 秒重試...")
        except Exception as e:
            print(f"   [WARN] 探測失敗: {e}，等待 2 秒重試...")
        time.sleep(2)

    print("\n" + "=" * 65)
    if success:
        print(f"🎉 [RELEASE SUCCESS] 發布圓滿成功！版號: {build_version}")
    else:
        print(f"⚠️ [RELEASE DEPLOYED] 已部署完成，邊緣快取擴散中，請稍候刷新手機！")
    print("🔗 倉庫網址: https://github.com/xfarbetty-svg/math-108-app")
    print("🌐 正式上線網址: https://math-108.pages.dev")
    print("=" * 65)

if __name__ == "__main__":
    main()
