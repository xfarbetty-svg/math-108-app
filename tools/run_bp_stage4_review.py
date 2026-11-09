# -*- coding: utf-8 -*-
"""
tools/run_bp_stage4_review.py
AutoFlow Stage 4: 由 BP (Big Pickle) 現場指揮官調用本地 OpenCode CLI (通道 1)
針對 R3_WORKER_BUILD_REPORT.md 的 D-01~D-13 偏離項與 TCK-09 矛盾工單進行獨立盲審裁決，
並落盤產出 reports/20261105_2035_g1_visual_spec/R4_BP_INITIAL_REPORT.md。
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
    print("[AutoFlow Stage 4] 啟動 BP 現場指揮官盲審與初驗流程...")

    prompt = """你是 AutoFlow v2.6.4 體系的現場指揮官 Big Pickle (BP)。
請仔細讀取並審查以下專案文件與驗收鐵證：
1. reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md
2. reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md (含附錄 R1.1)
3. reports/20261105_2035_g1_visual_spec/R3_WORKER_BUILD_REPORT.md (工兵交付報告)
4. 現有程式碼與測試：
   - app/components/ten-frame-grid.js
   - app/components/dual-track-diff.js
   - app/components/balance-beam.js
   - app/playground.html
   - 閘門執行結果：node tools/ac_gate.js 已達 GATE_GREEN (12 checks, 0 failed, Exit 0)

你的任務是完成【Stage 4: BP 施工初驗與裁決總結報告】，並將報告直接寫入：
reports/20261105_2035_g1_visual_spec/R4_BP_INITIAL_REPORT.md

【報告必須遵循的標準格式】：
1. 必須以標準屬性表頭開始：
## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 4：BP 施工初驗與裁決總結報告
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE4_REVIEW_20261109 -->

2. 核心章節架構：
- 一、初驗總結與閘門現況覆核（覆核 node tools/ac_gate.js 12項全綠、代碼總體積 30,279 B <= 30KB 上限）。
- 二、TCK-09 矛盾工單正式裁決（44px 熱區 vs 兩盒並排不重疊）：
  從三方案中給出明確裁決理由：
  方案 (A) 接受 33px 熱區並修改 AC-01-4；
  方案 (B) 390px 改上下堆疊換回 44px；
  方案 (C) 放寬不得重疊。
- 三、D-01 ~ D-13 偏離報告逐項裁決表（13項逐一標註 ACCEPTED / REJECTED，並列出技術理由）：
  重點涵蓋 D-01(33px熱區), D-07(天平吊盤鉛垂修正), D-09(日誌節流120ms), D-11(廢棄衝突腳本), D-12(移除滿十角標以符合體積), D-13(保留調試鉤子)。
- 四、三端自適應與算理閉環評定（十格陣雙盒並排湊十拋物線、雙軌差值金框、力矩天平平衡收斂）。
- 五、放行判定（PASS 放行進入 Stage 5 AGY 總驗收與 PR 交付 / FAIL 需重工）。

請直接呼叫工具建立並寫入 reports/20261105_2035_g1_visual_spec/R4_BP_INITIAL_REPORT.md，保持嚴謹、客觀且具備工程實證！
"""

    start_t = time.time()
    cmd = ["opencode", "run", prompt, "--auto"]

    print("[AutoFlow Stage 4] 正在調用 OpenCode CLI (通道 1, 注入 stdin=DEVNULL)...")
    try:
        proc = subprocess.run(
            cmd,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            shell=True,
            encoding="utf-8",
            errors="replace",
            timeout=300
        )
        elapsed = time.time() - start_t
        print(f"[AutoFlow Stage 4] 執行完畢，耗時: {elapsed:.2f}s, Exit Code: {proc.returncode}")
        if proc.stdout:
            print("--- Output Tail ---")
            lines = proc.stdout.splitlines()
            for line in lines[-30:]:
                print(line)
        if proc.stderr:
            err_lines = [l for l in proc.stderr.splitlines() if l.strip()]
            if err_lines:
                print("--- Stderr Tail ---")
                for line in err_lines[-10:]:
                    print(line)
        sys.exit(proc.returncode)
    except subprocess.TimeoutExpired:
        print("[AutoFlow Stage 4 ERROR] 執行超時 (300s 熔斷)！", file=sys.stderr)
        sys.exit(43)
    except Exception as exc:
        print(f"[AutoFlow Stage 4 ERROR] 異常: {exc}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
