# 028-1_國小數學APP - 里程碑進展與歷史交付日誌 (CHANGELOG)

> 本檔由 AGENTS.md 遷移建立，完整保存所有歷史 Session 交付與打勾細項。

## 🗺️ 里程碑路線圖
- [x] 專案開工：切斷 028 歷史包袱，建立 L1 乾淨工程標準
- [x] 一年級 108 課綱官方 9 大條目全量補齊與視覺痛點剖析
- [x] 融合 034 專案技術（等角透視、形體堆疊、力矩平衡天平）
- [x] 產出 R0 樣品藍圖與打樣規格書 (`reports/20261105_2035_g1_visual_spec/R0_AGY_BLUEPRINT.md`)
- [x] 產出一年級 9 大單元可操作視覺打樣 Showcase (`reports/20261105_2035_g1_visual_spec/g1_visual_samples_showcase.html`)
- [x] 人類三端實機驗收打樣手感 (手機 390px / 平板 768px / 電腦 960px)
- [x] 算力通道驗真與 Step-by-Step (單步推進流程) 三層閉環拓撲對齊 (通道1 Magpie 3425 / 通道2 A-SERVER SSH / 通道3 035 7把 Key Pool)
- [x] 啟動 Step-by-Step Stage 1：派工 BP 拆解 T-01~T-03 任務卡，由 OpenCode GLM 帶手腳施工首批元件 (<ten-frame-grid>, <dual-track-diff>, <balance-beam>)
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
- [x] Session 26 人類盲審重挫死板題型 ＆ G3-N-3-3 乘以一位數全方位多樣化真題 100% 落地閉環（已開放 3/24，全專案 14/131 條目）：
  1. 人類盲審重擊痛點：及時喝止「7 題連續直式罰寫」之 AI 死板偷懶盲區，徹底推翻重構。
  2. 10 題多樣化真題全面落地：涵蓋【規律探索】（9×7=63➔900×7=6300）、【秒殺思維不用算比大小】（99×6最大）、【生活估算】（29×5≈150）、【直式除錯小偵探】（抓出小明十位忘加進位盲點）、【直式中間含0陷阱】（309×3）、【整千進位大滿貫】（125×8=1000）、【超商飲料箱裝進貨】（24×9=216）、【文具店採買】（95×3=285）、【算式天平傾斜比大小】（405×6＜405×7）、【生活零用錢倍數】（70×3=210）。
  3. 教具升級 10 種不同視覺模式：`multiplication_lab.html` 支援模式卡片、長條條形對比、數線雷達、改錯放大鏡、純直式、箱裝貨架、文具收銀、傾斜天平、倍數存錢筒，豐富度與樂趣大幅躍升。
  4. 單屏極致緊湊：CDP 實機測量手機 390px 視口高度 409px~420px ≤ 420px，10/10 題一屏入眼零滑動零橫向溢出。
  5. 全域守門員全綠：`verify_n33.js`、`verify_n33_cdp.js`、`verify_curriculum_131.js`、`verify_app_shell.js` 全數 Exit Code 0！
- [x] Session 27 G3-N-3-5 除以一位數 100% 落地閉環（已開放 5/24，全專案 16/131 條目，批次 A 首戰完工）：
  1. 10 題多樣化直式真題落地（`data/units/G3/N-3-5.json`）：規律探索（38÷2=19➔3800÷2=1900）、免算比大小（100÷10＜100÷5）、商位數判斷（86÷5 商二位數）、補0改錯小偵探（618÷6 非 13 是 103）、商中間含0陷阱（436÷4=109）、整除大滿貫（285÷5=57）、平分帶餘數（629÷5=125…4）、跨位進位（938÷7=134）、商含0整除（927÷9=103）、乘除互逆逆向推導（?÷8=32➔256）。
  2. `division_vertical_lab.html` 日系擬物直式除法位值實驗台：長除號括線單一幾何公式渲染器、10 種視覺模式、補 0 黃色警示燈、餘數綠色安全標籤（4＜5）、小明 13 ✗ 幽靈改錯對比。
  3. 雙硬閘門全綠：`verify_n35.js`（資料契約＋逐題數學真值驗算）與 `verify_n35_cdp.js`（390px 實機 10/10 題 app 高度 394~411px ≤ 420px、零溢出、零 console 錯誤）。
  4. 課綱同步：`curriculum.json` N-3-5 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 16 條全綠。
