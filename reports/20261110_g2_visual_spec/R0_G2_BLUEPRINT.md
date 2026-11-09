# 028-1 二年級 (G2) 首發三條目 R0 藍圖規格書

> 依據教育部《108 課綱數學領域課程手冊》與 028-1 專案憲法：
> **倒著做 (Visual-First) ＋ 108 課綱官方代碼 ＋ 每單元嚴格 10 題段考真題 ＋ 純原生 Web Component (<=12KB)**。

---

## 🎯 首發三大核心條目

### 1. N-2-6 乘法意義 (Multiplication Array Model)
- **官方教學核心**：連加轉化為「倍」、單位量（每組幾個）與單位數（有幾組）。
- **法定教具**：`<multiplication-array>`（雞蛋盒/巧克力矩陣陣列、同心分組圈、橫縱翻轉透視）。
- **兒童認知盲點**：混淆「被乘數」與「乘數」的物理意義（3 顆 × 4 盒 vs 4 顆 × 3 盒，雖然積相同但情境完全不同）。
- **Given-When-Then 規格**：
  - **Given**：傳入 `{ rows: 3, cols: 4, unitName: "顆", groupName: "盒" }`。
  - **When**：點擊切換「按盒分組（橫排分圈）」或「按顆檢視」；點擊「翻轉矩陣（交換律視角）」。
  - **Then**：動態高亮每組單位量與組數，動態展示連加算式 `3 + 3 + 3 + 3 = 12` 轉化為乘法算式 `3 × 4 = 12`。

---

### 2. N-2-1 1000以內的數 (Thousand Place Value Box)
- **官方教學核心**：三位數讀寫、百位位值結構、10 個十是一百。
- **法定教具**：`<thousand-value-box>`（百格板 100、橘色十條 10、白色積木 1 的三艙物理聚合盒）。
- **兒童認知盲點**：遇到「中間有 0」的大數讀寫錯誤（如 305 讀成三百零五，但常寫成 35 或 3005）。
- **Given-When-Then 規格**：
  - **Given**：傳入 `{ hundreds: 3, tens: 0, ones: 5 }`。
  - **When**：百位艙放置 3 片百格板、十位艙為空、個位艙放置 5 顆白色積木；點擊「位值折疊卡」。
  - **Then**：顯示 `300 + 0 + 5`，十位艙閃爍提示「0 佔位不可漏」，位值合體展開卡片平滑聚合為 `305`。

---

### 3. N-2-2 加減算式與直式計算 (Vertical Math Grid)
- **官方教學核心**：二位數直式加減、二次進位、一次退位。
- **法定教具**：`<vertical-math-grid>`（位值格線直式表、動態借位劃線、退十小字標註）。
- **兒童認知盲點**：個位不夠減時用減數反減被減數（如 52 - 28 算成 8 - 2 = 6）。
- **Given-When-Then 規格**：
  - **Given**：傳入 `{ minuend: 52, subtrahend: 28, operator: "-" }`。
  - **When**：點擊「個位計算」時，偵測 $2 < 8$，觸發十位借位按鈕。
  - **Then**：十位 5 劃線變為 4，上方標註 10 退回個位，個位變為 $12 - 8 = 4$，十位變為 $4 - 2 = 2$，破除「用大減小」直覺錯誤。

---

## 📐 交付工單清單
- **工單 G2-T01**：`<multiplication-array>` 原生組件開發 (`app/components/multiplication-array.js` $\le 12$ KB)。
- **工單 G2-T02**：`<thousand-value-box>` 原生組件開發 (`app/components/thousand-value-box.js` $\le 12$ KB)。
- **工單 G2-T03**：`<vertical-math-grid>` 原生組件開發 (`app/components/vertical-math-grid.js` $\le 12$ KB)。
- **工單 G2-T04**：三年級段考真題各 10 題落盤 (`data/curriculum_v3/g2_n26_multiplication.json` 等)。
