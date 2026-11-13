# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪（Session 15 算力通道架構真理定錨與手機端調整方向剖析）
1. **手機版實機盲審痛點剖析（最高優先級待辦）**：
   - **痛點一（雙層嵌套與高度爆屏）**：Outer Shell（頂部導航 + stage-head + dots + stage-title）吃掉超過 215px 高度；加上 iframe 內部 container padding、重複題幹、過高 SVG（280px）、操作按鈕、選項與「檢查答案」，以及外層的「上一題/下一題」，導致直立螢幕（390px）總高度達 900px+，下半部操作鈕全部掉出螢幕外，使用者必須頻繁上下死命滑動，未能達成「One-Screen 單屏閉環」。
   - **痛點二（Q2 小鳥造型像金魚）**：`app/components/birds_on_tree_demo.html` 內的小鳥 SVG 幾何簡化過度，手機縮小時失去鳥喙、翅膀與抓枝特徵，視覺體驗不及格。
2. **算力通道真相對齊與 026 契約定錨（杜絕重複造輪子）**：
   - **三大法定算力通道實體定位**：
     - **通道一（本地 OpenCode CLI）**：目前官方 free tier 顯示 `Free usage limit reached`，不可單獨使用。
     - **通道二（A-SERVER SSH 備援）**：**100% 在線秒通（4.2s Exit 0）**，掛載 `google/antigravity-gemini-3.5-flash-lite`。
     - **通道三（035 8把Key池）**：`http://127.0.0.1:4000/v1`，8 把 Google Key 輪詢全部 ACTIVE 在線，實測 200 OK。
   - **深刻反思與憲法級規範**：
     - 026 的核心價值就是 `_allow_remote_fallback = True`：當通道一滿了，調度器必須毫秒級自動無感切換至通道二（A-SERVER SSH 附件化派工），對人類完全透明，嚴禁在對話框內瞎測、停頓或逼人類手動提醒！
     - 嚴禁在 028-1 另外發明散裝派工腳本，派工一律直接引用 `D:\ANTIGRAVITY\026_autoflow\core\af_dispatch.py`。

## 🚦 目前狀態
- **Web 服務監聽**：Port 3001（背景運行中）
  - 🌟 **總入口網址**：`http://100.91.241.21:3001/app/index.html`
- **035 閘道監聽**：Port 4000（8 把 Key 100% 正常）
- **通道二狀態**：A-SERVER SSH 連線正常，OpenCode CLI 待命接單。
- **Git 狀態**：乾淨無懸掛（Commit待推）。

## ➡️ 下一個對話框接續任務（開工即做）
1. **直接調派通道二（A-SERVER SSH）執行手機 One-Screen 視覺重構**：
   - 修改 `app/index.html` 與 `app/shell.js`：手機端（`< 700px`）自動折疊頂部導航，將 `stage-head` 壓縮為 36px 超窄單行，整合題號進度與回列表，消除外框多餘高度。
   - 教具 SVG 扁平化：改採寬扁 `viewBox`（高寬比 ≤ 1:2.2，高度鎖定 150px~180px 內）。
   - 徹底重繪 `app/components/birds_on_tree_demo.html`：繪製純向量精緻小鳥（黃尖鳥喙、立體雙層羽翼、圓潤胸腹、小爪抓枝姿勢），徹底告別「樹上金魚」。
2. **三端實機驗收確認**：以 390px CDP 截圖與真機測試，確認一屏內「題幹 + 教具 + 選項 + 按鈕」完全容納免滑動。

## ⚠️ 守門戒律
- 嚴禁自發明派工腳本，統一遵循 026 `af_dispatch` 契約。
- 通道一滿了直接自動無感切換通道二，絕不打擾使用者。
- 代碼編寫由工兵執行，AGY 堅守挑刺監工標準。

## 🕐 最後更新
- **時間**：2026-11-13 13:00:00 (UTC+8)
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git 狀態**：✅ 已本地提交 Commit `aa821b4`（無遠端 remote，工作區乾淨）
