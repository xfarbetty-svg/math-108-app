# -*- coding: utf-8 -*-
"""
tools/verify_visual_qa.py
028-1 國小數學 APP: 自動化多模態視覺守門員 (Visual QA Gatekeeper)
使用本地 035/036 免費視覺通道 (http://127.0.0.1:4000/v1 gemini-2.5-flash)
針對 CDP 產出的 390px 實機截圖，進行四大算理硬檢：
1. 物理常識 (天平下沉方向、重量大小與自然法則一致性)
2. 基準線對齊 (直尺起點是否對齊 0 或標註起點線、直條圖底座基線、物件左緣齊頭)
3. 顏色高對比 (元素顏色易於區隔、非同色系混淆、文字在背景上的高辨識度)
4. 單屏入眼 (390x844 視口無溢出、教具高度 <= 420px、文字未被裁切)
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

GATEWAY_URL = "http://127.0.0.1:4000/v1/chat/completions"

SYSTEM_PROMPT = """你是一位極度嚴格且實事求是的國小數學教材視覺與算理審查員。
請檢查提供的手機版數學教具截圖。

【防範幻覺核心鐵律】：
1. 首先請客觀辨識畫面中實際存在的物件類型（例如：天平、直尺、正字記號、直條統計圖、數字卡片、幾何圖形分類、線段圖等）。
2. 嚴禁無中生有！若畫面中【根本沒有天平】，物理常識直接填「不適用（合規）」；若畫面中【根本沒有直尺或長度測量】，基準線項直接填「不適用（合規）」。

【四大審查維度】：
1. 【物理常識】：若畫面中【有天平】，較重的一端必須下沉，較輕的必須翹起，若等重必須水平平衡，指針指向0，嚴禁顛倒；若畫面無天平/容量等物理物件，填「不適用（合規）」。
2. 【基準線對齊】：若為【長度比較或直尺測量】，物件起點必須嚴格對齊直尺 0 刻度或基準線；若為【直條圖/長條圖】，所有直條底部必須嚴格切齊 0 刻度底座基線；若畫面為其他類型，填「不適用（合規）」。
3. 【顏色高對比】：圖形、球體或分類物件顏色必須鮮明易辨（如紅、綠、藍對比強烈），文字在背景上必須清晰可讀。
4. 【單屏入眼與排版】：文字無重疊、無被切字、無溢出畫面邊界、排版整齊緊湊。

請以嚴格的 JSON 格式回傳，格式如下：
{
  "detected_elements": "簡述畫面實際看到的物件",
  "pass": true, // 若且唯若畫面中「實際存在的元素」嚴重違反物理、基準線、顏色或排版時填 false，否則填 true
  "physical_common_sense": "合規/不適用/不合規: 原因",
  "baseline_alignment": "合規/不適用/不合規: 原因",
  "color_contrast": "合規/不合規: 原因",
  "layout_fit": "合規/不合規: 原因",
  "flaws": []
}
只回傳純 JSON 內容，不要包含 markdown 標籤或額外文字。"""


def inspect_image(image_path: Path, max_retries: int = 3) -> dict:
    if not image_path.exists():
        return {"pass": False, "flaws": [f"圖片檔案不存在: {image_path}"]}

    with open(image_path, "rb") as f:
        b64_data = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"請對這張教材截圖（{image_path.name}）進行 4 大維度的嚴格審查。請先辨識實際物件，嚴禁幻覺！"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                ]
            }
        ],
        "temperature": 0.1
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        GATEWAY_URL,
        data=req_data,
        headers={"Content-Type": "application/json"}
    )

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    lines = content.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    content = "\n".join(lines).strip()
                result = json.loads(content)
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                return {"pass": False, "flaws": [f"API 請求失敗: {e}"]}
            time.sleep(1.5)

    return {"pass": False, "flaws": ["未知錯誤"]}


def main():
    parser = argparse.ArgumentParser(description="028-1 Visual QA Gatekeeper")
    parser.add_argument("--dir", type=str, help="欲審查的截圖資料夾路徑")
    parser.add_argument("--files", nargs="+", help="欲審查的個別截圖路徑")
    args = parser.parse_args()

    targets = []
    if args.dir:
        dir_path = Path(args.dir)
        if dir_path.is_dir():
            targets.extend(sorted(dir_path.glob("*.png")))
    if args.files:
        for f in args.files:
            targets.append(Path(f))

    if not targets:
        print("[Visual QA ERROR] 未指定任何截圖檔案！", file=sys.stderr)
        sys.exit(1)

    print(f"==================================================")
    print(f"🔍 [Visual QA Gatekeeper] 啟動多模態視覺硬門禁檢測 (防幻覺增強版)")
    print(f"📦 待檢測截圖數量: {len(targets)} 張")
    print(f"==================================================")

    all_passed = True
    report = []

    for img in targets:
        print(f"⏳ 正在審查: {img.name} ... ", end="", flush=True)
        res = inspect_image(img)
        passed = res.get("pass", False)
        report.append({"file": img.name, "result": res})

        if passed:
            detected = res.get("detected_elements", "無標記")
            print(f"✅ 合規 (PASS) [{detected}]")
        else:
            all_passed = False
            print("❌ 異常 (FAIL)")
            flaws = res.get("flaws", [])
            for flaw in flaws:
                print(f"   ⚠️  [瑕疵] {flaw}")
            print(f"   - 辨識物件: {res.get('detected_elements')}")
            print(f"   - 物理常識: {res.get('physical_common_sense')}")
            print(f"   - 基準線對齊: {res.get('baseline_alignment')}")
            print(f"   - 顏色對比: {res.get('color_contrast')}")
            print(f"   - 排版單屏: {res.get('layout_fit')}")

    print(f"==================================================")
    if all_passed:
        print(f"🎉 [Visual QA SUCCESS] 所有截圖 ({len(targets)}/{len(targets)}) 全數通過視覺硬門禁！")
        sys.exit(0)
    else:
        print(f"🚨 [Visual QA FAILED] 檢測到真實視覺算理缺陷，強制熔斷退出 (Exit Code 1)！", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
