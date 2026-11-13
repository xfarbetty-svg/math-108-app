# -*- coding: utf-8 -*-
"""
tools/run_worker_rework_rk.py
AutoFlow Stage 4.5: Worker 依據 R5_REWORK_TICKETS.md 執行代碼精準修復
"""
import os
import sys
import subprocess
import time

def main():
    print("[AutoFlow Stage 4.5] 調用 OpenCode Worker 執行 RK-01 ~ RK-05 重工施工...")

    prompt = """你是 AutoFlow 施工工兵 (Worker)。
BP 現場指揮官已完成 Stage 4 盲審並開立 `reports/20261105_2035_g1_visual_spec/R5_REWORK_TICKETS.md`。
請使用 edit/write 工具，精準修復以下 5 項問題，修復後不可超過單檔體積 12,288 B 限制：

==================================================
1. 【RK-01】修復 app/components/dual-track-diff.js (F-01 重連 TypeError)
==================================================
- 原因：disconnectedCallback() 將 this._links, this._top, this._bottom 設為 null，但保留 this._built = true。當元素被 append -> remove -> append 重連時，_render() 對 null 呼叫 replaceChildren() 拋出 TypeError。
- 處置：在 connectedCallback() 或 _build() 中，如果發現 this._links 為 null，需安全重新初始化容器或在 disconnectedCallback() 中保留容器參照，確保重連後能安全再次 _render() 不拋錯！

==================================================
2. 【RK-02】修復 app/components/ten-frame-grid.js (F-02 aria 狀態脫節)
==================================================
- 原因：填格（如 setCount 或點擊）後未呼叫 _syncTheme() 或未更新 host 的 aria-label 與 cell 的 disabled 狀態，導致 aria-label 停在「已填 0 格」。
- 處置：在 setCount(v) 與點擊填格更新 _value 時，必須同步更新 host 的 aria-label (如 `十格陣，已填 ${this._value} 格`)，並同步更新已填格子的 disabled/aria-pressed 屬性。

==================================================
3. 【RK-03】修復 tests/ac_t02.html (空洞驗收)
==================================================
- 處置：在 AC-02-6 測試中，除了比對重連後的節點數，必須增加「重連後呼叫 setAttribute('top-count', 7) 與 setCount(7, 4) 不拋出任何例外 (no-throw)」之斷言！

==================================================
4. 【RK-04】修復 tools/ac_gate.js (G-2 控制台雜訊納入 exit code)
==================================================
- 處置：檢查 CDP 抓到的控制台錯誤/警告 (CONSOLE_NOISE_COUNT)，若 CONSOLE_NOISE_COUNT > 0，則該項檢查報 FAIL 且最終 process.exitCode = 1，杜絕假通過！

==================================================
5. 【RK-05】修復 app/playground.html (__t04 實效量測)
==================================================
- 處置：在拋物線動畫啟動時記錄 t0 = performance.now()，在動畫結束 (transitionend / rAF 完成) 時記錄 window.__t04.flightMs = Math.round(performance.now() - t0)，以真實實測耗時記錄，拒絕假常數！

==================================================
請直接修改上述 5 個檔案！修改完成後執行 `node tools/ac_gate.js` 驗真，並確保體積閘門 G-5 全部在限額內 (單檔 <= 12,288 B，合計 <= 30,720 B)！
"""

    start_t = time.time()
    cmd = ["opencode", "run", "--auto"]

    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    stdout_b, stderr_b = proc.communicate(input=prompt.encode('utf-8'))
    duration = time.time() - start_t

    stdout = stdout_b.decode('utf-8', errors='replace')
    stderr = stderr_b.decode('utf-8', errors='replace')

    print(f"[AutoFlow Stage 4.5] OpenCode 執行完畢，耗時 {duration:.1f} 秒，Exit Code: {proc.returncode}")
    if stdout:
        print("=== STDOUT ===")
        print("\n".join(stdout.strip().splitlines()[-25:]))
    if stderr:
        print("=== STDERR ===")
        print("\n".join(stderr.strip().splitlines()[-10:]))

    sys.exit(proc.returncode)

if __name__ == "__main__":
    main()
