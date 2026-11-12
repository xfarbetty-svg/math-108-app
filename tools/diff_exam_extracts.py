# -*- coding: utf-8 -*-
"""
tools/diff_exam_extracts.py
自動比對通道一與通道二的真題提取結果，抓出單邊幻覺與遺漏
"""
import os
import sys
import json
from difflib import SequenceMatcher

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

def text_similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def diff_exam(exam_id):
    f1 = os.path.join(DATA_DIR, f"extracted_ch1_{exam_id}.json")
    f2 = os.path.join(DATA_DIR, f"extracted_ch2_{exam_id}.json")

    if not os.path.exists(f1) or not os.path.exists(f2):
        print(f"[{exam_id}] 缺失檔案: f1={os.path.exists(f1)}, f2={os.path.exists(f2)}")
        return None

    with open(f1, "r", encoding="utf-8") as fp:
        q1_list = json.load(fp)
    with open(f2, "r", encoding="utf-8") as fp:
        q2_list = json.load(fp)

    print(f"\n==================================================")
    print(f"📊 [{exam_id}] 提取結果自動比對")
    print(f"通道一 提取題數: {len(q1_list)}")
    print(f"通道二 提取題數: {len(q2_list)}")
    print(f"==================================================")

    matched = []
    ch1_only = []
    ch2_only = list(range(len(q2_list)))

    for i1, q1 in enumerate(q1_list):
        stem1 = q1.get("stem", "")
        best_match_idx = -1
        best_sim = 0.0

        for i2 in ch2_only:
            stem2 = q2_list[i2].get("stem", "")
            sim = text_similarity(stem1, stem2)
            if sim > best_sim:
                best_sim = sim
                best_match_idx = i2

        if best_sim >= 0.6:  # 相似度閾值
            ch2_only.remove(best_match_idx)
            matched.append({
                "sim": round(best_sim, 2),
                "q1": q1,
                "q2": q2_list[best_match_idx]
            })
        else:
            ch1_only.append(q1)

    ch2_remaining = [q2_list[idx] for idx in ch2_only]

    print(f"✅ 雙邊高度吻合題數: {len(matched)}")
    print(f"⚠️ 僅通道一提取: {len(ch1_only)}")
    print(f"⚠️ 僅通道二提取: {len(ch2_remaining)}")

    result = {
        "exam_id": exam_id,
        "ch1_total": len(q1_list),
        "ch2_total": len(q2_list),
        "consensus_count": len(matched),
        "consensus_items": matched,
        "ch1_exclusive": ch1_only,
        "ch2_exclusive": ch2_remaining
    }

    out_diff = os.path.join(DATA_DIR, f"diff_{exam_id}.json")
    with open(out_diff, "w", encoding="utf-8") as fp:
        json.dump(result, fp, ensure_ascii=False, indent=2)
    print(f"Diff 結果已存檔: {out_diff}")
    return result

def main():
    for exam_id in ["zhongxiao_mid", "neihu_final"]:
        diff_exam(exam_id)

if __name__ == "__main__":
    main()
