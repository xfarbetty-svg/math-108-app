#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/qa_review_gemini.py — 通道三（8 把 Gemini API Key 輪詢）教學與題庫邏輯自動審題守門員

功能：
1. 讀取 data/units/G4/<代碼>.json 與 app/components/<教具檔名> 完整程式碼。
2. 自動探索環境變數或 035_google_account_pool/.env 中的 Gemini API Keys（支援 8 把 Key 輪詢與 429/異常自動切換重試）。
3. 針對國小四年級數學 6 大紅線執行嚴格審查，輸出結構化 JSON 至 tools/_scratch/qa_review_<代碼>.json。
4. 若 verdict != "PASS"，回傳 Exit Code 1；若 PASS，回傳 Exit Code 0。
"""

import argparse
import json
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent
MODEL_FALLBACK_CHAIN = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
]
DEFAULT_MODEL = os.environ.get("QA_GEMINI_MODEL", "").strip()
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

SYSTEM_PROMPT = """你是一位極度嚴格、吹毛求疵、實事求是且專精台灣 108 課綱國小四年級數學教材的「教學與互動邏輯審查守門員」。
你將收到一份完整的 G4 單元題庫 JSON（`data/units/G4/<CODE>.json`）與對應的互動教具 HTML 原始碼（`app/components/<LAB>`）。
請逐題核對 JSON 每題（Q1~Q10）的 `stem` 與 `choices` 以及教具 HTML 對應分支，絕不當好人放水、絕不腦補，只依據實際提供的程式碼與題庫內容給出結論。

【吹毛求疵級強制退件原則（HIT 即 FAIL，Exit Code 1）】：
只要發現以下 (a)(b)(c) 任一項，**必須直接判 FAIL（`verdict: "FAIL"`）**：
(a) JSON 題幹（`stem`）或選項（`choices`）出現「7分之8」、「3又9分之8」、「10分之3」等國字分數（明確考「讀作……」的題目除外）。
(b) 題目涉及小數乘法或多位數除法拆解（例如 N-4-9 Q7 `8136 ÷ 9` 除法、Q8 `2.62 × 35` 小數乘法），教具在對應題號分支卻只顯示文字提示或芯片標籤、沒有真實繪製標準直式網格（如廠字形長除法網格、小數乘法位值對齊直式網格）。
(c) 教具按鈕點擊後（例如 S-4-5「測試斜木 D」），只移動垂直線或切換文字，而未在 SVG 中真實繪製／改變斜線座標與長度對比（例如未畫出紅色斜線或未標示 `6.2 cm > 5.0 cm`）。

必須嚴格檢查以下【6 大紅線】：

(1) 反敷衍與題型匹配鐵律：
- 嚴禁全單元 10 題共用同一張靜態假線段圖或同一張敷衍圖示。
- 嚴禁把「天數、人數、個數」等非距離概念誤畫成距離線段上的節點。
- 嚴禁使用無意義的要按幾十下 `[- 0 +]` 計數器湊答案。
- 教具呈現必須與每題的題意與數學結構精準匹配。

(2) 算理直式與視覺具象化：
- 凡涉及乘除法拆解（如長除法、小數乘法分步、公里公尺換算直式等），必須真實繪製標準直式網格（如廠字形長除法、位值對齊小數乘法直式），嚴禁只用「？km」文字或純文字公式帶過。
- 分數題必須呈現數線等分刻度或等分分數長條／圓餅等分結構，嚴禁套用四則運算的空白積木槽位。

(3) 分數標準排版鐵律：
- 除了明確考「讀作……」的題目外，分數題幹、選項與教具數字一律使用標準數學分數或上下橫線分數排版，嚴禁寫出「7分之8」、「3又9分之8」等國字分數。

(4) 關鍵互動按鈕「視覺必變」：
- 點擊教具互動按鈕後（如「測試斜木 D」、「借 1 公里」、「切分」、「展開」、「疊合」等），SVG 座標、幾何圖形屬性或數值結構必須發生真實幾何或算理變化，不可只有按鈕 active 狀態切換或只改文字標籤而圖形沒變。

(5) 版面單屏緊湊（防假省空間捲軸）：
- 透過左右雙欄或緊湊排版控制教具高度 `<= 415px`（或相容 420px 單屏視口），禁止在桌面版出現需要往下滑的內部垂直捲軸（例如 `overflow-y: auto` 搭配過高內容導致 `scrollHeight > clientHeight`）。

