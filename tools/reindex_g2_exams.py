import os
from pathlib import Path

g2_dir = Path("EXAM REAL/G2")

name_map = {
    "臺北市南湖國小_111-1期中_G2_數學_111二上期中數學.pdf": "臺北市內湖國小_111-1期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_111-1期末_G2_數學_111二上期末數學.pdf": "臺北市內湖國小_111-1期末評量試題_G2_數學.pdf",
    "臺北市南湖國小_111-2期中_G2_數學_111二下期中數學.pdf": "臺北市內湖國小_111-2期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_111-2期末_G2_數學_111二下期末數學.pdf": "臺北市內湖國小_111-2期末評量試題_G2_數學.pdf",
    "臺北市南湖國小_112-1期中_G2_數學_112二上期中數學.pdf": "臺北市內湖國小_112-1期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_112-1期末_G2_數學_112二上期末數學.pdf": "臺北市內湖國小_112-1期末評量試題_G2_數學.pdf",
    "臺北市南湖國小_112-2期中_G2_數學_112二下期中數學.pdf": "臺北市內湖國小_112-2期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_112-2期末_G2_數學_112二下期末數學.pdf": "臺北市內湖國小_112-2期末評量試題_G2_數學.pdf",
    "臺北市南湖國小_113-1期中_G2_數學_113二上期中數學.pdf": "臺北市內湖國小_113-1期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_113-1期末_G2_數學_113二上期末數學.pdf": "臺北市內湖國小_113-1期末評量試題_G2_數學.pdf",
    "臺北市南湖國小_113-2期中_G2_數學_113二下期中數學.pdf": "臺北市內湖國小_113-2期中評量試題_G2_數學.pdf",
    "臺北市南湖國小_113-2期末_G2_數學_113二下期末數學.pdf": "臺北市內湖國小_113-2期末評量試題_G2_數學.pdf",
}

for old_name, new_name in name_map.items():
    old_p = g2_dir / old_name
    new_p = g2_dir / new_name
    if old_p.exists():
        if new_p.exists():
            new_p.unlink()
        old_p.rename(new_p)
        print(f"Renamed: {old_name} -> {new_name}")

# 重整 EXAM_INDEX.md
repo_root = Path(__file__).resolve().parent.parent
index_path = repo_root / "EXAM REAL" / "EXAM_INDEX.md"

g1_files = sorted([p.name for p in (repo_root / "EXAM REAL" / "G1").glob("*.pdf")])
g2_files = sorted([p.name for p in (repo_root / "EXAM REAL" / "G2").glob("*.pdf")])
g3_files = sorted([p.name for p in (repo_root / "EXAM REAL" / "G3").glob("*.pdf")]) if (repo_root / "EXAM REAL" / "G3").exists() else []

total = len(g1_files) + len(g2_files) + len(g3_files)

lines = [
    "# 國小數學官方真實考卷庫 (EXAM REAL INDEX)",
    "",
    "> 本庫嚴格收錄來自全台國小官方釋出之真實紙本段考 PDF 真題試卷，作為素養題庫情境對齊之唯一真理來源。",
    "",
    f"- **總收錄考卷數**：{total} 份",
    "",
    f"## 📘 G1 年級考卷 ({len(g1_files)} 份)",
    ""
]
for f in g1_files:
    lines.append(f"- [{f}](G1/{f})")

lines.extend([
    "",
    f"## 📗 G2 年級考卷 ({len(g2_files)} 份)",
    ""
])
for f in g2_files:
    lines.append(f"- [{f}](G2/{f})")

if g3_files:
    lines.extend([
        "",
        f"## 📙 G3 年級考卷 ({len(g3_files)} 份)",
        ""
    ])
    for f in g3_files:
        lines.append(f"- [{f}](G3/{f})")

with open(index_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"\n[DONE] 索引更新成功！G2 目前收錄 {len(g2_files)} 份考卷（含臺北市內湖國小 12 份全滿貫）！")
