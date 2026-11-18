# -*- coding: utf-8 -*-
"""G3-N-3-9 一體化教室劇院：通道三五閘門多模態視覺驗收 (035 Key Pool / gemini-2.5-flash)"""
import base64
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'reports' / 'screenshots'
OUT = ROOT / 'reports' / 'g3_n39_theater_visual_qa.json'
GATEWAY = 'http://127.0.0.1:4000/v1/chat/completions'

ACTS = {
    'A1': ('theater_n39_act1.png', '情境導入：米米在講台左側、右側黑板出現 12 等分巧克力'),
    'A2': ('theater_n39_act2.png', '單位分數：10 塊高亮、1/12 單位概念'),
    'A3': ('theater_n39_act3.png', '核心算理：3/12+7/12=10/12，分母 12 有金色地基鎖定框'),
    'A4': ('theater_n39_act4.png', '總結互動：金色獎章與「進入挑戰」入口'),
}

SYSTEM = """你是極度嚴格的國小數學教材視覺審查員。請依据實際畫面判定，嚴禁幻覺、嚴禁腦補未出現的東西。
本舞台的設計契約：
1. 一體化溫馨教室：木質地板、牆面、暖光；米米老師（白兔、薄荷綠吊帶褲）站在講台左側；右側是掛牆黑板。
2. 米米老師必須完整可見，頭、臉、耳朵、身體不得被黑板、巧克力教具、講台、字幕條或任何元素遮擋。
3. 黑板與巧克力教具只能在畫面右側，不得跨越到米米身上。
4. 文字不得被裁切、不得互相重疊，畫面不得全黑或空白。
請回傳純 JSON（不要 markdown）：
{"pass": true/false, "mimi_fully_visible": true/false, "unified_classroom": true/false,
 "teaching_aid_correct": true/false, "text_readable": true/false,
 "act_specific_ok": true/false, "flaws": ["具體瑕疵"]}
唯有上述五項全部 true 才能 pass=true。"""


def ask(label, expect, files):
    parts = [{'type': 'text', 'text': f'閘門 {label}：{expect}。請逐項嚴格審查。'}]
    for f in files:
        b64 = base64.b64encode(f.read_bytes()).decode()
        parts.append({'type': 'image_url', 'image_url': {'url': 'data:image/png;base64,' + b64}})
    payload = {
        'model': 'gemini-2.5-flash',
        'messages': [{'role': 'system', 'content': SYSTEM}, {'role': 'user', 'content': parts}],
        'temperature': 0.1,
    }
    req = urllib.request.Request(GATEWAY, data=json.dumps(payload).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        content = json.loads(resp.read())['choices'][0]['message']['content'].strip()
    if content.startswith('```'):
        content = '\n'.join(content.splitlines()[1:-1]).strip()
    return json.loads(content)


def main():
    results = {}
    all_pass = True
    for gate, (name, expect) in ACTS.items():
        f = SHOTS / name
        if not f.exists():
            print(f'FAIL {gate}: 缺截圖 {f}')
            results[gate] = {'pass': False, 'flaws': [f'缺截圖 {f}']}
            all_pass = False
            continue
        try:
            r = ask(gate, expect, [f])
        except Exception as e:
            r = {'pass': False, 'flaws': [f'API 失敗: {e}']}
        results[gate] = r
        ok = bool(r.get('pass'))
        all_pass &= ok
        print(('PASS ' if ok else 'FAIL ') + gate + ' | ' + json.dumps(r.get('flaws', []), ensure_ascii=False))

    files = [SHOTS / v[0] for v in ACTS.values()]
    if all(f.exists() for f in files):
        try:
            total = ask('Total', '四幕合一全片：無黑屏、無音畫斷裂、米米全片零遮擋', files)
        except Exception as e:
            total = {'pass': False, 'flaws': [f'API 失敗: {e}']}
        results['Total'] = total
        ok = bool(total.get('pass'))
        all_pass &= ok
        print(('PASS ' if ok else 'FAIL ') + 'Total | ' + json.dumps(total.get('flaws', []), ensure_ascii=False))

    OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'REPORT {OUT}')
    print('VISUAL_QA_ALL_PASS (Exit 0)' if all_pass else 'VISUAL_QA_FAILED (Exit 1)')
    sys.exit(0 if all_pass else 1)


if __name__ == '__main__':
    main()