(6) 真題品質與零劇透：
- 10 題必須來自合法台灣國小段考真卷（具備明確出處欄位且題幹完整無錯字、數值合理、唯一正解）。
- 作答前初始畫面必須零劇透（DOM 初始狀態不得預先顯示答案、正解高亮或解析文字）。
- 概念探索三活動（若有）情境必須互不重複，且與 10 題真題零重複。

請嚴格回傳純 JSON（不要 markdown 圍欄），格式如下：
{
  "curriculum_code": "<課綱代碼>",
  "lab_file": "<教具檔名>",
  "verdict": "PASS" 或 "FAIL",
  "summary": "繁體中文總結（若 FAIL 請扼要點出最致命問題）",
  "red_line_checks": {
    "1_anti_perfunctory_and_type_match": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]},
    "2_vertical_calc_and_visualization": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]},
    "3_fraction_formatting": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]},
    "4_interactive_visual_change": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]},
    "5_single_screen_compact_layout": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]},
    "6_real_exam_and_no_spoiler": {"status": "PASS" 或 "FAIL", "findings": ["具體發現..."]}
  },
  "violations": [
    {
      "target": "例如 Q03 / 概念探索活動2 / CSS版面 / 按鈕xxx",
      "red_line": "1" 到 "6",
      "severity": "CRITICAL" 或 "MAJOR",
      "reason": "具體違規原因與引用的題幹或程式碼證據"
    }
  ]
}
注意：只要 6 大紅線有任何一項為 FAIL 或 violations 非空，verdict 必須為 "FAIL"。"""


def atomic_write_text(path: Path, content: str) -> None:
    """使用 tempfile.mkstemp + os.replace 進行原子寫入（UTF-8 無 BOM）。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(prefix=f".{path.name}.", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


def _parse_keys_from_mapping(mapping: Dict[str, Optional[str]]) -> List[str]:
    """從環境變數或 .env 字典擷取 GEMINI_API_KEYS 與 GEMINI_API_KEY_*。"""
    raw_keys: List[str] = []

    comma_sep = (mapping.get("GEMINI_API_KEYS") or "").strip()
    if comma_sep:
        for item in comma_sep.split(","):
            cleaned = item.strip().strip("'\"")
            if cleaned:
                raw_keys.append(cleaned)

    single_key = (mapping.get("GEMINI_API_KEY") or "").strip().strip("'\"")
    if single_key:
        raw_keys.append(single_key)

    numbered = sorted(
        k for k in mapping.keys() if re.fullmatch(r"GEMINI_API_KEY_\d+", k)
    )
    for var_name in numbered:
        val = (mapping.get(var_name) or "").strip().strip("'\"")
        if val:
            raw_keys.append(val)

    seen = set()
    keys: List[str] = []
    for key in raw_keys:
        if key not in seen:
            if not re.fullmatch(r"[A-Za-z0-9_\-\.]+", key):
                raise ValueError("偵測到含非法字元的 Gemini API Key，拒絕載入。")
            seen.add(key)
            keys.append(key)
    return keys


def discover_channel3_keys() -> Tuple[List[str], str]:
    """自動探索本機通道三 Gemini API Keys（不觸碰無關目錄，不硬編碼金鑰）。"""
    env_keys = _parse_keys_from_mapping(dict(os.environ))
    if env_keys:
        return env_keys, "os.environ"

    candidates: List[Path] = []
    custom_env = os.environ.get("GEMINI_POOL_ENV_PATH", "").strip()
    if custom_env:
        candidates.append(Path(custom_env))

    candidates.extend([
        ROOT.parent / "035_google_account_pool" / ".env",
        ROOT / ".env",
    ])

    for env_path in candidates:
        if env_path.is_file():
            values = dotenv_values(env_path)
            keys = _parse_keys_from_mapping(values)
            if keys:
                return keys, str(env_path)

    raise RuntimeError(
        "找不到通道三 Gemini API Keys（已檢查環境變數與 035_google_account_pool/.env）。"
    )


def mask_key(key: str) -> str:
    """安全脫敏顯示金鑰前後綴。"""
    if len(key) <= 10:
        return "***"
    return f"{key[:6]}...{key[-4:]}"


def strip_json_fence(text: str) -> str:
    """移除模型可能附帶的 markdown 程式碼圍欄。"""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def call_gemini_with_rotation(
    keys: List[str],
    models: List[str],
    user_prompt: str,
    timeout_sec: float = 90.0,
) -> Tuple[Dict[str, Any], str, int, int]:
    """依序嘗試模型優先鏈（預設 gemini-2.5-pro -> 2.5-flash -> 3-flash-preview）與 8 把 Key 輪詢。"""
    total = len(keys)
    start_idx = (time.time_ns() // 1_000_000) % total
    errors: List[str] = []
    total_attempts = 0

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }

    with httpx.Client(timeout=httpx.Timeout(connect=10.0, read=timeout_sec, write=15.0, pool=15.0)) as client:
        for model in models:
            url = f"{GEMINI_API_BASE}/{model}:generateContent"
            for attempt in range(total):
                total_attempts += 1
                key_idx = (start_idx + attempt) % total
                api_key = keys[key_idx]
                masked = mask_key(api_key)
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                }
                try:
                    resp = client.post(url, json=payload, headers=headers)
                    if resp.status_code == 404:
                        msg = f"{model} Key #{key_idx + 1} ({masked}) HTTP 404（模型不支援），切換備援模型"
                        print(f"[QA-FALLBACK] {msg}", file=sys.stderr)
                        errors.append(msg)
                        break
                    if resp.status_code in (429, 500, 502, 503, 504):
                        msg = f"{model} Key #{key_idx + 1} ({masked}) HTTP {resp.status_code}"
                        print(f"[QA-ROTATE] {msg}，切換下一把 Key ...", file=sys.stderr)
                        errors.append(msg)
                        continue
                    if resp.status_code != 200:
                        detail = resp.text[:200].replace("\n", " ")
                        msg = f"{model} Key #{key_idx + 1} ({masked}) HTTP {resp.status_code}: {detail}"
                        print(f"[QA-ROTATE] {msg}，切換下一把 Key ...", file=sys.stderr)
                        errors.append(msg)
                        continue

                    data = resp.json()
                    candidates = data.get("candidates") or []
                    if not candidates:
                        msg = f"{model} Key #{key_idx + 1} ({masked}) 回傳無 candidates"
                        errors.append(msg)
                        continue

                    parts = candidates[0].get("content", {}).get("parts") or []
                    raw_text = "".join(str(p.get("text", "")) for p in parts).strip()
                    if not raw_text:
                        msg = f"{model} Key #{key_idx + 1} ({masked}) 回傳空白內容"
                        errors.append(msg)
                        continue

                    parsed = json.loads(strip_json_fence(raw_text))
                    return parsed, model, key_idx + 1, total_attempts

                except (httpx.HTTPError, json.JSONDecodeError, KeyError, ValueError) as exc:
                    msg = f"{model} Key #{key_idx + 1} ({masked}) 例外: {exc}"
                    print(f"[QA-ROTATE] {msg}，切換下一把 Key ...", file=sys.stderr)
                    errors.append(msg)
                    continue

    raise RuntimeError(
        f"通道三模型鏈 {models} × {total} 把 Key 輪詢均失敗：{'; '.join(errors[-6:])}"
    )


