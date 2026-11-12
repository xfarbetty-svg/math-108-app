# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪
1. **真題三級流水線首發大捷（全量 $0 額度消耗）**：
   - 原始考卷無損文本化：抽取 `EXAM REAL/G1/` 忠孝期中/期末、內湖期末等 4 份段考試卷。
   - 雙工兵平行解析：高雄忠孝期中提取 31/47 題，臺北內湖期末提取 32/33 題。
   - 自動 Diff 比對器：忠孝吻合 22 題高確信題、內湖吻合 23 題高確信題。
   - 小一教育專家盲審通過：核定首批 20 題 100% 真題（含破招解析、教具對齊、無大人負號），已正式落盤至 `data/g1_real_verified_exam_suite.json`！
2. **A-SERVER 通道三（本地 Gemini Pool 8把Key）重大破案並 100% 驗真秒通**：
   - 證實 A-SERVER 本地存在獨立的 `32_AUTOFLOW與OpenCode算力調度`。
   - 抓出先前舊代碼 503 癥結：Google 官方已將舊型號 `2.5-flash` 下線給予 404，而換上新官方主力 `gemini-3-flash-preview` 後，**8 把金鑰實測全部 100% SUCCESS 200 秒回**！
   - 確立架構閉環：A-SERVER 通道二可直接調用 A-SERVER 本地通道三，完全不需折返本機，實現在地完全自治！

## 🚦 目前狀態
- **審定真題題庫**：`data/g1_real_verified_exam_suite.json` 已生成 20 題合格真題。
- **算力網絡**：
  - 本地通道一/通道三：健康在線（$0）。
  - A-SERVER 通道二/通道三：8 把 Key 全綠，秒通在線（$0）。
- **待辦重點**：將審定題庫掛載至前端自適應展演台 `app/index.html`，並修正 `<ten-frame-grid>` 拆十動畫與 `<glass-number-line>` 倒退青蛙跳。

## ➡️ 下一步（換框後立即執行）
1. **真題前端掛接**：工兵將 `data/g1_real_verified_exam_suite.json` 20 題真實評量題目掛接進 `app/index.html`。
2. **教具缺陷優化**：
   - `<ten-frame-grid>`：加入「拆十減法動態割捨動畫」（800ms 慢節奏）。
   - `<glass-number-line>`：消除 `-4`，改為「青蛙倒退跳 4 格」。
3. **實機三端手感驗真**：於手機/平板/電腦三端驗收真實段考題與教具互動。

## ⚠️ 注意事項
- 呼叫 035 Gemini Pool API 時，模型名稱一律走 `gemini-3-flash-preview`（官方支援最佳且零 404/503）。
- 嚴格維持 $0 額度消耗，由外部通道工兵施工。

## 🕐 最後更新
- **時間**：2026-11-12 23:57:00 (UTC+8)
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git Commit**：待推
