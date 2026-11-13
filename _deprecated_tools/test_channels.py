# -*- coding: utf-8 -*-
import subprocess
import sys
import time

def test_ch1():
    print("Testing Channel 1 (Local OpenCode)...")
    t0 = time.time()
    cmd = ["opencode", "run", "請回答：【通道一OK】", "--auto"]
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True, shell=True, timeout=30)
    print(f"Ch1 ExitCode={res.returncode}, Time={time.time()-t0:.2f}s")
    if res.stdout:
        print("Ch1 Output:", res.stdout.strip()[:150])
    if res.stderr:
        print("Ch1 Stderr:", res.stderr.strip()[:150])

def test_ch2():
    print("\nTesting Channel 2 (A-SERVER SSH OpenCode)...")
    t0 = time.time()
    # 在遠端啟動 powershell，以 $null 輸入避免假死
    ps_cmd = "powershell -Command \"try { (Invoke-RestMethod http://100.91.241.21:4000/v1/models -TimeoutSec 3).data.id } catch { $_.Exception.Message }\""
    cmd = ["ssh", "-n", "a-server", ps_cmd]
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, timeout=30)
    stdout_text = res.stdout.decode('cp950', errors='replace')
    stderr_text = res.stderr.decode('cp950', errors='replace')
    print(f"Ch2 ExitCode={res.returncode}, Time={time.time()-t0:.2f}s")
    if stdout_text:
        print("Ch2 Output:", stdout_text.strip()[:150])
    if stderr_text:
        print("Ch2 Stderr:", stderr_text.strip()[:150])

if __name__ == "__main__":
    test_ch1()
    test_ch2()