def build_review_prompt(code: str, lab: str, unit_json_text: str, lab_html_text: str) -> str:
    """組裝送交 Gemini 的完整審題輸入。"""
    return (
        f"請審查以下 G4 數學單元：\n"
        f"- 課綱代碼：{code}\n"
        f"- 教具檔名：{lab}\n\n"
        f"=== 1. 題庫 JSON (`data/units/G4/{code}.json`) ===\n"
        f"{unit_json_text}\n\n"
        f"=== 2. 互動教具完整程式碼 (`app/components/{lab}`) ===\n"
        f"{lab_html_text}\n"
    )


def normalize_result(result: Dict[str, Any], code: str, lab: str, meta: Dict[str, Any]) -> Dict[str, Any]:
    """正規化並強制一致化 verdict 與紅線狀態（防模型自相矛盾）。"""
    checks = result.get("red_line_checks")
    if not isinstance(checks, dict):
        raise ValueError("Gemini 回傳缺少 red_line_checks 物件")

    violations = result.get("violations")
    if not isinstance(violations, list):
        violations = []

    any_check_fail = any(
        isinstance(v, dict) and str(v.get("status", "")).upper() != "PASS"
        for v in checks.values()
    )
    raw_verdict = str(result.get("verdict", "")).upper().strip()
    final_verdict = "PASS" if (raw_verdict == "PASS" and not any_check_fail and len(violations) == 0) else "FAIL"

    normalized = {
        "curriculum_code": code,
        "lab_file": lab,
        "verdict": final_verdict,
        "summary": str(result.get("summary") or "").strip(),
        "red_line_checks": checks,
        "violations": violations,
        "_meta": meta,
    }
    return normalized


