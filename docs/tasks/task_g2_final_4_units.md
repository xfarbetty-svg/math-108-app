# G2 二年級大滿貫最後 4 單元施工任務卡 (R-2-2, R-2-3, R-2-4, D-2-1)

```yaml
# ==============================================================================
# 🔏 通道三推導憑證與雙簽防偽鋼印 (DUAL SIGNATURE CERTIFICATE)
# ==============================================================================
Channel: 通道三 (035 Key Pool 8把 Key 輪詢閘道) -> 派工通道一 (本地 OpenCode CLI)
Blueprint_Ref: docs/tasks/SPEC_G2_FINAL_4_UNITS_R0.md
Timestamp: 2026-11-18T13:41:28+08:00
Status: MUTUAL_CONSENT_APPROVED
Signers:
  - Role: 決策監工 (Supervisor)
    Agent: AGY
    Consent: APPROVED
  - Role: 規格大腦 (Architect)
    Agent: 035_KeyPool_Gemini
    Consent: APPROVED
# ==============================================================================
```

## 📌 執行目標
依據 108 課綱與段考真題標準，實作以下 4 單元題庫 JSON (SSOT) 與 20 套 034 純向量互動微教具 (HTML/SVG)：
1. `G2-R-2-2`【三數相加，順序改變不影響其和】：Q01 ~ Q05
   - 題庫：`data/units/G2/R-2-2.json`
   - 教具：`app/components/g2_r22_q01.html` ~ `g2_r22_q05.html`
2. `G2-R-2-3`【兩數相乘的順序不影響其積】：Q06 ~ Q10
   - 題庫：`data/units/G2/R-2-3.json`
   - 教具：`app/components/g2_r23_q06.html` ~ `g2_r23_q10.html`
3. `G2-R-2-4`【加法與減法的關係】：Q01 ~ Q05
   - 題庫：`data/units/G2/R-2-4.json`
   - 教具：`app/components/g2_r24_q01.html` ~ `g2_r24_q05.html`
4. `G2-D-2-1`【分類與呈現】：Q06 ~ Q10
   - 題庫：`data/units/G2/D-2-1.json`
   - 教具：`app/components/g2_d21_q06.html` ~ `g2_d21_q10.html`

## 🛡️ 嚴格算理與視覺規範
- **物理常識**：天平若傾斜，重物端必須穩穩下沉，輕物端翹起，底座清楚標記。
- **基準線對齊**：直尺測量、物件長度比較與直條圖，所有物件起點嚴格切齊基準虛線或 0 刻度。
- **顏色高對比**：使用高飽和對比三原色（紅 `#e74c3c`、綠 `#27ae60`、藍 `#2980b9`），物件中心清晰標註名稱或數字。
- **單屏入眼**：組件高度嚴格 $\le 420\text{px}$，手機視口 390×844 一屏入眼，頂部與元件間距緊湊，嚴禁產生捲軸。
- **純前端互動**：真實按鈕與指針監聽，無外連依賴，單檔體積 $< 30\text{KB}$。
