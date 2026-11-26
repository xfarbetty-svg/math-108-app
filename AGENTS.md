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

### 軍規八：Pillow `anchor="ls"` 基線對齊＋長除法同位值垂直對齊鐵律
- **文字一律 `anchor="ls"`**：Pillow 預設 `anchor="la"` 會讓文字下掉穿過減法橫線；黑板卡所有 `d.text()` 必須明確指定 `anchor="ls"`（基線對齊）。
- **座標框架單一化**：任務/規格給的 X、Y 若落在黑板安全區 `[580,120,1820,780]`，即為**成片 1920×1080 視訊座標**；1240×660 圖卡以 (580,120) 貼入，圖卡座標 = 視訊座標 − (580,120)。嚴禁混用框架。
- **同位值垂直一條線**：長除法固定欄位 `除數 820 / 左撇 865 / 百位 920 / 十位 1020 / 個位 1120 / 橫線右端 1175`（視訊 X）；同一位值的商、被除數、乘積、餘數共用同一 X，個位未參與運算時必須留空，嚴禁錯欄（S03 的 28 必須 `2` 在百位、`8` 在十位）。
- **固定列距與淨空**：商 265／上橫線 285／被除數 345／乘積 405／減法橫線 425／餘數 485／最終餘數 608／結論框 675..745；橫線與數字上下各 ≥18px，最終餘數與結論框 ≥30px；黃框上緣必須嚴格低於上橫線。

---

