# 028-1 施工工單：修復 G3-N-3-6 Q09 真題還原與教具去暴雷

> 適用專案：`028-1_國小數學APP`  
> 派工指令：`python tools/dispatch_worker.py --file reports/task_cards/T_FIX_N36_Q09.md "修復 G3-N-3-6 Q09 真題還原與教具去暴雷"`  
> 派工者：決策架構師 AGY  
> 施工者：通道一 (本地 OpenCode CLI / GLM-free) 或 通道二 (A-SERVER SSH 備援)

---

## 🎯 工單目標與單元基本資訊
- **單元課綱代碼**：G3-N-3-6
- **單元名稱**：解題（乘除應用問題）
- **年級**：3
- **目標題號**：Q09 (G3-N-3-6-Q09)
- **指定施工通道**：通道一 (本地 OpenCode CLI)

---

## 🚨 鐵律與紅線約束
1. **真題還原 100% Verbatim**：題幹嚴格還原為臺北市內湖國小 112-2 期末實體段考試卷原文，一字不差、四個算式完整呈現，求「□ × ▲」答案（正解 100）。嚴禁閹割成找碴題！
2. **教具去暴雷**：教具在使用者點擊「一步一步看算理」或提交前，**嚴禁**在畫面渲染「被除數都是 20，商也都是 4」、「兩座天平完全平衡！」等提前洩漏答案與算理的文字。
3. **消除雙重檢查按鈕**：教具內部原本的 `<button class="check-btn" ...>檢查答案</button>` 與 App Shell 外層底欄中央檢查按鈕重複。請在教具中將該按鈕設為隱藏（`style="display:none"` 或移除 DOM 顯示），但保留 `window.checkAnswer` 函式供 Shell 代理點擊與呼叫。
4. **One-Screen 手機單屏**：390px 視口下內部高度嚴格 $\le 420\text{px}$，`body` 無 `100vh`。

---

## 📚 題目 Q09 真題規格（SSOT Verbatim）

### 題目 Q09: 四算式乘除互逆與未知數推導 (□ × ▲)
- **實體考卷 PDF**：`EXAM REAL/G3/臺北市內湖國小_112-2期末_G3_數學.pdf`
- **試卷位置**：第 1 頁，二、填一填 第 (2) 題
- **考卷原始文字 (Raw Verbatim，一字不差引用)**：
  > (2) 20÷5＝4  4×5＝□  20÷▲＝4  4×▲＝□
  > 上面 4 個算式中的□和▲中分別代表一個數。想想看，「□ × ▲」的答案是(     )。
- **轉換後題幹 (stem)**：
  ```
  已知算式：
  20 ÷ 5 ＝ 4
  4 × 5 ＝ □
  20 ÷ ▲ ＝ 4
  4 × ▲ ＝ □
  上面 4 個算式中的 □ 和 ▲ 分別代表一個數。想想看，「□ × ▲」的答案是多少？
  ```
- **出處設定**：
  - `exam_source`：`臺北市內湖國小 112-2 期末`
  - `section`：`二、填一填`
  - `question_num`：2
  - `title`：`四算式乘除互逆：符號推導與兩數相乘`
- **選項組 (choices)**：`["100", "20", "25", "80"]`
- **正解索引 (answer_index)**：0
- **正解文字 (answer_raw)**：`100`
- **視覺模式 (visual_mode)**：`balance`（保留原 key 以免影響映射）
- **最終揭示 (final_check)**：`□ × ▲ ＝ 20 × 5 ＝ 100`
- **算理解析 (explanation)**：
  - `concept`：`四個算式的乘除互逆與符號推導`
  - `steps`：[
      "由 4 × 5 ＝ □ 可以推得：□ ＝ 20",
      "由 20 ÷ ▲ ＝ 4（或 4 × ▲ ＝ 20）可以推得：▲ ＝ 20 ÷ 4 ＝ 5",
      "最後求「□ × ▲」的答案：20 × 5 ＝ 100"
    ]
  - `trap`：`容易只算出 □ ＝ 20 或 ▲ ＝ 5 就急著填答；題目要求的是「□ × ▲」，必須將兩者相乘：20 × 5 ＝ 100。`

---

## 🎨 教具 `app/components/multiplication_division_relation_lab.html` 修改細節

1. **同步更新內部的 `QUESTIONS` 陣列**：
   - 找到 `q === 9` 的物件，將 `stem`、`options`、`answer_index`、`final_reveal`、`explanations`、`feedback` 與 `data/units/G3/N-3-6.json` 保持 100% 一致。
   - `final_reveal` 更新為 `'□ × ▲ ＝ 20 × 5 ＝ 100'`。
2. **重構 `renderBalance()` 視覺繪製**：
   - 拔除提前暴雷文字「被除數都是 20，商也都是 4 / 兩座天平完全平衡！」。
   - 畫面佈局：
     - 上方 4 個卡匣並排/兩兩並排：`20÷5＝4`、`4×5＝□`、`20÷▲＝4`、`4×▲＝□`。
     - 下方顯示推導區：
       - `currentStep == 0`: 顯示 `□ ＝ ?`、`▲ ＝ ?`、`求 □ × ▲ ＝ ?`（無暴雷答案）。
       - `currentStep >= 1`: 高亮 `4 × 5 ＝ □`，顯示綠色徽章 `□ ＝ 20`。
       - `currentStep >= 2`: 高亮 `20 ÷ ▲ ＝ 4`，顯示珊瑚紅徽章 `▲ ＝ 5`。
       - `currentStep >= 3`: 揭示 `□ × ▲ ＝ 20 × 5 ＝ 100 ✓`。
3. **消除雙重按鈕**：
   - 將教具中的 `.check-btn` 設為 `display: none;`，使 iframe 內部不顯示重複的檢查按鈕。
   - 確保 `window.checkAnswer = checkAnswer;` 依然正常運作，當 outer shell 呼叫 `triggerCheckAnswer()` 時能正常判定。

---

## 🛡️ 守門員修改與驗收
1. 更新 `tools/verify_n36.js`：
   - Q9 數學真值驗算更新為：`ok(4 * 5 === 20 && 20 / 5 === 4 && 20 * 5 === 100, 'Q9 真題真值 □=20, ▲=5 → □×▲=100');`
   - `truths` 陣列中第 9 項更新為包含 `100`（如 `'□ × ▲ ＝ 20 × 5 ＝ 100'`）。
2. 執行驗證命令：
   - `node tools/verify_n36.js` (Exit Code 0)
   - `node tools/verify_n36_cdp.js` (Exit Code 0)
   - `node tools/verify_curriculum_131.js` (Exit Code 0)
   - `node tools/verify_app_shell.js` (Exit Code 0)

---

## 📦 交付檔案清單
1. `data/units/G3/N-3-6.json`
2. `app/components/multiplication_division_relation_lab.html`
3. `tools/verify_n36.js`
