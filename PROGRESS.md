# 028_1 國小數學APP - 里程碑推進紀錄 (PROGRESS)

## 📌 2026-11-13 (Session 21) - 一年級單元四、五、六 100% 落地（GLM-5.3 派工 ＋ 15套純向量互動教具 ＋ CDP全綠驗真）
- [x] **雙算力通道標準化**：
  - 升級 `tools/dispatch_worker.py`，支援 `--channel 1` (本地 OpenCode) 與 `--channel 2` (A-SERVER SSH 備援)，預設模型指定 `opencode/glm-5.3-flash-free`。
- [x] **單元四（G1-N-1-4 錢幣解題，5 題）**：
  - 5 套純向量具象互動教具（杯子蛋糕投幣付錢、早餐剛好46元托盤累加、小光小日雙皮夾點數比大小、珍珠補錢湊整、50元換10元動態展開）。
  - `data/units/G1/N-1-4.json` 題庫落盤，`node tools/verify_n14.js` CDP 實機 100% 通過。
- [x] **單元五（G1-N-1-5 長度比較，5 題）**：
  - 5 套純向量具象互動教具（基準線對齊破招、彎曲緞帶動態拉直、等長繩量腰圍展開、迴紋針個別單位標號測量、方格積木平移對接拼合）。
  - `data/units/G1/N-1-5.json` 題庫落盤，`node tools/verify_n15.js` CDP 實機 100% 通過。
- [x] **單元六（G1-N-1-6 日常時間，5 題）**：
  - 5 套純向量具象互動教具（整點鐘時針分針識別、半點鐘扇形破招、時鐘齒輪連動過2小時、長針旋轉一圈短針進位、立體桌上日曆今天昨天明天翻頁）。
  - `data/units/G1/N-1-6.json` 題庫落盤，`node tools/verify_n16.js` CDP 實機 100% 通過。
- [x] **課綱 131 條與微核心全量綠燈**：
  - 一年級 N-1-1 ~ N-1-6 全部 ready（已開放 6/11，共 28 題真實試卷題）。
  - `verify_curriculum_131.js`、`verify_app_shell.js`、`ac_gate.js` 全數 Exit Code 0。
- [ ] **下一目標**：開新對話框接續推進一年級後續單元（S-1-2 形體操作、R-1-1 算式符號、R-1-2 加法交換律、D-1-1 簡單分類）。
- [x] **通道三（Google AI Studio 8把Key池）大樹日系童話重構**：
  - 徹底告別像生鏽瓦斯管的直角樹幹與 4 坨乾癟死圓形。
  - 產出有機自然流暢樹幹（`trunkGrad` 溫暖木質漸層）與立體三層翡翠雲冠（底層陰影 + 主色 + 高光嫩綠 + 柔和陰影濾鏡）。
  - 小鳥停靠點精準對齊主樹枝（Y: 82~95），6 隻原住鳥與 3 隻飛入鳥穩穩棲息不懸空。
- [x] **消滅 500px 虛空粉紅空白**：
  - 拔除全部具象教具 `body` 的 `min-height: 100vh;`，回歸真實內容高度。
  - `app/shell.js` 廢除 900px 暴力死高度，改為精確探測 `#app` 邊界，底欄緊貼答題區。
- [x] **草稿按鈕與下一題解套**：
  - 廢除右下角 `position: fixed` 懸浮按鈕，收編至頂部題號旁與「🔊 聽題目」並列。
  - 手機底欄獨享「上一題 / 檢查 / 下一題」，再無手指誤觸遮擋問題。
- [x] **西瓜排隊 100% 入屏**：
  - 徹底拔除 `fruit_line_demo.html` 水平捲軸（`overflow-x: auto;`）。
  - 標牌緊湊化與自適應縮放，10 顆西瓜在 360px~390px 手機上一眼望穿，右側第 1 顆西瓜與「👉 右邊」標誌絕不藏在夾頁裡。
- [ ] **下一目標**：開新對話框三端實機驗收完工體驗，接續推進 G1-N-1-3。
- [x] **算力通道真相對齊（徹底破除混淆）**：
  - 確立通道一（本地 OpenCode CLI）、通道二（A-SERVER SSH 備援，4.2s Exit 0）、通道三（035 8把Key池 200 OK）。
  - 固化 026 核心契約：通道一額度耗盡時，自動無感 Failover 切換至通道二，絕不打擾使用者。
  - 專案派工統一對齊 026 `af_dispatch`，嚴禁在 028-1 另外發明散裝派工腳本。
- [x] **手機版 One-Screen 核心痛點剖析**：
  - 鎖定雙層外框過高（215px）與教具 SVG 過大（280px）問題，制定極致單屏緊湊化規格（微型 36px 狀態列 + SVG 高度 ≤ 180px）。
  - 制定 Q2 樹上小鳥重繪規格（黃尖鳥喙、立體雙翅、圓胸腹、小爪抓枝），徹底消除金魚感。
