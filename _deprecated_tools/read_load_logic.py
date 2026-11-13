# -*- coding: utf-8 -*-
import glob, importlib.util
from pathlib import Path

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/gemini_key_pool.py', recursive=True)
p = Path(matches[0])
print("Script dir:", p.parent)
for parent in [p.parent, p.parent.parent, p.parent.parent.parent]:
    c = parent / ".env"
    print(f"Checking {c}: exists={c.exists()}")
    if c.exists():
        with open(c, 'r', encoding='utf-8') as f:
            for line in f:
                if 'GEMINI' in line:
                    print(f"  Line: {line[:40]}...")
