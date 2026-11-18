# 任務卡：G2-S-2-4 平面圖形邊長與周長微教具 5 套落地 (Step 3)

> 規範依據：034 Anatomy 純向量互動教具標準與 028-1 One-Screen Fit 規範。
> 產出目標：
> - `app/components/g2_s24_q06.html`（三角形周長 3+4+5=12cm）
> - `app/components/g2_s24_q07.html`（正方形周長 4*4=16cm）
> - `app/components/g2_s24_q08.html`（長方形對邊等長周長 5+3+5+3=16cm）
> - `app/components/g2_s24_q09.html`（正五邊形小螞蟻走一圈周長 2*5=10cm）
> - `app/components/g2_s24_q10.html`（正方形與長方形周長展開為直線比較）

---

## 🎨 034 Anatomy 核心設計規範
1. **純前端零依賴**：純 HTML5 + CSS3 + 純 SVG + 原生 Vanilla JS，單檔 $\le 30\text{KB}$。
2. **手機單屏入眼 (One-Screen Fit)**：
   - 寬度 390px 自適應，外層 `.wrap` 最大寬度 480px，高度固定 `420px`。
   - 舞台高度約 140~150px，確保 390×844 手機一屏免滾動。
3. **日系繪本微動態質感**：
   - 背景使用 `../assets/demo/bg_desk.webp` 搭配柔和遮罩層。
   - 色彩：墨色 `#3d3a34`、柔綠 `#7bc9b2`、深薄荷綠 `#318a70`、暖黃 `#ffd166`、珊瑚粉 `#ff85a1`、紙色 `#fff9f0`。
4. **自動化驗證契約**：
   - 選項按鈕具備 `.opt-btn` 類別，數量 4 個。
   - 檢查按鈕具備 `.check-btn` 類別，觸發 `checkAnswer()`。
   - 結果反饋包含 `id="feedback"`，答對時增加 `success` 類別，答錯時增加 `fail` 類別。
   - 嚴禁使用阻斷式 `alert()`。
   - 腳本末尾定義 `window.check = checkAnswer;`。
