# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

PROMPT = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請在工作目錄下的 `app/components/` 目錄中，建立一個純前端單一離線可互動 HTML 檔案：`app/components/pencil_desk_demo.html`。

【任務來源】：高雄市鳳山區忠孝國小 114 學年度第一學期一年級期中考 真實試卷第 3 題（桌上的鉛筆）。

【真實插圖與排列數據（經通道三視覺檢驗 100% 精確）】：
桌上水平橫放著 5 支鉛筆，從左到右排列（尖頭朝上或平放），由長到短排列：
1. 第 1 支（最左邊）：最長（例如長度 220px），筆身圖案是【愛心圖案】（粉紅/紅色愛心花紋）。
2. 第 2 支：第二長（例如長度 185px），筆身圖案是【條紋圖案】（藍黃條紋）。
3. 第 3 支（中間）：中等長度（例如長度 150px），筆身是【素面木質/黃色】（無花紋）。
4. 第 4 支：第二短（例如長度 120px），筆身圖案是【愛心圖案】（粉紅/紅色愛心花紋）。
5. 第 5 支（最右邊）：最短（例如長度 90px），筆身圖案是【條紋圖案】（綠白條紋）。

【題目 4 道連續小題】：
(1) 數一數，桌上有幾枝鉛筆？ 答案：5 枝。
(2) 老師的鉛筆排在【從右邊數起】的第 4 枝，請把它圈起來。
    - 解析：從右往左數（第5枝是第1、第4枝是第2、第3枝是第3、第2枝是第4），所以老師的鉛筆是【從左數第2枝（條紋、第二長那枝）】！
(3) 美美說：「有愛心圖案的鉛筆中，最長的那枝是我的。」美美的鉛筆是排在【從左邊數起】的第幾枝？
    - 解析：有愛心的是第1枝和第4枝，最長的是第1枝！答案：從左邊數起第 1 枝。
(4) 找一找，有愛心圖案的鉛筆有幾枝？ 答案：2 枝。

【互動與視覺呈現核心要求（靈魂在於童趣與直觀，嚴禁死板抽象紅點！）】：
1. 視覺：
   - 頂部模擬溫暖的國小木紋課桌桌面。
   - 5 支鉛筆以純 SVG 或 CSS 繪製得童趣可愛、木質筆桿、尖尖鉛筆芯、橡皮擦頭，筆身上清楚看見【愛心】、【條紋】與【素面】。
   - 鉛筆下方標有清楚的「👈 左邊」與「👉 右邊」提示標籤。
2. 互動：
   - 畫面分成 4 個關卡分頁或分步驟演繹（可按「下一題」依序切換題目 1~4）。
   - 當題目問第 (1) 題時：學童點擊任何一支鉛筆，鉛筆會向上彈跳並標上編號 ①②③④⑤，引導數數，下方提供選項讓學童作答。
   - 當題目問第 (2) 題時：引導學童點選「從右邊數起」，學童點擊鉛筆時會浮現可愛的「圓圈套索」圈起來，圈對（左數第2枝）給予讚許回饋！
   - 當題目問第 (3) 題時：有愛心的兩支筆閃閃發光，學童比長短後點選最長那支，顯示「答對了！美美的鉛筆從左數是第 1 支」。
   - 當題目問第 (4) 題時：愛心鉛筆高亮，填寫或點選答案「2 枝」。
3. 響應式與純前端：
   - 手機 (390px) 與電腦均能完美排版。
   - 純單一 HTML，CSS 與 JS 內嵌，零外部網路 CDN 依賴。

請直接帶手腳建立 `app/components/pencil_desk_demo.html`。
"""

def main():
    print("[AGY 監工] 派工通道一 (本地 OpenCode CLI) 施工「桌上的鉛筆」真實考題 Demo...")
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
    print(f"[Channel 1] 施工結束，耗時={elapsed:.1f}s，Exit Code={proc.returncode}")
    target = "app/components/pencil_desk_demo.html"
    if os.path.exists(target):
        sz = os.path.getsize(target)
        print(f"[AGY 驗收] 成功！{target} 已生成，大小={sz} bytes")
        sys.exit(0)
    else:
        print(f"[AGY 驗收] 失敗：{target} 未生成！")
        print("Stdout:", out[-500:])
        sys.exit(1)

if __name__ == "__main__":
    main()
