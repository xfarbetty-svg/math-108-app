# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

PROMPT = """你現在參加國小數學 APP 題具配合擂台賽（通道二：A-SERVER 遠端 OpenCode GLM）。
請在當前目錄下建立一個純前端單一離線 HTML 檔案：`ch2_opencode_remote.html`。
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

請直接使用寫入工具產出 `ch2_opencode_remote.html`。
"""

def main():
    print("[Channel 2] 啟動 A-SERVER 遠端 OpenCode GLM...")
    t0 = time.time()
    
    # 建立遠端目錄
    subprocess.run(["ssh", "a-server", "powershell -Command \"New-Item -ItemType Directory -Force -Path D:\\CCY\\ANTIGRAVITY\\compare_temp | Out-Null\""], check=False)
    
    # 調用遠端 opencode (不加 -n，確保 stdin 順利送入)
    cmd = [
        "ssh", "a-server",
        "cd /d D:\\CCY\\ANTIGRAVITY\\compare_temp && opencode run -m opencode/glm-5.3-flash-free --auto"
    ]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    stdout_b, stderr_b = proc.communicate(input=PROMPT.encode("utf-8"))
    elapsed = time.time() - t0
    
    # 把檔案拉回本地
    scp_cmd = ["scp", "a-server:D:/CCY/ANTIGRAVITY/compare_temp/ch2_opencode_remote.html", "compare_out/ch2_opencode_remote.html"]
    subprocess.run(scp_cmd, capture_output=True)
    
    print(f"[Channel 2] 完成，耗時={elapsed:.1f}s")
    if os.path.exists("compare_out/ch2_opencode_remote.html"):
        sz = os.path.getsize("compare_out/ch2_opencode_remote.html")
        print(f"[Channel 2] 檔案拉回成功！大小={sz} bytes")
    else:
        print("[Channel 2] 警告：compare_out/ch2_opencode_remote.html 未生成！")

if __name__ == "__main__":
    main()
