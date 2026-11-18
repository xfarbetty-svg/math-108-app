# 任務卡：G3-N-3-9 咪咪果凍盒概念小教室（階段一：靜態畫家打樣與截圖驗收）

> **指派通道**：通道一（本地 OpenCode CLI）  
> **藍圖參照**：`docs/tasks/G3_N39_MIMI_VIDEO_PLAN.md`（由通道三大腦規劃）  
> **驗收閘門**：產出 5 幕靜態預覽與截圖，無穿模、文圖 100% 一致（12格果凍盒，絕無披薩蛋糕），Exit Code 0  

---

## 🎯 任務目標

落實「先做靜態畫家產出 4~5 張圖進行驗收，再推廣到動態」之軍規，完成 N-3-9 咪咪概念小教室 5 幕靜態畫面打樣與實機截圖。

---

## 📋 施工規格與具體產出

### 1. 建立靜態打樣展示頁：`app/components/g3_n39_static_preview.html`
- **版面比例**：16:9 主視窗，嚴格 48:52 空間割席：
  - 左側 48%：顯示咪咪立繪（引用 `D:/ANTIGRAVITY/036_local_painter/theater/assets_hosts/g3_mimi/textures/` 內的高清立繪或相應表情）。
  - 右側 52%：純 SVG/CSS 向量繪製 12 格長方形水晶果凍盒（3x4 網格）與算式卡片。
- **5 幕分鏡切換機制**（支援 URL 參數 `?shot=1` ~ `?shot=5` 或點擊按鈕切換）：
  - **Shot 01（情境導入）**：12 格果凍盒，其中 3 格有果凍，其餘 9 格透明空格。標註「這是一盒的 $\frac{3}{12}$」。
  - **Shot 02（問題提出）**：12 格果凍盒，補入 7 顆不同色果凍（共10格），上方算式「$\frac{3}{12} + \frac{7}{12} = ?$」。
  - **Shot 03（陷阱警示）**：出現大字「$\frac{10}{24}$」並覆蓋顯眼大紅叉 ❌！提示字樣：「盒子沒有變成 24 格呀！」。
  - **Shot 04（算理拆解）**：果凍盒 12 格邊框發光，凸顯單位「$\frac{1}{12}$」。文字：「3個 $\frac{1}{12}$ ＋ 7個 $\frac{1}{12}$ ＝ 10個 $\frac{1}{12}$」。
  - **Shot 05（正確解答）**：算式定案「$\frac{3}{12} + \frac{7}{12} = \frac{10}{12}$ 盒」，10 顆果凍金色光暈，大獲全勝！
- **文圖一致性防線**：通篇 5 幕唯一道具為「12 格長方形水晶果凍盒」，嚴禁出現圓盤、披薩、蛋糕或非 12 格圖形！

### 2. 建立截圖驗收腳本：`tests/verify_g3_n39_static.js`
- 使用 Puppeteer 載入 `app/components/g3_n39_static_preview.html?shot=1` 到 `?shot=5`。
- 分別截圖存為：
  - `reports/previews/g3_n39_s01.png`
  - `reports/previews/g3_n39_s02.png`
  - `reports/previews/g3_n39_s03.png`
  - `reports/previews/g3_n39_s04.png`
  - `reports/previews/g3_n39_s05.png`
- 驗證頁面無 JavaScript 錯誤，截圖檔案確實存在且大於 20KB。
- 測試結束回傳 `process.exit(0)`，任一失敗直接 `process.exit(1)`。

---

## ⚡ 驗收標準
1. 執行 `node tests/verify_g3_n39_static.js` 必須 Exit Code 0。
2. 5 張截圖確實產出於 `reports/previews/`，供通道三與 AGY 監工進行第一輪視覺審查。
