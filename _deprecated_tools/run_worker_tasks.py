# -*- coding: utf-8 -*-
"""
tools/run_worker_tasks.py
AutoFlow Stage 3: 工兵逐卡施工腳本 (通道 1, 成本 $0)
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

def run_task(task_id, prompt_text):
    print(f"\n==================================================")
    print(f"🚀 [AutoFlow Stage 3] 正在派工 {task_id} 給 OpenCode CLI...")
    print(f"==================================================")
    start_t = time.time()
    cmd = ["opencode", "run", prompt_text, "--auto"]
    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        shell=True,
        encoding="utf-8",
        errors="replace",
        timeout=180
    )
    elapsed = time.time() - start_t
    print(f"[{task_id}] 耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
    if proc.stdout:
        print("--- Output ---")
        lines = proc.stdout.splitlines()
        for line in lines[-20:]:  # 印末尾 20 行
            print(line)
    if proc.returncode != 0:
        print(f"[ERROR] {task_id} 執行失敗!")
        sys.exit(proc.returncode)

def main():
    # T-01
    p_t01 = """你是 AutoFlow 施工工兵 (Worker)。
請嚴格依據 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md 中的 T-01 規格：
請直接使用寫入工具建立檔案 app/components/ten-frame-grid.js。

【關鍵要求】：
1. 原生 Web Component: class TenFrameGrid extends HTMLElement，並以 customElements.define('ten-frame-grid', TenFrameGrid) 註冊。
2. 頂層 IIFE 包裹，嚴禁 ES Module (type="module")，相容 file:// 離線秒開。
3. 使用 Shadow DOM (mode: 'open')。
4. 格子 36x36px，gap 4px，2x5 陣列，圓點 24px (紅/藍漸層)，觸控熱區 >= 44px。
5. 狀態機四態：EMPTY_OR_PARTIAL, FUSION_TRIGGER (湊十震動光暈 300ms), FULL_LOCKED (金色滿十光框 #FACC15), RESET。
6. 支援 attributes: value (0..10), theme (red/blue), interactive (true/false)。
7. 對外派發 CustomEvent: grid:change, grid:overflow, grid:locked。
8. disconnectedCallback 清除所有計時器。

請直接落盤 app/components/ten-frame-grid.js，不需要等待確認，立即寫入！"""
    run_task("T-01", p_t01)

    # T-02
    p_t02 = """你是 AutoFlow 施工工兵 (Worker)。
請嚴格依據 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md 中的 T-02 規格：
請直接使用寫入工具建立檔案 app/components/dual-track-diff.js。

【關鍵要求】：
1. 原生 Web Component: class DualTrackDiff extends HTMLElement，自定義標籤 <dual-track-diff>。
2. 頂層 IIFE，禁 ES Module，純 SVG 向量繪製，Shadow DOM。
3. 雙軌平行滑道：上軌紅色圓片 (預設 8)，下軌藍色圓片 (預設 5)。
4. 視覺動態：
   - 前 min(top, bottom) 顆垂直綠色對齊虛線連動。
   - 超出差值部分以金色流光矩形框選標註「相差 N 顆」。
   - 下方算式連動：如「8 - 5 = 3」；若相等顯示「5 ＝ 5 一樣多」。
5. attributes: top (0..10), bottom (0..10), interactive (true/false)。
6. 對外派發 diff:change 等事件。

請直接落盤 app/components/dual-track-diff.js，不需要等待確認，立即寫入！"""
    run_task("T-02", p_t02)

    # T-03
    p_t03 = """你是 AutoFlow 施工工兵 (Worker)。
請嚴格依據 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md 中的 T-03 規格：
請直接使用寫入工具建立檔案 app/components/balance-beam.js。

【關鍵要求】：
1. 原生 Web Component: class BalanceBeam extends HTMLElement，自定義標籤 <balance-beam>。
2. 頂層 IIFE，禁 ES Module，純 SVG，Shadow DOM。
3. 嚴禁靜態固定角度！必須使用 BP 指定力矩與阻尼公式：
   Δτ = (leftWeight * d) - (rightWeight * d)
   θ_target = clamp(atan2(Δτ, 1200), -15°, +15°)
   θ'' = 0.012 * (θ_target - θ) - 0.18 * θ'
4. 狀態機三態：UNBALANCED (顯示 ≠), BALANCING (彈簧阻尼振盪收斂), EQUALS_ACHIEVED (中央亮金色大「＝」，底部顯示雙向算式)。
5. attributes: left-weight (0..10), right-weight (0..10), right-expression, damping, animate。
6. disconnectedCallback 清除 rAF 迴圈。

請直接落盤 app/components/balance-beam.js，不需要等待確認，立即寫入！"""
    run_task("T-03", p_t03)

    # T-04
    p_t04 = """你是 AutoFlow 施工工兵 (Worker)。
請嚴格依據 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md 中的 T-04 規格：
請直接使用寫入工具建立檔案 app/playground.html。

【關鍵要求】：
1. 單檔自足 HTML，以傳統 <script src="components/ten-frame-grid.js"></script>、<script src="components/dual-track-diff.js"></script>、<script src="components/balance-beam.js"></script> 載入。
2. 三端自適應預覽切換器：
   - 頂部有 3 個按鈕：「📱 手機 390px」、「📱 平板 768px」、「💻 電腦 960px」，點擊時即時改變舞台容器寬度並居中顯示。
3. 分三個教具測試卡片展示：
   - 卡片 1: <ten-frame-grid>，配有數值按鈕 (+1, -1, 設為9, 湊滿10, 重設) 與狀態標籤。
   - 卡片 2: <dual-track-diff>，配有上軌/下軌滑桿或加減按鈕，即時連動金框與算式。
   - 卡片 3: <balance-beam>，配有左盤/右盤砝碼調節按鈕、阻尼滑桿、一鍵天平平衡測試。
4. 現代俐落 UI，純本地自足無 CDN，支援離線雙擊秒開。

請直接落盤 app/playground.html，不需要等待確認，立即寫入！"""
    run_task("T-04", p_t04)

    print("\n🎉 [AutoFlow Stage 3] T-01 ~ T-04 全部工單執行完畢！")

if __name__ == "__main__":
    main()
