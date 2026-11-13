import urllib.request
import json

prompt = """你是一位純前端高階工程師。請為國小三年級單元「G3-N-3-2 加減直式計算」編寫一套高度互動、純向量、支援手機 390px 單屏免滑動（高度 <= 420px）的共用教具：app/components/vertical_calc_lab.html。

規格需求：
1. 支援 URL 參數 `?q=1` 到 `?q=10`，載入對應題目的直式互動計算模式。
2. 視覺核心：
   - 清楚的四位數直式對齊排版（千位、百位、十位、個位），字體工整，帶位值欄位輔助線。
   - 「進位小數字」（如個位滿十進 1，十位上方浮現小小的 ① 並帶有微光）。
   - 「借位劃線與補 10」（如個位不夠減，十位數字劃斜線斜槓變小，個位上方補 10）。
   - 點擊「一步一步看算理 ▶」按鈕，可以從個位 ➔ 十位 ➔ 百位 ➔ 千位逐位演示計算過程。
3. 題目對應：
   - Q1: 5319 ＋ 806 ＝ 6125（百位滿十進千，個位滿十進十）
   - Q2: 2015 － 207 ＝ 1808（百位向千位借位，個位向十位借位）
   - Q3: 3397 ＋ 1826 ＝ 5223（三連續進位！）
   - Q4: 4000 － 1368 ＝ 2632（連續三個零向千位連續退位）
   - Q5: 3677 ＋ 4189 ＝ 7866（雙重進位）
   - Q6: 7800 － 4831 ＝ 2969（末尾雙零退位與千位退位）
   - Q7: 7406 ＋ 1193 ＝ 8599（演唱會門票直式加法）
   - Q8: 1022 － 237 ＝ 785（小說頁數連續借位減法）
   - Q9: 1399 ＋ 1200 ＝ 2599（上衣與褲子價格直式加法）
   - Q10: 1200 ＋ 300 ＝ 1500（皮卡丘與卡比獸價格直式加法，語意反轉「便宜」實為加法）
4. 手機端單屏憲法：
   - 在 390px 寬度下，iframe 內容高度嚴格控制在 320px~410px，絕對免捲軸！
   - 選項採用 2x2 Grid 排版，按鈕緊湊（高度 32px）。
   - 點擊「檢查」按鈕立即浮現即時反饋橫幅（success/fail）。
   - 頂部幽靈字標籤掛「臺北市內湖國小段考真題」。

請直接輸出完整 HTML 代碼（從 <!DOCTYPE html> 到 </html>），不加任何 markdown 標記。
"""

req_data = {
    'model': 'gemini-2.5-flash',
    'messages': [{'role': 'user', 'content': prompt}],
    'temperature': 0.1
}

req = urllib.request.Request(
    'http://127.0.0.1:4000/v1/chat/completions',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(req_data).encode('utf-8')
)

with urllib.request.urlopen(req, timeout=60) as res:
    resp = json.loads(res.read().decode('utf-8'))
    content = resp['choices'][0]['message']['content'].strip()
    if content.startswith('```html'):
        content = content[7:]
    if content.startswith('```'):
        content = content[3:]
    if content.endswith('```'):
        content = content[:-3]
    content = content.strip()
    with open('app/components/vertical_calc_lab.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Saved app/components/vertical_calc_lab.html! Length:', len(content))
