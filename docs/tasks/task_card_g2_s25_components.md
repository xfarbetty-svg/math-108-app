# 任務卡：G2-S-2-5 面積操作微教具 5 套落地 (Step 2)

> 規範依據：034 Anatomy 純向量互動教具標準與 028-1 One-Screen Fit 規範。
> 產出目標：
> - `app/components/g2_s25_q01.html`（個別單位比較：8張 vs 10張貼紙）
> - `app/components/g2_s25_q02.html`（直接比較疊合：紅紙蓋住藍紙，誰面積比較小？）
> - `app/components/g2_s25_q03.html`（面積守恆：正方形剪開拼成大三角形，面積一樣大）
> - `app/components/g2_s25_q04.html`（間接比較相同單位：佈告欄 15 張 vs 黑板 50 張）
> - `app/components/g2_s25_q05.html`（方格紙面積計算：12格比9格多3個）

---

## 🎨 034 Anatomy 核心設計規範
1. **純前端零依賴**：純 HTML5 + CSS3 + 純 SVG + 原生 Vanilla JS，單檔 $\le 30\text{KB}$。
2. **手機單屏入眼 (One-Screen Fit)**：
   - 寬度 390px 自適應，外層 `.wrap` 最大寬度 480px，高度固定 `420px`。
   - 舞台高度約 120~130px，內邊距 padding 約 8~12px，確保底部按鈕完整入屏。
3. **日系繪本微動態質感**：
   - 背景使用 `../assets/demo/bg_desk.webp` 搭配柔和遮罩層。
   - 色彩：墨色 `#3d3a34`、柔綠 `#7bc9b2`、深薄荷綠 `#318a70`、暖黃 `#ffd166`、珊瑚粉 `#ff85a1`、紙色 `#fff9f0`。
4. **自動化驗證契約**：
   - 選項按鈕具備 `.opt-btn` 類別，數量 4 個。
   - 檢查按鈕具備 `.check-btn` 類別，觸發 `checkAnswer()`。
   - 結果反饋包含 `id="feedback"`，答對時增加 `success` 類別，答錯時增加 `fail` 類別。
   - 嚴禁使用阻斷式 `alert()`。
   - 腳本末尾定義 `window.check = typeof checkAnswer !== "undefined" ? checkAnswer : () => {};`。
