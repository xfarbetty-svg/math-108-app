# G2-R-2-2 & G2-R-2-3 微教具組件施工任務卡 (Q01~Q10 共10套)

```yaml
# ==============================================================================
# 🔏 通道三推導憑證與雙簽防偽鋼印 (DUAL SIGNATURE CERTIFICATE)
# ==============================================================================
Channel: 通道三 (035 Key Pool 8把 Key 輪詢閘道) -> 派工工兵施工
Blueprint_Ref: docs/tasks/SPEC_G2_FINAL_4_UNITS_R0.md
Timestamp: 2026-11-18T13:47:30+08:00
Status: MUTUAL_CONSENT_APPROVED
Signers:
  - Role: 決策監工 (Supervisor) -> AGY (APPROVED)
  - Role: 規格大腦 (Architect) -> 035_KeyPool (APPROVED)
# ==============================================================================
```

## 📌 實作目標
實作以下 10 套 034 Anatomy 純向量互動微教具組件，存放在 `app/components/`：
1. `app/components/g2_r22_q01.html`：湊十法動態卡片結合（28+14+12，點擊 28 與 12 合併成 40 金色卡片）。
2. `app/components/g2_r22_q02.html`：三樣水果秤重計數（西瓜9kg、哈密瓜3kg、葡萄1kg，動態累加數線）。
3. `app/components/g2_r22_q03.html`：買麵包牛奶軟糖（35+19+15，部分結合湊整十）。
4. `app/components/g2_r22_q04.html`：天平兩側三數相加（(46+18)+4 與 46+(18+4)，天平水平對齊，指針指向0）。
5. `app/components/g2_r22_q05.html`：計算步驟配對（53+27+14 最佳分步）。
6. `app/components/g2_r23_q06.html`：蘋果陣列 90 度旋轉（5x2 與 2x5 視角切換，總數10不變）。
7. `app/components/g2_r23_q07.html`：九九乘法交換表對角線高亮（8x4 與 4x8 對稱視覺）。
8. `app/components/g2_r23_q08.html`：砝碼天平（左盤3個6kg，右盤6個3kg，天平嚴格水平平衡）。
9. `app/components/g2_r23_q09.html`：巧克力矩陣包裝盒比對（3盒9顆 vs 9盒3顆）。
10. `app/components/g2_r23_q10.html`：倍數陣列排隊（6的7倍與7的6倍）。

## 🛡️ 視覺硬指標（036 審查標準）
- `.wrap`: `max-width: 480px; height: 420px; box-sizing: border-box; overflow: hidden;`
- 單屏入眼：嚴格 $\le 420\text{px}$，手機視口 390×844 免滾動，頂部與元件間距緊湊。
- 天平與物理：Q04 與 Q08 均為等量天平，天平橫梁必須 100% 水平，指針切齊正中央 0 刻度。
- 色彩高對比：鮮明三原色（紅 `#e74c3c`、綠 `#27ae60`、藍 `#2980b9`），物件上標註清晰文字或符號。
- 完整性：單檔完整 HTML、CSS、JS，真實按鈕監聽反饋，體積 $< 30\text{KB}$。
