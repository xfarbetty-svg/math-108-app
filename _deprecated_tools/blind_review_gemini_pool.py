# -*- coding: utf-8 -*-
"""
tools/blind_review_gemini_pool.py
通道三 (035 Gemini Pool 127.0.0.1:4000) 小一教育專家盲審
嚴格遵循 108 課綱與小一認知發展，對齊視覺教具，成本 $0
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

REVIEWER_SYSTEM_PROMPT = """你是有 20 年國小一年級教學經驗的資深數學輔導團名師。
現在請你對來自臺灣公立國小（臺北內湖國小、高雄忠孝國小）期中/期末考卷的提取題目進行「嚴格教育盲審」。

【審查四大紅線】：
1. 嚴禁大人語法與負號思維：小一絕不能出現「-4」、「負數」、「方程式未知數」。若涉及倒數或減少，必須是「青蛙倒退跳」、「拿走幾個」。
2. 100% 忠於原卷原題：不得把原卷口語改成大人書面報告（保留「夠不夠？」、「圈圈看」、「連連看」等純真小一口吻）。
3. 最佳教具對齊：為本題指定最適合的小一互動教具：
   - ten-frame-grid: 10以內的數、湊十法、拆十減法
   - dual-track-diff: 兩排物品一一對應、比多比少、差額
   - balance-beam: 輕重比較、天平平衡、高矮輕重
   - glass-number-line: 數的順序、跳數、青蛙跳格子
   - money-counter: 1元、5元、10元、50元硬幣付錢與換錢
   - shape-builder: 幾何形狀（圓形、三角形、正方形、長方形）
   - clock-face: 幾點鐘、幾點半、看時鐘
4. 零冗餘 SSOT Schema：產生符合專案憲法的題目物件。

【輸出格式】：
必須輸出純 JSON 陣列 (不要 markdown 圍欄)，每題格式：
{
  "id": "G1-EXAM-001",
  "exam_source": "考卷名稱 (如：高雄忠孝國小114-1期中試卷)",
  "section": "大題名稱",
  "question_num": "原卷題號",
  "status": "APPROVED",
  "audit_comment": "審核專家講評 (指明是否符合小一算理與口吻)",
  "stem": "100% 核定之純小一題幹 (若有括號留給孩子填空)",
  "choices": ["選項1", "選項2", "選項3", "選項4"],
  "answer_index": 0,
  "answer_raw": "原卷答案",
  "curriculum_code": "課綱代碼 (如 N-1-1)",
  "component_tag": "ten-frame-grid",
  "visual_engine": {
    "engine": "ten-frame-grid",
    "params": {}
  },
  "explanation": "給 7 歲小朋友看的破招算理解析 (口語化、具體)"
}
"""

def review_consensus_items(exam_id):
    diff_file = os.path.join(DATA_DIR, f"diff_{exam_id}.json")
    if not os.path.exists(diff_file):
        print(f"[{exam_id}] 找不到 diff 檔案: {diff_file}")
        return []

    with open(diff_file, "r", encoding="utf-8") as fp:
        diff_data = json.load(fp)

    consensus = diff_data.get("consensus_items", [])
    print(f"\n==================================================")
    print(f"👩‍🏫 [通道三 035 Gemini Pool] 開始教育盲審: {exam_id}")
    print(f"待審查高確信題目數: {len(consensus)}")
    print(f"==================================================")

    # 取前 10 題核心段考真題進行深層審查
    review_input = []
    for item in consensus[:10]:
        q = item.get("q1") or item.get("q2")
        review_input.append({
            "exam_id": exam_id,
            "section": q.get("section"),
            "question_num": q.get("question_num"),
            "stem": q.get("stem"),
            "choices": q.get("choices"),
            "answer_raw": q.get("answer_raw"),
            "image_description": q.get("image_description")
        })

    prompt = f"請審查以下忠孝/內湖國小真實題目，並轉化為符合小一規範與教具對齊的 10 題真題卡：\n{json.dumps(review_input, ensure_ascii=False, indent=2)}"

    url = "http://127.0.0.1:4000/v1/chat/completions"
    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": REVIEWER_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    t0 = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=90)
        elapsed = time.time() - t0
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```json"): content = content[7:]
            if content.startswith("```"): content = content[3:]
            if content.endswith("```"): content = content[:-3]
            reviewed = json.loads(content.strip())
            out_file = os.path.join(DATA_DIR, f"verified_{exam_id}.json")
            with open(out_file, "w", encoding="utf-8") as fp:
                json.dump(reviewed, fp, ensure_ascii=False, indent=2)
            print(f"✅ [通道三 盲審通過] 耗時={elapsed:.2f}s, 通過題數={len(reviewed)}")
            print(f"📁 核定成果落盤: {out_file}")
            return reviewed
        else:
            print(f"❌ [通道三 失敗] HTTP {resp.status_code}: {resp.text[:200]}")
            return []
    except Exception as e:
        print(f"❌ [通道三 異常]: {e}")
        return []

def main():
    all_verified = []
    for exam_id in ["zhongxiao_mid", "neihu_final"]:
        items = review_consensus_items(exam_id)
        if items:
            all_verified.extend(items)
    
    suite_file = os.path.join(DATA_DIR, "g1_real_verified_exam_suite.json")
    with open(suite_file, "w", encoding="utf-8") as fp:
        json.dump(all_verified, fp, ensure_ascii=False, indent=2)
    print(f"\n🎉 [全量真題題庫] 已產出: {suite_file} (共 {len(all_verified)} 題合格真題)")

if __name__ == "__main__":
    main()