def print_report(report: Dict[str, Any], out_path: Path) -> None:
    """輸出清楚可讀的質檢報告至終端。"""
    code = report["curriculum_code"]
    lab = report["lab_file"]
    verdict = report["verdict"]
    meta = report.get("_meta", {})

    print("=" * 72)
    print(f"[QA-REVIEW] 單元：{code} | 教具：{lab} | 結果：{verdict}")
    print(
        f"[QA-META]   模型：{meta.get('model')} | 使用 Key #{meta.get('key_index_used')}/{meta.get('total_keys')} "
        f"| 嘗試次數：{meta.get('attempts')} | 報告：{out_path}"
    )
    print(f"[QA-SUMMARY] {report.get('summary', '')}")
    print("-" * 72)

    for key_name, detail in report.get("red_line_checks", {}).items():
        if isinstance(detail, dict):
            st = detail.get("status", "UNKNOWN")
            findings = detail.get("findings") or []
            print(f"  [{st}] {key_name}")
            for f in findings:
                print(f"       - {f}")

    violations = report.get("violations") or []
    if violations:
        print("-" * 72)
        print(f"[QA-VIOLATIONS] 共 {len(violations)} 項違規：")
        for idx, v in enumerate(violations, 1):
            if isinstance(v, dict):
                print(
                    f"  {idx}. [{v.get('severity', 'MAJOR')}][紅線{v.get('red_line', '?')}] "
                    f"{v.get('target', '')} -> {v.get('reason', '')}"
                )
            else:
                print(f"  {idx}. {v}")
    print("=" * 72)


def main() -> int:
    parser = argparse.ArgumentParser(description="通道三（8 把 Gemini API Key 輪詢）G4 教學與題庫邏輯自動審題守門員")
    parser.add_argument("--code", required=True, help="108 課綱代碼，例如 N-4-5")
    parser.add_argument("--lab", required=True, help="教具檔名，例如 fraction_mixed_g4_lab.html")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="指定 Gemini 模型（未指定時依序嘗試 gemini-2.5-pro -> gemini-2.5-flash -> gemini-3-flash-preview）")
    parser.add_argument("--out", default="", help="自訂輸出 JSON 路徑（預設 tools/_scratch/qa_review_<代碼>.json）")
    args = parser.parse_args()

    code = args.code.strip()
    lab = args.lab.strip()
    model_chain = [args.model.strip()] if args.model.strip() else list(MODEL_FALLBACK_CHAIN)

    if not re.fullmatch(r"[NSRD]-4-\d+", code):
        print(f"[FAIL] 無效的 G4 課綱代碼：{code}", file=sys.stderr)
        return 1
    if not lab.endswith(".html") or "/" in lab or "\\" in lab:
        print(f"[FAIL] 無效的教具檔名：{lab}", file=sys.stderr)
        return 1

    json_path = ROOT / "data" / "units" / "G4" / f"{code}.json"
    lab_path = ROOT / "app" / "components" / lab
    if not json_path.is_file():
        print(f"[FAIL] 找不到題庫檔案：{json_path}", file=sys.stderr)
        return 1
    if not lab_path.is_file():
        print(f"[FAIL] 找不到教具檔案：{lab_path}", file=sys.stderr)
        return 1

    out_path = Path(args.out) if args.out else (ROOT / "tools" / "_scratch" / f"qa_review_{code}.json")

    try:
        keys, key_source = discover_channel3_keys()
        unit_json_text = json_path.read_text(encoding="utf-8")
        lab_html_text = lab_path.read_text(encoding="utf-8")
        prompt = build_review_prompt(code, lab, unit_json_text, lab_html_text)

        raw_result, model_used, key_idx_used, attempts = call_gemini_with_rotation(
            keys=keys,
            models=model_chain,
            user_prompt=prompt,
        )

        meta = {
            "reviewed_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
            "model": model_used,
            "model_chain": model_chain,
            "total_keys": len(keys),
            "key_index_used": key_idx_used,
            "attempts": attempts,
            "key_source": key_source if key_source == "os.environ" else Path(key_source).name,
        }
        report = normalize_result(raw_result, code, lab, meta)
        atomic_write_text(out_path, json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print_report(report, out_path)
        return 0 if report["verdict"] == "PASS" else 1

    except Exception as exc:
        err_report = {
            "curriculum_code": code,
            "lab_file": lab,
            "verdict": "FAIL",
            "summary": f"審題執行失敗：{exc}",
            "red_line_checks": {},
            "violations": [
                {
                    "target": "qa_review_gemini",
                    "red_line": "SYSTEM",
                    "severity": "CRITICAL",
                    "reason": str(exc),
                }
            ],
            "_meta": {
                "reviewed_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
                "model": args.model,
            },
        }
        atomic_write_text(out_path, json.dumps(err_report, ensure_ascii=False, indent=2) + "\n")
        print(f"[FAIL] {code} 通道三質檢發生錯誤：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
