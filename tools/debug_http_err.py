# -*- coding: utf-8 -*-
import urllib.request, urllib.error, json, glob

p = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/.env', recursive=True)[0]
keys = []
with open(p, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEYS='):
            keys = [k.strip() for k in line.split('=')[1].split(',')]

print(f"測試 gemini-3-flash-preview 模型呼叫:")
for i, k in enumerate(keys):
    u = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={k}"
    body = json.dumps({"contents": [{"parts": [{"text": "請回覆一句：OK"}]}]}).encode('utf-8')
    req = urllib.request.Request(u, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            reply = data['candidates'][0]['content']['parts'][0]['text'].strip()
            print(f"Key {i+1} ({k[:10]}...): SUCCESS 200 -> 回覆: {reply}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='replace')
        print(f"Key {i+1} ({k[:10]}...): HTTP {e.code} -> {err_msg[:80]}")
    except Exception as ex:
        print(f"Key {i+1} ({k[:10]}...): {type(ex).__name__} -> {ex}")
