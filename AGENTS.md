# 028-1_國小數學APP - 專案藍圖與架構法典 (AGENTS)
<!-- BUDGET: <=200 行 / <=15KB。本檔為專案架構憲法，嚴禁記入 Session 流水帳、打勾日記與復盤雜文。歷史請移入 CHANGELOG.md，覆盤入 reports/retros/ -->

> 本檔為跨 Agent 通用的專案憲法（AGENTS.md 開放標準）。存放硬體不變量、踩坑防線、算力拓撲與核心架構約定。

---

## 🏛️ 七大憲法級工程軍規

### 軍規一：倒著做與真題為本 (Visual-First & Verbatim Real Exam)
- **真題神聖不可侵犯**：100% 忠實對齊段考實體試卷原文與算式，嚴禁為了「湊 10 題」而將高階思維題閹割成找碴弱智題（詳見 [Session 32 覆盤報告](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S32_EXAM_TRUNCATION.md)）。
- **倒著做驗證**：先確認題目真確度與視覺算理表達，再進入資料封裝。

### 軍規二：實事求是契約與嚴禁虛假賦能 (Honesty & No Fake Assertion)
- **言行 100% 一致**：做了什麼就說什麼。代碼沒調用的庫、沒寫的特效，一字不准吹噓（詳見 [Session 35 覆盤報告](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S35_HONESTY_NO_FAKE_POWER.md)）。
- **開口前必查代碼**：回答任何實現細節前，必須以實際終端檢查結果為準，禁止憑印象作答。

### 軍規三：外科手術式精修與拒絕盲目重做 (Surgical-Fix Only)
- **千金難買現狀穩定**：已驗收條目嚴禁盲目發動全局大改寫。發現瑕疵只做單點外科手術精修，修完即止，嚴禁擴大戰線（詳見 [Session 36 覆盤報告](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S36_SURGICAL_FIX_MANIPULATIVE.md)）。

### 軍規四：動態 vs 靜態精確分級與派工防偽 (Manipulative vs Static)
- **L0/L1 靜態認知題**：「數數看、共有多少、比大小」一律使用日系靜態繪本 + 點選高亮，嚴禁過度設計。
- **L2 物理操作題**：「量量看、比對、轉動、拼拼看」必須具備真實指針事件監聽（`pointerdown/move/up`）、旋轉軸心與磁吸貼齊。
- **機械化防偽守門**：度量類教具必須通過自動化腳本模擬拖曳（drag 20px / rotate）驗證座標與 `transform` 變動，死圖假教具直接 Exit 1 退回。

### 軍規五：三端自適應與單屏緊湊防抖 (One-Screen Fit)
- 手機端 390px 視口寬度 100% 入屏，零橫向溢出。
- 教具高度嚴格限制 $\le 420\text{px}$，全屏總高 $\le 740\text{px}$，保證一屏入眼免滾動。

### 軍規六：零冗餘資料結構與防劇透 (SSOT)
- 課綱 131 條目為唯一真理源。
- 教具內部嚴禁自建提交按鈕，未作答前嚴禁在 DOM 渲染任何解析或暗示文字。

### 軍規七：發布雙硬閘門與純前端離線
- 全站純純前端（Vanilla JS / SVG / ESM / Web Components），支援完全離線運行。
- 線上發布必須通過 `tools/release.py` 自動化門禁與 Cloudflare Pages 探針驗收。

---

