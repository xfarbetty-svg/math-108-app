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
- [x] BP 盲審 `R3_WORKER_BUILD_REPORT.md` 的 D-01~D-13 偏離裁決 + 新開 **TCK-09**（44px 熱區 vs 兩盒並排矛盾）
- [x] 一年級 108 課綱官方 9 大條目全量 100% 落地 (N-1-1 ~ D-1-1，90 題真題/8大獨立教具/28項閘門全綠)
- [x] 二年級 108 課綱首批核心條目落地：N-2-6 乘法陣列 (`<multiplication-array>`)、N-2-1 三艙位值盒 (`<thousand-value-box>`)、N-2-2 加減直式計算 (`<vertical-math-grid>`)、N-2-11 長度公尺量尺 (`<meter-scale-ruler>`)、S-2-1 幾何特徵與角 (`<angle-vertex-explorer>`)、N-2-7 乘法算式與倍數關係 (`<multiple-relator>`)、N-2-3 分數之初步認識 (`<fraction-pizza-slice>`)、N-2-4 容量之初步認識 (`<liquid-measuring-cup>`)、N-2-12 重量的認識 (`<weight-balance-scale>`)，各 10 題真題題卡全綠落地
- [x] 真題三級流水線跑通（$0 額度）：雙工兵平行解析 + Diff 比對 + 035 教育盲審首批 20 題真題落盤 (`data/g1_real_verified_exam_suite.json`)
- [x] A-SERVER 通道三（Gemini 8把Key池）100% 驗真秒通，確立遠端自治閉環
- [x] 人類真機盲審震撼教育（Session 09）：戳破「假湊 10 題、假出處標籤」虛榮指標，清除 7 題假題，回歸硬碟物理 4 份實體試卷真題（N-1-3 實打實 5 題）
- [x] 確立法典級真算理：21 必須畫出 2 個 ⑩、1 個 ①（修復 `tensBank`）；3+3 不可灌成 10 顆紅點；6+14 試卷畫 ⑩ 和 ① 圈合進位，廢除「大數/小數」荒謬標籤
- [x] 確立法典級角色分工：AGY 是監工、規格制訂者與嚴格挑刺者，施工一律派工 OpenCode CLI，絕不親自動手寫粗工代碼
- [x] Session 11 協作定錨與真題具象雙打樣落地（人類盲審驗真通過）：
  1. A 題「桌上的鉛筆（忠孝 114-1 期中第 3 題）」落盤驗收通過（`app/components/pencil_desk_demo.html`，木紋課桌、5 支愛心/條紋/素面真題長短鉛筆、4 連續關卡動態計數與套索圈選）。
  2. B 題「派對帽與蛋糕一對一配對（忠孝 114-1 期中第三大題）」落盤驗收通過（`app/components/party_pairing_demo.html`，3位小朋友、5頂帽子拋物線飛戴、3塊蛋糕櫻桃配對）。
  3. 實彈穿透 `tcool.cc` 目錄與教育局檔案系統直連通道，並盤點 `028_國小數學APP/vault/` 內存之 30+ 份 110~114 獅湖/陽明真題 PDF。
- [x] Session 12 C 題落地與官方 219 份段考真題同步閉環：
  1. C 題「水果排一列圈圈看（忠孝 114-1 期中三-2）」落盤驗收通過（`app/components/fruit_line_demo.html`，日系水果展架、純 SVG 🍉西瓜/🍎蓮霧/⭐楊桃/🍋檸檬、手繪紅色蠟筆套索、序數 vs 基數大陷阱動態破招演繹）。
  2. 將 `028_國小數學APP/vault/` 內存之 219 份官方段考真題無損同步進 `EXAM REAL/`，按 G1~G6 結構化歸檔，並建立 `EXAM_INDEX.md`。
- [x] Session 13 一到六年級總架構與 G1-N-1-1 首個實作單元 100% 落地閉環：
  1. 一到六年級官方 108 課綱全局拓撲骨架：`data/curriculum.json`。
  2. 首單元真題資料庫 SSOT：`data/units/G1/N-1-1.json`（嚴選 4 題忠孝國小期中真實段考題）。
  3. 一到六年級總入口容器與微核心控制器：`app/index.html` + `app/shell.js`（支援 G1~G6 頂部切換、單元路由、無痕嵌入具象教具、交卷結算回顧、三端自適應）。
  4. 機械化驗收：CDP 實機跑通年級切換、單元卡點擊、iframe 自動掛載，全流程 0 報錯通過。
