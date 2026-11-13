# -*- coding: utf-8 -*-
import subprocess
import time
import os

def main():
    print('[Channel 1] 派工本地 OpenCode CLI 施工 app/unit_n13.html...')
    t0 = time.time()
    cmd = ['opencode', 'run', '-m', 'opencode/glm-5.3-flash-free', '--auto']
    with open('_scratch/n13_worker_prompt.txt', 'r', encoding='utf-8') as f:
        prompt_text = f.read()
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True
    )
    stdout_b, stderr_b = proc.communicate(input=prompt_text.encode('utf-8'))
    elapsed = time.time() - t0
    out = stdout_b.decode('utf-8', errors='replace')
    err = stderr_b.decode('utf-8', errors='replace')
    print(f'[Channel 1] 施工結束，耗時={elapsed:.1f}s，Exit={proc.returncode}')
    if out:
        print(out[-1000:])
    if err:
        print('ERR:', err[-300:])

if __name__ == '__main__':
    main()
