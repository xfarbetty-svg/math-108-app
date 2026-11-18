# G2-R-2-4 & G2-D-2-1 微教具組件施工任務卡 (Q01~Q10 共10套)

```yaml
# ==============================================================================
# 🔏 通道三推導憑證與雙簽防偽鋼印 (DUAL SIGNATURE CERTIFICATE)
# ==============================================================================
Channel: 通道三 (035 Key Pool 8把 Key 輪詢閘道) -> 派工通道二 (A-SERVER SSH 工兵)
Blueprint_Ref: docs/tasks/SPEC_G2_FINAL_4_UNITS_R0.md
Timestamp: 2026-11-18T13:48:00+08:00
Status: MUTUAL_CONSENT_APPROVED
Signers:
  - Role: 決策監工 (Supervisor) -> AGY (APPROVED)
  - Role: 規格大腦 (Architect) -> 035_KeyPool (APPROVED)
# ==============================================================================
```

## 📌 實作目標
實作以下 10 套 034 Anatomy 純向量互動微教具組件，存放在 `app/components/`：
1. `app/components/g2_r24_q01.html`：加減互逆線段圖（Tape Diagram，全長 72，分為 45 藍與 27 綠，點擊移走 45 留下 27）。
2. `app/components/g2_r24_q02.html`：求被減數未知數（□ - 18 = 36，動態量尺倒扣反推 54）。
3. `app/components/g2_r24_q03.html`：減法驗算天平（80 - 23 = 57，用 57 + 23 = 80 驗算，天平水平平衡）。
4. `app/components/g2_r24_q04.html`：存錢筒零用錢（□ + 50 = 120，動態推算 70）。
5. `app/components/g2_r24_q05.html`：代數線段（A + 15 = B，線段差距 B - A = 15 高亮展示）。
6. `app/components/g2_d21_q06.html`：幾何圖形分類拖曳（紅圓形、藍三角形、綠方形，點擊「分類」自動切齊排列）。
7. `app/components/g2_d21_q07.html`：正字記號計數器（點擊劃「正」字，自動統計為數字 13）。
8. `app/components/g2_d21_q08.html`：水果受歡迎直條圖（西瓜12、芭樂8、芒果15、香蕉6，0刻度實線粗黑底座，柱狀圖嚴格切齊底線）。
9. `app/components/g2_d21_q09.html`：直條圖高度差比對（芒果15 vs 芭樂8，兩柱高差虛線貫穿對齊顯示差 7）。
10. `app/components/g2_d21_q10.html`：二維分類交叉統計表（二年級與跑步交叉儲存格高亮）。

## 🛡️ 視覺硬指標（036 審查標準）
- `.wrap`: `max-width: 480px; height: 420px; box-sizing: border-box; overflow: hidden;`
- 單屏入眼：嚴格 $\le 420\text{px}$，手機視口 390×844 免滾動，頂部與元件間距緊湊。
- 基準線對齊：直條圖 Q08 與 Q09 的 0 刻度底線為實線粗黑線，四根直條底部嚴格切齊 0 刻度。
- 色彩高對比：鮮明三原色（紅 `#e74c3c`、綠 `#27ae60`、藍 `#2980b9`）。
- 完整性：單檔完整 HTML、CSS、JS，真實按鈕監聽反饋，體積 $< 30\text{KB}$。
