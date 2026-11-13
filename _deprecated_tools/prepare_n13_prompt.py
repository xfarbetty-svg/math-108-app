# -*- coding: utf-8 -*-
import json
import os

with open('data/curriculum_v3/g1_n13_make_ten.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_str = json.dumps(questions, ensure_ascii=False, indent=2)

prompt_parts = [
    "你現在是國小數學 APP 施工工兵（通道一：本地 OpenCode CLI）。",
    "請直接編輯或重寫專案中的 `app/unit_n13.html`，打造最高規格、童趣清晰且完全離線可執行的「N-1-3 湊十法與拆十法（12題段考真題）」正式單元互動測驗頁。\n",
    "【資料來源】：",
    "請將以下 12 題段考真題資料完整內嵌到 `app/unit_n13.html` 的 `<script>` 區塊作為預設數據（變數名 `const EMBEDDED_QUESTIONS = ...`），同時在 fetch 失敗時自動降級使用內嵌數據，確保在任何瀏覽器直接雙擊以 file:// 打開時 100% 正常載入，絕不出現「載入中...」死卡！",
    "資料內容如下：\n",
    q_str,
    "\n【視覺與交互硬規格要求】：",
    "1. 頂部狀態列（< 40px）：",
    "   - 左側：單元標籤「N-1-3 湊十法與拆十法」。",
    "   - 中間/右側：12 顆圓點進度條（可點擊快速跳題，當前題高亮藍色，已答題綠色）。",
    "2. 左欄（題幹與教具舞臺）：",
    "   - 題幹卡片：清晰題號（第 N / 12 題）、幽靈字題源（如「114學年內湖段考真題」）、加大字體題幹（16~18px）。",
    "   - 教具舞臺：放置兩個 `<ten-frame-grid>`（左盒 id=\"frameLeft\"，右盒 id=\"frameRight\"）。",
    "   - 動態演示按鈕：",
    "     - 若為加法（add）：提供「▶ 演示湊十飛補」按鈕，觸發右盒飛補至左盒、左盒滿十金色光暈、右盒扣減。",
    "     - 若為減法（subtract）：提供「▶ 演示破十拆十」按鈕，呼叫左盒的 `takeAway(count, callback)` 播放 800ms 慢節奏呼吸淡出割捨動態，演繹 10 扣除後再與個位合體之算理！",
    "3. 右欄（選項與算理破招詳解）：",
    "   - 2x2 拇指大按鈕（選項）：文字清楚，點選後鎖定並立即顯示正確（綠色）與錯誤（紅色）反饋。",
    "   - 抽屜式詳解（答題後自動滑出展開）：",
    "     - 💡 破招算理分解：包含 Step 1、Step 2、Step 3（粗體突顯）。",
    "     - 算式標籤（如 9 + 4 = 13 或 14 - 6 = 8）。",
    "     - ⚠️ 常見思維陷阱提示。",
    "   - 導航控制列：包含「⬅ 上一題」與「下一題 ➔」按鈕。",
    "4. 響應式佈局：",
    "   - 手機 390px：單手垂直流，兩盒並排適配不破版（支援 360px 窄螢幕）。",
    "   - 平板 768px 與電腦 960px：左右雙欄自適應。",
    "5. 零外部依賴：",
    "   - 嚴禁外部 CDN（僅引用本機 `components/ten-frame-grid.js`）。",
    "   - 控制台 Console 零報錯。\n",
    "請立即施工並覆寫 `app/unit_n13.html`，完成後輸出確認訊息。"
]

os.makedirs('_scratch', exist_ok=True)
with open('_scratch/n13_worker_prompt.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(prompt_parts))

print("Prompt successfully generated in _scratch/n13_worker_prompt.txt")
