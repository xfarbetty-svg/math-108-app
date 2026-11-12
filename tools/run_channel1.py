# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

PROMPT = """你現在參加國小數學 APP 題具配合擂台賽（通道一：本地 OpenCode GLM）。
請在工作目錄下的 compare_out/ 目錄中，建立一個純前端單一離線 HTML 檔案：`compare_out/ch1_opencode_local.html`。
內容必須嚴格依照以下小學一年級真題與教具動態規格製作：

【題目】：臺北市內湖國小一年級下學期期末考壓軸真題（七、1）
【題幹】：公車裡原本有 21 個人，有 7 個人先下車，還有幾個人在車上？
【官方要求】：先畫 ⑩ 和 ①，再用算式記下來 (21 － 7 ＝ 14，退位借十法)。

【嚴格驗收要求】：
1. 視覺呈現：畫面中有一台童趣可愛、色彩溫暖明亮的公車（純 SVG 或 CSS 繪製），公車內部初始清晰擺放「2 個 ⑩ 硬幣積木」與「1 個 ① 硬幣積木」（代表 21 人）。
2. 動態演示（題具咬合靈魂，嚴禁死板靜態）：
   - 提供「🚌 7 個人下車」或「演示借十算理」互動按鈕。
   - 點擊後，觸發小一「借十拆解」動態：其中 1 個 ⑩ 閃爍發光並分裂/展開成「10 個 ①」，整齊排列展示。
   - 接著，其中的 7 個 ① 亮起下車動態（逐一變淡或滑出公車）。
   - 最後，車上剩下的「1 個 ⑩」與「4 個 ①」高亮組合，下方即時浮現算理解析與算式「21 － 7 ＝ 14（人）」。
3. 互動性：學童可點擊重播動態，並提供 2x2 選項按鈕 (12人, 13人, 14人, 15人) 供點選作答，點對時有童趣讚許動畫。
4. 純前端單一 HTML，零外部網路依賴（禁外鏈 CDN，樣式與 JS 全內嵌）。

請直接使用寫入工具產出 `compare_out/ch1_opencode_local.html`，並確認檔案已建立。
"""

def main():
    print("[Channel 1] 啟動本地 OpenCode GLM...")
    t0 = time.time()
    cmd = ["opencode", "run", "-m", "opencode/glm-5.3-flash-free", "--auto"]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    stdout_b, stderr_b = proc.communicate(input=PROMPT.encode("utf-8"))
    elapsed = time.time() - t0
    out = stdout_b.decode("utf-8", errors="replace")
    err = stderr_b.decode("utf-8", errors="replace")
    print(f"[Channel 1] 完成，耗時={elapsed:.1f}s，Exit={proc.returncode}")
    if os.path.exists("compare_out/ch1_opencode_local.html"):
        sz = os.path.getsize("compare_out/ch1_opencode_local.html")
        print(f"[Channel 1] 檔案產出成功！大小={sz} bytes")
    else:
        print("[Channel 1] 警告：compare_out/ch1_opencode_local.html 未生成！")

if __name__ == "__main__":
    main()
