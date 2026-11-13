# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪（Session 21 一年級單元四、五、六 100% 落地與盲審修復）
1. **雙算力通道標準化**：
   - 升級 `tools/dispatch_worker.py`，支援 `--channel 1`（本地 OpenCode CLI）與 `--channel 2`（A-SERVER SSH 備援）。
   - 依指令指定預設模型為 `opencode/glm-5.3-flash-free`，實測響應順暢（Exit Code 0）。
2. **一年級單元四、五、六 全量 15 題真題與 15 套純向量具象教具完工落盤**：
   - **單元四（G1-N-1-4 錢幣解題，5 題）**：杯子蛋糕投幣付錢、早餐剛好46元托盤累加、小光小日雙皮夾點數比大小、珍珠補錢湊整、50元換10元動態展開。CDP 自動化閘門 `tools/verify_n14.js` ALL PASS。
   - **單元五（G1-N-1-5 長度比較，5 題）**：基準線對齊破招、彎曲緞帶動態拉直、等長繩量腰圍展開、迴紋針個別單位標號測量、方格積木平移對接拼合。CDP 自動化閘門 `tools/verify_n15.js` ALL PASS。
   - **單元六（G1-N-1-6 日常時間用語，5 題）**：整點鐘時針分針識別、半點鐘扇形破招、時鐘齒輪連動過2小時、長針旋轉一圈短針進位、立體桌上日曆今天昨天明天翻頁。CDP 自動化閘門 `tools/verify_n16.js` ALL PASS。
3. **人類真機盲審即時修復**：
   - 解決使用者於實機操作 G1-N-1-5 Q4 迴紋針題時發現的「選項按鈕文字未對齊、歪斜」問題：將原本的 `display: flex; justify-content: center` 徹底重構為 `display: grid; grid-template-columns: repeat(2, 1fr)` 嚴格雙欄等寬九宮格，徹底消滅因「一樣長」字數較少引起的歪斜與參差。
4. **課綱總表與微核心架構同步**：
   - `data/curriculum.json`：一年級 N-1-1 ~ N-1-6 全部標記為 `ready`（已開放 6/11，合計 28 題真實試卷題）。
   - 全量守門員測試（`verify_curriculum_131.js`, `verify_app_shell.js`, `verify_n14.js`, `verify_n15.js`, `verify_n16.js`, `ac_gate.js` 28 checks）全部 Exit Code 0 綠燈！

## 🚦 目前狀態
- **Web 服務監聽**：Port 3001（背景運行中）
  - 🌟 **總入口網址**：`http://100.91.241.21:3001/app/index.html`
- **Git 狀態**：乾淨無未追蹤或未提交變動（Commit `3eb723c` 及收工 commit）。

## ➡️ 下一個對話框接續任務（冷啟動開工）
1. **推進一年級後續單元**：
   - `S-1-2`（形體的操作：描繪、複製、拼貼、堆疊）
   - `R-1-1`（算式與符號）
   - `R-1-2`（兩數相加的順序不影響其和：加法交換律）
   - `D-1-1`（簡單分類）
2. **二年級新單元與進階題型規劃**。

## ⚠️ 注意事項
- **選項排版鐵律**：後續所有多選按鈕群組（`.opt-group`），若為 4 個選項一律優先採用 `display: grid; grid-template-columns: repeat(2, 1fr)` 2x2 等寬佈局，嚴禁使用 `flex` 居中浮動以避免字數不一導致排版歪斜。
- **派工唯一通道**：所有組件與題庫撰寫一律維持使用 `python tools/dispatch_worker.py --file <task_card.md>` 派工給 OpenCode，嚴禁 AGY 親自寫業務邏輯代碼。

## 🕐 最後更新
- **時間**：2026-11-13 17:55
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git push 狀態**：無遠端 remote（純本機 git commit 鋼印保護，已確認本機版控完整）