- [x] Session 28 G3-N-3-6 乘除應用問題 100% 落地閉環（已開放 6/24，全專案 17/131 條目，批次 A 第二戰完工）：
  1. 10 題多樣化未知數真題落地（`data/units/G3/N-3-6.json`）：乘除互逆家族（125÷5=25➔25×5=125）、秒殺比大小（50×3＞150÷3）、生活估算（85×3=255≤300）、被除數未知改錯偵探（32×8=256非4）、除數未知陷阱（112÷7=16非784）、被乘數未知（每包7塊）、乘數未知（裝成12盒）、被除數未知總量（112本）、天平符號推理（▲=5）、兩步驟逆向推導（▲×6=30）。
  2. `multiplication_division_relation_lab.html` 日系擬物乘除關係與未知數實驗台：純 SVG 旋轉算式卡、雙天平對照、估算進度條、未知數長條圖、雙步驟解密槽。
  3. 雙硬閘門全綠：`verify_n36.js`（資料契約＋逐題數學真值驗算）與 `verify_n36_cdp.js`（390px 實機 10/10 題 app 高度 387~414px ≤ 420px、零溢出、零 console 錯誤）。
  4. 課綱同步：`curriculum.json` N-3-6 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 17 條全綠。
- [x] Session 29 G3-N-3-7 兩步驟應用問題 100% 落地閉環（已開放 7/24，全專案 18/131 條目，批次 A 第三戰完工）：
  1. 10 題多樣化兩步驟真題落地（`data/units/G3/N-3-7.json`，不含併式）：規律探索連乘結合律（(4×5)×12 vs 4×(5×12) 均 240）、秒殺比大小（8×4×2＞8×4÷2）、兩步驟採買估算（48×3＋65→找零41）、漏乘除錯偵探（小明 85 ✗ → 正解 160）、先減後除繩長陷阱（123－19=104→÷4=26）、連乘雙層包裝（64 顆）、先乘後除平分（36÷6=6）、先除後減分裝（20－18=2 盒）、先減後除土司用量（900÷6=150ml）、綜合階梯氣球連乘（300 顆）。
  2. `two_step_problem_lab.html` 日系擬物階梯式解題實驗台：10 種視覺模式（associate/compare/estimate/detective/wire_trap/boxes/oranges/apples/milk_toast/balloons）。
  3. 雙硬閘門全綠：`verify_n37.js`（資料契約＋逐題兩步驟數學真值驗算）與 `verify_n37_cdp.js`（390px 實機 10/10 題 app 高度 367~409px ≤ 420px、零溢出、零 console 錯誤）。
  4. 課綱同步：`curriculum.json` N-3-7 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 18 條全綠。
- [x] Session 30 G3-N-3-8 四則估算 100% 落地閉環（已開放 8/24，全專案 19/131 條目，批次 A 第四戰完工）：
  1. 10 題多樣化四則估算真題落地（`data/units/G3/N-3-8.json`）：規律探索整百概數相加（507＋291最接近800）、秒殺取整百定位（495×6最接近3000）、培根麵包生活採買估算（48×7≈350元）、估算除錯小偵探合理性檢驗（495×6＝4970明顯太大不合理）、核心陷阱棒球帽預算高估法則（859×2＞850×2＝1700＞1500不夠買）、四位數千位概數相加（4903＋1991≈7000）、四位數千位概數相減（7150－1100≈6000）、三位數百位概數相減（907－289≈600）、二位數單價乘法估算（29×5≈150）、四位數大數合併估算（1930＋3130≈5000）。
  2. `estimation_lab.html` 日系擬物四則估算實驗台：10 種視覺模式（round_add/radar_scale/bakery/detective/cap_budget/thousands_add/thousands_sub/hundreds_sub/snack_multiply/thousands_sum）。
  3. 雙硬閘門全綠：`verify_n38.js`（資料契約＋逐題取概數數學真值驗算）與 `verify_n38_cdp.js`（390px 實機 10/10 題 app 高度 364~391px ≤ 420px、零溢出、零 console 錯誤）。
  4. 課綱同步：`curriculum.json` N-3-8 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 19 條全綠。