- [x] Session 14 課綱 131 條全量重建、G1-N-1-2 落地與手機盲審體檢：
  1. 課綱 131 條目真理校準，N-1-1 與 N-1-2 標記 ready，其餘 129 條誠實標記 upcoming。
  2. 落地 G1-N-1-2（4 題忠孝期末真題 ＋ 4 套具象教具）。
  3. 實機盲審抓出手機版面致命傷（雙層外框吃高度、按鈕掉出螢幕外、小鳥像金魚）。
- [x] Session 15 算力通道架構真理對齊與自動 Failover 憲法固化：
  1. 徹底釐清三大法定通道實體：通道一（本地 OpenCode）、通道二（A-SERVER SSH 4.2s Exit 0）、通道三（035 8把Key池 200 OK）。
  2. 固化 026 `_allow_remote_fallback = True` 契約：通道一額度耗盡時毫秒級自動切換通道二，對人類完全透明，嚴禁中途打擾人類或在專案內重複造輪子。
- [x] Session 16 手機 One-Screen 單屏緊湊重構與 Q2 小鳥純向量重繪全綠落地：
  1. 通道一秒級響應，派工 OpenCode 施工工兵完成 `app/index.html`、`app/shell.js` 與 `app/components/birds_on_tree_demo.html` 重構。
  2. 手機版（390px）Shell 頂部壓縮至 36px 超窄單行，消除重複標題與空白 padding。
  3. `shell.js` 自適應高度精準貼合容器高度（434px），徹底破除 860px 撐滿死鎖。
  4. 徹底重繪純向量小鳥（亮黃尖喙、圓頭靈眼、立體雙羽翼、微翹尾羽、抓枝小爪），完全告別金魚魚鰭感。
  5. Playwright CDP 實機測量：390x844 單屏總高度 844px（零捲軸、免滑動），一屏完美容納「題幹 + 教具 + 選項 + 按鈕」！
- [x] Session 17 現存全量 8 題 One-Screen 單屏免滑動 100% 達成：
  1. 徹底落實「都應該盡可能免滑動」憲法標準，逐題優化 N-1-1 與 N-1-2 全部 8 套具象教具內部排版。
  2. 解決魚缸、披薩、餅乾在手機端 1fr 垂直堆疊爆屏痛點，改為橫向並列與寬扁 viewBox。
  3. Playwright CDP 8 題全量實機測量：內部高度 359px~556px，外層總高 451px~648px，8/8 全綠免滑動！
- [x] Session 18 導航檢查三合一 ＆ 臺灣腔語音朗讀 ＆ 手寫草稿板落地收工：
  1. 將「檢查答案」移至置底中央，「上一題」與「下一題」在左右兩側，消除內外雙重按鈕浪費，底部過多空白徹底收攏。
  2. 移植 028 經典規格：頂部「🔊 聽題目」（臺灣腔 zh-TW 語音朗讀、Emoji 清洗、世代推進防假死）。
  3. 移植 028 手機手寫草稿板：右下角常駐「📝 算草稿」，支援全螢幕 DPR 2x 觸控繪圖、三色螢光筆、橡皮擦與筆跡記憶。
  4. 8 題 One-Screen 測量全綠，截圖驗收通過保存於 `reports/screenshots/mobile_390_birds_q2.png`。