## 🗺️ 里程碑進度總表 (宏觀進展)
> 📌 **詳細歷史打勾清單（200+ 筆歷史交付細項）** 已完整封存於：[CHANGELOG.md](file:///d:/ANTIGRAVITY/028-1_國小數學APP/CHANGELOG.md)

- [x] **Phase 1: 一年級 (G1) 108 課綱 9 大單元**：100% 落地完工 (N-1-1 ~ D-1-1 共 28 條子題庫與教具)。
- [x] **Phase 2: 三年級 (G3) 108 課綱 24 大單元**：100% 大滿貫落地 (含 23 套概念小教室與 71 套互動組件)。
- [x] **Phase 3: 全站語音架構與 Gate 4 守門員**：微軟 Edge-TTS 曉臻自然女聲單例架構上線，CDP 實機驗證全綠。
- [x] **Phase 4: 二年級 (G2) 108 課綱 24 大單元**：100% 大滿貫落地！(含 24 套概念實驗室、24 單元 121 題高階真題與 121 套 034 向量微教具全量落地，全站累計開放 59/131 條目，實裝 035 機器多模態視覺硬門禁)。

---

## ⚡ 三大法定免費算力拓撲與三層閉環

1. **三層閉環工作流**：
   - **第一層 (決策大腦 AGY)**：反推 Given-When-Then R0 藍圖規格書，**零業務代碼寫入權 (WRITE-FILE LOCKED)**。
   - **第二層 (現場指揮官 Big Pickle)**：接收 R0 拆解任務卡，調度施工工兵，親自審查代碼與盲審比對。
   - **第三層 (施工工兵 GLM / Worker)**：本機 OpenCode CLI 實體帶手腳施工（注入 `stdin=DEVNULL` 破除假死），提交 Git 鋼印。
2. **三大法定免費算力通道 (全部 Exit Code 0 驗真)**：
   - **通道 1 (本地 OpenCode CLI 主力)**：`opencode run --auto` (v2.2.5 本機子進程，真實工具手腳施工)。
   - **通道 2 (A-SERVER SSH 備援)**：`ssh a-server "opencode run ..."` (遠端 OpenCode CLI 備援)。
   - **通道 3 (035 Key Pool)**：`http://127.0.0.1:4000/v1` (8 把 Google API Key 輪詢，僅限 Gemini 系列)。

---

## 📁 核心目錄結構

```text
028-1_國小數學APP/
├── AGENTS.md                  # 專案憲法與架構約定 (<=200行)
├── CHANGELOG.md               # 歷史里程碑交付日誌 (200+項打勾記錄)
├── handoff.md                 # 斷點交接日誌 (收工必寫)
├── PROGRESS.md                # 極簡進展看板 (<=40行)
├── INDEX.md                   # 模組導航地圖
├── app/                       # 正式前端入口、組件與教材
├── data/                      # 108 課綱結構與各年級題庫 JSON (SSOT)
├── docs/                      # 規格標準手冊 (含 UNIT_FACTORY_STANDARD.md)
├── reports/                   # 歷程報告、截圖與打樣
│   └── retros/                # 歷次事故覆盤報告 (Session 32/35/36)
├── tests/                     # 冒煙與防回歸測試
└── tools/                     # 自動化發布、派工與 CDP 守門員腳本
```

---

## 🚨 核心防錯與工兵派工鋼印（最高優先級）

1. **嚴禁 AGY 本體動筆撰寫 PLAN 與業務代碼（$0 額度鋼印）**：
   - **Plan 階段強制限速**：試卷題型分析、Given-When-Then 藍圖與任務卡草擬，**強制調用 MCP 通道三（035 金鑰池 `ask_gemini_pool`）**，嚴禁 AGY 在主對話框直接推導或草擬大篇幅任務卡浪費主額度！
   - **Exec 階段嚴禁動手**：題庫 JSON 封裝、純 SVG 教具組件與測試腳本，**一律指派通道一（OpenCode CLI）施工**，AGY 零業務代碼寫入權 (`WRITE-FILE LOCKED`)。
   - **AGY 法定職責**：調度通道三出藍圖 -> 雙簽放行 -> 派工 OpenCode -> 親自執行軌道 B 多模態視覺審查 (`read_file`) -> 執行 `tools/release.py` 自動發布。
2. **唯一標準派工通道**：
   - 派工指令：`python tools/dispatch_worker.py --file <task_card.md> "任務簡述"`
   - 嚴格遵守 Step-by-Step 單步推進底層規格（`--format json --auto --standalone stdin=DEVNULL encoding=utf-8`）。
3. **只認 Exit Code 0 與真實互動**：
   - 所有產出元件必須具備真實按鈕與事件監聽，無互動死圖一律視為假成功。

---

## 🏭 單元工廠化與批次交付標準規約

> 完整規範文件：[`docs/UNIT_FACTORY_STANDARD.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/docs/UNIT_FACTORY_STANDARD.md)

- **真題多樣性（取消死板 10 題限制）**：依段考考卷自然分佈，真題有多少合適題型就覆蓋多少，嚴禁削足適履。
- **One-Screen 單屏緊湊防抖**：純 SVG/CSS 日系繪本風，教具高 $\le 420\text{px}$，外層總高 $\le 740\text{px}$ 免滑動。
- **機械化三硬閘門驗收體系**：
  - 閘門一（靜態資料契約）：`verify_<unit>.js`（結構、stem、正解、教具檔案存在）。
  - 閘門二（動態 CDP 實機測量與視覺審查）：`verify_<unit>_cdp.js`（390×844 視口實測高 $\le 420\text{px}$、零報錯）＋ `capture_preview.js` 實機截圖經 AGY 眼睛視覺審查無穿模無文字遮擋。
  - 閘門三（課綱大廳總檢）：`verify_curriculum_131.js`（131 條目、開放單元累計、帳實閉環）。

---

## 📚 歷史資產與覆盤檢討索引
- 📜 [CHANGELOG.md: 200+ 筆歷史交付與組件歷程](file:///d:/ANTIGRAVITY/028-1_國小數學APP/CHANGELOG.md)
- 🚨 [Session 32 覆盤報告: 題目清洗與派工流程全面體檢 (真題閹割反思)](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S32_EXAM_TRUNCATION.md)
- 🚨 [Session 35 覆盤報告: 做了什麼就說什麼，嚴禁虛假賦能](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S35_HONESTY_NO_FAKE_POWER.md)
- 🛡️ [Session 36 覆盤報告: 拒絕全局推倒重做與動態派工防偽法典](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/retros/RETRO_S36_SURGICAL_FIX_MANIPULATIVE.md)
