# -*- coding: utf-8 -*-
"""
tools/run_full_pipeline.py
全自動真題提取與盲審閉環總流水線
執行順序：平行提取 -> 自動Diff比對 -> 035 Gemini Pool教育專家盲審
"""
import os
import sys
import subprocess
import time

def run_step(step_name, cmd):
    print(f"\n========================================================")
    print(f"🔥 [流水線] 開始執行: {step_name}")
    print(f"指令: {' '.join(cmd)}")
    print(f"========================================================")
    t0 = time.time()
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL)
    elapsed = time.time() - t0
    print(f"🏁 [{step_name}] 完成! ExitCode={res.returncode}, 耗時={elapsed:.2f}s")
    if res.returncode != 0:
        print(f"❌ [{step_name}] 失敗中斷!")
        sys.exit(res.returncode)

def main():
    py_exe = sys.executable
    t_start = time.time()

    # 第一步：平行提取
    run_step("第一步：雙通道平行提取", [py_exe, "tools/extract_exams_parallel.py"])

    # 第二步：自動比對
    run_step("第二步：自動 Diff 比對與過濾", [py_exe, "tools/diff_exam_extracts.py"])

    # 第三步：教育專家盲審
    run_step("第三步：035 Gemini Pool 教育專家盲審", [py_exe, "tools/blind_review_gemini_pool.py"])

    total_time = time.time() - t_start
    print(f"\n🎉🎉🎉 全流水線執行完畢! 總耗時={total_time:.2f}s, 雲端額度消耗: $0 (完全免費)")

if __name__ == "__main__":
    main()
