# -*- coding: utf-8 -*-
"""
tools/dispatch_worker.py - 028-1 專屬工兵調用唯一標準入口 (遵循 Step-by-Step 單步推進規範)
嚴禁 Agent 自行動手手寫業務代碼，所有生成與實作任務一律經由本腳本派工！
支援通道一 (本地 OpenCode)、通道二 (A-SERVER SSH) 與通道三 (035 金鑰池) 三級真自動 Failover 鋼鐵閉環。
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

OPENCODE_DEFAULT_MODEL = "opencode/deepseek-v4.1-flash-free"
LOCAL_FREE_MODELS = [
    "opencode/deepseek-v4.1-flash-free",
    "opencode/nemotron-3.5-lightning-free",
    "opencode/mimo-v2.6-flash-free"
]

def run_channel3_gemini_pool(prompt: str, task_file: str = None) -> int:
    """通道三：035 Key Pool 本地 8把 Key 輪詢閘道 (http://127.0.0.1:4000/v1)"""
    print("[Worker Dispatch CH3] 正在派工至通道三 (035 Key Pool 8把 Key 閘道)...")
    is_json = ".json" in prompt or (task_file and ".json" in task_file)
    if is_json:
        req_note = "【重要要求】請務必輸出標準純 JSON 檔案內容，以 ```json ... ``` 包覆，嚴禁包含任何 HTML 標籤，嚴禁任何省略、註釋跳過或佔位符！"
        sys_note = "你是一個資深架構師與題庫工程師，嚴格按照任務卡實作資料契約。只輸出繁體中文的純 JSON 格式內容，不要任何無關寒暄。"
    else:
        req_note = "【重要要求】請務必輸出完整可運行的 HTML 檔案全文，包含完整的 CSS 與 JavaScript，嚴禁任何省略、註釋跳過或佔位符！"
        sys_note = "你是一個資深專業前端與互動教具工程師，嚴格按照任務卡實作代碼。只輸出繁體中文的 HTML 完整代碼，不要任何無關寒暄。"

    full_prompt = prompt
    if task_file and os.path.isfile(task_file):
        try:
            with open(task_file, "r", encoding="utf-8") as f:
                full_prompt = f"【任務卡內容】\n{f.read()}\n\n【執行指令】\n{prompt}\n\n{req_note}"
        except Exception as e:
            print(f"[Worker Dispatch CH3] 讀取任務卡失敗: {e}", file=sys.stderr)

    url = "http://127.0.0.1:4000/v1/chat/completions"
    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": sys_note},
            {"role": "user", "content": full_prompt}
        ],
        "temperature": 0.2
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - t0
            print(f"[Worker Dispatch CH3] 成功完成，耗時 {elapsed:.2f}s，HTTP {resp.status}")
            output_text = data["choices"][0]["message"]["content"]
            
            # 尋找目標檔案路徑並原子寫入 (優先從指令 prompt 擷取，其次才從 full_prompt 搜尋)
            target_match = re.search(r"(?:app/components/[a-zA-Z0-9_\-]+\.html|data/units/[a-zA-Z0-9_\-/]+\.json)", prompt)
            if not target_match:
                target_match = re.search(r"(?:app/components/[a-zA-Z0-9_\-]+\.html|data/units/[a-zA-Z0-9_\-/]+\.json)", full_prompt)
            if target_match:
                target_path = target_match.group(0)
                code = output_text
                if target_path.endswith(".json"):
                    code_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", output_text, re.IGNORECASE)
                    if code_match:
                        code = code_match.group(1).strip()
                    elif "{" in output_text and "}" in output_text:
                        start = output_text.find("{")
                        end = output_text.rfind("}")
                        if end != -1:
                            code = output_text[start:end+1].strip()
                else:
                    code_match = re.search(r"```(?:html)?\s*([\s\S]*?)```", output_text, re.IGNORECASE)
                    if code_match:
                        code = code_match.group(1).strip()
                    elif "<!DOCTYPE html>" in output_text:
                        start = output_text.find("<!DOCTYPE html>")
                        end = output_text.rfind("</html>")
                        if end != -1:
                            code = output_text[start:end+7].strip()

                target_dir = os.path.dirname(target_path)
                os.makedirs(target_dir, exist_ok=True)
                fd, tmp_path = tempfile.mkstemp(dir=target_dir, suffix=".tmp")
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    f.write(code)
                os.replace(tmp_path, target_path)
                print(f"[Worker Dispatch CH3] ✅ 成功原子寫入目標檔案: {target_path} ({len(code)} bytes)")

            print("[Worker CH3 Output Preview]:")
            for line in output_text.splitlines()[:5]:
                print("  ", line[:120])
            return 0
    except Exception as e:
        print(f"[Worker Dispatch CH3 ERROR] 通道三調用失敗: {e}", file=sys.stderr)
        return 1

