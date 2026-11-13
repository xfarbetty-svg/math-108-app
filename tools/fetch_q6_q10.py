import urllib.request
import json
import re

prompt = """你是一位國小數學頂尖教材架構師。請依據以下 5 題來自臺北市內湖國小段考真題的規格，產生符合 schema 的 5 個題目 JSON 物件 (Q06 到 Q10)，格式必須完全對齊已有的 Q01~Q05。

請輸出一個包含 5 個物件的 JSON 陣列 [ ... ]。每個物件必須有以下欄位：
- id: "G3-N-3-1-Q06" ~ "G3-N-3-1-Q10"
- exam_source: 包含學校與學期（例如 "臺北市內湖國小 114-1 期中"）
- section: 試卷大題（例如 "二、填填看"、"一、選擇題"）
- question_num: 試卷題號整數
- title: 題目簡短標題
- stem: 題幹文字（清晰易讀）
- choices: 4 個選項字串陣列（第一個 choices[0] 必須是正確答案，answer_index 設為 0）
- answer_index: 0
- answer_raw: 正確選項字串
- component: "ten-thousand-lab"
- component_path: "components/ten_thousand_lab.html?q=6" (依題號對應 q=6~10)
- fallback_height: 400~430 之間的整數
- explanation: 包含 concept (核心概念), steps (三到五步解題步驟陣列), trap (易錯陷阱說明)

五題真題規格：
Q06: 內湖國小 114-1 期中 二、填填看 第 3 題
- 題幹：「用 0、7、2、8 四個數字排成四位數，排成的『最大四位數』是多少？『最小四位數』是多少？」
- 正確答案：「最大是 8720，最小是 2078」
- 陷阱：最小四位數千位不能排 0（排 0 變成三位數 278）。

Q07: 內湖國小 114-1 期中 二、填填看 第 6 題
- 題幹：「小明存錢筒裡有 8 張千元鈔、14 張百元鈔、7 個十元硬幣和 3 個一元硬幣，合起來是多少元？」
- 正確答案：「9473 元」
- 陷阱：14張百元鈔等於1400元，滿十進千，千位變成 8+1=9，百位剩 4，不可直接串成 81473 元。

Q08: 內湖國小 114-1 期中 一、選擇題 第 3 題
- 題幹：「把『最大的四位數』減去『最小的三位數』，算出來的答案是多少？」
- 正確答案：「9899」
- 陷阱：最大四位數是 9999，最小三位數是 100，9999 - 100 = 9899。

Q09: 內湖國小 114-1 期中 二、填填看 第 4 題(2)
- 題幹：「按照數的規律填填看：1980 → 1990 → ( 甲 ) → ( 乙 ) → 2020。甲和乙分別是多少？」
- 正確答案：「甲是 2000，乙是 2010」
- 陷阱：每次加 10，1990+10 跨整千進位為 2000，不可寫成 19100。

Q10: 內湖國小 113-1 期中 一、選擇題 第 1 題
- 題幹：「3 個千、8 個百、20 個十和 18 個一合起來是多少？」
- 正確答案：「4018」
- 陷阱：20個十=200，18個一=18，800+200=1000滿千進位，總合為 3000+1000+18=4018。

請務必只回傳標準 JSON 陣列，不加任何 Markdown 語法標記。
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

with urllib.request.urlopen(req, timeout=30) as res:
    resp = json.loads(res.read().decode('utf-8'))
    content = resp['choices'][0]['message']['content'].strip()
    if content.startswith('```json'):
        content = content[7:]
    if content.startswith('```'):
        content = content[3:]
    if content.endswith('```'):
        content = content[:-3]
    content = content.strip()
    with open('reports/temp_q6_q10_clean.json', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Saved successfully! Length:', len(content))
