# -*- coding: utf-8 -*-
"""
tools/run_worker_s11.py
AutoFlow Stage 3 施工腳本：調用本地 OpenCode CLI (Magpie 免費通道, 成本 $0)
透過 -f 附件安全傳遞長篇提示詞，徹底根除 Windows 命令列截斷問題
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
    print("[AutoFlow Stage 3] 啟動 OpenCode Worker 帶手腳施工流程 (S-1-1 幾何形體)...")
    
    prompt = """你是 AutoFlow v2.6.3 的代碼施工工兵 (Worker)。
現場指揮官 BP 與架構大腦 AGY 已簽署放行書 reports/20261109_2225_g1_s11_spec/R2_AGY_PLAN_REVIEW.md。
請嚴格依據計畫書：
reports/20261109_2225_g1_s11_spec/R1_BP_EXECUTION_PLAN.md
並可參考 reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html 中的樣品 06 (S-1-1) 實現。

【施工任務清單 (T-05)】：
1. 建立 app/components/isometric-rotator.js
   - 原生 Web Component: <isometric-rotator>
   - 封裝為 IIFE，禁止 ES Module (type="module")，相容 file:// 離線秒開
   - 包含 Shadow DOM、純 SVG viewBox="-160 -110 320 220"
   - 單一旋轉群組 <g id="rot" transform="rotate(θ)"> 包含形狀本體、直角記號 (黃色內縮折線)、邊長等長斜短線、文字標籤
   - 文字標籤使用 transform="rotate(-θ, x, y)" 保持直立可讀
   - 支援 5 種 shape：square, rectangle, triangle, circle (含直徑線與圓心), cylinder-unfold (含藍色長方形側面 k=0.55 與綠色上下底圓，圖說「示意圖，未按真實比例」)
   - 支援 attributes: shape, angle, show-labels, progress
   - 支援方法: setAngle(deg), setProgress(p)
   - 支援事件: rotator:change (detail: {shape, angle, isSquare: shape === 'square'}), rotator:unfolded
   - 遵守生命週期對稱 (disconnectedCallback 保留 _built 與內部狀態，重連不報 TypeError)
   - 嚴格遵守單檔純文字大小 <= 12,288 B (12 KB 硬閘門)！

2. 建立 tests/ac_isometric_rotator.html
   - 專屬獨立 AC 驗收頁面，可直接在瀏覽器或無頭 Chrome 開啟
   - 掛載 <isometric-rotator> 並包含自動化檢查測試 (AC-05-1a~d, AC-05-2a~d, AC-05-3a~d, AC-05-4a~c)
   - 在 window.__acReport 輸出測試通過筆數與失敗明細

3. 產出施工回報書：reports/20261109_2225_g1_s11_spec/R3_WORKER_BUILD_REPORT.md
   - 標明建立的檔案、程式行數、精確 Byte 數、偏離事項 (D-01 等若有) 與驗證命令

【執行鐵律】：
請不要向我提問、不要等待確認、不要停下，請直接調用寫檔工具立即建立上述 3 個檔案！落盤完成後回報檔案路徑與 Byte 數即可。
"""

    os.makedirs("_scratch", exist_ok=True)
    prompt_file = "_scratch/worker_s11_prompt.txt"
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(prompt)

    start_t = time.time()
    # 使用本地 Magpie 網關免費通道 (成本 $0，突破 Zen Free 429 限流)
    # 搭配 -f 附件參數，杜絕 Windows CLI 斷行吞字
    cmd = [
        "opencode", "run",
        "-m", "magpie/openrouter/recursive/flint-v1.0:free",
        "-f", prompt_file,
        "請嚴格執行附件檔案內的所有代碼施工與報告建立指令，不要等待確認，立即寫入檔案",
        "--auto"
    ]
    
    print("[AutoFlow Stage 3] 正在調用 OpenCode CLI (Magpie 免費通道, 注入 stdin=DEVNULL)...")
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
            print("--- OpenCode STDOUT (前 35 行) ---")
            lines = proc.stdout.splitlines()
            for line in lines[:35]:
                print(line)
        if proc.returncode != 0:
            print(f"[ERROR] OpenCode 返回非 0 狀態碼: {proc.returncode}")
            if proc.stderr:
                print("--- OpenCode STDERR ---")
                print(proc.stderr[:500])
            sys.exit(proc.returncode)
    except Exception as e:
        print(f"調用 OpenCode 發生異常: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
