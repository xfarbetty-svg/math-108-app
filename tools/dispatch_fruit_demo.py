# -*- coding: utf-8 -*-
import subprocess
import time
import os
import sys

PROMPT = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請在工作目錄下的 `app/components/` 目錄中，建立一個純前端單一離線可互動 HTML 檔案：`app/components/fruit_line_demo.html`。

【任務來源】：高雄市鳳山區忠孝國小 114 學年度第一學期一年級期中考 真實試卷第三大題第 2 題（水果排一列圈圈看）。

【核心數學算理：序數 (第幾個) vs 基數 (幾個) 大陷阱】：
這是一年級全台失分率最高的經典觀念！
1. 「第 N 個」（序數）：只有【單獨 1 個】！代表排在某個位置的那一個物體。
2. 「前面 N 個」（基數/數量）：共有【N 個】！代表從起點開始算的一整群物體。

【真實題目 4 道連續關卡】：
每道題目展示 10 顆排列整齊的可愛向量水果，水果列左右兩端明確標示「👈 左邊」與「👉 右邊」：
- 關卡 1：西瓜列（10 顆可愛西瓜，帶綠黑條紋）
  - 題目：從右邊數起，圈出【第 5 顆】西瓜。
  - 正確答案：從右向左數第 5 顆（即左數第 6 顆），只有【單獨 1 顆】被紅色套索圈起來。
  - 算理破招提示：「第 5 顆」只有 1 顆！從右邊開始數：1, 2, 3, 4, 5，就是它！

- 關卡 2：蓮霧列（10 顆紅艷多汁蓮霧）
  - 題目：從左邊數起，圈出【前面 8 顆】蓮霧。
  - 正確答案：從左向右數，前面 8 顆全部圈入同一個大套索（或分別選中 8 顆），總共【8 顆】！
  - 算理破招提示：「前面 8 顆」是數量，共有 8 顆！要把左邊前 8 顆全部圈起來！

- 關卡 3：楊桃列（10 顆五角星黃綠楊桃）
  - 題目：從右邊數起，圈出【第 7 顆】楊桃。
  - 正確答案：從右向左數第 7 顆（即左數第 4 顆），只有【單獨 1 顆】。
  - 算理破招提示：「第 7 顆」只有 1 顆！從右數到 7 就是它！

- 關卡 4：檸檬列（10 顆黃澄澄檸檬）
  - 題目：從左邊數起，圈出【前面 6 顆】檸檬。
  - 正確答案：從左向右數，前面 6 顆全部圈起來，總共【6 顆】！
  - 算理破招提示：「前面 6 顆」是數量，總共有 6 顆！

【互動與視覺呈現核心要求（童趣質感，拒絕死板抽象）】：
1. 視覺美術：
   - 頂部為溫暖柔和的日系手繪童趣風（木質水果展架或果園檯面）。
   - 水果使用純 SVG 繪製（西瓜、蓮霧、楊桃、檸檬），色彩豐富、可愛逗趣。
   - 水果列左右兩側有醒目的木牌指示：「👈 左邊」與「👉 右邊」，輔助低年級學童辨認方向。
2. 互動體驗：
   - 學童點擊水果時，水果會有可愛的彈跳縮放動畫（pop bounce）。
   - 點擊時可以在水果下方或上方浮現可愛的順序小數字氣泡，輔助小朋友數數。
   - 選中時以手繪風格的「紅色蠟筆圈圈（Red Crayon Lasso）」圈選。
   - 提供「確認答案」與「重數一次」按鈕。
   - 答對時釋放溫暖鼓勵動畫；答錯時（例如把「第5顆」圈成了「5顆」，或把「前面8顆」只圈了「第8顆」）精準指出「這是第幾顆還是幾個呢？」，並展開清楚的破招動畫與算理解析。
   - 頂部有 4 個關卡切換按鈕，可自由切換或自動推進。
3. 響應式與純前端：
   - 支援手機（390px 水平滑動或排版自適應）、平板與電腦。
   - 純單一 HTML 檔案，包含內嵌 CSS 與 JavaScript，零外部網路依賴。

請直接在 `app/components/fruit_line_demo.html` 建立此檔案。
"""

def main():
    print("[AGY 監工] 準備調派本地 OpenCode CLI (opencode/glm-5.3-flash-free)...")
    prompt_file = "tools/temp_fruit_prompt.txt"
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(PROMPT)
    
    t0 = time.time()
    # 透過管道直接呼叫 opencode run
    cmd = 'opencode run -m opencode/glm-5.3-flash-free --auto < tools/temp_fruit_prompt.txt'
    print(f"[Channel 1] 執行命令: {cmd}")
    res = os.system(cmd)
    elapsed = time.time() - t0
    print(f"[Channel 1] 施工結束，耗時={elapsed:.1f}s，Exit Code={res}")
    
    target = "app/components/fruit_line_demo.html"
    if os.path.exists(target):
        sz = os.path.getsize(target)
        print(f"[AGY 驗收] 成功！{target} 已生成，大小={sz} bytes")
        sys.exit(0)
    else:
        print(f"[AGY 驗收] 失敗：{target} 未生成！")
        sys.exit(1)

if __name__ == "__main__":
    main()
