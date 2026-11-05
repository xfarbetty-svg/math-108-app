# -*- coding: utf-8 -*-
"""
tools/run_worker_fix_tickets.py
AutoFlow Stage 3 修補：由 Worker 依據 TCK-01 ~ TCK-08 工單精準修補代碼
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
    print("[AutoFlow Stage 3 Ticket Fix] 啟動 OpenCode Worker 修復工單...")
    
    prompt = """你是 AutoFlow 施工工兵 (Worker)。
BP 現場指揮官與 AGY 已通過 R1_BP_TICKET_RULING.md 與 R2_AGY_PLAN_REVIEW.md。
請依據 reports/20261105_2035_g1_visual_spec/R1_CHALLENGER_TICKETS.md 的裁決，立即修補以下檔案：

1. 修補 app/components/ten-frame-grid.js：
   - 【TCK-02 390px 算術】：將格子從 36px 調為 30px，gap 3px，padding 4px，確保單盒寬度 <= 186px，使兩盒並排 (372px) 能在 390px 手機流暢並排不爆橫向捲軸！
   - 【TCK-04 生命週期】：修正 disconnectedCallback，移除時不可將 _cells 清空而未銷毀 DOM，確保 append -> remove -> append 重連後點擊不會 throw TypeError！
   - 【TCK-05 事件與色票】：移除未登記事件 ten-frame:tap，藍版漸層雙變數化（--tfg-hi 與 --tfg-fill），避免藍版中心仍為鮭紅色。

2. 修補 app/components/balance-beam.js：
   - 【TCK-04 生命週期】：_build() 掛載時先執行 this._root.replaceChildren()，避免重連時重複疊加 SVG 與 style 標籤。
   - 【TCK-07 物理公式量綱】：明訂 θ_target 單位為 deg，半隱式 Euler 積分乘上 scale = dt / 16.667 歸一化，防止 120Hz 下甩動過快。

3. 修補 app/playground.html：
   - 【TCK-03 算理閉環】：在頁面中增加「湊十法 (9+4=13)」算理演繹展示，包含兩盒十格陣同屏並排、點擊右盒觸發拋物線飛入左盒補滿第 10 格金色鎖框、下方顯現分解樹「4 分解為 1 與 3，9+1=10，10+3=13」，補齊算理閉環！

請直接呼叫工具修改上述檔案。不需要停下詢問，立即執行！
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        shell=True,
        encoding="utf-8",
        errors="replace",
        timeout=240
    )
    elapsed = time.time() - start_t
    print(f"[Worker Fix] 耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
    if proc.stdout:
        print("--- Output ---")
        lines = proc.stdout.splitlines()
        for line in lines[-25:]:
            print(line)
    if proc.returncode != 0:
        print(f"[ERROR] 執行失敗，Exit Code: {proc.returncode}")
        sys.exit(proc.returncode)

    print("[Worker Fix] 修補完成！")

if __name__ == "__main__":
    main()
