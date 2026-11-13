# -*- coding: utf-8 -*-
"""
tools/run_stage15_challenger.py
AutoFlow Stage 1.5: 外部獨立模型初審挑錯與 BP 雙軌分流腳本
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
    print("[AutoFlow Stage 1.5] 啟動外部獨立模型 Challenger 初審挑錯與 BP 分流...")
    
    prompt = """你是 AutoFlow v2.6.3 的外部獨立盲審架構師 (Challenger)。
請對照專案中的兩份核心文件：
- R0 藍圖: reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md
- R1 計畫: reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md

你的職責是挑毛病、抓私貨 (Scope Creep) 與漏網之魚 (Gaps)：
1. 找出 R1 中是否有偷加料、規格過度複雜化、或未符合 R0 規範的地方？
2. 找出 T-01 ~ T-04 之間的介面斷裂、事件命名不一致、離線運行相容性缺陷、物理公式邊界條件等破綻。
3. 現場指揮官 BP 隨後進行雙軌分流判定 ([ACCEPTED] / [REJECTED])。

請直接使用寫入工具產出並落盤報告：
reports/20261105_2035_g1_visual_spec/R1_CHALLENGER_TICKETS.md

【文件必須遵循的格式】：
## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1.5：外部獨立模型盲審挑錯工單與雙軌分流
4. **編寫角色**：GLM-5.3 (Challenger) & BP (現場指揮官雙軌分流)
5. **放行狀態**：待 Stage 2 AGY 雙簽覆核

內容請條列開出 5~8 張具體質詢工單 (Ticket-01 ~ Ticket-08)，每張包含：
- 嚴重等級 (HIGH / MEDIUM / LOW)
- 缺陷成因與風險
- 修改建議
- BP 雙軌分流處置 ([ACCEPTED] 納入約束 / [REJECTED] 駁回原因)

請立即寫入 reports/20261105_2035_g1_visual_spec/R1_CHALLENGER_TICKETS.md。
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    
    print("[AutoFlow Stage 1.5] 調用 OpenCode 執行 Challenger 盲審...")
    try:
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
        print(f"[AutoFlow Stage 1.5] 執行完畢，耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
        if proc.stdout:
            print("--- Challenger Output (前 30 行) ---")
            lines = proc.stdout.splitlines()
            for line in lines[:30]:
                print(line)
        if proc.returncode != 0:
            print(f"[ERROR] 返回非 0 狀態碼: {proc.returncode}")
            sys.exit(proc.returncode)
    except Exception as e:
        print(f"[ERROR] 執行異常: {e}")
        sys.exit(1)

    print("[AutoFlow Stage 1.5] Challenger 挑錯與雙軌分流完成！")

if __name__ == "__main__":
    main()
