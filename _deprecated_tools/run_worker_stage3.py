# -*- coding: utf-8 -*-
"""
tools/run_worker_stage3.py
AutoFlow Stage 3 施工腳本：調用本地 OpenCode CLI (通道 1，成本 $0)
由工兵 Worker 帶手腳落實 T-01 ~ T-04 教具組件與調試台
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
    print("[AutoFlow Stage 3] 啟動 OpenCode Worker 帶手腳施工流程...")
    
    prompt = """你是 AutoFlow v2.6.3 的代碼施工工兵 (Worker)。
現場指揮官 BP 與架構大腦 AGY 已簽署放行書 R2_AGY_PLAN_REVIEW.md。
請嚴格依據計畫書：
reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md
並可參考 reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html 中的打樣實現。

【施工任務清單 (T-01 ~ T-04)】：
1. 建立 app/components/ten-frame-grid.js
   - 原生 Web Component: <ten-frame-grid>
   - 封裝為 IIFE，禁止 ES Module (type="module")，相容 file:// 離線秒開
   - 包含 Shadow DOM、純 SVG/DOM 渲染、滿十閉鎖、湊十拋物線、對外派發事件
2. 建立 app/components/dual-track-diff.js
   - 原生 Web Component: <dual-track-diff>
   - 支援上下軌道計數圓片、垂直綠色對齊虛線、金色差值矩形動態高亮、算式聯動
3. 建立 app/components/balance-beam.js
   - 原生 Web Component: <balance-beam>
   - 實現真實物理阻尼振盪力矩公式（不得使用固定角度切換），收斂時亮金色等號「＝」與雙向算式
4. 建立 app/playground.html
   - 集中調試台，使用傳統 <script src="components/..."> 載入上述三個元件
   - 包含三端切換按鈕 (手機 390px、平板 768px、電腦 960px)，動態調整舞台外框
   - 包含即時控制參數面板（按鈕/滑桿即時改變教具 attributes），即時驗證手感

請立即調用寫檔工具落地上述 4 個檔案。完成後簡要報告檔案路徑與狀態。
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    
    print("[AutoFlow Stage 3] 正在調用 OpenCode CLI (通道 1, 注入 stdin=DEVNULL)...")
    try:
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
        print(f"[AutoFlow Stage 3] 執行完畢，耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
        if proc.stdout:
            print("--- OpenCode STDOUT (前 40 行) ---")
            lines = proc.stdout.splitlines()
            for line in lines[:40]:
                print(line)
        if proc.returncode != 0:
            print(f"[ERROR] OpenCode 返回非 0 狀態碼: {proc.returncode}")
            if proc.stderr:
                print("--- OpenCode STDERR ---")
                print(proc.stderr[:1000])
            sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print("[ERROR] OpenCode 執行超時 (300s 熔斷)！")
        sys.exit(43)
    except Exception as e:
        print(f"[ERROR] 執行異常: {e}")
        sys.exit(1)

    print("[AutoFlow Stage 3] 工兵施工完成！")

if __name__ == "__main__":
    main()