def run_worker(prompt: str, task_file: str = None, model: str = OPENCODE_DEFAULT_MODEL, timeout: int = 300, channel: int = 1, auto_fallback: bool = True) -> int:
    """
    依據 Step-by-Step 規範執行標準派工：
    Channel 1: 本地 OpenCode CLI (支援多組免費模型自動輪換)
    Channel 2: A-SERVER SSH 遠端 OpenCode CLI (獨立 GLM 配額)
    Channel 3: 035 Key Pool 本地 8把 Google Key 池備援
    """
    full_prompt = prompt
    if task_file and os.path.isfile(task_file):
        try:
            with open(task_file, "r", encoding="utf-8") as f:
                file_content = f.read()
            full_prompt = f"【任務卡內容】\n{file_content}\n\n【執行指令】\n{prompt}"
        except Exception as e:
            print(f"[Worker Dispatch] 讀取任務卡失敗: {e}", file=sys.stderr)

    if channel == 2:
        # A-SERVER SSH 通道：強制使用 A-SERVER 專屬的免費模型 (獨立配額)
        target_model = OPENCODE_DEFAULT_MODEL if "google/" in model else model
        escaped_prompt = full_prompt.replace("'", "'\\''").replace('"', '\\"')
        cmd = ["ssh", "-n", "a-server", f"opencode run -m {target_model} --format json --auto --standalone \"{escaped_prompt}\""]
        print(f"[Worker Dispatch CH2] 正在派工至 A-SERVER OpenCode (Model: {target_model})...")
    else:
        import shutil
        opencode_bin = shutil.which("opencode") or "opencode"
        cmd = [opencode_bin, "run", "--format", "json", "--auto", "--standalone", "-m", model]
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
            shell=False,
            timeout=timeout
        )
        elapsed = time.time() - t0
        print(f"[Worker Dispatch CH{channel}] 完成，耗時 {elapsed:.2f}s，Exit Code: {proc.returncode}")
        
        if proc.returncode != 0:
            print(f"[Worker Dispatch ERROR] 通道 {channel} 執行失敗 (Exit Code {proc.returncode})")
            if proc.stderr:
                print(f"[Worker Dispatch STDERR]: {proc.stderr.strip()[:600]}")
            if proc.stdout:
                print(f"[Worker Dispatch STDOUT]: {proc.stdout.strip()[:600]}")
            
            if auto_fallback:
                if channel == 1:
                    # 通道 1 失敗：先換本地其他免費模型，若全掛則切換至通道 2
                    curr_idx = LOCAL_FREE_MODELS.index(model) if model in LOCAL_FREE_MODELS else -1
                    if curr_idx != -1 and curr_idx + 1 < len(LOCAL_FREE_MODELS):
                        next_model = LOCAL_FREE_MODELS[curr_idx + 1]
                        print(f"[Worker Dispatch FAILOVER] ⚠️ 通道 1 切換至本地替代免費模型 ({next_model})...")
                        return run_worker(prompt=prompt, task_file=task_file, model=next_model, timeout=timeout, channel=1, auto_fallback=True)
                    else:
                        print("[Worker Dispatch FAILOVER] ⚠️ 通道 1 本地模型全數耗盡，自動切換至通道 2 (A-SERVER SSH 備援)...")
                        return run_worker(prompt=prompt, task_file=task_file, model=OPENCODE_DEFAULT_MODEL, timeout=timeout, channel=2, auto_fallback=True)
                elif channel == 2:
                    # 通道 2 也失敗：自動切換至通道 3 (035 Key Pool)
                    print("[Worker Dispatch FAILOVER] ⚠️ 通道 2 亦異常，自動切換至通道 3 (035 Key Pool 8把 Key 備援)...")
                    return run_channel3_gemini_pool(prompt=prompt, task_file=task_file)
                
            return proc.returncode
            
        if proc.stdout:
            print("[Worker Output Preview]:")
            lines = [l for l in proc.stdout.splitlines() if l.strip()]
            for l in lines[-10:]:
                print("  ", l[:120])
                
        return 0

    except subprocess.TimeoutExpired:
        print(f"[Worker Dispatch TIMEOUT] 通道 {channel} 超時 ({timeout}s)！", file=sys.stderr)
        if auto_fallback and channel == 1:
            print("[Worker Dispatch FAILOVER] ⚠️ 超時切換至通道 2...")
            return run_worker(prompt=prompt, task_file=task_file, model=OPENCODE_DEFAULT_MODEL, timeout=timeout, channel=2, auto_fallback=True)
        elif auto_fallback and channel == 2:
            print("[Worker Dispatch FAILOVER] ⚠️ 通道 2 超時切換至通道 3...")
            return run_channel3_gemini_pool(prompt=prompt, task_file=task_file)
        return 124
    except Exception as e:
        print(f"[Worker Dispatch EXCEPTION] 通道 {channel} 異常: {e}", file=sys.stderr)
        if auto_fallback and channel < 3:
            next_ch = channel + 1
            print(f"[Worker Dispatch FAILOVER] ⚠️ 切換至通道 {next_ch}...")
            if next_ch == 2:
                return run_worker(prompt=prompt, task_file=task_file, model=OPENCODE_DEFAULT_MODEL, timeout=timeout, channel=2, auto_fallback=True)
            else:
                return run_channel3_gemini_pool(prompt=prompt, task_file=task_file)
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="028-1 工兵派工腳本 (支援通道 1/2/3 自動容錯)")
    parser.add_argument("prompt", help="發送給工兵的具體執行指令")
    parser.add_argument("--file", "-f", help="任務卡 Markdown 檔案路徑", default=None)
    parser.add_argument("--model", "-m", help="指定 OpenCode 模型名稱", default=OPENCODE_DEFAULT_MODEL)
    parser.add_argument("--channel", "-c", help="指定起始通道 (1: 本地, 2: A-SERVER, 3: 035 Key Pool)", type=int, default=1)
    parser.add_argument("--timeout", "-t", help="超時秒數", type=int, default=300)
    parser.add_argument("--no-fallback", help="關閉自動 Failover", action="store_true")
    
    args = parser.parse_args()
    if args.channel == 3:
        code = run_channel3_gemini_pool(prompt=args.prompt, task_file=args.file)
    else:
        code = run_worker(
            prompt=args.prompt,
            task_file=args.file,
            model=args.model,
            timeout=args.timeout,
            channel=args.channel,
            auto_fallback=(not args.no_fallback)
        )
    sys.exit(code)
