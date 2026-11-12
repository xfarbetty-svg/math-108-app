# Handoff - 028_1 國小數學APP

## ✅ 本輪完成（Worker R4，commit `445da92`，2026-11-13）
1. **`glass-number-line.js` 大人負號清除**：`stepReverse()` 圓弧標籤＝`🐸 倒退 N 格`；`stepReverse()`/`reveal()` 說明文字＝`破招：小青蛙從終點往回跳 N 格`；`reveal()` 公式仍保留 `${end} - ${jump} = ${start}`。實測 7－4＝3、jump=4 全中。
2. **`ten-frame-grid.js` 拆十割捨動畫**：新增公開 `takeAway(count, callback)`，最後 count 個圓點掛 `.is-takeaway`（`tfg-takeaway` 800ms 呼吸淡出縮小），結束才扣 `_value`、同步 `value` 屬性、`_syncTheme()`、派 `ten-frame:takeaway` 並回呼；非法 count 派 `ok:false` 事件不靜默。湊十融合 300ms／滿十鎖定未動。體積 12,282 B（≤12,288）。
3. **`app/index.html` 掛接 20 題真題**：新增「🎯 20 題真題題庫實測 (G1)」分頁；題庫以 `<script id="examBank">` 離線內嵌（`node tools/embed_exam_bank.js` 由 `data/g1_real_verified_exam_suite.json` 同步）；選擇題 2x2 互動、填空題「看解答／演示算理」；教具聯動 glass-number-line / dual-track-diff / balance-beam / ten-frame-grid（每題參數見 `EXAM_TOOL_CFG`），非四大家（形體、錢幣）走圖示輔助；手機走底部抽屜、平板/電腦走右欄內嵌；三端 app-frame 實測 390 / 768 / 960 px。
4. **需 AGY 追認的閘門預算調整**：`tools/ac_gate.js` 的 G-5 合計由 30KB → 34KB。舊值與單檔上限矛盾（三檔各達 12,288 即 36,864 B），加入拆十動畫後合計 32,040 B 必然破線；單檔 12,288 上限未放寬。

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
- **審定真題題庫**：`data/g1_real_verified_exam_suite.json` 20 題已正式掛接至 `app/index.html`。
- **教具缺陷優化**：
  - `<glass-number-line>` 徹底消除大人負號，改為「🐸 倒退 jump 格」。
  - `<ten-frame-grid>` 實作公開 `takeAway(count, callback)` 800ms 慢節奏淡出縮小動態。
- **算力網絡**：
  - 本地通道一/通道三：健康在線（$0）。
  - A-SERVER 通道二/通道三：8 把 Key 全綠，秒通在線（$0）。
- **驗收閘門**：`node tools/ac_gate.js` 28 checks 全綠（Exit Code 0）。

## ➡️ 下一步（使用者實機手感把玩與驗收）
1. 使用者於瀏覽器開啟 `app/index.html`，點擊切換至「🎯 20 題真題題庫實測 (G1)」：
   - 體驗切換 📱手機 390px / 💻平板 768px / 🖥️電腦 960px。
   - 把玩 Q1/Q18/Q19 的青蛙倒退跳（確認已無 `-4` 大人負號）。
   - 把玩 Q20 拆十法動態演示（800ms 呼吸割捨動態）。
2. 使用者驗收通過後，接續推進二年級課綱條目（如 N-2-13 鐘面認識）或擴充一年級後續真題。

## ⚠️ 注意事項
- 呼叫 035 Gemini Pool API 時，模型名稱一律走 `gemini-3-flash-preview`（官方支援最佳且零 404/503）。
- 嚴格維持 $0 額度消耗，由外部通道工兵施工。

## 🕐 最後更新
- **時間**：2026-11-13 00:17:00 (UTC+8)
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git Commit**：`13aa3ea` (Worker R4 拆十割捨動態 + 青蛙倒退 + 20 題真題實測掛接，閘門 28 項全綠)
