import urllib.request
import json

with open('reports/TASK_G3_N32_SPEC.md', 'r', encoding='utf-8') as f:
    spec_text = f.read()

prompt = f"""你是一位國小數學頂尖教材架構師。請依據以下 10 題真題規格，產生 G3-N-3-2 單元的題庫 JSON 檔案內容。
格式規範：
- 根物件包含：
  - code: "N-3-2"
  - title: "加減直式計算"
  - grade: 3
  - question_count: 10
  - verified_source: "臺北市內湖國小 114-1/113-1/112-1 期中"
  - questions: 包含 10 個題目的陣列
- 每個題目物件必須包含：
  - id: "G3-N-3-2-Q01" ~ "G3-N-3-2-Q10"
  - exam_source: 規格中的真實出處（例如 "臺北市內湖國小 114-1 期中"）
  - section: 試卷大題（例如 "三、用直式算算看"、"八、應用題"）
  - question_num: 題號整數
  - title: 題目簡短標題
  - stem: 題幹文字
  - choices: 4 個選項（第一個 choices[0] 必須是正確答案，answer_index 設為 0）
  - answer_index: 0
  - answer_raw: 正確選項字串
  - component: "vertical-calc-lab"
  - component_path: "components/vertical_calc_lab.html?q=1" (依題號對應 q=1~10)
  - fallback_height: 380~430 之間的整數
  - explanation: 包含 concept, steps (陣列), trap

【規格內容】：
{spec_text}

請只輸出純 JSON，不加任何 Markdown 代碼標記。
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
    if content.startswith('```json'):
        content = content[7:]
    if content.startswith('```'):
        content = content[3:]
    if content.endswith('```'):
        content = content[:-3]
    content = content.strip()
    with open('data/units/G3/N-3-2.json', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Saved data/units/G3/N-3-2.json! Length:', len(content))