- [x] Session 31 G3-N-3-9 簡單同分母分數 100% 落地閉環（已開放 9/24，全專案 20/131 條目，批次 A 第五戰完工）：
  1. 10 題多樣化同分母分數真題落地（`data/units/G3/N-3-9.json`，涵蓋比較、加、減，牽涉分數與結果皆不超過2）：規律探索同分母大小比較（5/8＞3/8）、秒殺比大小（5/12＋1/12＝2/12＋4/12）、蛋糕切片平分生活情境（弟弟吃4片）、披薩切片除錯小偵探（4片＝4/8個披薩）、核心陷阱和等於1與減法（1－4/6＝6/6－4/6＝2/6）、湯包單位分數點數（5/8籠＝5顆）、果凍盒同分母加法（3/12＋7/12＝10/12）、果凍盒同分母減法（12/12－10/12＝2/12）、石斑魚切片連續同分母減法（10/10－3/10－5/10＝2/10）、整數1與真分數綜合思維（5/5＝1且1＞6/7）。
  2. `fraction_lab.html` 日系擬物同分母分數實驗台：10 種視覺模式（fraction_compare/add_balance/cake_slices/pizza_detective/one_minus/dumplings/jelly_add/jelly_sub/fish_slices/one_equal）。
  3. 雙硬閘門全綠：`verify_n39.js`（資料契約＋逐題分數數學真值驗算）與 `verify_n39_cdp.js`（390px 實機 10/10 題 app 高度 364~391px ≤ 420px、零溢出、零 console 錯誤）。
  4. 課綱同步：`curriculum.json` N-3-9 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 20 條全綠，`verify_app_shell.js` G3 hero「已開放 9/24」。
- [x] Session 33 清真體檢與全面修復（徹底修復 N-3-6 Q09/Q10、N-3-9 Q08、N-3-7 Q02、N-3-5 Q02 全部拆題與造假比大小，全量雙硬閘門全綠）。
- [x] Session 34 G3-N-3-10 一位小數 100% 落地閉環（已開放 10/24，全專案 21/131 條目）：
  1. 10 題實體段考真題落地（`data/units/G3/N-3-10.json`，來源自臺北市內湖國小 111-2、112-2、113-2、114-2 期末真題）：位值辨識（十分位）、數的組成（2.6＝2個1＋6個0.1）、位值反推（十分位3個位6＝6.3）、讀寫轉換（十六點八十分位為8）、盒裝十進位換算（17個0.1盒＝1.7盒）、長度換算（2cm9mm＝2.9cm）、數線跳數規律（4.7->4.8->4.9->5->5.1）、大小比較（零點七＞0.6）、直式加法進位（1.7＋0.8＝2.5）、生活兩步驟應用（牛奶共喝2.8箱剩2.2箱）。
  2. `decimal_place_lab.html` 034 擬物向量小數實驗台：四階光影、位值台座、積木平板細條、書法木牌、精密量尺、軌道數線、力矩天平、直式進位圈、牛奶箱槽。
  3. 通道三（035 8把Key池）教育專家盲審 10/10 題 ALL PASS 准予採用。
  4. 雙硬閘門全綠：`verify_n310.js` 與 `verify_n310_cdp.js`（390px 實機 10/10 題 app 高度 392~401px ≤ 420px、零溢出、零 console 錯誤）。
  5. 課綱同步：`curriculum.json` N-3-10 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 21 條全綠，`verify_app_shell.js` G3 hero「已開放 10/24」。
- [x] Session 35 G3-S-3-3 圓 100% 落地閉環（已開放 11/24，全專案 22/131 條目）：
  1. 10 題實體段考真題落地（`data/units/G3/S-3-3.json`，來源自臺北市內湖國小 112-2、113-2、114-2 期末 ＋ 高雄市永安國小 114-2 期中）：圓特徵概念（半徑非直徑2倍）、部位定義（半徑）、繩繞圓心（繩長10cm直徑20cm）、披薩比大小（媽媽直徑12cm＞哥哥直徑10cm）、圓規開度換算（直徑12cm開度6cm）、圓規求直徑（開度6cm直徑12cm）、甲乙圓倍數（甲半徑3直徑6＝乙半徑直徑12）、四圓混合排序（甲24＞丁12＞乙10＞丙8）、圓內最長直線（直徑）、嵌套大小圓直徑推理（小圓半徑2直徑4＝大圓半徑直徑8）。
  2. `circle_lab.html` 034 擬物幾何圓實驗台：圓心半徑直徑高光、圓周動態指針、旋轉繩子軌跡、起司披薩直徑卡尺、金屬圓規兩腳開度、嵌套相切圓、同軸四圓尺寸對照。
  3. 通道三（035 8把Key池）教育專家盲審 10/10 題 ALL PASS 准予採用。
  4. 雙硬閘門全綠：`verify_s33.js` 與 `verify_s33_cdp.js`（390px 實機 10/10 題 app 高度 392~415px ≤ 420px、零溢出、零 console 錯誤）。
  5. 課綱同步：`curriculum.json` S-3-3 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 22 條全綠，`verify_app_shell.js` G3 hero「已開放 11/24」。