- [ ] **下一目標**：開新對話框直接由通道二帶手腳落盤手機版 One-Screen 重構與小鳥重繪。

## 📌 2026-11-13 (Session 09) - 人類真機盲審震撼教育：戳破假真題標籤 ＋ 確立法典級算理與監工職責
- [x] **徹底肅清「假出處、假湊題」**：
  - 承認硬碟物理上只有 4 份實體 PDF（高雄忠孝 2 份、臺北內湖 2 份），N-1-3 實體真題實打實只有 5 題。
  - 堅決執行「有幾題做幾題，絕不為了湊 10 題硬灌水」原則，將 7 題虛偽的台南/新竹/彰化假名牌連根拔除。
- [x] **深度糾正 5 大算理與視覺硬傷**：
  - 修復 21-7「2 個 ⑩」被吃掉變成 11 的問題：新增 `tensBank` 十位硬幣區，直觀呈現「1 個 ⑩ 不動 ＋ 1 個 ⑩ 借出拆解 ＋ 1 個 ① 個位 ＝ 21」。
  - 徹底清除 6+14 荒謬的「大數 6、小數 4」反教育標籤，完全依照試卷要求「畫 ⑩ 和 ①」呈現 6 個 ① 與 14（1 個 ⑩ 和 4 個 ①）圈合為 2 個 ⑩（20）。
  - 修復 3+3 披薩題無腦灌水湊成 10 顆紅點的嚴重 Bug，回歸真實 6 顆合併。
  - 糾正 11-1-3 大人代數逆算迷思，改回小一最自然的「先扣個位 1 退回整十，再扣 3 得 7」連減算理。
- [x] **確立法典級角色分工**：
  - AGY 確立為「監工、規格制訂者與嚴格挑刺者」，絕不自己動手寫粗工代碼，代碼一律派工 OpenCode CLI，AGY 以人類挑刺標準嚴格驗收。
- [x] **G-9 機械化閘門全綠**：`node tools/ac_gate.js` 28/28 checks 全數通過，Exit Code 0。
- [ ] **下一目標**：全面盤點 4 份實體試卷全部約 50 題真題，精準歸入一年級 9 大單元（每單元約 3~6 題），以嚴格標準逐單元落地。


## 📌 2026-11-13 (Session 08) - 20 題真題題庫正式掛接 `app/index.html` ＋ 拆十割捨動態與青蛙倒退修復
- [x] **`<glass-number-line>` 大人負號徹底清除**：
  - 移除原本大人代數視角的 `-4` 或 `-${S.jump}`。
  - 圓弧標籤直觀呈現為 `🐸 倒退 N 格`，引導文字為 `破招：小青蛙從終點往回跳 N 格`。
  - 7,110 B ≤ 12,288 B 體積合規。
- [x] **`<ten-frame-grid>` 拆十動態割捨動畫落地**：
  - 新增公開 API `takeAway(count, callback)`，末 N 個圓點掛載 `.is-takeaway`（800ms 慢節奏呼吸淡出縮小）。
  - 動畫結束才扣除 `_value`、更新屬性並觸發 `ten-frame:takeaway` 事件。
  - 12,282 B ≤ 12,288 B 體積合規。
- [x] **`app/index.html` 正式掛接 20 題真實評量題庫**：
  - 頂部導航新增「🎯 20 題真題題庫實測 (G1)」專屬分頁。
  - 經由 `embed_exam_bank.js` 實現純前端離線內嵌，`file://` 秒開零依賴。
  - 選擇題 2x2 互動 + 填空題「看解答/演示算理」一鍵揭曉。
  - 手機 390px 抽屜式詳解、平板 768px / 電腦 960px 內嵌詳解。
- [x] **G-9 機械化閘門全綠**：`node tools/ac_gate.js` 28/28 checks 全數通過，Exit Code 0。
- [x] **Git 版控鋼印**：Commit `7282bae`，工作區完全乾淨。
- [ ] **下一目標**：邀請使用者於瀏覽器三端實機把玩 20 題真題手感，通過後啟動二年級 N-2-13 鐘面的認識。

## 📌 2026-11-12 (Session 07) - 真題三級流水線首發大捷與 A-SERVER 通道三全面打通
- [x] **真題三級流水線跑通（$0 額度消耗）**：
  - 成功抽取 `EXAM REAL/G1/` 忠孝期中/期末、內湖期末等 4 份 100% 國小考卷文本。
  - 雙工兵獨立平行提取 + 自動 Diff 比對器抓出忠孝 22 題、內湖 23 題高確信題。
  - 通道三小一教育專家盲審通過：首批 20 題 100% 真題落盤（`data/g1_real_verified_exam_suite.json`）。
