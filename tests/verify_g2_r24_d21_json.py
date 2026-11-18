# -*- coding: utf-8 -*-
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

FILES = [
    ("R-2-4", "data/units/G2/R-2-4.json", ["Q01", "Q02", "Q03", "Q04", "Q05"], "g2_r24_q0"),
    ("D-2-1", "data/units/G2/D-2-1.json", ["Q06", "Q07", "Q08", "Q09", "Q10"], "g2_d21_q0"),
]

for code, fname, ids, comp_prefix in FILES:
    with open(fname, encoding="utf-8") as f:
        d = json.load(f)
    assert d["$schema"] == "math-app-unit-v1", f"{code} schema"
    assert d["code"] == code and d["curriculum_code"] == code and d["grade"] == 2
    assert d["unit_name"], f"{code} unit_name"
    qs = d["questions"]
    assert len(qs) == 5, f"{code} question count={len(qs)}"
    for q, expect_id in zip(qs, ids):
        assert q["id"] == f"G2-{code}-{expect_id}", q["id"]
        assert q["answer_index"] == 0, f"{q['id']} answer_index"
        assert q["choices"][q["answer_index"]] == q["answer_raw"], q["id"]
        parts = code.split("-")
        expected_comp = f"g2_{parts[0].lower()}{parts[1]}{parts[2]}_q{expect_id[1:]}"
        assert q["component"] == expected_comp, f"{q['id']} component"
        assert q["component_path"] == f"components/{q['component']}.html", q["id"]
        for k in ("id", "exam_source", "section", "question_num", "title", "stem",
                  "choices", "answer_index", "answer_raw", "component",
                  "component_path", "explanation"):
            assert k in q, f"{q['id']} missing {k}"
        assert set(q["explanation"]) >= {"concept", "steps", "trap"}, q["id"]
        assert len(q["explanation"]["steps"]) == 3, q["id"]
        print(q["id"], "| num", q["question_num"], "|", q["answer_raw"], "|", q["component_path"])
    print(f"[OK] {fname}")

print("ALL CHECKS PASSED")
