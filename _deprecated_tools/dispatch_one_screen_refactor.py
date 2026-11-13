# -*- coding: utf-8 -*-
"""tools/dispatch_one_screen_refactor.py
派工工兵執行手機端 One-Screen 緊湊重構與小鳥向量重繪任務。
通道順位：通道一（本地 OpenCode CLI + google/gemini-2.5-flash）。
"""
import os
import shutil
import subprocess
import sys
import time

TASK_CARD = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請針對下列三個檔案進行精確重構，達成手機端（390px）「One-Screen 單屏完全容納、免滑動、極致精緻」的驗收標準：

【待修改檔案 1】：`app/index.html`
【待修改檔案 2】：`app/shell.js`
【待修改檔案 3】：`app/components/birds_on_tree_demo.html`

--------------------------------------------------------------------------------
【任務要求 A】：`app/index.html` 與 `app/shell.js` 手機端 One-Screen 緊湊重構
1. 手機端媒體查詢優化（@media (max-width: 699px)）：
   - 在測驗舞台（#stageView 顯示時）：
     - 將頂部 #stageView 內的 `.stage-head` 壓縮為 36px 超窄單行（align-items: center; justify-content: space-between; margin-bottom: 4px;）。
     - `.btn-back` 壓小（padding: 3px 8px; font-size: 12px; border-radius: 999px;）。
     - `.progress-box` 改為水平單行展示（display: flex; align-items: baseline; gap: 6px;），progress-num 13px，progress-source 10px。
     - `.dots` 圓點縮小至 6px 寬高，間距 4px，margin-bottom: 4px。
     - `.stage-title`（題目大標題）在手機端（< 700px）設為 `display: none;`！因為 iframe 內部已有題幹，消除外層重複大標題省下 30px 高度。
     - `main` 在手機端 padding: 6px 8px 10px;。
     - `.stage-nav` 底部按鈕群：縮小高度至 min-height: 40px; margin-top: 6px; 按鈕文字 13px。
2. `app/shell.js` 聯動調整：
   - 在 renderQuestion() 中，計算 fallback 高度：手機端（window.innerWidth < 700）初始 fallback_height 設為 480px（比原先 360/900 更貼合一屏），隨後透過 fitFrame 自適應收縮。
   - 確保不會產生不必要的垂直捲動。

--------------------------------------------------------------------------------
【任務要求 B】：`app/components/birds_on_tree_demo.html` 扁平化與小鳥純向量重繪（徹底消除金魚感）
1. 寬扁 viewBox 與高度收斂：
   - 將 `<svg id="treeSvg">` 的 viewBox 改為 `viewBox="0 0 500 180"`（高寬比 1:2.77，寬扁平整）。
   - `.tree-stage` 的 max-width 設為 480px，高度鎖定在 175px 左右。
   - 橫向樹枝穿過畫面：重繪一根從左側主幹延伸到右側的自然樹幹與分支（棕色樹枝帶橫向延展分叉，頂部點綴蓬鬆翠綠樹冠），讓小鳥自然棲息。
2. 小鳥純向量造型重繪（birdMarkup 徹底重寫，具備明確小鳥生物特徵，嚴禁橢圓加魚尾）：
   - 亮黃尖鳥喙：朝左的小三角硬喙（polygon 或 path），尖端分明。
   - 圓潤鳥頭與大眼：圓圓的小鳥頭部，帶黑色靈動圓眼與白色高光眼點。
   - 豐滿圓胸腹：飽滿圓弧的胸膛與腹部（圓潤可愛）。
   - 層次立體羽翼：背上側面的小翅膀，羽翼微向上揚起，有層次羽紋。
   - 向上翹起的尾羽：小巧翹起的燕尾/扇尾羽毛（向上翹 20~30 度，絕非水平魚鰭尾）。
   - 抓枝小爪爪：小鳥腹部下方有細緻的抓枝小爪（爪子貼合樹枝）。
   - 原住 6 隻鳥位置（ORIG_POS）與飛入 3 隻鳥位置（NEW_POS）座標全部適配 500x180 的新座標系，穩穩站在橫向樹枝與樹冠上。
3. 單屏排版緊湊收縮（One-Screen 設計）：
   - body padding: 6px; background: #f0fdf4;
   - .container padding: 10px 12px; max-width: 480px; border-radius: 12px;
   - .meta-row margin-bottom: 2px;
   - .stem font-size: 14.5px; font-weight: 700; margin-bottom: 6px; line-height: 1.35;
   - .tree-stage margin-bottom: 6px;
   - .count-strip 頂部浮水印（font-size: 11px; padding: 2px 8px; border-radius: 6px;）
   - .action-row margin-bottom: 6px; 按鈕 min-height: 36px; padding: 6px 14px; font-size: 13px;
   - .equation-strip min-height: 1.2em; font-size: 13.5px; margin-bottom: 6px;
   - .opt-group gap: 6px; margin-bottom: 6px;
   - .opt-btn min-height: 36px; padding: 6px 12px; font-size: 13px; border-radius: 8px;
   - .footer-action margin-top: 6px;
   - .check-btn min-height: 38px; padding: 6px 28px; font-size: 14px;
   - .result-banner margin-top: 6px; padding: 8px; font-size: 13px;
   - 保持所有功能（飛入動畫、點擊數鳥顯示號碼徽章、破招算式展示、四選項單選與檢查判定）100% 完整無損。

請直接修改上述 3 個檔案，確保語法純淨、完全無錯。
"""

def main():
    print("[AGY 監工] 啟動派工任務：手機端 One-Screen 緊湊重構與小鳥向量重繪")
    cmd_path = shutil.which("opencode")
    if not cmd_path:
        print("[ERROR] 找不到 opencode 可執行檔")
        sys.exit(1)

    prompt_file = "tools/temp_onescreen_prompt.txt"
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(TASK_CARD)

    cmd = [cmd_path, "run", "-m", "google/gemini-2.5-flash", "--auto", "--file", prompt_file, "請依照附加檔案中的任務卡規格施工！"]
    print(f"[AGY 監工] 調派通道一 (OpenCode + gemini-2.5-flash) 施工中...")
    start_t = time.time()
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True)
    cost = time.time() - start_t
    print(f"[AGY 監工] 施工完成，耗時 {cost:.1f} 秒，Exit Code: {res.returncode}")
    if res.stdout:
        print("--- STDOUT (前 15 行) ---")
        lines = res.stdout.strip().splitlines()
        for line in lines[:15]:
            print(line)
    if res.stderr:
        print("--- STDERR (前 10 行) ---")
        lines = res.stderr.strip().splitlines()
        for line in lines[:10]:
            print(line)

    if os.path.exists(prompt_file):
        os.remove(prompt_file)

    if res.returncode != 0:
        print("[ERROR] 工兵施工失敗！")
        sys.exit(1)
    print("[SUCCESS] 工兵施工完工，準備進行嚴格監工驗收！")

if __name__ == "__main__":
    main()