- [x] Session 19 四大視覺與排版痛點徹底根治（通道三重繪大樹 ＆ 500px 虛空空白消除 ＆ 草稿按鈕收編頂部 ＆ 西瓜排隊全量入屏）：
  1. 調用通道三（Google AI Studio 8把Key池）：徹底重繪 `birds_on_tree_demo.html` 樹木，告別生鏽瓦斯管直角樹，改為日系繪本有機曲線樹幹與三層次立體翡翠雲冠，小鳥著陸點完美對齊橫向枝幹。
  2. 消滅 500px 虛空粉紅空白：拔除 `party_pairing_demo.html` 等教具 `body` 的 `min-height: 100vh`，`shell.js` 拔除 900px 暴力死高度改為優先探測 `#app` 實體高度，底欄緊貼答題區。
  3. 草稿按鈕解套：廢除右下角 `position: fixed` 懸浮按鈕，收編至頂部題號旁與「🔊 聽題目」並列，手機底欄獨享操作熱區，不再遮擋「下一題」。
  4. 西瓜排一列全量入屏：拔除 `fruit_line_demo.html` 水平捲軸（`overflow-x: auto`），標牌緊湊化與自適應縮放，10 顆西瓜在 360px~390px 手機上 100% 一眼望穿，右側第 1 顆西瓜與起點標牌不再被夾頁吃掉。
- [x] Session 21 一年級單元四（N-1-4 錢幣）、單元五（N-1-5 長度）、單元六（N-1-6 時間）100% 落地閉環：
  1. 雙通道工具標準化：`tools/dispatch_worker.py` 原生支援 `--channel 1` (本地 OpenCode / GLM-5.3-flash-free) 與 `--channel 2` (A-SERVER SSH 備援)。
  2. 單元四（G1-N-1-4 錢幣解題，5 題真題 ＋ 5 套純向量教具）：大雄買蛋糕、早餐剛好46元、小光小日比錢多、珍珠補錢、50元換10元，CDP 自動化閘門 `tools/verify_n14.js` ALL PASS。
  3. 單元五（G1-N-1-5 長度比較，5 題真題 ＋ 5 套純向量教具）：基準線對齊破招、彎曲緞帶拉直、等長繩量腰圍、迴紋針個別單位測量、方格積木拼合，CDP 自動化閘門 `tools/verify_n15.js` ALL PASS。
  4. 單元六（G1-N-1-6 日常時間，5 題真題 ＋ 5 套純向量教具）：整點鐘報讀、半點鐘扇形破招、時鐘齒輪連動過2小時、長針旋轉一圈短針進位、立體桌上日曆今天昨天明天，CDP 自動化閘門 `tools/verify_n16.js` ALL PASS。
  5. 盲審修復：修復迴紋針題目選項按鈕 flex 寬度不一歪斜問題，重構為 2x2 等寬 Grid 佈局。
  6. 課綱條目同步：`data/curriculum.json` 一年級已開放 6/11 單元（合計 28 題真實試卷題），全域閘門全數 Exit Code 0。
- [x] Session 22 一年級 108 課綱官方 11 大條目 100% 全量落地閉環（已開放 11/11，合計 50 題真題 ＋ 4 套通用核心教具 ＋ 全域 CDP 綠燈）：
  1. 四套通用核心教具落地：`solid_shape_lab.html`（S-1-2 形體操作台）、`math_balance_scale.html`（R-1-1 等量天平）、`commutative_bead_bar.html`（R-1-2 雙色珠串翻轉板）、`tally_sorting_board.html`（D-1-1 正字計數分類板）。
  2. 單元題庫 SSOT 全數落盤：`S-1-2.json` (5題)、`R-1-1.json` (5題)、`R-1-2.json` (3題)、`D-1-1.json` (4題)、`S-1-1.json` (5題鏡像對齊 N-1-5)。
  3. 全量守門員測試全綠：`verify_s12.js`、`verify_r11_r12.js`、`verify_d11.js`、`verify_curriculum_131.js`、`verify_app_shell.js`、`ac_gate.js` 全部 Exit Code 0！
