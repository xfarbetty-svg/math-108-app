# 任務卡：G2-S-2-3 直尺操作微教具 5 套落地 (Step 2)

> 規範依據：034 Anatomy 純向量互動教具標準與 028-1 One-Screen Fit 規範。
> 產出目標：
> - `app/components/g2_s23_q01.html`
> - `app/components/g2_s23_q02.html`
> - `app/components/g2_s23_q03.html`
> - `app/components/g2_s23_q04.html`
> - `app/components/g2_s23_q05.html`

---

## 🎨 034 Anatomy 核心設計規範
1. **純前端零依賴**：純 HTML5 + CSS3 + 純 SVG + 原生 Vanilla JS，單檔 $\le 30\text{KB}$。
2. **手機單屏入眼 (One-Screen Fit)**：
   - 寬度 390px 自適應，外層 `.wrap` 最大寬度 480px。
   - 組件總高度 $\le 420\text{px}$，舞台高度約 140~150px，確保手機一屏免滾動。
3. **日系繪本微動態質感**：
   - 背景使用 `../assets/demo/bg_desk.webp` 搭配柔和遮罩層。
   - 色彩：墨色 `#3d3a34`、柔綠 `#7bc9b2`、深薄荷綠 `#318a70`、暖黃 `#ffd166`、紙色 `#fff9f0`。
   - 直尺刻度清晰（厘米大刻度、毫米微刻度、清晰數字標註）。
4. **互動性與零劇透**：
   - 點擊刻度、指針、物件有微動態反饋（高光、跳動、氣泡提示）。
   - 預設不得揭示答案或顯示錯誤警告；作答點擊選項後點「檢查答案」才顯示判定與詳解。
