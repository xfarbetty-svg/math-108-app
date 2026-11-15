# FIX_PLAN: G3-N-3-13 角與角度 概念小教室落地計畫

> **規劃核心**：035 Key Pool (Gemini 2.5 Pro 大腦 $0 額度)  
> **施工通道**：通道一 (本地 OpenCode CLI / GLM-5.3-flash)  
> **審核驗收**：AGY 總監 (Playwright CDP 390px 實機測試 Exit Code 0)  
> **狀態**：[COMPLETED] 全流程通過雙硬閘門驗收 (Exit Code 0)  

---

## 🎯 施工清單 (Task Breakdown)

### Step 1: 建立 Concept Lab 元件 (`app/components/angle_concept_lab.html`)
- [x] 視口規格：390px 手機單屏極致緊湊（總高 ≤ 420px，`overflow: hidden`，零捲軸）
- [x] 4 幕活動導航膠囊 (Act 1 ~ Act 4)
- [x] 雙通道 Edge-TTS 台灣曉臻語音導讀整合
- [x] 日系莫蘭迪純向量 SVG 畫布 (viewBox 0 0 300 170)：
  - Act 1：兩紙條開合扇形（木釘頂點、藍橘雙邊、張角扇形）
  - Act 2：魔術三角板疊合找直角（半透明水藍壓克力三角板旋轉貼合）
  - Act 3：銳角/直角/鈍角三兄弟疊合比大小
  - Act 4：角度自由沙箱（動態張角 0°~150° + 邊長拉桿 45~95px 破除邊長迷思）
- [x] 底欄「🎯 挑戰真題測驗」按鈕（呼叫 `parent.switchToExamMode()`）

### Step 2: 建立機械化守門員驗收腳本 (`tools/verify_angle_concept.js`)
- [x] Playwright CDP 實機載入 `app/components/angle_concept_lab.html` (390x844 視口)
- [x] 驗證 `#app` 高度 ≤ 420px，無橫向溢出、無縱向捲軸
- [x] 依序點擊 Act 1 ~ Act 4 導航，驗證視圖無縫切換
- [x] 驗證音訊播放器與備援降級機制
- [x] 驗收 Exit Code 0 (7項全綠)

### Step 3: 掛載整合進總入口 Shell
- [x] 更新 `app/shell.js` 掛載 `N-3-13` 與 `S-3-1` 指標
- [x] 執行全域守門員 `node tools/verify_app_shell.js` Exit Code 0
- [x] 執行真題驗證 `node tools/verify_n313_cdp.js` Exit Code 0
