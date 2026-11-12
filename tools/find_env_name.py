# -*- coding: utf-8 -*-
import glob

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/gemini_key_pool.py', recursive=True)
if matches:
    p = matches[0]
    with open(p, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if any(x in line for x in ['os.getenv', 'os.environ', 'GEMINI']):
                print(f"L{i}: {line.strip()}")
