# -*- coding: utf-8 -*-
import requests, json, time

with open('EXAM REAL/G1/extracted_text/忠孝114-1 MID.txt', 'r', encoding='utf-8') as f:
    text = f.read()

prompt = f"""你是國小數學評量試卷結構化解析工兵。
請嚴格依據下列原始考卷文本，提取出全部「真實題目」，絕不可腦補、杜撰或修改任何題目文字。
必須輸出純 JSON 陣列 (不要 markdown 圍欄)，每個物件格式：
{{
  "exam_id": "zhongxiao_mid",
  "section": "大題名稱",
  "question_num": "題號",
  "stem": "100% 原始題幹文字",
  "choices": ["選項1", "選項2"],
  "answer_raw": "原卷標註或答案",
  "has_image": true,
  "image_description": "原始圖形詳細描述",
  "curriculum_code": "推薦課綱條目 (如 N-1-1)",
  "recommended_component": "推薦教具 (如 ten-frame-grid)"
}}

考卷文本：
{text}
"""

t0 = time.time()
resp = requests.post(
    'http://127.0.0.1:4000/v1/chat/completions',
    json={
        'model': 'gemini-2.5-flash',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.1
    },
    timeout=60
)
t = time.time() - t0
print(f"耗時: {t:.2f}s, HTTP Status: {resp.status_code}")
if resp.status_code == 200:
    content = resp.json()['choices'][0]['message']['content'].strip()
    if content.startswith('```json'): content = content[7:]
    if content.startswith('```'): content = content[3:]
    if content.endswith('```'): content = content[:-3]
    items = json.loads(content.strip())
    print(f"✅ 成功提取出 {len(items)} 題!")
    print(f"【範例第 1 題】:\n{json.dumps(items[0], ensure_ascii=False, indent=2)}")
    print(f"【範例第 2 題】:\n{json.dumps(items[1], ensure_ascii=False, indent=2)}")