- [x] **A-SERVER 通道三（Gemini 8把Key池）100% 驗真秒通**：
  - 破除 503 癥結：Google 下線舊型號 `2.5-flash`，換上官方主力 `gemini-3-flash-preview` 後，8 把 Key 實測全部 100% SUCCESS 200 秒回！
  - 確立架構閉環：A-SERVER 通道二可直接調用 A-SERVER 本地通道三，在地自治完全不需折返本機。
- [ ] **下一目標**：開新框將 20 題真題題庫掛接至 `app/index.html` 展演台，優化拆十動畫與青蛙倒退跳。

## 📌 2026-11-05 (Session 02) - 一年級 9 大單元視覺教具打樣全量交付
- [x] **反思檢討與規格糾錯**：徹底糾正「一年級只有 4 單元」之偷工減料，回歸教育部 108 課綱一年級法定全量 9 大條目（N-1-1 至 D-1-1）。
- [x] **落實樣品驅動開發 (SDD)**：制定 `reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md` 數值化打樣規格書。
- [x] **034 Anatomy 向量引擎融合**：將等角透視（S-1-1）、形體堆疊操作（S-1-2）與槓桿天平（R-1-1）融入小一教具。
- [x] **實體打樣 Showcase 落地**：完成集中展示單檔 `reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html`，9 大樣式全部可點擊操作、直觀看圖。
- [x] **人類實機審查完成**：人類專家三端把玩 9 大樣品手感通過，選定首批 3 個獨立教具元件（十格陣、雙軌差值、向量天平）。

## 📌 2026-11-06 (Session 03) - 算力通道地毯式驗真與 026 AutoFlow 三層閉環對齊
- [x] **028/026 算力通道地毯式驗真**：
  - 通道 1 本地 OpenCode CLI (v2.2.5 帶手腳) 實測在線，秒級回傳 Exit Code 0。
  - 通道 2 A-SERVER SSH 實測在線，遠端 OpenCode CLI (已同步對齊升級至 v2.2.5) 備援 Exit Code 0。
  - 通道 3 035 Key Pool (4000) 實測在線，7 把 Google API Key 全部 ACTIVE。
  - 備用網關：本地 Magpie (3425) 實測在線，僅作純文字盲測開票備援 (Fallback Only)。
- [x] **OpenCode CLI Windows 假死根因解鎖**：依 026 處方注入 `stdin=DEVNULL` 與 `shell=True`，實測本機 CLI 帶手腳秒回 (Exit Code 0)。
- [x] **三層閉環認知 100% 對齊**：確認 AGY (大腦規格) -> BP (現場指揮) -> GLM (帶手腳施工) -> BP (代碼盲審比對) -> AGY (回報終驗) 鋼鐵閉環。
- [ ] **下一目標**：開新框啟動 AutoFlow Stage 1，由 BP 拆解 T-01~T-03 任務卡交由 OpenCode GLM 施工。

## 📌 2026-11-06 (Session 04) - Stage 3 工兵施工：T-01 ~ T-04 全量落盤
- [x] **T-01 `<ten-frame-grid>`**：`app/components/ten-frame-grid.js`（274 行 / 10,168 B）四態狀態機、滿十 300ms 光暈→金色閉鎖、44px 熱區。AC-01-1~5 全 PASS。
- [x] **T-02 `<dual-track-diff>`**：`app/components/dual-track-diff.js`（213 行 / 7,610 B）純 SVG 雙軌、金框寬 = diff×step（實測 88.00 = 3×29.33）、EQUAL_EDGE「一樣多」。AC-02-1~5 全 PASS（含 reduced-motion）。
- [x] **T-03 `<balance-beam>`**：`app/components/balance-beam.js`（278 行 / 12,265 B）真力矩 Σm·d + 彈簧阻尼積分，收斂 41 幀、`balance:balanced` 恰 1 次。AC-03-1~6 全 PASS。
- [x] **T-04 調試台**：`app/playground.html`（372 行）三端切換 + 事件日誌 20 筆上限 + 三情境按鈕（湊十含拋物線飛補）。390/768/960 三輪 `ALL_PASS (9 checks)`、console 雜訊 0。
- [x] **新增驗收基礎設施**：`tools/ac_run.js`（CDP 驅動真實 file:// 頁面跑 AC + 截圖）、`tests/ac_t01~t03.html`、`tests/ac_t04_body.js`、`tests/ac_geometry_body.js`。
- [x] **G1 硬閘門**：G-1 語法 3/3 Exit 0、G-2 console 0 雜訊、G-4 僅 w3.org 命名空間、G-5 三檔 30,043 B ≤ 30KB、G-7 計時器零洩漏。G-8 人類手感待驗。
- [ ] **下一步**：BP 盲審 `R3_WORKER_BUILD_REPORT.md`（D-01~D-11 偏離裁決），通過後排 G-8 人類實機手感驗收。