## 🗺️ 里程碑進度總表 (宏觀進展)
> 📌 **詳細歷史打勾清單（200+ 筆歷史交付細項）** 已完整封存於：[CHANGELOG.md](file:///d:/ANTIGRAVITY/028-1_國小數學APP/CHANGELOG.md)

- [x] **Phase 1: 一年級 (G1) 108 課綱 9 大單元**：100% 落地完工 (N-1-1 ~ D-1-1 共 28 條子題庫與教具)。
- [x] **Phase 2: 三年級 (G3) 108 課綱 24 大單元**：100% 大滿貫落地 (含 23 套概念小教室與 71 套互動組件)。
- [x] **Phase 3: 全站語音架構與 Gate 4 守門員**：微軟 Edge-TTS 曉臻自然女聲單例架構上線，CDP 實機驗證全綠。
- [x] **Phase 4: 二年級 (G2) 108 課綱 24 大單元**：100% 大滿貫落地！(含 24 套概念實驗室、24 單元 121 題高階真題與 121 套 034 向量微教具全量落地，全站累計開放 59/131 條目，實裝 035 機器多模態視覺硬門禁)。
- [x] **N-3-4 米米概念小教室影片（最終成片已上線）**：`N34_Final.mp4`（1920×1080/30fps/101.633s/約 19.5 MB）已合成並掛載 `app/shell.js` 的 `N-3-4`／`N-3-5`；`tools/release.py` Build `20261120_171001` 全綠部署至 https://math-108.pages.dev，线上映射與影片 HTTP 200 驗真。
- [x] **N-3-17 時間概念小教室影片（最終成片已上線）**：`N317_Final.mp4`（1920×1080/30fps/4570 幀/152.333s/23.11 MiB/AV 誤差 0.000s）已合成並掛載 `app/shell.js` 的 `N-3-17`；四道門禁（curriculum131／app_shell／n317／n317_cdp）全綠，commit `1a47f44` 已 push上線。首壓 1280k → 25.48 MiB 超標如實記錄，單點降 1150k 重壓通過；線上影片 HTTP 200 / `video/mp4`。完整 5 欄報告見 `reports/20261122_N317_ACCEPTANCE.md`。
- [x] **G3 第二棒全線收官（2026-11-22）**：修復 N-3-1／N-3-3 選項與答案破綻，R-3-1／R-3-2／D-3-1 各補 Q06–Q10（15 題），三教具升級 `?q=1..10`＋Light/Dark＋420px；G3 24 單元 240 題契約全綠，CDP 60 張雙模式截圖全綠，commit `a2efb4c` 已 push 部署。報告：`reports/20261122_G3_AUDIT_AND_BATCH2_COMPLETE.md`。
- [x] **S-3-4 Q2 圓規複製教具改造（2026-11-23）**：`solid_geometry_lab.html?q=2` 由靜態圖改為真實量距／圓規張合對齊／逐段截取＋`已複製 N/4`＋重置；自建 CDP 四組合全綠，`release.py` 20 道閘門全綠，commit `2d59575` 已 push 部署。報告：`reports/20261123_007_S34_Q2_COMPASS_ACCEPTANCE.md`。
- [x] **S-3-4 幾何形體概念小教室影片 5 大硬傷精修（2026-11-23）**：修復等角透視正方體/長方體、並排三角形木棍真題規律、滾動家族分欄消疊字、提升字幕安全框高距底 76px、米米兔多姿勢走位與「量折線」破音字二聲「良」校正；成片 `S34_Final.mp4`（106.12s / 9.54 MiB / AV diff 0.02s）與門禁全綠，commit `7ded6a8` 已 push 部署至 Cloudflare Pages。
- [x] **G3 概念影片第 1/3 批（N-3-1／N-3-2／N-3-3）＋ N-3-9 響度統一（2026-11-23）**：3 支四幕 `full_stage` 成片全綠（N31 101.033s／N32 97.767s／N33 97.067s，皆 1920×1080、−14.04 LUFS、<9.1 MiB）；`g3_n39_concept_final.mp4` 由 −19.37 拉至 −14.29 LUFS（`-c:v copy`）；`shell.js` 掛載 6 行映射；7 道門禁全 Exit 0（單點修正 `verify_n31.js` Q1 選項數 2→4 陈旧期待值）；commit `fe33be6` 已 push，Pre-Push Hook 完成 Cloudflare Pages 部署。報告 `reports/20261123_014_N31_N32_N33_CONCEPT_MOVIES_ACCEPTANCE.md`。
- [ ] **R-3-1／R-3-2／D-3-1 唯讀地毯盤點（2026-11-23）**：30 題＋3 教具完成靜態解析與 CDP 60 組合（390×844／1280×800）量測，正式檔零修改；報告 `reports/20261123_008_R31_R32_D31_AUDIT.md`。待確認「繼續」後依 P0（R-3-2 補 q-scene/.b/.t/.s CSS）→P1（R-3-1 去舊分頁還原互動）→P2（D-3-1 去舊 nav／修桌面留白）→P3 回歸施工。
- [x] **G4 雙貓最終精修（2026-11-24）**：多米 ping-pong 187 幀（倒放逐像素相同、MAE=0.0000、零交叉溶解重影）；小貓全域 >205 清白邊＋局部 ROI（sprite x0–258/y396–418, mn>180）清灰墊（MAE=0.0000）；起跑 x=760 使 t=0 重疊 0px；10s demo／preview 重生。報告 `reports/20261124_006_G4_FINAL_ROI_ACCEPTANCE.md`；全程無 Git。

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
   - **Plan 階段強制限速與禁開提案後門**：試卷題型分析、Given-When-Then 藍圖、故事分鏡與任務卡草擬，**強制調用 MCP 通道三（035 金鑰池 `ask_gemini_pool`）**。**嚴禁以「企劃草案 (Proposal)」為名在主對話框動筆腦補**！提案即 PLAN，未獲 035 產出前禁止在對話框推演。
   - **跨專案資產前置強檢 (Pre-flight Inspection)**：凡涉及影音、角色與情境教室，**第一動強制檢索 `036_local_painter/theater`**（確認 3D 黏土 SVD 視訊資產與 48:52 影院規格）及 `034`（向量微教具），嚴禁閉門造車手刻 2D 偽資產。
   - **Exec 階段嚴禁動手**：題庫 JSON 封裝、教具組件與測試腳本，**一律指派通道一（OpenCode CLI）施工**，AGY 零業務代碼寫入權 (`WRITE-FILE LOCKED`)。
   - **AGY 法定職責**：前置調研資產 -> 調度通道三出藍圖 -> 雙簽放行 -> 派工 OpenCode -> 親自執行軌道 B 多模態視覺審查 (`read_file`) -> 執行 `tools/release.py` 自動發布。
2. **唯一標準派工通道**：
   - 派工指令：`python tools/dispatch_worker.py --file <task_card.md> "任務簡述"`
   - 嚴格遵守 Step-by-Step 單步推進底層規格（`--format json --auto --standalone stdin=DEVNULL encoding=utf-8`）。
3. **只認 Exit Code 0 與真實互動**：
   - 所有產出元件必須具備真實按鈕與事件監聽，無互動死圖一律視為假成功。

---

## 🎬 G3 米米動態母片清單（`036_local_painter` 動態素材來源）

全部 6 支於 `036_local_painter/theater/assets_hosts/g3_mimi/ready/`（每支 `mp4` + `webm`，41 幧/16fps/512×512，閉環 MAE=0.000，首尾合成純白）：

| tag | 姿勢/動作 | 交付 |
|---|---|---|
| `loop_apose` | A-pose 站姿（閉環） | 已完成 |
| `loop_ask` | 投誠問候 | 已完成 |
| `loop_hips` | 叉腰總結 | 已完成 |
| `loop_arm_raised` | 舉起右手 | 已完成（任務 A） |
| `loop_clap` | 歡呼鼓掌 | 已完成（任務 B） |
| `loop_thumbs_up` | 豎大拇指 | 已完成（任務 C） |

顯示建議：以 `loop_<tag>.mp4`（純白底 H.264）作顯示底圖為安全選項；`webm` 為透明底圖，新增驗收腳本為 `036_local_painter\_scratch\20261121_001_verify_loops.py`（要求 WebM `alpha_mode=1`）。

> ⚠ 驗收注意：FFmpeg 9.0（gyan static build）無法編出帶 alpha 的 VP9（已實測 VP8 亦無，`ffprobe -show_streams` 顯示 `alpha_mode=None`）；若要硬達成 `alpha_mode=1`，需更換可產出 alpha VP9 的 ffmpeg，或改用 `mp4` 底圖方案。

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

---

## 🎞️ N313 動態母片合成實測修正（2026-11-21 附加章節）

- 上節「webm 為透明底圖」之假設經實測**不成立**：`ready/loop_*.webm` 以現行 ffmpeg 解出為 `yuv420p`、**alpha 全 255**，`alpha_mode=1` 僅為容器標籤；且每支 41 幀中**第 33–39 幀被烘成黑底**。
- 合成 N313 成片時，角色層必須：①只讀 SSOT `ready/` 的 `.webm`（禁 `.mp4` 預覽）；②逐幀自適應偵測背景色（白／黑）做連通泛洪鍵除＋2px 軟邊；③剔除黑底異常幀；④透明比例 < 0.30 即 raise 防假成功。
- `mouth_frames_v2` 源自 2048 立繪、與 webm 非同一光源，需羽化遮罩＋局部膚色增益，禁 seamlessClone。
- 已驗證產物：`app/assets/classroom_videos/N313_Final.mp4`（57.933 s／12.73 MiB／影音誤差 0.000 s）。詳細斷點見 `handoff.md`。

---

## 📐 G3 經驗蒸餾強制鐵律（2026-11-23 生效，G1/G2/G4/G5/G6 自動繼承）

> 完整規範：[`docs/PRODUCTION_SOP_G3_DISTILLED.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/docs/PRODUCTION_SOP_G3_DISTILLED.md)｜上傳 SOP：[`docs/YOUTUBE_UPLOAD_WORKFLOW_GUIDE.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/docs/YOUTUBE_UPLOAD_WORKFLOW_GUIDE.md)。與舊慣例衝突時以本節為準。

- **鐵律一（真題與教具）**：題庫 100% 採用台灣各縣市國小真實段考題並標明學校／學年度／出處（SSOT：`docs/G3_REAL_EXAM_MASTER_POOL.md`），嚴禁 AI 杜撰或為湊題數閹割高階題；互動教具須有「一步一步看算理」拆解＋真實事件監聽，且 **Dark/Light 雙模式高對比度皆須目視通過**。
- **鐵律二（概念影片）**：四幕暖米色無限畫布（生活情境 → 圖像動態高光 → 陷阱 `✗`/`✓` 對比 → 三大口訣）；角色只用 `app/assets/mimi_poses/` 3D PNG＋`full_stage`，**嚴禁 SVG 自繪**；字幕黑框距底 ≥76px（`y ≤ 960`）；每片抽 4 幕影格自檢零疊字／零裁切／零前幕殘影。
- **鐵律三（音訊與部署）**：全片 `loudnorm` 雙階段校正至 **-14.0 LUFS**；Windows 執行含 Emoji／中文腳本前必設 `PYTHONIOENCODING=utf-8`；>25 MiB 總合集只放 `_scratch/` 並列 `.wranglerignore`，禁推 Pages。
- **鐵律四（YouTube SOP）**：`tools/build_g3_youtube_compilation.py` 串接去重 → `tools/20261123_001_upload_g3_youtube_compilation.py` 上傳；憑證 `034_anatomy_interactive_svg/token.json`（自動刷新），`youtube.upload` scope、教育類 `27`、`selfDeclaredMadeForKids`、預設 `unlisted`；上傳後 oEmbed 驗真。**G3 收官：24/24 全滿編，總合集 ID `M4N_UNwBT5Y`（https://youtu.be/M4N_UNwBT5Y）。**
- **隔離紅線**：`client_secret*.json`／`token*.json`／`_scratch/`／`handoff.md` 永不進 Git；嚴禁碰 `017\` 或「子由」。
