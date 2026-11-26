#!/usr/bin/env python3
"""
tools/register_g4_unit.py — G4 單元通用自動總裝與註冊腳本（完全冪等）

功能：
1. 檢查 app/components/<lab> 與 data/units/G4/<code>.json 存在且為滿編 10 題合法 JSON。
2. 安全追加 app/shell.js 的 CONCEPT_COMPONENTS 映射與預設「🌱 概念探索」清單（絕不碰 UNIT_CONCEPT_MOVIES）。
3. 更新 data/curriculum.json 對應單元的 status、question_count、verified_source 與路徑欄位。
4. 更新 tools/verify_curriculum_131.js 的 EXPECTED_READY_CODES 並自動執行驗證。
5. 若對應單元門禁腳本 tools/verify_<slug>.js / verify_<slug>_cdp.js 已存在，一併執行驗真。
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def atomic_write_text(path: Path, content: str) -> None:
    """使用 tempfile.mkstemp + os.replace 進行原子寫入（UTF-8 無 BOM）。"""
    fd, tmp_path = tempfile.mkstemp(prefix=f".{path.name}.", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


def validate_inputs(code: str, lab: str) -> dict:
    """檢查教具 HTML 與 10 題 JSON 存在且合法。"""
    if not re.fullmatch(r"[NSRD]-4-\d+", code):
        raise ValueError(f"無效的 G4 課綱代碼：{code}")
    if not lab.endswith(".html") or "/" in lab or "\\" in lab:
        raise ValueError(f"無效的教具檔名：{lab}")

    lab_path = ROOT / "app" / "components" / lab
    if not lab_path.is_file() or lab_path.stat().st_size == 0:
        raise FileNotFoundError(f"找不到教具檔案或檔案為空：{lab_path}")

    json_path = ROOT / "data" / "units" / "G4" / f"{code}.json"
    if not json_path.is_file():
        raise FileNotFoundError(f"找不到題庫檔案：{json_path}")

    unit_data = json.loads(json_path.read_text(encoding="utf-8"))
    if unit_data.get("curriculum_code") != code:
        raise ValueError(f"{json_path} curriculum_code={unit_data.get('curriculum_code')} 與 {code} 不符")
    if unit_data.get("grade") != 4:
        raise ValueError(f"{json_path} grade={unit_data.get('grade')} 非 4")
    questions = unit_data.get("questions")
    if not isinstance(questions, list) or len(questions) != 10 or unit_data.get("question_count") != 10:
        raise ValueError(f"{json_path} 非滿編 10 題（question_count={unit_data.get('question_count')}, len={len(questions) if isinstance(questions, list) else 'N/A'}）")

    return unit_data


def extract_block(text: str, marker: str) -> str:
    """擷取 JS 物件區塊以便比對是否誤改。"""
    m = re.search(rf"const\s+{marker}\s*=\s*\{{[\s\S]*?\n\}};", text)
    if not m:
        raise RuntimeError(f"app/shell.js 中找不到 {marker} 區塊")
    return m.group(0)


def update_shell_js(code: str, lab: str) -> bool:
    """冪等更新 app/shell.js 的 CONCEPT_COMPONENTS 與預設概念探索清單，絕不碰 UNIT_CONCEPT_MOVIES。"""
    shell_path = ROOT / "app" / "shell.js"
    orig = shell_path.read_text(encoding="utf-8")
    movies_before = extract_block(orig, "UNIT_CONCEPT_MOVIES")
    target_val = f"components/{lab}?mode=concept"

    # 1. 更新 CONCEPT_COMPONENTS
    comp_match = re.search(r"(const\s+CONCEPT_COMPONENTS\s*=\s*\{)([\s\S]*?)(\n\};)", orig)
    if not comp_match:
        raise RuntimeError("app/shell.js 找不到 CONCEPT_COMPONENTS")

    body = comp_match.group(2)
    entry_re = re.compile(rf'([ \t]*"{re.escape(code)}"\s*:\s*)"[^"]*"(,?)')
    if entry_re.search(body):
        new_body = entry_re.sub(rf'\1"{target_val}"\2', body, count=1)
    else:
        lines = body.rstrip().splitlines()
        if lines and not lines[-1].rstrip().endswith(","):
            lines[-1] = lines[-1].rstrip() + ","
        lines.append(f'  "{code}": "{target_val}"')
        new_body = "\n" + "\n".join(lines)

    updated = orig[:comp_match.start(2)] + new_body + orig[comp_match.end(2):]

    # 2. 確保預設開啟「🌱 概念探索」
    set_re = re.compile(r"const\s+DEFAULT_CONCEPT_CODES\s*=\s*new\s+Set\(\[([^\]]*)\]\);")
    set_m = set_re.search(updated)
    if set_m:
        items = re.findall(r'"([^"]+)"', set_m.group(1))
        if code not in items:
            items.append(code)
        new_set = "const DEFAULT_CONCEPT_CODES = new Set([" + ", ".join(f'"{x}"' for x in items) + "]);"
        updated = updated[:set_m.start()] + new_set + updated[set_m.end():]
    else:
        legacy_re = re.compile(
            r'([ \t]*)setUnitMode\(\(code === "N-4-2" \|\| code === "N-4-10"\) \? "concept" : "exam"\);'
        )
        legacy_m = legacy_re.search(updated)
        if not legacy_m:
            raise RuntimeError("app/shell.js 找不到預設 setUnitMode 判斷式")
        indent = legacy_m.group(1)
        items = ["N-4-2", "N-4-10"]
        if code not in items:
            items.append(code)
        replacement = (
            f"{indent}const DEFAULT_CONCEPT_CODES = new Set(["
            + ", ".join(f'"{x}"' for x in items)
            + "]);\n"
            + f'{indent}setUnitMode(DEFAULT_CONCEPT_CODES.has(code) ? "concept" : "exam");'
        )
        updated = updated[:legacy_m.start()] + replacement + updated[legacy_m.end():]

    movies_after = extract_block(updated, "UNIT_CONCEPT_MOVIES")
    if movies_before != movies_after:
        raise RuntimeError("安全檢查失敗：UNIT_CONCEPT_MOVIES 發生非預期變動")

    if updated != orig:
        atomic_write_text(shell_path, updated)
        return True
    return False


def update_curriculum_json(code: str, lab: str, unit_data: dict) -> bool:
    """冪等更新 data/curriculum.json 對應 G4 單元。"""
    cur_path = ROOT / "data" / "curriculum.json"
    orig_text = cur_path.read_text(encoding="utf-8")
    cur = json.loads(orig_text)

    g4 = next((g for g in cur.get("grades", []) if g.get("grade") == 4), None)
    if not g4:
        raise RuntimeError("data/curriculum.json 找不到 grade=4")

    unit = next((u for u in g4.get("units", []) if u.get("code") == code), None)
    if not unit:
        raise RuntimeError(f"data/curriculum.json 找不到單元 {code}")

    src_paper = str(unit_data.get("source_paper") or "").strip()
    default_verified = (
        f"EXAM REAL/G4 真卷逐題比對：{src_paper}；詳 data/units/G4/{code}.json"
        if src_paper
        else f"EXAM REAL/G4 真卷逐題比對，詳 data/units/G4/{code}.json"
    )

    unit["status"] = "ready"
    unit["question_count"] = 10
    if not unit.get("verified_source"):
        unit["verified_source"] = default_verified
    unit["component_path"] = f"components/{lab}"
    unit["concept_path"] = f"components/{lab}?mode=concept"

    new_text = json.dumps(cur, ensure_ascii=False, indent=2) + "\n"
    if new_text != orig_text:
        atomic_write_text(cur_path, new_text)
        return True
    return False


def update_verify_131(code: str) -> bool:
    """冪等更新 tools/verify_curriculum_131.js 的 EXPECTED_READY_CODES。"""
    v_path = ROOT / "tools" / "verify_curriculum_131.js"
    orig = v_path.read_text(encoding="utf-8")
    m = re.search(r"(const\s+EXPECTED_READY_CODES\s*=\s*\[)([\s\S]*?)(\];)", orig)
    if not m:
        raise RuntimeError("tools/verify_curriculum_131.js 找不到 EXPECTED_READY_CODES")

    body = m.group(2)
    existing = re.findall(r"'([^']+)'", body)
    if code in existing:
        return False

    lines = body.rstrip().splitlines()
    if lines:
        if not lines[-1].rstrip().endswith(","):
            lines[-1] = lines[-1].rstrip() + ","
        lines.append(f"  '{code}'")
    else:
        lines = [f"  '{code}'"]
    new_body = "\n" + "\n".join(lines) + "\n"
    updated = orig[:m.start(2)] + new_body + orig[m.end(2):]
    atomic_write_text(v_path, updated)
    return True


def run_qa_gate(code: str, lab: str) -> None:
    """執行通道三（8 把 Gemini API Key）教學與題庫邏輯自動審題守門員，非 Exit 0 即中止註冊。"""
    qa_script = ROOT / "tools" / "qa_review_gemini.py"
    if not qa_script.is_file():
        raise FileNotFoundError(f"找不到前置質檢腳本：{qa_script}")
    print(f"[QA-GATE] 執行通道三審題守門員 ({code} / {lab}) ...")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    res = subprocess.run(
        [sys.executable, str(qa_script), "--code", code, "--lab", lab],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print(res.stderr.strip(), file=sys.stderr)
    if res.returncode != 0:
        raise RuntimeError(
            f"通道三審題未通過（FAIL, Exit Code={res.returncode}），已中止註冊。詳見 tools/_scratch/qa_review_{code}.json"
        )


def run_node_gate(rel_script: str) -> None:
    """執行 Node.js 門禁腳本，非 Exit 0 即拋錯。"""
    script_path = ROOT / rel_script
    print(f"[GATE] 執行 {rel_script} ...")
    res = subprocess.run(
        ["node", str(script_path)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print(res.stderr.strip(), file=sys.stderr)
    if res.returncode != 0:
        raise RuntimeError(f"門禁失敗 ({rel_script})，Exit Code={res.returncode}")


def main() -> int:
    parser = argparse.ArgumentParser(description="G4 單元通用自動總裝與註冊腳本")
    parser.add_argument("--code", required=True, help="108 課綱代碼，例如 N-4-9")
    parser.add_argument("--lab", required=True, help="教具檔名，例如 length_km_g4_lab.html")
    parser.add_argument("--skip-qa", action="store_true", help="緊急略過通道三 Gemini 審題守門員（僅限備用）")
    args = parser.parse_args()

    code = args.code.strip()
    lab = args.lab.strip()

    try:
        unit_data = validate_inputs(code, lab)
        if args.skip_qa:
            print(f"[WARN] 已啟用 --skip-qa，略過 {code} 的通道三自動審題門禁！")
        else:
            run_qa_gate(code, lab)

        s_changed = update_shell_js(code, lab)
        c_changed = update_curriculum_json(code, lab, unit_data)
        v_changed = update_verify_131(code)
        print(f"[REGISTER] {code} ({lab}) -> shell.js:{s_changed}, curriculum.json:{c_changed}, verify_131:{v_changed}")

        run_node_gate("tools/verify_curriculum_131.js")

        slug = code.lower().replace("-", "")
        for extra in (f"tools/verify_{slug}.js", f"tools/verify_{slug}_cdp.js"):
            if (ROOT / extra).is_file():
                run_node_gate(extra)
            else:
                print(f"[SKIP] 尚未建立 {extra}")

        print(f"[PASS] {code} 總裝與可用門禁全數通過")
        return 0
    except Exception as exc:
        print(f"[FAIL] {code} 總裝失敗：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