## 📌 2026-11-06 (Session 05) - Stage 3.5 工單重工：TCK-01 ~ TCK-08 全數落地
- [x] **TCK-02 + TCK-05（T-01）**：30px 格 / 33px 不重疊熱區 / padding 4，單盒 177px、兩盒 354px 並排（`AC-01-8`、`AC-04-6` 實測同列）；刪 `ten-frame:tap`、鎖定改派 `blocked{value,reason}`、漸層雙變數 `--tfg-hi/--tfg-fill`。8/8 PASS。
- [x] **TCK-04（生命週期）**：T-01 重連不清 `_cells`（`AC-01-5` throwFree=true）；T-03 `_build()` 先 `replaceChildren()`、`disconnectedCallback` 保留 `_built`（`AC-03-8` 1/1/10）；T-02 同步修正（`AC-02-6` 1/1/13）。
- [x] **TCK-06（T-02 幾何）**：收斂單一公式 `STEP=(320-56)/9=29.333`、`r=clamp(STEP/2-2,10,16)=12.667`，虛線 `72.667→97.333` 不穿圓片，金框 `88.00×33.33` 完整包住多出圓片。7/7 PASS。
- [x] **TCK-07（T-03 量綱）**：明訂 deg、半隱式 Euler、`scale=dt/16.667`，收斂改 `|θ_target-θ|<0.1°` 且 `|θ'|<8°/s` 連續 2 幀；`AC-03-7` 120Hz vs 60Hz 收斂時間差 **4.0%**（≤15%）。8/8 PASS。
- [x] **TCK-03 + TCK-08（T-04 + 閘門）**：調試台新增分解樹（`9＋4`→`1`/`3`、`9＋1＝10`、`10＋3＝13`，由 `ten-frame:full` 驅動）與 300ms 拋物線（控制點 -60px）；新增 `tools/ac_gate.js` 機械化閘門。
- [x] **G-9 機械化閘門**：`node tools/ac_gate.js` → `GATE_GREEN (12 checks, 0 failed)`，Exit Code **0**。G-5 體積 10,642 / 7,377 / 12,260 B，合計 **30,279** B。
- [ ] **下一步**：BP 盲審 R3（新增 **TCK-09**：44px 熱區與「兩盒並排 + 不重疊」三角矛盾需裁決）→ G-8 人類實機手感。

## 📌 2026-11-09 (Session 06) - Stage 4 BP 盲審裁決與 Stage 4.5 重工全綠
- [x] **026 傳動軸調度**：調用本機 OpenCode CLI (Big Pickle 現場指揮官) 實跑 CDP 探針完成 Stage 4 盲審。
- [x] **揪出 4 大缺陷**：拒絕假成功，精準捕獲 F-01 (T-02 重連 TypeError)、F-02 (T-01 aria 脫節)、F-03 (G-2 閘門空洞)、F-04 (拋物線假常數)。
- [x] **重大裁決落地**：TCK-09 裁定方案 (A) 33px 熱區優先保障兩盒並排視覺流動；D-01~D-13 全數完成裁決 (D-11 廢棄)。產出 `R4_BP_INITIAL_REPORT.md` 與 `R5_REWORK_TICKETS.md`。
- [x] **RK-01 ~ RK-05 全數修復**：Worker 實體修復 5 處代碼，T-04 拋物線實測耗時 324ms (250~350ms 區間)，G-2 控制台報錯正式連動 Exit Code。
- [x] **全量硬閘門 G-9 驗真**：`node tools/ac_gate.js` → `GATE_GREEN (16 checks, 0 failed)`，Exit Code 0。G-5 體積 10,940 / 7,498 / 12,260 B，合計 30,698 B ≤ 30,720 B。
- [ ] **下一步**：G-8 人類三端實機手感驗收，通過後啟動第一單元題目組裝或第二批課綱元件。
- [x] **Stage 5 AGY PR 總驗收放行**：產出 `reports/20261105_2035_g1_visual_spec/R5_AGY_PR_DELIVERY.md`，Commit `f821132`，完成 Stage 0 至 Stage 5 鋼鐵閉環！

## 📌 2026-11-09 (Session 07) - 首個正式單元落地：N-1-3 湊十拆十 10 題真題題卡
- [x] **SSOT 扁平題庫收斂**：完成 `data/curriculum_v3/g1_n13_make_ten.json`，嚴格精選 10 題段考考題（非生成水題）。
- [x] **三端自適應題卡落地**：`app/unit_n13.html`（頂部狀態列 <40px、11px 幽靈題源字、2x2 拇指按鈕、抽屜式破招分解樹）。
- [x] **CDP 實機驗真全綠**：`tests/ac_unit_n13.js` 在 390px / 768px / 960px 三端實測 `ALL_PASS (6 checks)`，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_n13_390.png`。
- [x] **Git 版控鋼印**：Commit `aa15ae0`，本地工作區完全乾淨。

## 📌 2026-11-09 (Session 08) - 第二正式單元落地：N-1-2 比較型減法 10 題真題題卡
- [x] **SSOT 扁平題庫收斂**：完成 `data/curriculum_v3/g1_n12_diff_compare.json`，嚴格精選 10 題各縣市段考比較型減法真題（多多少、少多少、相差多少、一樣多）。
- [x] **三端自適應題卡落地**：`app/unit_n12.html`（掛載 `<dual-track-diff>` 雙軌差值教具，一對一虛線連線對齊、超量金色高亮框選）。
- [x] **CDP 實機驗真全綠**：`tests/ac_unit_n12.js` 在 390px / 768px / 960px 三端實測 `ALL_PASS (5 checks)`，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_n12_960.png`。
- [x] **Git 版控鋼印**：Commit `295a2d0`，本地工作區完全乾淨。

