# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪（Session 20 異常回退與收工）
1. **工作區狀態已完整乾淨回退**：
   - 撤銷本 session 違規產出之無互動死圖與假題庫提交（已執行 `git reset --hard HEAD~1` + `git clean -fd`）。
   - 工作區恢復至 Session 19 正式收工狀態（Commit `f006bc4`）。
2. **目前實裝基線確認（真實可互動）**：
   - `G1-N-1-1`（4 題忠孝期中真題，具象教具：小魚缸、鉛筆課桌、派對帽配對、水果排隊，全部具備可操作熱區與動態檢查）。
   - `G1-N-1-2`（4 題忠孝期末真題，具象教具：日系翡翠雲冠大樹與靈動小鳥，已調用通道三完成重繪與 One-Screen 單屏適配）。
   - 語音朗讀機制已確認：綁定 `window.speechSynthesis` 原生臺灣腔（Windows 本機桌面因未裝微軟 Natural Voice 會 fallback Hanhan，手機端 iOS/Android 實機直接調用臺灣腔語音）。

## 🚦 目前狀態
- **Web 服務監聽**：Port 3001（背景運行中）
  - 🌟 **總入口網址**：`http://100.91.241.21:3001/app/index.html`
- **Git 狀態**：`f006bc4 docs(handoff): 回填收工 commit 鋼印與狀態`（乾淨，無未提交檔案）。

## ➡️ 下一個對話框接續任務（冷啟動開工）
1. **重啟第四單元（G1-N-1-4 錢幣解題）正規流程**：
   - 嚴格依照專案法典，不得由 AGY 大腦寫入死圖。
   - 由現場指揮官開出 Given-When-Then 互動規格卡，派工給**通道一（本地 OpenCode CLI）**或**通道二（A-SERVER OpenCode CLI）**施工帶手腳之互動元件。
   - 每個元件必須包含可點擊硬幣、收銀盤金額累積、即時檢查反饋。

---

## 🚨 2026-11-13 核心防錯與工兵派工鋼印（最高優先級）

1. **嚴禁 Agent 自行動手寫業務代碼或拼造假題庫**：
   - AGY 是架構師、監工與驗收者，**絕對禁止使用 Python 腳本硬編碼題目內容、正則拼裝 JSON 或偽造靜態死圖**！
   - 題目辨識、解析與互動元件撰寫，**一律指派 OpenCode CLI 執行**。
2. **唯一標準派工通道**：
   - 派工唯一指令：`python tools/dispatch_worker.py --file <task_card.md> "任務簡述"`
   - 嚴格遵守 026 AutoFlow 底層規格（`--format json --auto --standalone stdin=DEVNULL encoding=utf-8`），禁止任何其他野雞腳本。
3. **只認 Exit Code 0 與真實互動**：
   - 所有產出元件必須具備按鈕、事件監聽與可玩互動邏輯，任何無互動死圖一律視為假成功，拒絕收工。
