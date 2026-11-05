# 028-1_國小數學APP - 專案藍圖與架構法典 (AGENTS)

> 🌟 **【誕生背景與歷史借鏡】**：
> 本專案由 `028_國小數學APP` 徹底涅槃重生。
> 深刻吸取 028「盲目追求 3,734 題水題、16,000 行單檔縫合怪物 HTML、四頭馬車張冠李戴、大字考題喧賓奪主」之慘痛教訓。
> **本專案實施最高憲法：「倒著做」(Visual-First) ＋ 108 課綱官方代碼 ＋ 每單元嚴格只做 10 題 ＋ 人類逐題盲審驗真。**

---

## 🏛️ 五大憲法級工程鐵律

### 鐵律一：倒著做 (Visual-First & Human-Verified)
1. **教具先行**：新單元必須先完成視覺教具與算理演示（純向量 SVG / 獨立元件），呈現給人類驗收。
2. **每單元嚴格 10 題**：徹底廢除「生成換數字刷題」。每單元精選 10 題真實段考考題與思維陷阱題。
3. **人類做 10 題審 10 題**：每題經由人類在三端（手機/平板/電腦）實機操作、算理解析核對無誤後，才准寫入題庫。

### 鐵律二：零冗餘資料結構 (SSOT)
- 徹底廢除 `story`、`word_problem.question`、`math` 等多重欄位。
- 每題只有單一扁平 Schema：唯一題幹 `stem`、唯一選項組 `choices`、唯一正解索引 `answer_index`、唯一教具參數 `visual_engine`、唯一算理解析 `explanation`。

### 鐵律三：三端響應式排版 (Mobile / Tablet / Desktop)
- **手機 (390px)**：單手垂直流動，頂部狀態列 < 40px，真題來源以 11px 幽靈字置於右上角，絕不喧賓奪主；2x2 拇指熱區按鈕；抽屜式詳解。
- **平板 (768px iPad)**：左右雙欄自適應（左邊題幹與教具，右邊選項與內嵌破招詳解）。
- **電腦 (960px+)**：寬螢幕雙欄自適應。

### 鐵律四：回歸 108 課綱官方單元
- 廢除「初生森林、幻滅王座、什麼大王國」花哨名稱。
- 嚴格依照教育部《108 課綱數學領域課程手冊》官方代碼命名（N-1-3, N-2-2, N-5-4 等）。

### 鐵律五：發布雙硬閘門與純前端離線
- 零外部遠端伺服器依賴，純靜態離線秒開。
- 發布前強制通過全量單元測試、語意算理守門員與三端視覺驗收。

---

## 🗺️ 里程碑路線圖
- [x] 專案開工：切斷 028 歷史包袱，建立 L1 乾淨工程標準
- [x] 一年級 108 課綱官方 9 大條目全量補齊與視覺痛點剖析
- [x] 融合 034 專案技術（等角透視、形體堆疊、力矩平衡天平）
- [x] 產出 R0 樣品藍圖與打樣規格書 (`reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md`)
- [x] 產出一年級 9 大單元可操作視覺打樣 Showcase (`reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html`)
- [x] 人類三端實機驗收打樣手感 (手機 390px / 平板 768px / 電腦 960px)
- [x] 算力通道驗真與 026 AutoFlow v2.6.3 三層閉環拓撲對齊 (通道1 Magpie 3425 / 通道2 A-SERVER SSH / 通道3 035 7把 Key Pool)
- [x] 啟動 AutoFlow Stage 1：派工 BP 拆解 T-01~T-03 任務卡，由 OpenCode GLM 帶手腳施工首批元件 (<ten-frame-grid>, <dual-track-diff>, <balance-beam>)
- [x] Stage 3 工兵施工：T-01~T-04 全量落盤並逐條 AC 實測通過 (`app/components/*.js` + `app/playground.html` + `tools/ac_run.js`)
- [x] Stage 3.5 工單重工：TCK-01~TCK-08 全數落地（30px 格/33px 熱區、生命週期對稱、單一幾何公式、deg 量綱、分解樹+拋物線、`tools/ac_gate.js` 機械化閘門 exit 0）
- [ ] BP 盲審 `R3_WORKER_BUILD_REPORT.md` 的 D-01~D-13 偏離裁決 + 新開 **TCK-09**（44px 熱區 vs 兩盒並排矛盾）→ 通過後排 G-8 人類實機手感驗收

---

## ⚡ 三大法定免費算力拓撲與三層閉環 (對齊 026 AutoFlow v2.6.3)
1. **三層閉環工作流**：
   - **第一層 (決策大腦 AGY)**：反推 Given-When-Then R0 藍圖規格書，**零業務代碼寫入權 (WRITE-FILE LOCKED)**。
   - **第二層 (現場指揮官 Big Pickle)**：接收 R0 拆解任務卡，調度 GLM 施工，**親自審查代碼與盲審比對**後向 AGY 回報。
   - **第三層 (施工工兵 GLM / Worker)**：本機 OpenCode CLI 實體帶手腳施工（注入 `stdin=subprocess.DEVNULL` 破除假死），提交 Git 鋼印。
2. **三大法定免費算力通道 (全部 Exit Code 0 驗真)**：
   - **通道 1 (本地 OpenCode CLI 主力)**：`opencode run --auto` (v2.2.5 本機子進程，真實工具手腳施工)。
   - **通道 2 (A-SERVER SSH 備援)**：`ssh a-server "opencode run ..."` (遠端 OpenCode CLI，已同步對齊升級至 v2.2.5 備援)。
   - **通道 3 (035 Key Pool)**：`http://127.0.0.1:4000/v1` (7 把 Google API Key 輪詢，僅限 Gemini 系列，0-Token 攔截非 Gemini)。
   - **備用網關 (本地 Magpie)**：`http://127.0.0.1:3425/v1` (純文字審查開票備援，Fallback Only，無工具執行手腳)。

---

## 📁 核心目錄結構
```text
028_1/
├── AGENTS.md                  # 專案憲法與架構約定
├── handoff.md                 # 斷點交接日誌 (收工必寫)
├── PROGRESS.md                # 極簡進展看板 (≤40行)
├── INDEX.md                   # 模組導航地圖
├── app/                       # 正式前端入口與組件
│   └── index.html             # 三端自適應展演台原型
├── reports/                   # 歷程報告與討論打樣
│   └── 20261105_2035_g1_visual_spec/
│       ├── R0_AGY_BLUEPRINT.md            # 一年級 9 大條目打樣與驗收規格
│       └── g1_visual_samples_showcase.html # 一年級 9 大單元可操作視覺打樣
├── data/                      # 題庫資料
├── docs/                      # 課綱規格手冊
└── tests/                     # 驗收守門員
```
