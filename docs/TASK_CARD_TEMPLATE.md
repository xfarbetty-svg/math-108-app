# 028-1 施工工單標準模板 (Task Card Specification)

> 適用專案：`028-1_國小數學APP`  
> 派工指令：`python tools/dispatch_worker.py --file task_card.md "任務簡述"`  
> 派工者：決策架構師 AGY  
> 施工者：通道一 (本地 OpenCode CLI / GLM-free) 或 通道二 (A-SERVER SSH 備援)

---

## 🎯 工單目標與單元基本資訊
- **單元課綱代碼**：[例如：G3-N-3-10]
- **單元名稱**：[例如：一位小數]
- **年級**：[例如：3]
- **題數**：[例如：8 題（誠實填寫實際檢索合格題數，嚴禁湊數）]
- **指定施工通道**：[通道一 本地 OpenCode CLI / 通道二 A-SERVER SSH]
- **通道憑證與連線狀態**：[通道一 Exit 0 / 通道二 SSH 4.2s Exit 0]

---

## 🚨 鐵律與紅線約束（工兵與監工共同遵守）
1. **嚴禁閹割題幹**：題幹文字必須與下方「考卷原始文字 (Raw Verbatim)」100% 語意一致，一個算式不少、核心條件一個不缺。
2. **嚴禁一題多拆**：一道大題若包含多個子步驟或連續推導，必須完整包裝為單一題目，嚴禁拆成 2~3 道弱智題充數。
3. **無合適真題時直球回報**：若庫存試卷中無合適真題，必須直接向人類申報並商討，嚴禁自編死板水題或削足適履。
4. **教具純靜態與 One-Screen 單屏緊湊**：
   - 視口 360px~390px 100% 入屏，零橫向溢出（`overflow-x: hidden`）。
   - 教具高度嚴格 $\le 420\text{px}$，`body` 與外層嚴禁 `height: 100vh`。
   - 教具內部嚴禁自建提交/檢查答案按鈕，未作答前嚴禁在 DOM 渲染任何解析文字。

---

## 📚 題庫真題規格（每題必須一對一提供 Verbatim 原文）

### 題目 Q01: [題目名稱/核心考點]
- **實體考卷 PDF**：`EXAM REAL/G3/[考卷完整檔名].pdf`
- **試卷位置**：第 [X] 頁，第 [Y] 大題第 [Z] 小題
- **考卷原始文字 (Raw Verbatim，一字不差引用)**：
  > [在此貼上 PDF 試卷文字原始段落，包含所有算式與符號，如：(2) 20÷5＝4 4×5＝□ 20÷▲＝4 4×▲＝□ ...]
- **轉換後題幹 (stem)**：[保持試卷原始提問與語境]
- **選項組 (choices)**：["選項 A", "選項 B", "選項 C", "選項 D"]
- **正解索引 (answer_index)**：[0~3]
- **正解文字 (answer_raw)**：[如：100]
- **教具視覺模式 (visual_mode)**：[如：balance_scale / decimal_ruler]
- **算理解析 (explanation)**：
  - `concept`：[核心算理一句話]
  - `steps`：[步驟一, 步驟二, 步驟三]
  - `trap`：[學生常見迷思陷阱]

*(其餘題目 Q02 ~ Qxx 依此類推)*

---

## 📦 產出檔案清單
1. 題庫資料 SSOT：`data/units/G[X]/[UnitCode].json`
2. 教具獨立元件：`app/components/[lab_name].html`
3. 靜態契約守門員：`tools/verify_[unit_code_lower].js`
4. CDP 動態測量守門員：`tools/verify_[unit_code_lower]_cdp.js`

---

## ✅ AC 驗收標準清單（只認 Exit Code 0）
- [ ] `node tools/verify_[unit_code_lower].js` 退出碼 Exit Code 0。
- [ ] `node tools/verify_[unit_code_lower]_cdp.js` 實機 390px 測量高度 $\le 420\text{px}$、零控制台報錯、Exit Code 0。
- [ ] `node tools/verify_curriculum_131.js` 課綱大廳總檢 Exit Code 0。
- [ ] 題幹比對：題庫 JSON 題幹與實體試卷 Raw Verbatim 100% 吻合，無拆題、無閹割。
