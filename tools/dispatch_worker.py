# -*- coding: utf-8 -*-
"""
tools/dispatch_worker.py - 028-1 專屬工兵調用唯一標準入口 (遵循 Step-by-Step 單步推進規範)
嚴禁 Agent 自行動手手寫業務代碼，所有生成與實作任務一律經由本腳本派工！
支援通道一 (本地 OpenCode) 與通道二 (A-SERVER SSH) 自動 Failover 容錯。
"""

import argparse
import os
import subprocess
import sys
import time

OPENCODE_DEFAULT_MODEL = "opencode/glm-5.3-flash-free"
OPENCODE_FALLBACK_MODEL = "google/gemini-2.5-flash"

def run_worker(prompt: str, task_file: str = None, model: str = OPENCODE_DEFAULT_MODEL, timeout: int = 300, channel: int = 1, auto_fallback: bool = True) -> int:
    """
    依據 Step-by-Step 規範以標準子進程呼叫 OpenCode CLI：
    Channel 1: 本地 OpenCode CLI (支援 GLM-free 額度耗盡自動切換 gemini-2.5-flash)
    Channel 2: A-SERVER SSH 遠端 OpenCode CLI
    """
    if channel == 2:
        # A-SERVER SSH 通道
        full_prompt = prompt
        if task_file and os.path.isfile(task_file):
            try:
                with open(task_file, "r", encoding="utf-8") as f:
                    file_content = f.read()
                full_prompt = f"【任務卡內容】\n{file_content}\n\n【執行指令】\n{prompt}"
            except Exception as e:
                print(f"[Worker Dispatch CH2] 讀取任務卡失敗: {e}", file=sys.stderr)
        
        # 轉義單引號供 bash/ssh 使用
        escaped_prompt = full_prompt.replace("'", "'\\''")
        cmd = ["ssh", "-n", "a-server", f"opencode run -m {model} --format json --auto --standalone '{escaped_prompt}'"]
        print(f"[Worker Dispatch CH2] 正在派工至 A-SERVER OpenCode (Model: {model})...")
    else:
        cmd = ["opencode", "run", "--format", "json", "--auto", "--standalone", "-m", model]
        if task_file and os.path.isfile(task_file):
            cmd.extend(["-f", task_file])
        cmd.append(prompt)
        print(f"[Worker Dispatch CH1] 正在派工至本地 OpenCode (Model: {model})...")
    
    t0 = time.time()
    try:
        proc = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=(channel == 1), # 本地 Windows 需要 shell=True，SSH 則直接執行
            timeout=timeout
        )
        elapsed = time.time() - t0
        print(f"[Worker Dispatch CH{channel}] 完成，耗時 {elapsed:.2f}s，Exit Code: {proc.returncode}")
        
        if proc.returncode != 0:
            print(f"[Worker Dispatch ERROR] 工兵執行失敗 (Exit Code {proc.returncode})", file=sys.stderr)
            if proc.stderr:
                print(proc.stderr.strip()[:500], file=sys.stderr)
            
            # 若通道 1 失敗且開啟自動容錯：
            # 優先切換至本地備援模型 (gemini-2.5-flash)，維持本地工具落地能力
            if channel == 1 and auto_fallback:
                if model != OPENCODE_FALLBACK_MODEL:
                    print(f"[Worker Dispatch FAILOVER] ⚠️ 通道 1 額度耗盡或異常，切換至本地備援模型 ({OPENCODE_FALLBACK_MODEL})...")
                    return run_worker(prompt=prompt, task_file=task_file, model=OPENCODE_FALLBACK_MODEL, timeout=timeout, channel=1, auto_fallback=True)
                else:
                    print("[Worker Dispatch FAILOVER] ⚠️ 本地備援亦異常，自動切換至通道 2 (A-SERVER SSH 備援)...")
                    return run_worker(prompt=prompt, task_file=task_file, model=model, timeout=timeout, channel=2, auto_fallback=False)
                
            return proc.returncode
            
        if proc.stdout:
            print("[Worker Output Preview]:")
            lines = [l for l in proc.stdout.splitlines() if l.strip()]
            for l in lines[-10:]:
                print("  ", l[:120])
                
        return 0
        
    except subprocess.TimeoutExpired:
        print(f"[Worker Dispatch TIMEOUT] 工兵執行超過 {timeout}s 逾時！", file=sys.stderr)
        if channel == 1 and auto_fallback:
            print("[Worker Dispatch FAILOVER] ⚠️ 通道 1 逾時，自動切換至通道 2 (A-SERVER SSH 備援)...")
            return run_worker(prompt=prompt, task_file=task_file, model=model, timeout=timeout, channel=2, auto_fallback=False)
        return 43
    except Exception as e:
        print(f"[Worker Dispatch EXCEPTION] {e}", file=sys.stderr)
        if channel == 1 and auto_fallback:
            print("[Worker Dispatch FAILOVER] ⚠️ 通道 1 例外，自動切換至通道 2 (A-SERVER SSH 備援)...")
            return run_worker(prompt=prompt, task_file=task_file, model=model, timeout=timeout, channel=2, auto_fallback=False)
        return 1

def main():
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    parser = argparse.ArgumentParser(description="028-1 OpenCode 派工標準工具 (Step-by-Step 規範)")
    parser.add_argument("prompt", nargs="?", default="健康檢查：請回覆「通道正常」", help="派工提示詞或簡述")
    parser.add_argument("--file", "-f", help="任務卡檔案路徑 (.md)")
    parser.add_argument("--channel", "-c", type=int, choices=[1, 2], default=1, help="通道選擇 (1=本地 OpenCode, 2=A-SERVER OpenCode)")
    parser.add_argument("--model", "-m", default=OPENCODE_DEFAULT_MODEL, help="模型名稱")
    parser.add_argument("--timeout", "-t", type=int, default=300, help="逾時秒數 (預設 300s)")
    parser.add_argument("--no-fallback", action="store_true", help="關閉自動 Failover 到通道 2")
    parser.add_argument("--test", action="store_true", help="執行快速自我檢查")
    
    args = parser.parse_args()
    
    if args.test:
        print(f"[Dispatch Self-Test] 開始執行通道 {args.channel} 自我檢測...")
        code = run_worker(f"自我檢測：請簡短回覆「通道{args.channel}連線正常」即可，不要操作任何檔案。", timeout=30, channel=args.channel, auto_fallback=not args.no_fallback)
        sys.exit(code)
        
    code = run_worker(prompt=args.prompt, task_file=args.file, model=args.model, timeout=args.timeout, channel=args.channel, auto_fallback=not args.no_fallback)
    sys.exit(code)

if __name__ == "__main__":
    main()