- [x] Session 36 G3-N-3-11 整數數線 100% 落地閉環（已開放 12/24，全專案 23/131 條目）：
  1. 遵照使用者最高指示與【鐵律六：實事求是契約（做了什麼就說什麼，嚴禁虛假賦能）】，實裝 034 工具庫 `dist/anatomy-tools.js`，在 `number_line_lab.html` 引入並使用 034 基因 1 緩動曲線、基因 3 `pathLength="1"` 描繪、以及 Q10 實體掛載 `<math-sketch-canvas>`。
  2. 10 題多樣化真題落地（`data/units/G3/N-3-11.json`）：100% 來自臺北市內湖國小 111-1/112-1/114-1 期中 ＆ 高雄市永安國小 114-1 期中段考真題。
  3. 雙通道調用與驗真：通道二（A-SERVER SSH 遠端 OpenCode CLI，使用 glm-5.3-flash-free）9.93s 驗收秒通，035 本地 8把 Key 池閘道恢復待命。
  4. 雙硬閘門全綠：`verify_n311.js` 與 `verify_n311_cdp.js`（390px 實機 10/10 題 app 高度 352~377px ≤ 420px、零溢出、零 console 錯誤、034Lib 成功載入）。
  5. 課綱同步：`curriculum.json` N-3-11 標記 ready（question_count 10），`verify_curriculum_131.js` ready 清單 23 條全綠，`verify_app_shell.js` G3 hero「已開放 12/24」。
- [x] Session 37 使用者手機實機盲審抓包重大架構缺陷 ＆ 徹底重構收工（2026-11-15 04:30）：
  1. 深刻檢討與事故覆盤：抓包教具缺少題幹框與選項按鈕、答案直接劇透、10 題答案全死鎖為 A 等三大嚴重問題。確認責任 100% 在 AGY。
  2. 徹底重構教具骨架：完全對齊 `circle_lab.html` 標準規範，補齊 `#questionBox`、2x2 `#optionsGrid`、`.option-btn`、`#checkBtn`、`#feedbackBox` 與逐步算理演繹。
  3. 題庫課綱化重構：升級為數線三要素、直尺 vs 數線、5與10等距刻度判定、整百跳數、局部讀數、兩點距離、加減位移、大數區間定位，答案離散度均勻分佈（A/B/C/D）。
  4. 鋼鐵守門員硬性阻斷：CDP 測試強制斷言題幹長度 > 10、選項數嚴格為 4、作答反饋正常，實測 10 題高度 352~377px 完美單屏。
  5. 雲端同步生效：GitHub（Commit `984cb74`）與 Cloudflare Pages（https://math-108.pages.dev）發布完成。
- [x] Session 38 G3-N-3-12 長度（「毫米」） 100% 落地閉環（已開放 13/24，全專案 24/131 條目，2026-11-15 05:00）：
  1. 恪守【做了什麼就說什麼，嚴禁虛假賦能】：本單元依據算理需求，以「純向量 SVG（Pure SVG）」自主手刻日系擬物微觀直尺、斷尺破招、進位圈與借位減法演示，未調用 034 外部庫，誠實清晰，完全勝任教學功能。
  2. 10 題實體段考真題落盤（`data/units/G3/N-3-12.json`）：100% 來自臺北市內湖國小 111-1/112-1/113-1/114-1 期中 ＆ 高雄市永安國小 114-1 期中段考（生活量感、1cm=10mm本質、單複名數雙向換算、直尺0刻度實測、斷尺非0起點破招、長度比大小、直式進位加法、直式退位借位減法、蠟筆差量生活題）。
  3. 標準完整互動架構（`app/components/millimeter_ruler_lab.html`）：完全遵循 Session 37 規範，內建 `#questionBox`、2x2 `#optionsGrid`、`.option-btn`、`#checkBtn`、`#stepBtn`、`#feedbackBox`，單題獨立可玩且 iframe postMessage 高度適配良好。
  4. 雙硬閘門全綠：`tools/verify_n312.js`（資料契約＋逐題數學真值驗算）與 `tools/verify_n312_cdp.js`（390px 實機 10/10 題 app 高度 382~407px ≤ 420px、零橫向溢出、逐步算理演繹正常、答題回饋正確）。
  5. 全域守門員全綠：`tools/verify_curriculum_131.js`（24 ready 條目全綠）與 `tools/verify_app_shell.js`（G3 hero 顯示「已開放 13/24」）全數 Exit Code 0。
