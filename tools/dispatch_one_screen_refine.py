# -*- coding: utf-8 -*-
"""tools/dispatch_one_screen_refine.py
工兵二度微調：
1. 修正 app/shell.js 的 fitFrame 邏輯：精準取 .container 的 scrollHeight，防止 iframe 被撐到 860px。切換題目時自動 scrollTo(0, 0)。
2. 修正 app/components/birds_on_tree_demo.html 的 treeLayer 與 ORIG_POS/NEW_POS：將樹枝與小鳥整體下移 30px，居中適配 500x180，杜絕小鳥頭部出界。
3. 確保 390px 手機實機高度完全收斂在 550px 內，達到真正的 One-Screen 奇蹟。
"""
import os
import shutil
import subprocess
import sys
import time

TASK_CARD = """你現在是國小數學 APP 的前線施工工兵（通道一：本地 OpenCode CLI）。
請針對下列兩個檔案進行極致精準的微調修復：

【待修改檔案 1】：`app/shell.js`
1. 修改 `fitFrame(frame, q)` 函式：
   - 目前使用的 `Math.max(doc.documentElement.scrollHeight, ...)` 導致 iframe 高度鎖死在 860px 縮不回來。
   - 請改為抓取 `doc.querySelector('.container') || doc.body` 的真實高度：
     ```javascript
     function fitFrame(frame, q) {
       try {
         const doc = frame.contentDocument;
         if (!doc) return;
         const container = doc.querySelector('.container') || doc.body;
         if (!container) return;
         const h = Math.ceil(container.getBoundingClientRect().height || container.scrollHeight);
         if (h > 100) frame.style.height = (h + 8) + "px";
       } catch (_e) {
         /* file:// 同源限制 → 保持 fallback */
       }
     }
     ```
2. 在 `renderQuestion()` 開頭加上 `window.scrollTo(0, 0);`，確保切換題目時視窗不會錯位捲動。

--------------------------------------------------------------------------------
【待修改檔案 2】：`app/components/birds_on_tree_demo.html`
1. 修正 SVG 內樹木與小鳥的垂直居中座標（目前太靠頂部，小鳥頭部甚至跑到 viewBox 外）：
   - 在 viewBox="0 0 500 180" 範圍內：
     - 主樹幹與橫向樹枝整體向下平移 25~30px（橫向樹枝中心線約在 y=95~105 之間）。
     - 樹冠圓形圓心 cy 移至 65~75，半徑維持 30~45，頂部 y 保持在 25 以上，絕不切到頂部。
     - 小鳥 6 隻原住鳥座標（ORIG_POS）移至橫向樹枝上（y 座標約在 85~105 之間）：
       ```javascript
       const ORIG_POS = [
           { x: 90, y: 92 }, { x: 150, y: 78 }, { x: 205, y: 98 },
           { x: 260, y: 82 }, { x: 315, y: 94 }, { x: 370, y: 88 }
       ];
       ```
     - 飛入的 3 隻鳥（NEW_POS）落點也適配至橫枝右側與下方（y 座標在 85~110 之間）：
       ```javascript
       const NEW_POS = [
           { x: 230, y: 110 }, { x: 285, y: 112 }, { x: 410, y: 96 }
       ];
       ```
     - 飛入動畫起始點 `flyIn()`：起始位置設為 `translate(${pos.x}px, 210px) scale(0.4)`，平滑飛升至樹枝上。
   - 底部可加一道細緻地面草地光暈或草坡，增加森林立體層次。

請直接修改上述 2 個檔案，嚴格確保語法正確、無多餘空白。
"""

def main():
    print("[AGY 監工] 調派通道一 (OpenCode + gemini-2.5-flash) 執行居中與高度精準收斂...")
    cmd_path = shutil.which("opencode")
    if not cmd_path:
        sys.exit(1)

    prompt_file = "tools/temp_refine_prompt.txt"
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write(TASK_CARD)

    cmd = [cmd_path, "run", "-m", "google/gemini-2.5-flash", "--auto", "--file", prompt_file, "請依照附加檔案修復兩檔！"]
    res = subprocess.run(cmd, stdin=subprocess.DEVNULL, capture_output=True, text=True)
    if os.path.exists(prompt_file):
        os.remove(prompt_file)

    print("工兵退出碼:", res.returncode)
    sys.exit(0)

if __name__ == "__main__":
    main()
