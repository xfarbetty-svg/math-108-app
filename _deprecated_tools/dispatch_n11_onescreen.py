# -*- coding: utf-8 -*-
"""tools/dispatch_n11_onescreen.py
派工工兵執行 N-1-1 單元 4 題的手機端 One-Screen 緊湊重構：
1. fish_tank_demo.html: 3 個魚缸在手機端保持橫向並列（repeat(3, 1fr)），魚缸高度精巧壓縮，杜絕垂直堆疊成 1117px！
2. pencil_desk_demo.html: 課桌 SVG 扁平化，縮減 padding 與按鈕高度。
3. party_pairing_demo.html: 派對帽與蛋糕高度縮減，適配寬扁 viewBox。
4. fruit_line_demo.html: 水果展架寬扁化，按鈕與算理解析緊湊化。
"""
import os
import shutil
import subprocess
import sys
import time

TASK_CARD = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請針對 `app/components/` 目錄下的 N-1-1 單元 4 個教具 HTML 進行手機端（390px）「One-Screen 單屏完全容納、免滑動」的標準化收斂：

【One-Screen 統一規格標準（黃金公式）】：
1. 容器與邊距收斂：
   - body { padding: 4px 6px; }
   - .container { max-width: 480px; padding: 8px 12px; border-radius: 12px; }
   - .meta-row { margin-bottom: 2px; }
   - .stem { font-size: 14.5px; font-weight: 700; line-height: 1.35; margin-bottom: 6px; }
2. 教具舞台高度限制：
   - 所有教具 stage（如桌子、魚缸、展架）高度鎖定在 150px~175px 內，margin-bottom: 6px。
   - SVG viewBox 寬扁化（例如 500x170 或 480x160），高寬比 ≤ 1:2.5。
3. 操作與按鈕緊湊化：
   - .action-row 或控制列：margin-bottom: 6px;
   - 按鈕 min-height: 36px; padding: 6px 12px; font-size: 13px;
   - 選項按鈕 (.opt-btn)：min-height: 36px; padding: 6px 12px; font-size: 13px; gap: 6px;
   - 檢查按鈕 (.check-btn)：min-height: 38px; padding: 6px 28px; font-size: 14px;
   - 算理/提示/結果橫條：min-height: 1.2em; font-size: 13px; margin: 6px 0; padding: 6px 8px;

--------------------------------------------------------------------------------
【待修改檔案 1】：`app/components/fish_tank_demo.html`
- 痛點：目前在手機端被 `@media (max-width: 640px) { .tanks-grid { grid-template-columns: 1fr; } }` 垂直堆疊成 3 層，高度飆到 1117px！
- 修復：
  - 手機端 .tanks-grid 一律維持 3 欄並列：`grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 6px;`。
  - 每個 .tank-card 緊湊：padding: 6px 4px; border-radius: 10px;
  - 魚缸 SVG viewBox="0 0 140 100"（高度約 80px~90px），小魚與水波小巧靈活。
  - 標籤與按鈕緊湊，使整體 container 高度收斂至 440px 左右！

【待修改檔案 2】：`app/components/pencil_desk_demo.html`
- 痛點：目前高度 844px，加上外框後爆屏 92px。
- 修復：
  - 課桌 desk-stage 高度鎖定 160px，viewBox 寬扁化，鉛筆等比縮小。
  - 4 個關卡切換按鈕縮小（min-height: 30px, font-size: 12px, padding: 4px 8px）。
  - container padding 縮為 8px 12px，總高度收斂至 480px 左右。

【待修改檔案 3】：`app/components/party_pairing_demo.html`
- 痛點：目前高度 844px，加上外框後爆屏 92px。
- 修復：
  - 派對舞台高度鎖定 165px（小朋友、派對帽與蛋糕垂直間距壓縮）。
  - 連線與按鈕精簡，margin 縮為 6px。
  - container padding 縮為 8px 12px，總高度收斂至 480px 左右。

【待修改檔案 4】：`app/components/fruit_line_demo.html`
- 痛點：目前高度 844px，加上外框後爆屏 92px。
- 修復：
  - 水果展架 stage 高度鎖定 150px（10 顆水果在橫向木架上展開）。
  - 水果點擊與圈選套索動畫保持無損。
  - 關卡按鈕、選項與檢查按鈕按黃金公式緊湊化，總高度收斂至 480px 左右。

請修改上述 4 個檔案，嚴格確保所有功能（互動、點擊、判定、破招）100% 完整無損。
"""

def main():
    print("[AGY 監工] 調派通道一 (OpenCode + gemini-2.5-flash) 執行 N-1-1 4 題 One-Screen 緊湊重構...")
    cmd_path = shutil.which("opencode")
    if not cmd_path:
        sys.exit(1)

    prompt_file = "tools/temp_n11_prompt.txt"
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(TASK_CARD)

    cmd = [cmd_path, "run", "-m", "google/gemini-2.5-flash-lite", "--auto", "--file", prompt_file, "請依照附加檔案修復 N-1-1 4 個教具 HTML！"]
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True)
    if os.path.exists(prompt_file):
        os.remove(prompt_file)

    print("工兵退出碼:", res.returncode)
    sys.exit(0)

if __name__ == "__main__":
    main()