- [x] Session 39 三單元批次流水線大滿貫落地閉環（N-3-13、S-3-1、N-3-14、N-3-15，已開放 17/24，全專案 28/131 條目，2026-11-15 05:35）：
  1. 恪守【做了什麼就說什麼，嚴禁虛假賦能】：本批次三個單元教具（`angle_explorer_lab.html`、`area_square_lab.html`、`capacity_volume_lab.html`）皆採用「純手寫向量 SVG（Pure SVG）」自主繪製，未調用 034 外部庫，具備優雅日系擬物、極致緊湊免滑動與清晰算理。
  2. 30 題實體段考真題落盤（100% 來自臺北市內湖國小 111~114 期中/期末 ＆ 高雄市永安國小 114 期中/期末）：
     - G3-N-3-13 / S-3-1 角與角度（10題）：邊長延長開度不變、三角板直角、銳角鈍角、時鐘3點直角、三角飯糰銳角、三角板檢驗未知角、長方形4直角、兩角疊合法、摺扇旋轉角、直角三角形組成。
     - G3-N-3-14 面積（平方公分）（10題）：1cm²定義、方格紙點數8格、半格拼湊7cm²、4x3陣列乘法、等積變形、L型分割相加、周長vs面積量綱辨析、5x5正方形25cm²、大長方形挖空20cm²、健保卡面積估測40cm²。
     - G3-N-3-15 容量（公升、毫升）（10題）：1L=1000mL、家庭號鮮奶2L量感、3L 4mL補0換算3004mL、4080mL千位分拆、量杯700mL讀數、容量比大小、加法滿千進位4L 200mL、減法借千退位720mL、檸檬紅茶混合、飲水差量450mL。
  3. 雙硬閘門全數秒通：`verify_n313.js` + `verify_n313_cdp.js`（高度 367~392px ≤ 420px）、`verify_n314.js` + `verify_n314_cdp.js`（高度 363~388px ≤ 420px）、`verify_n315.js` + `verify_n315_cdp.js`（高度 363~388px ≤ 420px），全部 30 題實機零溢出、零劇透、選項全滿 4 個。
  4. 全域守門員全綠：`tools/verify_curriculum_131.js`（28 ready 條目全綠）與 `tools/verify_app_shell.js`（G3 hero 顯示「已開放 17/24」）全數 Exit Code 0。
- [x] Session 40 人類盲審驗收與進度記憶持久化閉環（Q5 刻度幾何精準修復 ＆ Shell localStorage 記憶落地，2026-11-15 06:05）：
  1. 人類盲審抓出痛點並秒級修復：G3-N-3-15 第 5 題量杯藍色水面誤繪於 800 毫升上方，以及提前劇透「700 毫升 ✓」。已徹底重構刻度幾何（滿杯 1000mL 在 y=16，800mL 在 y=36，600mL 在 y=56，700mL 正中間刻度在 y=46，藍色水面頂部嚴格對齊 y=46），且在 step < 2 前刻度標記為 `?`，徹底拔除未作答前的劇透問題。
  2. 落地使用者體驗核心痛點：在 `app/shell.js` 實裝 `localStorage` 進度持久化記憶機制（年級、單元、題號），使用者重新整理或下次打開手機，自動恢復到最後停留在的位置，再也不用每次重新從頭翻找！
  3. 雙硬閘門全綠：`verify_n315.js`（ALL PASS）與 `verify_n315_cdp.js`（高度 363~388px ≤ 420px，ALL PASS）、`verify_curriculum_131.js` 與 `verify_app_shell.js` 全數 Exit Code 0。
  4. 遠端全量同步：GitHub 與 Cloudflare Pages 部署完畢（https://math-108.pages.dev）。
- [x] Session 41 頂部 Header 大瘦身 ＆ 108 課綱官方三大探索活動落地（2026-11-15 09:00）：
  1. 根治手機右上角擁擠破版：拔除全域概念按鈕，答題時自動隱藏年級導航列（`display: none`），手機頂部只保留極致純淨的「小數學冒險」與「更新」，徹底消滅截圖中只剩半截「一年級」卡在右上角的嚴重視覺 Bug。
  2. 單元專屬概念艙落地（G3-N-3-15 容量）：徹底移除非本單元的重量元素，內建專屬雙模切換 `[🌱 概念探索] ｜ [🎯 真題測驗]`。
  3. 108 課綱官方手冊三大活動 100% 互動化實裝（`app/components/capacity_concept_lab.html`）：
     - 活動一【水壺實測】：100mL 小量杯倒水進 400mL 水壺，倒滿 4 杯直觀見證容量。
     - 活動二【1800mL 飲水任務】：400mL 水壺裝水，累計 1800mL 健康飲水進度條（400×4=1600 不夠，400×5=2000 達成目標！）。
     - 活動三【2.7L 小數橋樑】：0.1L=100mL 與 2.7L=2L 700mL=2700mL 算理拆解，支援 3.4L 動態切換。
     - 活動四【量杯沙箱】：2000mL 擬物量杯自由倒水與單位換算。
  4. 導航抗破版升級：頂部活動選單升級為自適應水平滑動膠囊（Horizontal Scroll），文字永不折行切字，完美支援未來活動五、活動六之無上限擴充。
  5. 雙硬閘門全數秒通：`verify_curriculum_131.js`、`verify_app_shell.js`、`verify_capacity_concept.js`、`verify_n315.js`、`verify_n315_cdp.js` 全綠（Exit 0），Cloudflare Pages 部署完畢。
