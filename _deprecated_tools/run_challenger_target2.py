# -*- coding: utf-8 -*-
"""
tools/run_challenger_target2.py
鎖定靶心 2：直接審 Stage 1 任務卡規格 (R0 vs R1)，開出具體 Tickets 並由 BP 分流
"""
import os
import sys
import subprocess
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def main():
    print("[AutoFlow Stage 1.5] 指定靶心 2：開始對照 R0 藍圖 vs R1 計畫進行挑錯...")
    
    prompt = """你是外部獨立盲審架構師 (Challenger)。
我指定審查靶心為：【2. 直接審 Stage 1 任務卡規格（R0 → T-01~T-03 / T-04 是否可施工、有無規格漏洞）】。

請讀取：
- R0 藍圖: reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md
- R1 計畫: reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md

請扮演無情挑錯者，逐條審查 R1 計畫是否有：
1. 偷加料 (Scope Creep) 或過度設計？
2. 規格模糊、缺乏邊界條件處理（如負數、大於10、非整數）？
3. 狀態機與對外 CustomEvent 命名是否一致？
4. Web Components Shadow DOM 穿透與離線 file:// CORS 問題？
5. T-03 天平的物理公式是否有數值發散風險（如 dt 波動導致甩動無限大）？

請把挑錯結果整理成 5~8 張具體工單 (Ticket-01 ~ Ticket-08)，並由 BP 在每張工單下方做出雙軌分流判定：
[ACCEPTED] (納入約束要求 Worker 施工遵守) 或 [REJECTED] (駁回理由)。

請直接使用寫檔工具寫入檔案：
reports/20261105_2035_g1_visual_spec/R1_CHALLENGER_TICKETS.md

【文件表頭規範】：
## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1.5：外部獨立模型盲審挑錯工單與雙軌分流
4. **編寫角色**：GLM-5.3 (Challenger) & BP (現場指揮官雙軌分流)
5. **放行狀態**：待 Stage 2 AGY 雙簽覆核

立即落盤 reports/20261105_2035_g1_visual_spec/R1_CHALLENGER_TICKETS.md！
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    proc = subprocess.run(
        cmd,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        shell=True,
        encoding="utf-8",
        errors="replace",
        timeout=180
    )
    elapsed = time.time() - start_t
    print(f"[Stage 1.5] 耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
    if proc.stdout:
        print("--- Challenger Output (前 30 行) ---")
        lines = proc.stdout.splitlines()
        for line in lines[:30]:
            print(line)
    if proc.returncode != 0:
        print(f"[ERROR] 執行失敗，Exit Code: {proc.returncode}")
        sys.exit(proc.returncode)

    print("[Stage 1.5] 成功產出 R1_CHALLENGER_TICKETS.md！")

if __name__ == "__main__":
    main()
