# 任務卡：G3-N-3-2 加減直式計算日系擬物升級與掛載 (Visual-First 落地)

> 施工單位：通道一（本地 OpenCode CLI / Model: opencode/glm-5.3-flash-free）  
> 監工驗收：AGY 架構師（依據使用者指示：繼續推進下一單元 N-3-2）  
> 交付標準：`node tools/verify_n32.js`、`node tools/verify_curriculum_131.js`、`node tools/verify_app_shell.js` 全綠 Exit Code 0！

---

## 🎯 核心任務目標

### 任務一：升級 `app/components/vertical_calc_lab.html` 日系擬物視覺與防抖版面
- **配色與版面溫暖升級**：
  - 配色對齊日系繪本主題：`--bg: #fff9f0`、`--card: #ffffff`、`--coral: #ff8a65`、`--mint: #7bc9b2`、`--lemon: #ffd166`、`--sky: #7db8e8`、`--text-dark: #333`。
  - **消滅 100vh 與固定死寬度**：
    - `body { height: auto; min-height: auto; overflow-x: hidden; padding: 6px; }`
    - `#app { width: 100%; max-width: 100%; height: auto; min-height: auto; background: transparent; border: none; box-sizing: border-box; }`
- **直式計算 SVG 卡片化**：
  - `.calc-area` 包裹於圓角 `16px` 白色卡片中，帶有柔和陰影 `box-shadow: 0 6px 18px rgba(149,117,76,0.10);`。
  - 保留千、百、十、個位值引導虛線與進退位符號（`①` 珊瑚進位、紅斜線 `\` 劃掉退位借 10）。
  - 按鈕升級為日系圓角藥丸按鈕，點擊微回彈。
- **嚴格保留驗收契約識別碼**：
  - 類別/ID 必須包含：`calc-area`, `stepBtn` 或 `step-btn`, `options`, `checkAnswer` 或 `checkAnswer()`, `feedback`。

### 任務二：課綱真理同步 (`data/curriculum.json`)
- 將三年級 `N-3-2` 條目正式翻綠：
  - `"status": "ready"`
  - `"question_count": 10`
  - `"verified_source": "臺北市內湖國小 114-1/113-1/112-1 期中（直式進位加法/連續退位減法/情境應用題）"`

### 任務三：守門員條目同步 (`tools/verify_curriculum_131.js` & `tools/verify_n32.js`)
- 在 `tools/verify_curriculum_131.js` 的 `EXPECTED_READY_CODES` 加入 `'N-3-2'`（總數為 13 條）。
- 確保 `tools/verify_n32.js` 執行無誤（Exit Code 0）。

---

## 🛡️ 驗收流程
工兵完成代碼後，必須在終端執行並確保全部 PASS：
```bash
node tools/verify_curriculum_131.js
node tools/verify_n32.js
node tools/verify_app_shell.js
```
三者皆為 Exit Code 0，即刻向 AGY 回報完工。