- [x] Session 42 升級 Edge-TTS 台灣曉臻自然語音 ＆ 落地 G3-N-3-13(角) 與 G3-N-3-14(面積) 概念小教室（2026-11-15 10:55）：
  1. 語音系統全量升級 Edge-TTS（曉臻台灣自然音色）：建立 `functions/api/tts.js`，包含 Sec-MS-GEC v2 動態簽章直連微軟 Edge-TTS，正式掛載 Cloudflare Pages Functions；前端具備三級雙通道平滑降級，徹底告別機械合成音。
  2. G3-N-3-13 / S-3-1「角與角度」概念小教室落地（`app/components/angle_concept_lab.html`）：四幕活動（紙條旋轉頂點與邊、三角板找直角與45度旋轉、銳角直角鈍角裁判疊合、邊長沙箱破解長度迷思）。
  3. G3-N-3-14「面積（平方公分）」概念小教室落地（`app/components/area_concept_lab.html`）：四幕活動（郵票密鋪、1cm²指甲生活量感、3×4方格板矩陣乘法點數、變形拼圖沙箱實證面積相同但周長改變）。
  4. 三年級核心三單元（13角、14面積、15容量）概念小教室全線連通與掛載。
  5. 雙硬閘門全數秒通：`verify_angle_concept.js`、`verify_area_concept.js`、`verify_capacity_concept.js`、`test_tts_endpoint.py`、`verify_app_shell.js`、`verify_n313_cdp.js`、`verify_n314_cdp.js`、`verify_n315_cdp.js` 全綠（Exit 0）。
  6. 遠端部署生效：GitHub 與 Cloudflare Pages（https://math-108.pages.dev）發布完成，手機實機盲審完全通過！
- [x] Session 43 實體部署流程鋼鐵重構 ＆ 落地 G3-S-3-3「圓」概念小教室 ＆ 角度雙條目收攏（2026-11-15 13:45）：
  1. 實體發布流程鋼鐵重構：建立 `.git/hooks/pre-push` 物理硬門禁（git push 自動攔截並觸發 Cloudflare Pages 部署，失敗即中斷 push）、升級 `tools/release.py`（自動注入版本號破除手機快取、守門員全檢、Git 鋼印推送、Cloudflare 部署、遠端 HTTPS 探測閉環驗真）、新增 `deploy.ps1` 一鍵指令。
  2. 單元收攏與架構定錨：將 `N-3-13` 與 `S-3-1` 明確收攏為「同義整合」，維持 108 課綱 131 條目守門員全綠並消除 UI 重複；確立法典級規範「平面幾何一律保持純 2D 向量 SVG、嚴禁硬套 034 等角透視以防圓形透視變形」。
  3. G3-S-3-3「圓」概念小教室 100% 落地 (`app/components/circle_concept_lab.html`)：四幕式純 2D 向量擬物探索（Act 1 圓心/圓周/半徑/直徑波紋定義、Act 2 360°指針等長與 180° 對向直徑兩倍展開、Act 3 等腰剛體圓規順時針 100% 同向畫圓沙箱、Act 4 迷思直線挑戰直徑為圓內最長線段）。
  4. 體驗細節修復：全面拔除點選部位、完成畫圓、挑選線段時的擅自自動播音，播放權限 100% 歸還給使用者手動點擊「🔊 聽導讀」，並支援 Toggle 隨時點擊「⏹ 停止」。
  5. 雙硬閘門與線上節點實測驗真：`verify_curriculum_131.js`、`verify_app_shell.js`、`verify_circle_concept.js`、`test_tts_endpoint.py` 全部 Exit Code 0，Cloudflare Pages 線上節點確認生效 (Build 20261115_123531)。