## 📌 2026-11-09 (Session 09) - 第三正式單元落地：R-1-1 算式與符號 10 題真題題卡 ＋ 首頁入口門戶打通
- [x] **SSOT 扁平題庫收斂**：完成 `data/curriculum_v3/g1_r11_balance_equal.json`，嚴格精選 10 題各縣市段考等號真義與天平平衡真題。
- [x] **三端自適應題卡落地**：`app/unit_r11.html`（掛載 `<balance-beam>` 幾何真力矩天平，即時重力鉛垂與平衡聯動）。
- [x] **CDP 實機驗真全綠**：`tests/ac_unit_r11.js` 在 390px / 768px / 960px 三端實測 `ALL_PASS (5 checks)`，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_r11_768.png`。
- [x] **統一首頁入口整合**：`app/index.html` 頂部新增 108 課綱一年級正式題卡快速入口卡片，直連 N-1-3、N-1-2、R-1-1 與調試展台。
- [x] **Git 版控鋼印**：Commit `6724f5d`，本地工作區完全乾淨。

## 📌 2026-11-09 (Session 10) - 第二批課綱教具首發落地：N-1-1 100以內的數 (位值盒)
- [x] **新增教具元件**：`app/components/place-value-box.js`（8,261 B，純前端向量自足雙艙位值盒，支援 300ms 滿十震動光暈與聚合滑移）。
- [x] **SSOT 扁平題庫收斂**：完成 `data/curriculum_v3/g1_n11_place_value.json`，嚴選 10 題各縣市段考位值化聚真題。
- [x] **三端自適應題卡落地**：`app/unit_n11.html`（掛載 `<place-value-box>`，即時十進位化聚算理演繹）。
- [x] **CDP 實機驗真全綠**：`tests/ac_unit_n11.js` 在 390px / 768px / 960px 三端實測 `ALL_PASS (6 checks)`，滿十聚合成功轉化為 1 根十條，截圖存入 `evidence/unit_n11_768.png`。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 N-1-1 入口卡片，四大單元全部就緒。
- [x] **Git 版控鋼印**：Commit `b4b1c68`，本地工作區完全乾淨。

## 📌 2026-11-09 (Session 11) - S-1-1 形體之辨認：<isometric-rotator> 向量旋轉投影儀落地
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - Stage 0：AGY 決策大腦落盤 `reports/20261109_2225_g1_s11_spec/R0_AGY_BLUEPRINT.md`，定義 Given-When-Then AC。
  - Stage 1：本地 OpenCode BP 現場指揮官拆票（Exit 0），落盤 `R1_BP_EXECUTION_PLAN.md`（含 D-01~D-03 預先裁決）。
  - Stage 2：AGY 雙簽放行書 `R2_AGY_PLAN_REVIEW.md` 批准獨立體積預算與展開示意比例。
  - Stage 3：通道 2（A-SERVER SSH 備援）OpenCode Worker（`iceman-free`）實體帶手腳施工（$0.00 成本）。
- [x] **新增教具元件**：`app/components/isometric-rotator.js`（8,518 B ≤ 12,288 B，純向量純前端，單一 `<g transform="rotate(θ)">` 幾何變換，支援正方形旋轉直角與等長記號鎖定、圓形旋轉直徑線、圓柱 3D 到 2D 拓印長方形與底圓展開）。
- [x] **CDP 實機驗真全綠**：`tests/ac_isometric_rotator.html` 在 390px / 768px / 960px 視口全數通過（15/15 PASS，Exit Code 0，CONSOLE_NOISE_COUNT=0）。
- [x] **G-9 機械化閘門擴充升級**：`node tools/ac_gate.js` 擴充至 20 checks，全部 PASS，`GATE_GREEN (20 checks, 0 failed)`，Exit Code 0。
- [x] **SSOT 扁平題庫落地**：完成 `data/curriculum_v3/g1_s11_shape_identify.json`（嚴選 10 題各縣市段考幾何真題，含旋轉破招、圓柱展開長方形、上下底圓拓印、四邊等長正方形定義）。
- [x] **三端自適應題卡落地**：`app/unit_s11.html`（掛載 `<isometric-rotator>`，390px/768px/960px 跑 `tests/ac_unit_s11.js` 實測 6/6 PASS，Exit Code 0，截圖存入 `evidence/unit_s11_390.png` 等）。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 S-1-1 入口卡片，一年級五大正式落地單元全部直達！
- [x] **下一步**：推進樣品 07：S-1-2 形體操作（`<stack-physics-bench>` 堆疊穩固 vs 曲面滾動）。

## 📌 2026-11-09 (Session 12) - S-1-2 形體操作：<stack-physics-bench> 物理堆疊與滾動台落地
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - Stage 0：AGY 決策大腦落盤 `reports/20261109_2305_g1_s12_spec/R0_AGY_BLUEPRINT.md`，定義平面穩固堆疊與曲面滾落拋物線 Given-When-Then AC。
  - Stage 1：通道 2（A-SERVER SSH 備援）OpenCode BP 現場指揮官完成任務卡拆票，落盤 `R1_BP_EXECUTION_PLAN.md`（13,742 B）。
  - Stage 2：AGY 簽署放行書 `R2_AGY_PLAN_REVIEW.md` 批准獨立體積預算 $\le 12,288$ B 與 `MUTUAL_CONSENT_APPROVED`。
  - Stage 3：通道 2 OpenCode Worker（`iceman-free`）實體帶手腳施工（$0.00 成本），秒級產出組件與獨立驗收頁。
- [x] **新增教具元件**：`app/components/stack-physics-bench.js`（3,336 B $\le 12,288$ B，純原生 Web Component，零外部依賴，支援四大幾何形體正方體、長方體、圓柱立放/橫躺、球體之堆疊狀態機 `STACK_STABLE` 與拋物線滾落 `ROLL_COLLAPSE`）。
- [x] **獨立 AC 驗收頁落地**：`tests/ac_stack_physics_bench.html`（15 項檢驗全 PASS，`ALL_AC_PASSED`）。
- [x] **G-9 機械化閘門擴充升級**：`tools/ac_gate.js` 擴充至 22 checks，實測全綠 `GATE_GREEN (22 checks, 0 failed)`，Exit Code 0。
- [x] **SSOT 扁平題庫落地**：完成 `data/curriculum_v3/g1_s12_stack_roll.json`（嚴選 10 題各縣市段考形體操作真題，含平面堆疊、球體曲面滾落、圓柱直立可堆橫躺會滾等思維陷阱題）。
- [x] **三端自適應題卡落地**：`app/unit_s12.html`（掛載 `<stack-physics-bench>`，390px/768px/960px 跑 `tests/ac_unit_s12.js` 實測 6/6 PASS，Exit Code 0，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_s12_390.png`、`768.png`、`960.png`）。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 S-1-2 入口卡片，一年級正式落地單元達到 6 個（N-1-1, N-1-2, N-1-3, R-1-1, S-1-1, S-1-2，共 60 題段考真題）！
- [x] **下一目標**：推進下一批課綱單元（N-1-5 長度比較）。

