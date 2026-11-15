# 任務卡：Step 1 - 建立 G2 全局規範樣板與 CDP 驗證骨架

## 任務目標
建立國小數學 APP 二年級 (G2) 概念探索實驗室的「黃金標準樣板」與「專屬 CDP 自動化驗證腳本」。

## 背景與技術約定
1. **日系繪本純前端美學**：
   - 溫潤柔和配色 (`--bg: #fff9f0`, `--card: #ffffff`, `--mint: #7bc9b2`, `--coral: #ff8a65`, `--lemon: #ffd166`)。
   - 純 SVG + CSS，禁止外部龐大 3D 庫。
2. **三端自適應與單屏緊湊防抖**：
   - 手機視口 390px 寬度 100% 入屏，零橫向溢出 (`overflow-x: hidden`)。
   - 教具高度嚴格限制 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$，保證一屏入眼免滾動。
3. **四幕式標準探索結構 (Four Acts)**：
   - Act 1: 觀念大解剖 (具象化觀察)
   - Act 2: 物理探索器 (觸控拖曳/互動操作)
   - Act 3: 規律大發現 (數學抽象與連結)
   - Act 4: 小小挑戰賽 (互動即時驗證)
4. **全站音訊標準 (Audio Policy)**：
   - 強制引入 `<script src="../js/audio_manager.js"></script>`。
   - 所有朗讀行為一律呼叫 `window.AudioManager.play(text, { onStart, onEnd, onError })`。
   - 嚴禁直接呼叫原生 `window.speechSynthesis`。

## 待產出檔案

### 檔案 1：`app/components/g2_template_lab.html`
- 完整的 HTML5 標準結構，包含乾淨的 CSS 變數。
- 頂部導航列：標題、語音朗讀按鈕 (🔊)、重置按鈕 (🔄)。
- 四幕導航列 (`.act-btn`)：Act 1 ~ Act 4。
- 四個 `.act-panel`（預設 Act 1 顯示，其餘隱藏）。
- 底部狀態列 / 提示氣泡。
- JS 邏輯：
  - 切換幕次函數 `switchAct(idx)`
  - 語音朗讀支援：呼叫 `window.AudioManager.play(...)`，附帶若 AudioManager 未載入時的降級防護。
  - 具備單元自我驗證狀態。

### 檔案 2：`tools/verify_g2_concept_labs.js`
- 參考 `tools/verify_g3_remaining_concepts.js` 架構。
- 純 Node.js 內建模組 (`http`, `child_process`, `fs`, `path`)，透過 Chrome DevTools Protocol (CDP) WebSocket 連接 Chrome/Edge。
- 支援命令行參數 `--unit <filename_or_code>`（若未指定則掃描 `app/components/` 下所有 `g2_*.html`）。
- 驗證核心指標：
  1. **390px 視口零橫溢**：`document.documentElement.scrollWidth <= 390`。
  2. **Console 0 報錯**：捕獲 `Runtime.consoleAPICalled` (error) 與 `Runtime.exceptionThrown`，計數必須為 0。
  3. **四幕切換有效性**：依序點擊 4 個 `.act-btn`，驗證對應 panel 確實切換 `active` 狀態。
  4. **音訊接口完備**：評估 `typeof window.AudioManager === 'object'`。
- 驗證通過輸出 `[PASS]` 並以 `process.exit(0)` 退出；任何異常報錯輸出 `[FAIL]` 並以 `process.exit(1)` 退出。

## 驗收指令
```bash
node tools/verify_g2_concept_labs.js --unit g2_template_lab.html
```
Exit code 必須為 0！