- [x] Session 24 回歸「教具先行（Visual-First）」最高憲法，三年級三大核心教具打樣 (v2 日系繪本擬物版) 100% 落地閉環：
  1. 全域防溢出鎖死：在 `app/index.html` 鎖死 `html, body { overflow-x: hidden; width: 100%; max-width: 100vw; }` 與 `user-scalable=no`，徹底根絕手機端「頁寬會動/左右飄移晃動」Bug。
  2. 單元誠實下架：在 `data/curriculum.json` 將三年級 N-3-1、N-3-2 撤回 `upcoming`，堅決不推未打樣半成品。
  3. 日系繪本擬物三大教具打樣落地 (`reports/g3_visual_samples_showcase.html` ＋ `app/g3_showcase.html`)：7 節自適應跳數小火車（360px~390px 滿版 100% 入屏、純 SVG 蒸氣火車頭、輪子、枕木、跳數拋物線弧線）、立體卡牌桌遊盤（最大 8720 與最小 2078 雙槽對照、千位避 0 警示、兩小題完整比較）、四艙位值收納台（翡翠綠千位箱、珊瑚紅百位板、雙 0 幽靈占位、滿十進千動畫）。
  4. 手機寬度極致優化：消滅雙層 80px 冗餘 padding，緊湊 8px~10px 貼邊，單手膠囊滑動導航。
  5. 機械化驗收全綠：`tools/verify_g3_showcase.js`（360px/390px 視口零溢出、全按鈕真實點擊）、`verify_curriculum_131.js`、`verify_app_shell.js` 全數 Exit Code 0！
- [x] Session 25 三年級 N-3-1 與 N-3-2 雙單元 100% 正式掛載上線 ＆ 手機真機體驗盲審閉環：
  1. G3-N-3-1（一萬以內的數）：10 題實體段考真題連通，日系擬物小火車、立體卡牌桌遊盤、四艙位值與滿十進千動畫組件化落地。
  2. 人類實機盲審抓出痛點並秒級修復：小火車車廂改為 `flex: 1 1 0; min-width: 0;` 7 節 100% 入屏根治截斷；拔除 `100vh` 與定時器防抖死區，徹底消滅手機畫面抖動。
  3. G3-N-3-2（加減直式計算）：10 題內湖國小段考真題連通，`vertical_calc_lab.html` 日系繪本擬物卡片化升級（千百十個位值引導虛線、珊瑚進位①、紅色退位借10劃線、逐步算理演繹動態）。
  4. 課綱條目同步：三年級已開放 2/24 單元（全專案開放 13/131 條目），全量守門員（`verify_n31.js`、`verify_n32.js`、`verify_curriculum_131.js`、`verify_app_shell.js`）全部 Exit Code 0！
- [x] Session 26 三年級第三單元 N-3-3 乘以一位數 100% 落地閉環（已開放 3/24，全專案 14/131 條目）：
  1. G3-N-3-3（乘以一位數）：精選 10 題實體段考真題（內湖 114-1/113-1/111-1 ＋ 永安 114-1），涵蓋二三位數直式、中間含 0、連續進位滿千、乘法比大小、估算乘積與情境應用題。
  2. 具象教具落地：`multiplication_lab.html` 日系繪本擬物乘法直式計算台，具備千百十個位值虛線對齊、逐步算理演繹動態（個位 $\to$ 十位 $\to$ 百位高亮）、珊瑚橘圓形進位氣泡漂浮動畫。
  3. 單屏防抖與極致緊湊：嚴格遵守 `height: auto` 與無 100vh，CDP 實機測量手機 390px 視口高度 409px~418px ≤ 420px，10/10 題一屏入眼零滑動零橫向溢出。
  4. 課綱與守門員全綠：`verify_n33.js`、`verify_n33_cdp.js`、`verify_curriculum_131.js`、`verify_app_shell.js`、`verify_n31.js`、`verify_n32.js` 全部 Exit Code 0！
- [ ] 下一步：推進三年級第四單元 `N-3-4 除法`（除法的意義與應用、幾個一數、乘除互逆基礎）。


---

## 🌐 題庫資源與資料庫來源 (SSOT)
- **核心題庫入口**：https://www.tcool.cc/（題庫酷 / 國小國中歷屆考古題雲端目錄）。
  - 涵蓋全台各縣市國小（忠孝、獅湖、內湖、民權、安和、大華、建德等）之公開試卷雲端資料夾與下載模組。
  - 後續擴充題庫一律以此站彙整之學校官方來源為準，禁止漫無目的空轉。
- **現存實體考卷基準 (EXAM REAL/G1/)**：
  1. 高雄市忠孝國小 114-1 期中試卷
  2. 高雄市忠孝國小 114-1 期末試卷
  3. 高雄市忠孝國小 114-2 期末試卷
  4. 臺北市內湖國小 114-2 期末試卷

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