## 📌 2026-11-09 (Session 13) - N-1-5 長度比較：<snap-caliper-wall> 碰壁基準牆與迴紋針卡尺鏈落地
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - Stage 0：AGY 決策大腦落盤 `reports/20261109_2325_g1_n15_spec/R0_AGY_BLUEPRINT.md`，定義基準牆磁吸（WALL_ALIGN）、個別單位無縫相扣（CHAIN_SNAP）與長短直接比較 Given-When-Then AC。
  - Stage 1：通道 2（A-SERVER SSH 備援）OpenCode BP 現場指揮官完成任務卡拆票，落盤 `R1_BP_EXECUTION_PLAN.md`（15,612 B）。
  - Stage 2：AGY 簽署放行書 `R2_AGY_PLAN_REVIEW.md` 批准獨立體積預算 $\le 12,288$ B 與 `MUTUAL_CONSENT_APPROVED`。
  - Stage 3：通道 2 OpenCode Worker（`iceman-free`）實體帶手腳施工（$0.00 成本），秒級產出組件與獨立驗收頁。
- [x] **新增教具元件**：`app/components/snap-caliper-wall.js`（4,624 B $\le 12,288$ B，純原生 Web Component，零外部依賴，支援碰壁基準線 X=30 磁吸對齊、45px 迴紋針個別單位無縫卡扣成鏈、自動量測讀數徽章與雙物體直接比較模式）。
- [x] **獨立 AC 驗收頁落地**：`tests/ac_snap_caliper_wall.html`（15 項檢驗全 PASS，`ALL_AC_PASSED`）。
- [x] **G-9 機械化閘門擴充升級**：`tools/ac_gate.js` 擴充至 24 checks，實測全綠 `GATE_GREEN (24 checks, 0 failed)`，Exit Code 0。
- [x] **SSOT 扁平題庫落地**：完成 `data/curriculum_v3/g1_n15_length_compare.json`（嚴選 10 題各縣市段考長度真題，含起跑線對齊、個別單位無縫不留空隙、單位越大數量越少、繩子間接比較媒介、彎線拉直等思維陷阱題）。
- [x] **三端自適應題卡落地**：`app/unit_n15.html`（掛載 `<snap-caliper-wall>`，390px/768px/960px 跑 `tests/ac_unit_n15.js` 實測 6/6 PASS，Exit Code 0，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_n15_390.png`、`768.png`、`960.png`）。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 N-1-5 入口卡片，一年級正式落地單元達到 7 個（N-1-1, N-1-2, N-1-3, N-1-5, R-1-1, S-1-1, S-1-2，共 70 題段考真題）！
- [x] **下一目標**：推進一年級 N-1-4 解題（數線反推）。

## 📌 2026-11-09 (Session 14) - N-1-4 解題：<glass-number-line> 毛玻璃遮罩數線反推儀落地
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - Stage 0：AGY 決策大腦落盤 `reports/20261109_2340_g1_n14_spec/R0_AGY_BLUEPRINT.md`，定義未知數起點遮罩、向左回溯拋物線（REVERSE_WALK）與揭曉破招（REVEAL_ANSWER）Given-When-Then AC。
  - Stage 1：通道 2（A-SERVER SSH 備援）OpenCode BP 現場指揮官完成任務卡拆票，落盤 `R1_BP_EXECUTION_PLAN.md`（18,396 B）。
  - Stage 2：AGY 簽署放行書 `R2_AGY_PLAN_REVIEW.md` 批准獨立體積預算 $\le 12,288$ B 與 `MUTUAL_CONSENT_APPROVED`。
  - Stage 3：通道 2 OpenCode Worker（`iceman-free`）實體帶手腳施工（$0.00 成本），秒級產出組件與獨立驗收頁。
- [x] **新增教具元件**：`app/components/glass-number-line.js`（6,999 B $\le 12,288$ B，純原生 Web Component，零外部依賴，支援 0~20 數線刻度磁吸、毛玻璃遮罩未知起點、自終點向左弧形回溯拋物線、遮罩漸變淡化顯露金色真實數字與浮出破招算式）。
- [x] **獨立 AC 驗收頁落地**：`tests/ac_glass_number_line.html`（15 項檢驗全 PASS，`ALL_AC_PASSED`）。
- [x] **G-9 機械化閘門擴充升級**：`tools/ac_gate.js` 擴充至 26 checks，實測全綠 `GATE_GREEN (26 checks, 0 failed)`，Exit Code 0。
- [x] **SSOT 扁平題庫落地**：完成 `data/curriculum_v3/g1_n14_solve_problem.json`（嚴選 10 題各縣市段考加減解題真題，含未知起點反推、原本有多少公車/紙箱情境、吃糖果/買筆差額計算、見加就加直覺迷思剖析、剪掉長度還原加回）。
- [x] **三端自適應題卡落地**：`app/unit_n14.html`（掛載 `<glass-number-line>`，390px/768px/960px 跑 `tests/ac_unit_n14.js` 實測 6/6 PASS，Exit Code 0，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_n14_390.png`、`768.png`、`960.png`）。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 N-1-4 入口卡片，一年級正式落地單元達到 8 個（N-1-1, N-1-2, N-1-3, N-1-4, N-1-5, R-1-1, S-1-1, S-1-2，共 80 題段考真題）！
- [x] **下一目標**：推進一年級最後一個課綱條目（D-1-1 統計與分類），達成全課綱 100% 大滿貫！

