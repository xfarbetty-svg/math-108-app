# -*- coding: utf-8 -*-
"""
tools/dispatch_worker.py - 028-1 專屬工兵調用唯一標準入口 (遵循 026 AutoFlow 規範)
嚴禁 Agent 自行動手手寫業務代碼，所有生成與實作任務一律經由本腳本派工！
"""

import argparse
import os
import subprocess
import sys
import time

OPENCODE_DEFAULT_MODEL = "opencode/deepseek-v4.1-flash-free"

def run_worker(prompt: str, task_file: str = None, model: str = OPENCODE_DEFAULT_MODEL, timeout: int = 180) -> int:
    """
    依據 026 規範以標準子進程呼叫 OpenCode CLI：
    1. --format json: 避免管道阻塞
    2. --auto: 自動執行工具
    3. --standalone: 獨立進程，不走 TUI
    4. stdin=subprocess.DEVNULL: 徹底避免 Windows 主控台假死 2 小時
    5. encoding="utf-8": 杜絕 Windows CP950 解碼崩潰
    """
    cmd = ["opencode", "run", "--format", "json", "--auto", "--standalone", "-m", model]
    
    if task_file and os.path.isfile(task_file):
        cmd.extend(["-f", task_file])
    
    cmd.append(prompt)
    
    print(f"[Worker Dispatch] 正在派工至 OpenCode (Model: {model})...")
    t0 = time.time()
    
    try:
        proc = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=True,
            timeout=timeout
        )
        elapsed = time.time() - t0
        print(f"[Worker Dispatch] 完成，耗時 {elapsed:.2f}s，Exit Code: {proc.returncode}")
        
        if proc.returncode != 0:
            print(f"[Worker Dispatch ERROR] 工兵執行失敗 (Exit Code {proc.returncode})", file=sys.stderr)
            if proc.stderr:
                print(proc.stderr.strip()[:500], file=sys.stderr)
            return proc.returncode
            
        if proc.stdout:
            print("[Worker Output Preview]:")
            lines = [l for l in proc.stdout.splitlines() if l.strip()]
            for l in lines[-10:]:
                print("  ", l[:120])
                
        return 0
        
    except subprocess.TimeoutExpired:
        print(f"[Worker Dispatch TIMEOUT] 工兵執行超過 {timeout}s 逾時！", file=sys.stderr)
        return 43
    except Exception as e:
        print(f"[Worker Dispatch EXCEPTION] {e}", file=sys.stderr)
        return 1

def main():
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="028-1 OpenCode 派工標準工具")
    parser.add_argument("prompt", nargs="?", default="健康檢查：請回覆「通道一正常」", help="派工提示詞或簡述")
    parser.add_argument("--file", "-f", help="任務卡檔案路徑 (.md)")
    parser.add_argument("--model", "-m", default=OPENCODE_DEFAULT_MODEL, help="模型名稱")
    parser.add_argument("--timeout", "-t", type=int, default=180, help="逾時秒數 (預設 180s)")
    parser.add_argument("--test", action="store_true", help="執行快速自我檢查")
    
    args = parser.parse_args()
    
    if args.test:
        print("[Dispatch Self-Test] 開始執行通道自我檢測...")
        code = run_worker("自我檢測：請簡短回覆「通道一連線正常」即可，不要操作任何檔案。", timeout=30)
        sys.exit(code)
        
    code = run_worker(prompt=args.prompt, task_file=args.file, model=args.model, timeout=args.timeout)
    sys.exit(code)

if __name__ == "__main__":
    main()