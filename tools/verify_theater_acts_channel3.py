# -*- coding: utf-8 -*-
"""
tools/verify_theater_acts_channel3.py
使用通道三 (035 Key Pool 多模態視覺眼睛)
對 G3-N-3-9 情境劇院 4 幕實機截圖逐一進行視覺與算理嚴格審查。
"""

import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

GATEWAY_URL = "http://127.0.0.1:4000/v1/chat/completions"
SCREENSHOTS_DIR = Path("reports/screenshots")

SYSTEM_PROMPT = """你是一位極度嚴格、具備敏銳機器視覺眼睛的國小數學教材與空間視覺審查專家。
請針對這張「國小三年級 G3-N-3-9 分數情境劇院實機截圖」進行嚴格的視覺審查。

【審查核心指針】：
1. 【米米老師防遮擋（最高優先）】：米米老師（小白兔）是否被任何黑板、巧克力教具、浮動卡片、文字或按鈕遮擋？米米老師必須擁有獨立清晰的站位，絕不允許任何物件壓在老師身上！
2. 【一體化教室空間】：畫面是否呈現出一個完整、一體化的教室空間（木地板、暖色牆面、掛牆黑板、講台）？是否已徹底消除死板生硬的 48:52 左右分割線？
3. 【黑板算理清晰度】：
   - 巧克力長條是否明確平分為 12 塊？
   - 藍色（3塊）、橘色（7塊）、深色未取（2塊）是否顏色分明？
   - 算式與分數文字（如 1/12, 10/12）是否清晰易讀、排版整齊？
4. 【排版與視覺舒適度】：字體大小適中、無溢出、無文字重疊、整體日系繪本風質感良好。

請以標準 JSON 格式輸出：
{
  "act": "Act編號",
  "pass": true, // 若有任何遮擋老師或空間嚴重割裂則為 false，否則為 true
  "teacher_occlusion": "合規（未被遮擋） / 不合規（被遮擋）: 詳細描述",
  "spatial_integration": "合規（一體化教室） / 不合規: 詳細描述",
  "math_clarity": "合規 / 不合規: 描述巧克力與算式",
  "layout_typography": "合規 / 不合規: 描述文字排版",
  "summary": "一句話總結",
  "flaws": []
}
只回傳純 JSON 內容，不要包含 markdown 代碼塊標記。"""

def inspect_act(act_num: int) -> dict:
    img_path = SCREENSHOTS_DIR / f"theater_act{act_num}.png"
    if not img_path.exists():
        return {"act": f"Act {act_num}", "pass": False, "flaws": [f"找不到截圖: {img_path}"]}

    with open(img_path, "rb") as f:
        b64_data = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"請對 G3-N-3-9 情境劇院【Act {act_num}】進行通道 3 多模態視覺眼睛審查。特別確認米米老師是否被遮擋、空間是否一體化、算理是否正確清晰。"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                ]
            }
        ],
        "temperature": 0.1
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"].strip()
            # 清除可能包裹的 markdown
            if content.startswith("```"):
                lines = content.splitlines()
                content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            return json.loads(content)
    except Exception as e:
        return {"act": f"Act {act_num}", "pass": False, "flaws": [f"API 請求失敗: {e}"]}

def main():
    print("👁️ [Channel 3 Visual Eye] 啟動 G3-N-3-9 四幕獨立視覺眼睛審查...")
    results = []
    all_pass = True

    for act in range(1, 5):
        print(f"\n🔍 正在審查 Act {act}...")
        res = inspect_act(act)
        results.append(res)
        status = "✅ PASS" if res.get("pass") else "❌ FAIL"
        print(f"  [{status}] Act {act}")
        print(f"    - 米米老師防遮擋: {res.get('teacher_occlusion')}")
        print(f"    - 一體化教室空間: {res.get('spatial_integration')}")
        print(f"    - 算理清晰度: {res.get('math_clarity')}")
        print(f"    - 審查總結: {res.get('summary')}")
        if not res.get("pass"):
            all_pass = False
            print(f"    ⚠️ 瑕疵清單: {res.get('flaws')}")

    out_file = Path("reports/verify_channel3_acts_report.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n📄 審查報告已落盤: {out_file}")

    if all_pass:
        print("\n🎉【通道 3 視覺眼睛驗收全數通過 (4/4 PASS)】！")
        sys.exit(0)
    else:
        print("\n❌【通道 3 視覺眼睛發現瑕疵，未達交付標準】！")
        sys.exit(1)

if __name__ == "__main__":
    main()
