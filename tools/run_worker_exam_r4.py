# -*- coding: utf-8 -*-
"""
tools/run_worker_exam_r4.py
調用 OpenCode Worker 執行：
1. app/components/glass-number-line.js: 消除大人負號，改為青蛙倒退跳
2. app/components/ten-frame-grid.js: 拆十減法割捨動態 (800ms)
3. app/index.html: 掛接 20 題真實評量題目
"""
import os
import sys
import subprocess
import time

def main():
    print("[Worker Dispatch] 正在調用 OpenCode CLI (通道一 P0 $0)...")

    prompt = """你是 AutoFlow 施工工兵 (Worker)。
請精準完成以下 3 項任務，嚴格遵守零額度消耗與零外部依賴規範：

==================================================
任務一：優化 `app/components/glass-number-line.js` (消除大人負號)
==================================================
1. 找到 `stepReverse()` 中的大人負號：
   `this.$.jtxt.textContent = \`-${S.jump}\`;`
2. 將負號修改為小學一年級直觀的「青蛙倒退跳」語法：
   `this.$.jtxt.textContent = \`🐸 倒退 ${S.jump} 格\`;`
   並且若在公式文字中出現負號引導，保留減法運算，但說明文字 `this.$.msg.textContent` 設為：
   `破招：小青蛙從終點往回跳 ${S.jump} 格`
3. 確保單檔體積 <= 12,288 B（目前約 7,000 B），純前端原生，不破壞既有 API。

==================================================
任務二：優化 `app/components/ten-frame-grid.js` (拆十減法割捨動畫)
==================================================
1. 在 `TenFrameGrid` 類別中新增公開方法 `takeAway(count, callback)` 或 `animateTakeAway(count)`：
   - 接受 `count`（要拿走/割捨的個數，小於等於當前 `_value`）。
   - 將最後 `count` 個已填的圓點加上割捨樣式（如 `.is-leaving` 或新增動畫 `tfg-takeaway`：800ms 慢節奏呼吸淡出並縮小，符合小一感知節奏）。
   - 800ms 動畫結束後，正式扣除圓點並更新 `_value = _value - count`，呼叫 `_syncTheme()`，最後觸發 `ten-frame:takeaway` 事件與可選 callback。
2. 確保原有的加法湊十動畫與滿十鎖定不被破壞，體積 <= 12,288 B（目前約 10,940 B）。

==================================================
任務三：掛接 20 題真題題庫至 `app/index.html` 展演台
==================================================
1. 讀取 `data/g1_real_verified_exam_suite.json`（共 20 題審定真題）。
2. 在 `app/index.html` 中：
   - 提供「20 題真題題庫實測」切換模式或將 20 題真題作為精選單元載入展示。
   - 支援三端視角（手機 390px、平板 768px、電腦 960px）。
   - 針對選擇題（`choices.length > 0`）提供 2x2 選項互動，答題後觸發教具聯動與抽屜/內嵌算理詳解。
   - 針對填空題（`choices.length === 0`）提供「看解答/演示算理」按鈕，點擊後揭示答案 `answer_raw` 與算理解析。
   - 正確呼叫對應的教具組件：
     * `glass-number-line`: 數線順序與反推
     * `dual-track-diff`: 比長短與多多少
     * `balance-beam`: 比高矮輕重與平衡
     * `ten-frame-grid`: 湊十與拆十
3. 保持純前端離線開箱可用（可直接雙擊 index.html 或以 http.server 開啟）。

請直接使用 write/edit 工具修改檔案，並執行 `node tools/ac_gate.js` 確保閘門全綠！
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

    print(f"[Worker Dispatch] 執行完畢，耗時 {duration:.1f} 秒，Exit Code: {proc.returncode}")
    if stdout:
        print("=== STDOUT (最後 30 行) ===")
        print("\n".join(stdout.strip().splitlines()[-30:]))
    if stderr:
        print("=== STDERR (最後 10 行) ===")
        print("\n".join(stderr.strip().splitlines()[-10:]))

    sys.exit(proc.returncode)

if __name__ == "__main__":
    main()