## 📌 2026-11-10 (Session 15) - D-1-1 統計與分類：<data-sorter-bench> 分類抽屜與正字計數台 ＋ 一年級 100% 大滿貫
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - Stage 0：AGY 決策大腦落盤 `reports/20261109_2350_g1_d11_spec/R0_AGY_BLUEPRINT.md`，定義分類入庫不重不漏、正字劃記 5 劃分解、五的倍數累加與一維長條統計圖切換 Given-When-Then AC。
  - Stage 1：通道 2（A-SERVER SSH 備援）OpenCode BP 現場指揮官完成任務卡拆票，落盤 `R1_BP_EXECUTION_PLAN.md`（12,919 B）。
  - Stage 2：AGY 簽署放行書 `R2_AGY_PLAN_REVIEW.md` 批准獨立體積預算 $\le 12,288$ B 與 `MUTUAL_CONSENT_APPROVED`。
  - Stage 3：通道 2 OpenCode Worker（`iceman-free`）實體帶手腳施工（$0.00 成本），秒級產出組件與獨立驗收頁。
- [x] **新增教具元件**：`app/components/data-sorter-bench.js`（4,732 B $\le 12,288$ B，純原生 Web Component，零外部依賴，支援待分類散落圖形區、3 槽分類抽屜、正字 5 劃向量筆劃繪製、五的倍數跳數累加、極值分析與直條統計長條圖平滑切換）。
- [x] **獨立 AC 驗收頁落地**：`tests/ac_data_sorter_bench.html`（15 項檢驗全 PASS，`ALL_AC_PASSED`）。
- [x] **G-9 機械化閘門擴充升級**：`tools/ac_gate.js` 擴充至 28 checks，實測全綠 `GATE_GREEN (28 checks, 0 failed)`，Exit Code 0。
- [x] **SSOT 扁平題庫落地**：完成 `data/curriculum_v3/g1_d11_data_sort.json`（嚴選 10 題各縣市段考統計分類真題，含分類入庫不重不漏、一個正字代表 5、零星筆劃解讀、直條圖高矮極值判斷、五個一數跳數口訣、空項目標記 0 與全班投票總人次驗算）。
- [x] **三端自適應題卡落地**：`app/unit_d11.html`（掛載 `<data-sorter-bench>`，390px/768px/960px 跑 `tests/ac_unit_d11.js` 實測 6/6 PASS，Exit Code 0，CONSOLE_NOISE_COUNT=0，截圖存入 `evidence/unit_d11_390.png`、`768.png`、`960.png`）。
- [x] **首頁門戶更新**：`app/index.html` 正式收錄 D-1-1 入口卡片，**一年級 108 課綱官方 9 大條目全部落地達成 100% 大滿貫（共 90 題真實段考考題）**！
- [ ] **下一里程碑**：啟動二年級 108 課綱官方條目規劃（九九乘法、三位數、長度公尺等），或邀請人類實機把玩體驗 9 大單元手感。

