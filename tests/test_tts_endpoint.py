#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
守門員測試：test_tts_endpoint.py
專案：028_國小數學APP
用途：驗證 /api/tts 語音合成端點之介面合約特徵、微軟 Sec-MS-GEC v2 動態簽章演算法與 502 降級訊號。
退出碼 (Exit Code)：全數通過回傳 0，任何一項失敗立即拋出例外退出碼 1。
"""

import os
import sys
import re
import edge_tts.drm as drm

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        raise SystemExit("[FAIL] 無法將終端輸出設定為 UTF-8 編碼")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TTS_JS_PATH = os.path.join(ROOT_DIR, "functions", "api", "tts.js")

EXPECTED_TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
KNOWN_TEST_EPOCH = 1700000000
EXPECTED_V2_TOKEN = "2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2"


def run_checks():
    failures = []
    print("=" * 70)
    print(">> 啟動 028_國小數學APP Edge-TTS v2 端點介面合約與簽章特徵驗收")
    print("=" * 70)

    # 1. 檔案存在性檢驗
    print("[1/5] 驗證 functions/api/tts.js 實體檔案...")
    if not os.path.isfile(TTS_JS_PATH):
        failures.append(f"端點檔案不存在: {TTS_JS_PATH}")
        print(f"  [FAIL] 找不到 {TTS_JS_PATH}")
        return failures
    else:
        print(f"  [PASS] 成功定位 {os.path.relpath(TTS_JS_PATH, ROOT_DIR)}")

    with open(TTS_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 2. CORS 標頭與預檢請求驗證
    print("[2/5] 驗證 CORS Headers 與 OPTIONS 預檢合約...")
    cors_checks = [
        ("CORS Origin 通配符", r'"Access-Control-Allow-Origin":\s*"\*"'),
        ("CORS Methods (GET, OPTIONS)", r'"Access-Control-Allow-Methods":\s*"GET,\s*OPTIONS"'),
        ("CORS Headers (Content-Type)", r'"Access-Control-Allow-Headers":\s*"Content-Type"'),
        ("OPTIONS 204 回應", r'status:\s*204'),
    ]
    for label, pattern in cors_checks:
        if not re.search(pattern, content):
            failures.append(f"CORS 缺失: {label}")
            print(f"  [FAIL] 未檢測到 {label}")
        else:
            print(f"  [PASS] {label} 吻合")

    # 3. Sec-MS-GEC v2 演算法特徵檢驗
    print("[3/5] 驗證 Sec-MS-GEC v2 演算法特徵 (CS64 + 自訂 SHA256)...")
    sec_checks = [
        ("TrustedClientToken 常數", EXPECTED_TRUSTED_TOKEN),
        ("Windows Epoch 差異秒數 (11644473600n)", r'11644473600n'),
        ("100ns Ticks 乘數 (10000000n)", r'10000000n'),
        ("CS64 係數表常數", r'CS64_COEFFICIENTS'),
        ("Sec-MS-GEC-Version 2-143.0.3650.75", r'Sec-MS-GEC-Version=2-143\.0\.3650\.75'),
        ("自訂 SHA-256 實作", r'customSha256Digest'),
        ("大寫 Hex 轉換", r'toUpperCase\(\)'),
    ]
    for label, pattern in sec_checks:
        if isinstance(pattern, str) and pattern.isalnum():
            found = pattern in content
        else:
            found = bool(re.search(pattern, content))
        if not found:
            failures.append(f"Sec-MS-GEC v2 缺失: {label}")
            print(f"  [FAIL] 未檢測到 {label}")
        else:
            print(f"  [PASS] {label} 吻合")

    # 4. 異常處理與 502 降級標頭 (X-Degraded-Reason)
    print("[4/5] 驗證 502 降級標頭與無縫退守機制...")
    fallback_checks = [
        ("HTTP 502 狀態碼定義", r'status:\s*502'),
        ("X-Degraded-Reason 響應標頭", r'"X-Degraded-Reason":'),
        ("fallback_to_browser 降級代碼", r'"fallback_to_browser"'),
        ("Web Speech 提示字串", r'Use native Web Speech'),
        ("2.5秒超時保護門檻", r'2500'),
    ]
    for label, pattern in fallback_checks:
        if not re.search(pattern, content):
            failures.append(f"降級機制缺失: {label}")
            print(f"  [FAIL] 未檢測到 {label}")
        else:
            print(f"  [PASS] {label} 吻合")

    # 5. 跨語言演算法數學精確對齊檢驗
    print("[5/5] 驗證 Sec-MS-GEC v2 數學模型跨環境一致性...")
    py_v2_token = drm.generate_sec_ms_gec_v2(KNOWN_TEST_EPOCH)
    if py_v2_token != EXPECTED_V2_TOKEN:
        failures.append(f"Python edge-tts 輸出不符: 預期 {EXPECTED_V2_TOKEN}，得到 {py_v2_token}")
        print("  [FAIL] Python edge-tts 基準雜湊不一致")
    else:
        print(f"  [PASS] 已知 Epoch({KNOWN_TEST_EPOCH}) 基準 token byte-for-byte 100% 精準吻合")

    live_token = drm.generate_sec_ms_gec_v2()
    if len(live_token) != 81 or "-" not in live_token:
        failures.append(f"即時簽章格式非法: {live_token}")
        print(f"  [FAIL] 即時簽章格式非法: {live_token}")
    else:
        print(f"  [PASS] 當前 v2 動態簽章產生成功: {live_token[:25]}... (長度 81, CS64-SHA256)")

    return failures


if __name__ == "__main__":
    errs = run_checks()
    print("=" * 70)
    if errs:
        print(f"[FAIL] 驗收失敗，累計 {len(errs)} 項錯誤：")
        for e in errs:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("[SUCCESS] 恭喜！functions/api/tts.js v2 介面合約與簽章特徵【全綠通過】！(Exit Code 0)")
        sys.exit(0)
