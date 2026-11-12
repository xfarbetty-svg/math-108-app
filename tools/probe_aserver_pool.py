# -*- coding: utf-8 -*-
import subprocess

script = """
import os, sys, glob

print("=== Checking A-SERVER Environment ===")
for k, v in os.environ.items():
    if any(x in k.lower() for x in ['gemini', 'google', 'key', 'pool', 'opencode']):
        print(f"ENV: {k} = {v[:8]}***")

print("\n=== Checking Antigravity Dir ===")
try:
    dirs = os.listdir('D:/CCY/ANTIGRAVITY')
    for d in dirs:
        if any(x in d for x in ['32', '21', '035', 'pool', 'gate']):
            print("Found dir:", d)
except Exception as e:
    print("Error listing D:/CCY/ANTIGRAVITY:", e)
"""

cmd = ["ssh", "-n", "a-server", "python", "-c", f'"{script}"']
res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=30)
print(res.stdout)
print(res.stderr)