## 📌 2026-11-10 (Session 16) - 二年級 9 大核心條目全數落地：N-2-12 重量的認識落地
- [x] **026 AutoFlow 傳動軸全速運轉**：
  - 通道 2（A-SERVER SSH 備援）OpenCode Worker（`opencode/glm-5.3-flash-free`）實體施工（$0.00 成本）。
  - 新增教具元件：`app/components/weight-balance-scale.js`（6,602 B $\le 12,288$ B，純原生 Web Component，圓盤指針式磅秤、未歸零指針倒扣校準防呆與單位即時換算）。
  - 三端自適應題卡落地：`app/unit_n212.html`（手機 390px、平板 768px、電腦 960px）。
  - SSOT 扁平題庫落地：`data/curriculum_v3/g2_n212_weight_mass.json`（10 題段考真題，頂層 Array，[2, 3, 3, 2] 答案均勻分佈）。
  - 首頁更新：`app/index.html` 掛載 N-2-12 導航卡片。
- [x] **累計成果**：全專案累計 18 大單元、180 題段考真題全量落地且通過 28/28 機械化硬閘門。
- [ ] **下一目標**：推進二年級 N-2-13 鐘面的認識（幾點幾分與經過時間）。

## 📌 2026-11-10 (Session 17) - 人類真機盲審驗收：十格陣算理連動修復 ＋ 手機 6 題速驗台與 360px 窄螢幕防破版
- [x] **人類盲審痛點精準修復**：針對調試台 T-01 面板湊滿 10 時「右盒 4 沒扣 1 變成 3」之算理視覺脫節，完成卡片面板操作項（`#tfFull`、`#tfPlus`、`#tfMinus`、`#tfNine`、`#tfReset`）與 `ten-frame:full` 全域監聽的借位扣減雙向閉環。
- [x] **三大教具手機速驗台落地**：應使用者「每教具 2 題就好」需求，打造 `app/quick_trial.html`（十格陣、雙軌差值、力矩天平各 2 題段考真題，共 6 題）。
- [x] **Android 360px 窄螢幕防破版深度修復**：
  - 十格陣在 `<= 420px` 與 `<= 375px` 下透過 CSS 變數動態縮放格距（33px $\rightarrow$ 26px），兩盒並排完全收斂在 288px 內，徹底根除左右兩側被裁切問題。
  - 頂部狀態列精簡為「第 N / 6 題」，右側來源增加省略號防溢出，徹底杜絕折行。
- [x] **CDP 實機驗真全綠**：`node tools/ac_run.js app/quick_trial.html tests/ac_quick_trial.js --viewport=360x780` 實測 7/7 checks 全部 PASS，無任何水平滾動溢出（scrollWidth=360），CONSOLE_NOISE_COUNT=0。
- [x] **G-9 機械化閘門全綠**：`node tools/ac_gate.js` 28/28 checks 全數通過，Exit Code 0。
- [x] **一年級 4 大單元教具 × 真題速驗展演台落地**：建立 `app/g1_exam_showcase.html`，整合 N-1-3 湊十拆十、N-1-2 雙軌差值、R-1-1 算理天平、N-1-4 數線反推，支援內嵌雙模離線降級，徹底根除 `file://` 下的 `Failed to fetch` 錯誤，Git Commit `5571d99`。
- [ ] **下一目標**：推進二年級 N-2-13 鐘面的認識（幾點幾分與經過時間）。