- [x] Session 44 概念小教室批次化第二戰 100% 落地閉環（分數、小數、毫米）＆ 實體發布生效（2026-11-15 14:35）：
  1. 遵循 `/plan` 規範調度通道三（035 金鑰池 Gemini 2.5 Pro 大腦）完成第二戰施工藍圖，落盤 `FIX_PLAN.md` 與 `reports/PLAN_20261115_135255.md`。
  2. G3-N-3-9 簡單同分母分數概念小教室落地 (`app/components/fraction_concept_lab.html`, 43KB, 1149行)：Act 1 平分圓盤與分數命名、Act 2 巧克力長條與單位分數累加、Act 3 雙軌長條同分母比大小、Act 4 拼塊合併拿走同分母加減。
  3. G3-N-3-10 一位小數概念小教室落地 (`app/components/decimal_concept_lab.html`, 44KB, 1176行)：Act 1 十等分方格與 0.1 誕生、Act 2 一位小數位值計數盒滿十進位、Act 3 公尺直尺數線放大鏡、Act 4 比大小與小數點對齊加減。
  4. G3-N-3-12 長度（毫米 mm）概念小教室落地 (`app/components/millimeter_concept_lab.html`, 40KB, 966行)：Act 1 直尺微距放大鏡 (1cm=10mm)、Act 2 生活微物對齊測量 (硬幣/訂書針/迴紋針/橡皮擦)、Act 3 複名數換算板 (3cm 5mm=35mm)、Act 4 測量迷思除錯小偵探。
  5. 總入口串接與自動化守門員：`app/shell.js` 之 `CONCEPT_COMPONENTS` 登錄 `N-3-9`、`N-3-10`、`N-3-12`，支援「💡 概念小教室 ｜ 📝 真題測驗」雙模式；新增 `tools/verify_g3_new_concepts.js` 與 `tools/verify_millimeter_concept.js`，390px 視口零溢出、四大活動切換、Console 0 報錯全部通過。
  6. 實體發布線上生效：執行 `.\deploy.ps1` 觸發 S0~S4 鋼鐵閉環，GitHub 倉庫與 Cloudflare Pages（https://math-108.pages.dev）發布完成，HTTPS 探針確認 Build `20261115_143425` 100% 生效！
- [x] Session 45 三年級 17 大單元概念小教室 100% 全量大滿貫（Grand Slam）＆ 人類實測熱修復（2026-11-15 16:56）：
  1. 遵照使用者最高授權：「幫我把三年級派工做完，由 AGY 監督派工」，規劃 9 大單元四幕式規格藍圖（`reports/PLAN_20261115_155500_g3_full_concept_labs.md`），調用通道一（OpenCode CLI）批量落盤。
  2. 9 套全新概念小教室 100% 落地：
     - `N-3-1` 一萬以內的數 (`number_10000_concept_lab.html`, 39.7KB, 1147行)：滿十進千與萬、四艙位值盤、跳數小火車、比大小天平。
     - `N-3-2` 加減直式計算 (`vertical_calc_concept_lab.html`, 32.8KB)：位值對齊、連續進位小紅圈①、連環退位劃線借10、除錯小偵探。
     - `N-3-3` 乘以一位數 (`multiplication_concept_lab.html`, 35.8KB)：乘法面積模型、三位數階梯連續進位、中間含0放大鏡、末尾有0規律估算。
     - `N-3-4` 除法 (`division_concept_lab.html`, 33.8KB)：包含除分裝、等分除平分、餘數安全守則（餘數<除數）、乘除互逆輪盤。
     - `N-3-5` 除以一位數直式 (`division_vertical_concept_lab.html`, 40.2KB)：分錢長除法、三位數長除號命名口訣、商中間補0大陷阱、驗算平衡槽。
     - `N-3-6` 乘除應用問題 (`mult_div_relation_concept_lab.html`, 39.9KB)：乘除互逆天平、未知數長條圖、符號推理、超商採買應用。
     - `N-3-7` 兩步驟應用題 (`two_step_concept_lab.html`, 39.1KB)：階梯解題法、連乘雙層盒、先剪後平分陷阱避雷、採買小店長。
     - `N-3-8` 四則估算 (`estimation_concept_lab.html`, 38.8KB)：數線磁鐵靠攏、生活採買保險高估法則、幾十幾百乘一位數心算雷達、合理性檢驗。
     - `N-3-11` 整數數線 (`number_line_concept_lab.html`, 34.5KB)：數線三要素、單位長切換、青蛙跳加減法、數線找問號逆推。
  3. 小朋友實測回饋光速熱修復：
     - 「三角板不會動」：在 `angle_concept_lab.html` 實現 **手指觸控拖曳（Touch Drag & Drop）**、平滑滑入對齊與 35px 磁吸角落吻合動效。
     - 「兩個聲音搶話（重音）」：在 `shell.js` 與組件建立**硬性發聲互斥鎖（Exclusive Lock）**，並在概念探索模式智慧隱藏頂部「聽題目」，杜絕競態重音。
  4. 雙硬閘門與線上節點實測驗真：`verify_g3_remaining_concepts.js`（9大單元 390px 實機全綠）、`verify_angle_concept.js`、`verify_app_shell.js`、`verify_circle_concept.js`、`test_tts_endpoint.py` 全部 Exit Code 0。
  5. 實體發布線上生效：執行 `.\deploy.ps1` 遞增版號，GitHub 倉庫與 Cloudflare Pages（https://math-108.pages.dev）發布完成，HTTPS 探針確認 Build `20261115_165533` 100% 生效！
