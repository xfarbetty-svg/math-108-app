# -*- coding: utf-8 -*-
"""
tools/run_bp_stage1.py
AutoFlow Stage 1 派工腳本：調用本地 OpenCode CLI (通道 1，成本 $0)
由 BP (Big Pickle) 現場指揮官拆解首批教具任務卡並落盤 R1_BP_EXECUTION_PLAN.md
"""
import os
import sys
import subprocess
import time

# 防 Windows 主控台 cp950 編碼噴錯
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def main():
    print("[AutoFlow Stage 1] 啟動 BP 現場指揮官派工流程...")
    
    prompt = """你是 AutoFlow v2.6.3 體系的現場指揮官 Big Pickle (BP)。
請讀取專案內的藍圖文檔：
- reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md
- reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html (樣品參考)

你的任務是：為第一階段「首批三大核心教具元件落地」制定詳細的原子施做計畫書，並將完整報告寫入：
reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md

【文件必須遵循的規格】：
1. 必須以標準屬性表頭開始：
## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1：BP 細部施做計畫與清單
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE1_PLAN_20261106 -->

2. 內容架構：
- 一、工程架構與設計準則（採用原生 Web Components 自定義標籤，零外部依賴、純 SVG、無打包器直接可在瀏覽器執行）
- 二、任務卡詳細拆解（必須包含目標路徑、負責工兵、數值化 AC 驗收標準、狀態機、輸入屬性 Attributes 與事件 CustomEvent）：
  - T-01: app/components/ten-frame-grid.js (<ten-frame-grid>)
  - T-02: app/components/dual-track-diff.js (<dual-track-diff>)
  - T-03: app/components/balance-beam.js (<balance-beam>)
  - T-04: app/playground.html (獨立調試台：支援 390px/768px/960px 視窗切換、三元件實時參數控制面板、手感實時回饋)
- 三、施工順序與排程（依賴拓撲：T-01 -> T-02 -> T-03 -> T-04）
- 四、驗收閘門標準（零控制台報錯、三端無破版、無 CDN 網路依賴）

請直接呼叫工具建立並寫入 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md。
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    
    print(f"[AutoFlow Stage 1] 正在調用 OpenCode CLI (通道 1, 注入 stdin=DEVNULL)...")
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
        print(f"[AutoFlow Stage 1] 執行完畢，耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
        if proc.stdout:
            print("--- OpenCode STDOUT (前 30 行) ---")
            lines = proc.stdout.splitlines()
            for line in lines[:30]:
                print(line)
        if proc.returncode != 0:
            print(f"[ERROR] OpenCode 返回非 0 狀態碼: {proc.returncode}")
            if proc.stderr:
                print("--- OpenCode STDERR ---")
                print(proc.stderr[:1000])
            sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print("[ERROR] OpenCode 執行超時 (180s 熔斷)！")
        sys.exit(43)
    except Exception as e:
        print(f"[ERROR] 執行異常: {e}")
        sys.exit(1)

    print("[AutoFlow Stage 1] 成功！請檢查 reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md 是否已生成。")

if __name__ == "__main__":
    main()
