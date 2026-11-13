# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪（Session 21 一年級單元四、五、六 100% 落地與驗真）
1. **雙算力通道標準化（派工唯一入口）**：
   - 升級 `tools/dispatch_worker.py`，原生支援 `--channel 1`（本地 OpenCode）與 `--channel 2`（A-SERVER SSH 備援）。
   - 預設模型切換為 `opencode/glm-5.3-flash-free`，實測 3.8s 回應，Exit Code 0。
2. **單元四、五、六 全量 15 題真題 ＋ 15 套真實可操作教具完工落盤**：
   - **單元四（G1-N-1-4 錢幣解題，5 題）**：
     - `coin_cake_pay_demo.html`（大雄買杯子蛋糕最少拿幾個 10 元：8 個硬幣點選拿取、金額累積、夠付與找錢判定）
     - `exact_change_breakfast_demo.html`（早餐剛好 46 元：10元/1元托盤累加、即時剛好/太多/太少反饋）
     - `wallet_compare_demo.html`（小光和小日誰錢多：雙皮夾逐幣點數高亮、43 > 38 比較）
     - `coin_supplement_demo.html`（珍珠買早餐還要補多少：45 + 15 = 60 算式連動補錢）
     - `coin_exchange_demo.html`（換錢大作戰：50元換5個10元、10元換2個5元動態展開）
     - 驗收守門員：`node tools/verify_n14.js` CDP 實機測量 ALL PASS (Exit Code 0)
   - **單元五（G1-N-1-5 長度比較，同 S-1-1，5 題）**：
     - `stationery_baseline_align_demo.html`（桌上的兩枝鉛筆：對齊紅色虛線基準線破除視覺偏位）
     - `curved_ribbon_stretch_demo.html`（彎彎的紅緞帶：波浪動態平整拉直展開長度破招）
     - `rope_waist_measure_demo.html`（等長繩量大熊小兔腰圍：展開剩餘繩段，剩餘越少＝腰圍越長）
     - `paperclip_unit_measure_demo.html`（毛筆與剪刀迴紋針測量：個別單位點數標號 1~12，6－4＝2）
     - `block_chain_add_demo.html`（彩色筆＋橡皮擦拼方格：綠積木與橘積木平移動態對接，8＋3＝11）
     - 驗收守門員：`node tools/verify_n15.js` CDP 實機測量 ALL PASS (Exit Code 0)
   - **單元六（G1-N-1-6 日常時間用語，5 題）**：
     - `clock_6_oclock_demo.html`（整點鐘報讀：認識時針分針、微調短針旋轉整點演示）
     - `clock_10_half_demo.html`（半點鐘報讀：短針在10與11之間、算理解密扇形指引破除看成11點半）
     - `clock_elapsed_2h_demo.html`（經過2小時：長針平滑旋轉360°齒輪連動短針、8＋2＝10）
     - `broken_clock_detect_demo.html`（長針走一圈：9點鐘出發旋轉一圈、齒輪連動推進到10點鐘）
     - `calendar_yesterday_today_tomorrow_demo.html`（日曆報讀：今天5/20週三、翻昨天5/19週二、翻明天5/21週四）
     - 驗收守門員：`node tools/verify_n16.js` CDP 實機測量 ALL PASS (Exit Code 0)
3. **課綱總表與微核心架構同步**：
   - `data/curriculum.json`：一年級 N-1-1 ~ N-1-6 共 6 大單元全部標記為 `ready`，合計 28 題真實試卷題。
   - `tools/verify_curriculum_131.js`：131 課綱守門員 Exit Code 0。
   - `tools/verify_app_shell.js`：微核心 Shell 導航與單元切換 Exit Code 0。
   - `tools/ac_gate.js`：28 項基礎元件檢查 ALL PASS。

## 🚦 目前狀態
- **Web 服務監聽**：Port 3001（背景運行中）
  - 🌟 **總入口網址**：`http://100.91.241.21:3001/app/index.html`
- **Git 狀態**：待提交 Session 21 成果。

## ➡️ 下一個對話框接續任務（冷啟動開工）
1. **推進一年級後續條目**：
   - `S-1-2`（形體的操作：描繪、複製、拼貼、堆疊）
   - `R-1-1`（算式與符號）
   - `R-1-2`（加法交換律）
   - `D-1-1`（簡單分類）
2. **三端（手機 390px / 平板 768px / 電腦）實機手感巡檢**。