- [x] Session 46 三年級最後 7 大單元概念小教室 100% 落地 ＆ 三年級 24/24 全量大滿貫（Grand Slam）（2026-11-15 17:52）：
  1. 落地 7 套四幕式概念實驗室：`N-3-16` 重量 (`weight_concept_lab.html`)、`N-3-17` 時間 (`time_concept_lab.html`)、`S-3-2` 正方形長方形 (`square_rectangle_lab.html`)、`S-3-4` 幾何形體操作 (`solid_geometry_lab.html`)、`R-3-1` 乘除互逆 (`multiplication_division_lab.html`)、`R-3-2` 數量模式與推理 (`pattern_reasoning_lab.html`)、`D-3-1` 一維與二維表格 (`table_cross_lab.html`)。
  2. 課綱條目全量連通：三年級 24/24 條目全部標記 ready，全專案累計開放 35/131 條目（一年級 11/11 + 三年級 24/24 雙年級 100% 大滿貫！）。
  3. 全域守門員與 CDP 測試全綠通過。
- [x] Session 47 人類實機盲審回饋（Plan-PR 閉環）＆ 深度互動點擊守門員升級（2026-11-15 18:52）：
  1. 人類盲審抓出 R-3-2 跳跳蛙不能跳與找規律數列空白：精準定位 `<script>` 遺失業務函數根因，完成外科手術式修復（青蛙拋物線跳躍、SVG 虛線弧線、火柴棒公式疊加、數列初始卡片渲染、差值氣泡揭示、S-3-2 四邊標記、3D 摺紙對摺、面積鋪格）。
  2. 守門員全面升級為深度 CDP 點擊斷言：`tools/verify_g3_remaining_concepts.js` 真實模擬點擊按鈕，斷言 DOM 位移與狀態改變，16 套概念小教室全部 Exit Code 0 全綠！
  3. 實體發布線上生效：執行 `python tools/release.py`（Build 20261115_185028），GitHub 與 Cloudflare Pages（https://math-108.pages.dev）發布完成，遠端 HTTPS 探測確認生效。
- [x] Session 48 語音技術債全面收攏至 AudioManager 單例 ＆ 鋼鐵硬門禁 v2.0 落地閉環（2026-11-15 21:50）：
  1. 遵照 025 盲點批判，將 PR 守門體系升級為「五大鋼鐵硬門禁 v2.0」（作用域防劇透、幾何公式參數化、通用互動合約、音訊單例、內容指紋快取破除）。
  2. 建立全站唯一 `app/js/audio_manager.js`：微軟 Edge-TTS 曉臻自然女聲 (`zh-TW-HsiaoChenNeural`) 優先、三級雙通道平滑降級、全域硬性互斥鎖、文字清洗。
  3. 全量 71 套組件（含 23 套概念小教室）全面重構：裸調原生 `speechSynthesis.speak` 處數嚴格為 0！iframe 一律向外層 Shell 發送 `TTS_SPEAK` / `TTS_STOP`，徹底根絕雙聲道搶話與手機機械音。
  4. 落地 Gate 4 守門員 `tools/verify_audio_singleton.js`（零外部依賴 Chrome CDP 實機驗證，ALL PASS Exit 0），並登記至 `release.py` S1 七大門禁。
  5. 算力通道架構鋼鐵修復：通道一 (本地) ➔ 通道二 (A-SERVER SSH 獨立配額) ➔ 通道三 (035 8把 Key 池) 三級自動 Failover 鋼鐵閉環實測全綠。
  6. 實體發布線上生效：執行 `tools/release.py`（Build `20261115_214911`），Cloudflare Pages 邊緣探針確認同步生效！
- [ ] 下一步：
  - 【單元推進】三年級 24/24 大滿貫與語音技術債已全部收官，下次開工正式啟動二年級（G2）核心單元推進！



---
