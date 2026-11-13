# -*- coding: utf-8 -*-
import glob

matches = glob.glob('D:/CCY/ANTIGRAVITY/*32*/**/gemini_key_pool.py', recursive=True)
p = matches[0]
with open(p, 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'MODEL_ALIASES\s*=\s*\{([^}]+)\}', text)
if m:
    print("MODEL_ALIASES on A-SERVER:")
    print(m.group(0))
else:
    print("No MODEL_ALIASES found")
