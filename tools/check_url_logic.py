# -*- coding: utf-8 -*-
import glob

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/gemini_key_pool.py', recursive=True)
p = matches[0]
with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if any(k in l for k in ['url =', 'urllib', 'http', 'models/']):
        print(f"L{i+1}: {l.strip()}")
