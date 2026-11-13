# -*- coding: utf-8 -*-
import requests
import json
import time
import os
import sys

PROMPT = """你現在參加國小數學 APP 題具配合擂台賽（通道三：035 Gemini Pool）。
請產出一個純前端單一離線 HTML 檔案內容。
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
   - 最後，車上剩下的「1 個 ⑩」與「4 個 ①」高亮組合，下方即事浮現算理解析與算式「21 － 7 ＝ 14（人）」。
3. 互動性：學童可點擊重播動態，並提供 2x2 選項按鈕 (12人, 13人, 14人, 15人) 供點選作答，點對時有童趣讚許動畫。
4. 純前端單一 HTML，零外部網路依賴（禁外鏈 CDN，樣式與 JS 全內嵌）。

請直接輸出完整的 <!DOCTYPE html> 程式碼，不要使用 markdown 圍欄，若有圍欄請只回傳 html。
"""

def main():
    print("[Channel 3] 啟動 035 Gemini Pool (gemini-3-flash-preview)...")
    t0 = time.time()
    url = "http://127.0.0.1:4000/v1/chat/completions"
    payload = {
        "model": "gemini-3-flash-preview",
        "messages": [
            {"role": "system", "content": "你是一位頂尖的資深前端工程師與國小教育互動專家。請輸出可直接執行的單檔 HTML。"},
            {"role": "user", "content": PROMPT}
        ],
        "temperature": 0.2,
        "max_tokens": 8192
    }
    resp = requests.post(url, json=payload, timeout=90)
    elapsed = time.time() - t0
    if resp.status_code == 200:
        html = resp.json()["choices"][0]["message"]["content"].strip()
        if html.startswith("```html"): html = html[7:]
        if html.startswith("```"): html = html[3:]
        if html.endswith("```"): html = html[:-3]
        out_path = "compare_out/ch3_gemini_pool.html"
        with open(out_path, "w", encoding="utf-8") as fp:
            fp.write(html.strip())
        sz = os.path.getsize(out_path)
        print(f"[Channel 3] 完成，耗時={elapsed:.1f}s，大小={sz} bytes")
    else:
        print(f"[Channel 3] 失敗：HTTP {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    main()
