# -*- coding: utf-8 -*-
"""
tools/extract_exams_parallel.py
雙模型平行工兵 (通道 A: gemini-2.5-flash, 通道 B: gemini-3-flash-preview)
透過 035 Pool (8把Key輪詢, $0 雲端額度) 提取真實考卷原題
"""
import os
import sys
import json
import time
import requests

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

PROMPT_TEMPLATE = """你是國小數學評量試卷結構化解析工兵。
請嚴格依據下列原始考卷文本，提取出全部「真實題目」，絕不可腦補、杜撰或修改任何題目文字。

【輸出格式】：
必須輸出純 JSON 陣列 (不要 markdown 圍欄，直接 [ 開頭 ] 結尾)，每個物件格式如下：
{{
  "exam_id": "{exam_id}",
  "exam_title": "{exam_title}",
  "section": "大題名稱 (如：一、填一填)",
  "question_num": "題號 (如：1, 2-(1), 3)",
  "stem": "100% 原始題幹文字",
  "choices": ["選項1", "選項2"],
  "answer_raw": "原卷標註或答案 (若無填空或未知則填空字串)",
  "has_image": true,
  "image_description": "原始圖形詳細描述 (如：鐘面7點半、4顆蘋果、天平左3右5)",
  "curriculum_code": "推薦課綱條目 (N-1-1 至 D-1-1)",
  "recommended_component": "推薦教具 (如 ten-frame-grid, dual-track-diff, balance-beam, glass-number-line, money-counter, shape-builder, clock-face)"
}}

【原始考卷文本】：
{raw_text}
"""

def extract_with_model(model_name, channel_name, exam_id, exam_title, text_path):
    print(f"\n==================================================")
    print(f"🚀 [{channel_name}: {model_name}] 開始提取: {exam_title}")
    print(f"==================================================")
    with open(text_path, "r", encoding="utf-8") as f:
        raw_text = f.read()

    prompt = PROMPT_TEMPLATE.format(exam_id=exam_id, exam_title=exam_title, raw_text=raw_text)
    out_file = os.path.join(DATA_DIR, f"extracted_{channel_name}_{exam_id}.json")

    t0 = time.time()
    url = "http://127.0.0.1:4000/v1/chat/completions"
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are a professional primary math exam parser. Output valid JSON array only."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    try:
        resp = requests.post(url, json=payload, timeout=90)
        elapsed = time.time() - t0
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            parsed = json.loads(content.strip())
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(parsed, f, ensure_ascii=False, indent=2)
            print(f"✅ [{channel_name}] 完成! 耗時={elapsed:.2f}s, 提取出 {len(parsed)} 題")
            return out_file
        else:
            print(f"❌ [{channel_name}] 失敗 HTTP {resp.status_code}: {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"❌ [{channel_name}] 異常: {e}")
        return None

def main():
    exams = [
        ("zhongxiao_mid", "高雄忠孝國小 114-1 一年級期中考", "EXAM REAL/G1/extracted_text/忠孝114-1 MID.txt"),
        ("neihu_final", "臺北內湖國小 114-2 一年級期末考", "EXAM REAL/G1/extracted_text/內湖 G1 114-2 FINAL exam.txt")
    ]
    for exam_id, title, txt_path in exams:
        print(f"\n========================================================")
        print(f"📌 啟動雙工兵平行解析: {title}")
        print(f"========================================================")
        # 工兵 A: gemini-2.5-flash
        f1 = extract_with_model("gemini-2.5-flash", "ch1", exam_id, title, txt_path)
        # 工兵 B: gemini-3-flash-preview
        f2 = extract_with_model("gemini-3-flash-preview", "ch2", exam_id, title, txt_path)
        print(f"🏁 [{exam_id}] 雙工兵提取結果: 工兵A={'成功' if f1 else '失敗'}, 工兵B={'成功' if f2 else '失敗'}")

if __name__ == "__main__":
    main()
