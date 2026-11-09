# -*- coding: utf-8 -*-
"""
tools/run_bp_stage1_s11.py
AutoFlow Stage 1 派工腳本：調用本地 OpenCode CLI (通道 1，成本 $0)
由 BP (Big Pickle) 現場指揮官拆解 S-1-1 幾何形體旋轉投影儀任務卡並落盤 R1_BP_EXECUTION_PLAN.md
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
    print("[AutoFlow Stage 1] 啟動 BP 現場指揮官派工流程 (S-1-1 幾何形體)...")
    
    prompt = """你是 AutoFlow v2.6.3 體系的現場指揮官 Big Pickle (BP)。
請讀取專案內的藍圖文檔：
- reports/20261109_2225_g1_s11_spec/R0_AGY_BLUEPRINT.md
- reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html (樣品 06 S-1-1 幾何形體旋轉投影儀)

你的任務是：為「S-1-1 幾何形體旋轉投影儀 <isometric-rotator> 落地」制定詳細的原子施做計畫書，並將完整報告寫入：
reports/20261109_2225_g1_s11_spec/R1_BP_EXECUTION_PLAN.md

【文件必須遵循的規格】：
1. 必須以標準屬性表頭開始：
## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261109_2225_g1_s11_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1：BP 細部施做計畫與清單
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE1_PLAN_S11_20261109 -->

2. 內容架構：
- 一、藍圖對齊與邊界審查：核對 AC-05-1 ~ AC-05-4，確認單檔體積限制 <= 12,288 B 與三端自適應。
- 二、幾何與旋轉演算法細節：
  - 正方形旋轉：中心軸心 (-45, -45) 至 (45, 45)，頂點旋轉公式與直角記號 (12x12px 折線) 同步變換。
  - 長方形、三角形、圓形之參數與邊角標註。
  - 圓柱 3D 到 2D 拓印展開：側面長方形展開動畫與底面圓形翻轉幾何。
- 三、工兵施工任務卡 T-05 分步清單：
  - Step 1: 原生 Web Component 骨架與 Shadow DOM (app/components/isometric-rotator.js)
  - Step 2: 旋轉與標註邏輯 (rotate, feature invariance)
  - Step 3: 圓柱拓印展開動畫
  - Step 4: 驗收頁面 (tests/ac_isometric_rotator.html) 與 CDP 探針腳本 (tests/ac_unit_s11.js)
- 四、驗收硬閘門指標清單 (G-1 ~ G-8)。

【執行鐵律】：
請不要向我提問、不要等待確認，請立刻調用寫檔工具直接建立並完整寫入：
reports/20261109_2225_g1_s11_spec/R1_BP_EXECUTION_PLAN.md
落盤完成後簡要回報路徑與 byte 數即可。
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]
    
    print("[AutoFlow Stage 1] 正在調用 OpenCode CLI (通道 1, 注入 stdin=DEVNULL)...")
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
                print(proc.stderr[:500])
            sys.exit(proc.returncode)
    except Exception as e:
        print(f"調用 OpenCode 發生異常: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
