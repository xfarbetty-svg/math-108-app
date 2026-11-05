# -*- coding: utf-8 -*-
"""
tools/run_worker_continue.py
通知 OpenCode Worker 執行「繼續」，將 5 步修復全量落地！
"""
import os
import sys
import subprocess
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def main():
    print("[AutoFlow Stage 3] 發送指令『繼續』，推動 OpenCode Worker 落地 5 步修復...")
    
    prompt = "繼續。請直接依序執行 1~5 步全部落地，寫入對應檔案，完成後跑 node tools/ac_run.js 驗證並回報真實 Exit Code 與 git diff。"

    start_t = time.time()
    cmd = ["opencode", "run", "--continue", prompt, "--auto"]
    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        shell=True,
        encoding="utf-8",
        errors="replace",
        timeout=300
    )
    elapsed = time.time() - start_t
    print(f"[Worker Continue] 耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
    if proc.stdout:
        print("--- Output ---")
        lines = proc.stdout.splitlines()
        for line in lines[-30:]:
            print(line)
    if proc.returncode != 0:
        print(f"[ERROR] 執行失敗，Exit Code: {proc.returncode}")
        sys.exit(proc.returncode)

    print("[Worker Continue] 5 步修復已全部落地！")

if __name__ == "__main__":
    main()
