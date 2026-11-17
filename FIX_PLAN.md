# 🎯 專案施工藍圖：二年級 108 課綱 24 單元物理概念小教室工程 (PLAN+PR)

> 生成時間：2026-11-15 22:40  
> 架構規劃：通道三 (035 金鑰池 Gemini 2.5 Pro 架構核准)  
> 監督驗證：AGY (決策大腦 / 雙簽門禁 / 嚴格鎖定不寫業務代碼)  
> 施工部隊：通道一 (本地 OpenCode CLI $0) / 通道二 (A-SERVER 備援) / 通道三 (金鑰池)  

---

## 1. 核心規格與邊界 (Given-When-Then)

- **Given (情境前提)**：
  - 二年級 (G2) 24 大課綱單元（N-2-1 ~ D-2-1）尚無完整標準化真題庫與概念實驗室。
  - 使用者指示：**優先打造對齊 108 課綱官方活動之「四幕式物理互動概念小教室 (Concept Labs)」**。
  - 全站已就緒 `app/js/audio_manager.js`，G2 所有組件必須 100% 接入微軟曉臻高音質自然語音（`/api/tts`），嚴禁使用原生 Web Speech 機械音。
- **When (觸發施工)**：
  - 依序分 4 大波次（Wave 1 ~ Wave 4，每波 6 個單元）派發任務卡給通道一 (OpenCode CLI)。
- **Then (交付成果)**：
  - 每單元產出一個標準四幕式 HTML 概念實驗室（日系繪本風、純 SVG/CSS、高 $\le 420\text{px}$、支援觸控拖曳磁吸）。
  - 自動接入 `AudioManager.play(text)` 高音質語音。
  - `app/shell.js` 完成 24 單元路由註冊。
  - 專屬 CDP 實機腳本 `tools/verify_g2_concept_labs.js` 驗證：390px 視口零橫溢、4 幕按鈕連點切換、真實物理位移與零 Console 報錯。
- **邊界禁區 (Strict Prohibitions)**：
  - 嚴禁 AGY 動手手寫 HTML/JS/CSS 業務代碼。
  - 嚴禁靜態死圖或偽造按鈕，物理題必須具備真實指針事件監聽（`pointerdown/move/up`）。
  - 嚴禁使用 `window.speechSynthesis` 舊語音，一律走 `AudioManager`。

---

## 2. 通用功能與接口驗收地圖 (Capability & Interface Map)

| 編號 | 功能模組 | 執行入口（指令 / 腳本 / 端點） | 輸入參數 / 測試樣本 | 預期可觀測結果（Pass 條件） |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | 全域音訊接口封裝 | `app/js/audio_manager.js` 引用檢查 | 各 Lab HTML `<head>` | 均含 `audio_manager.js`，呼叫 `AudioManager.play` 成功 |
| **F-02** | 四幕式物理操作實驗室 | `app/components/g2_*_lab.html` | 瀏覽器載入 / CDP 測量 | 單屏高 $\le 420\text{px}$，4 幕活動流暢切換，具備真實互動動畫 |
| **F-03** | 課綱大廳路由銜接 | `app/shell.js` 二年級按鈕點擊 | G2 單元點選 | 點擊「概念探索」正確以 iframe 呼叫對應 `g2_*_lab.html` |
| **F-04** | CDP 自動化硬門禁 | `node tools/verify_g2_concept_labs.js` | 390×844 手機視口 | 橫向溢出 0px、Console 報錯 0、真實操作斷言通過、Exit Code 0 |

---

## 3. 四波次微粒度單步施工清單 (Step-by-Step Checklist)

### 🌊 第一波 (Wave 1: 數與量基礎核心 6 單元) —— 標竿試點
- [x] **Step 1: 建立 G2 全局規範樣板與 CDP 驗證骨架**
  - 產出檔案: `tools/verify_g2_concept_labs.js`, `app/components/g2_template_lab.html`
  - 驗收結果: Exit Code 0 (390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、高度 $\le 420\text{px}$、Console 0 報錯)
  - 施工通道: 通道一 (OpenCode CLI $0)
- [x] **Step 2: G2-N-2-1 一千以內的數 (`g2_place_value_1000_lab.html`)**
  - 產出檔案: `app/components/g2_place_value_1000_lab.html` (1017 行)
  - 課綱活動: 百格千塊立體積木、千位進位翻牌器、三位數數線放大鏡、滿 10 個百合體金千立方體
  - 驗證結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一/通道二自動容災協同 ($0)
- [x] **Step 3: G2-N-2-2 加減算式與直式計算 (`g2_vertical_addition_subtraction_lab.html`)**
  - 產出檔案: `app/components/g2_vertical_addition_subtraction_lab.html` (38KB), 更新 `app/shell.js`
  - 課綱活動: 直式算柱位值對齊、滿十進一動態融合、不夠減借十退位拆解、分步引導計算機
  - 驗證結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一/通道二自動容災協同 ($0)
- [x] **Step 4: G2-N-2-5 幣值與錢幣換算 (`g2_money_change_lab.html`)**
  - 產出檔案: `app/components/g2_money_change_lab.html` (39KB), 更新 `app/shell.js`
  - 課綱活動: 新台幣面額大解剖（千元/五百元/百元/銅板）、自動換幣機拖曳兌換、超市付錢與找零計算
  - 驗證結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 5: G2-N-2-6 乘法啟蒙 (`g2_multiplication_intro_lab.html`)**
  - 產出檔案: `app/components/g2_multiplication_intro_lab.html` (37KB), 更新 `app/shell.js`
  - 課綱活動: 盤子裝蘋果幾個幾、連加算式與乘號動態誕生、倍數階梯青蛙跳
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一/通道二自動容災協同 ($0)
- [x] **Step 6: G2-N-2-7 九九乘法表 (`g2_multiplication_table_lab.html`)**
  - 產出檔案: `app/components/g2_multiplication_table_lab.html` (31KB), 更新 `app/shell.js`
  - 課綱活動: 點子陣列矩陣動態框選、乘法表斜對角對稱規律、翻牌九九歌
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 7: G2-N-2-11 長度（公分與公尺） (`g2_meter_length_lab.html`)**
  - 產出檔案: `app/components/g2_meter_length_lab.html` (35KB), 更新 `app/shell.js`
  - 課綱活動: 100公分拼接成長尺、伸縮捲尺拉出1公尺與雙單位即時轉換、生活量感大比對
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕按鈕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一/通道二自動容災協同 ($0)

### 🌊 第二波 (Wave 2: 數與量進階與應用 6 單元) —— 100% 落地完工
- [x] **Step 8: G2-N-2-3 加減應用問題 (`g2_addition_subtraction_word_lab.html`)**
  - 產出檔案: `app/components/g2_addition_subtraction_word_lab.html` (44KB), 更新 `app/shell.js`
  - 課綱活動: 條形線段圖 (Bar Model) 解剖器、動態線段拉伸機、四大題型指南針
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 9: G2-N-2-4 簡單加減估算 (`g2_estimation_lab.html`)**
  - 產出檔案: `app/components/g2_estimation_lab.html` (34KB), 更新 `app/shell.js`
  - 課綱活動: 數線磁吸最接近幾十、超市買菜預算估算器、加減估算策略秘笈
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 10: G2-N-2-8 兩步驟應用問題（加減乘） (`g2_two_step_math_lab.html`)**
  - 產出檔案: `app/components/g2_two_step_math_lab.html` (34KB), 更新 `app/shell.js`
  - 課綱活動: 工廠流水線兩步驟輸送帶、先乘後減/先乘後加雙模式探索、尋找中繼站金字塔
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 11: G2-N-2-9 分裝與平分 (`g2_division_intro_lab.html`)**
  - 產出檔案: `app/components/g2_division_intro_lab.html` (31KB), 更新 `app/shell.js`
  - 課綱活動: 糖果連減分裝機 (包含除)、一人輪流分一顆公平秤 (等分除)、分裝 vs 平分對照鏡
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 12: G2-N-2-10 單位分數的認識 (`g2_fraction_unit_lab.html`)**
  - 產出檔案: `app/components/g2_fraction_unit_lab.html` (37KB), 更新 `app/shell.js`
  - 課綱活動: 披薩動態切片 (1/2, 1/4, 1/8)、公平天平檢驗平分靈魂、分母越大每份越小
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 13: G2-N-2-12 容量、重量、面積感官比較 (`g2_measure_compare_lab.html`)**
  - 產出檔案: `app/components/g2_measure_compare_lab.html` (41KB), 更新 `app/shell.js`
  - 課綱活動: 水杯互倒容量比較、天平蹺蹺板秤重大師 (破除體積迷思)、面積疊合與積木方塊鋪排
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)

### 🌊 第三波 (Wave 3: 時間與空間幾何 6 單元) —— 推進中 (4/6 完成)
- [x] **Step 14: G2-N-2-13 鐘面的時刻 (`g2_clock_time_lab.html`)**
  - 產出檔案: `app/components/g2_clock_time_lab.html` (31KB), 更新 `app/shell.js`
  - 課綱活動: 齒輪連動時鐘、半點與時針扇形區間迷思破解、外圈五分五分數
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 15: G2-N-2-14 時間（年、月、星期、日） (`g2_calendar_lab.html`)**
  - 產出檔案: `app/components/g2_calendar_lab.html` (35KB), 更新 `app/shell.js`
  - 課綱活動: 12 個月份翻牌箱、拳頭大月小月記憶神器、月曆神探 (+7 規律與跨日標尺)
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 16: G2-S-2-1 物體之幾何特徵 (`g2_solid_features_lab.html`)**
  - 產出檔案: `app/components/g2_solid_features_lab.html` (34KB), 更新 `app/shell.js`
  - 課綱活動: 斜坡滾動 vs 滑動物理實驗、積木堆疊高塔穩定性、平面 vs 曲面顯微鏡
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一 (本地 OpenCode CLI $0)
- [x] **Step 17: G2-S-2-2 簡單幾何形體 (`g2_shapes_lab.html`)**
  - 產出檔案: `app/components/g2_shapes_lab.html` (40KB), 更新 `app/shell.js`
  - 課綱活動: 3D 等角透視積木解剖儀 (面/邊/頂點大點名)、印泥蓋印章拓印工坊、正方體 vs 長方體對照
  - 驗收結果: Exit Code 0 (CDP 390px 視口零溢出、4 幕切換、AudioManager 接口、Console 0 報錯)
  - 施工通道: 通道一/通道二自動容災協同 ($0)
- [ ] **Step 18: G2-S-2-3 直尺操作 (`g2_ruler_drawing_lab.html`)**
- [ ] **Step 19: G2-S-2-4 平面圖形的邊長 (`g2_perimeter_lab.html`)**

### 🌊 第四波 (Wave 4: 幾何操作、關係與統計 6 單元)
- [ ] **Step 20: G2-S-2-5 面積（具體操作） (`g2_area_square_lab.html`)**
- [ ] **Step 21: G2-R-2-1 大小關係與遞移律 (`g2_transitive_law_lab.html`)**
- [ ] **Step 22: G2-R-2-2 加法交換律與結合律 (`g2_addition_commutative_lab.html`)**
- [ ] **Step 23: G2-R-2-3 乘法交換律 (`g2_multiplication_commutative_lab.html`)**
- [ ] **Step 24: G2-R-2-4 加法與減法的關係 (`g2_addition_subtraction_relation_lab.html`)**
- [ ] **Step 25: G2-D-2-1 分類與呈現 (`g2_data_classify_lab.html`)**

---

## 4. 施工防錯與交付守則

1. **嚴禁假成功**：CDP 測試只認真實 Exit Code 0，失敗立即中斷。
2. **語音硬性標準**：各 HTML 一律包含 `<script src="../js/audio_manager.js"></script>` 並調用 `window.AudioManager.play()`，禁用 `speechSynthesis`。
3. **單屏緊湊**：教具高度嚴格 $\le 420\text{px}$，手機視口 390px 寬度 100% 入屏免橫向滑動。
4. **單步即停與雙簽放行**：AGY 每推進一步，必須收到工兵的「PR 實機驗證存根」，審核通過後方可進行下一步。

---

## 5. 新階段：二年級真題題庫封裝與概念小教室雙軌閉環 (PLAN+PR)
> 詳細計畫書請參閱獨立新檔：[`reports/PLAN_G2_EXAM_AND_LAB_AUDIT.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/PLAN_G2_EXAM_AND_LAB_AUDIT.md)  
> 推進策略：使用者選定 **方案 A（單元單兵閉環推進法）**，首發試點：**N-2-1 一千以內的數**。

---

## 6. 二年級第二單元：G2-N-2-2 加減算式與直式計算高階真題工程 (2026-11-16 升級)
> 完整考卷全通讀選題報告：[`reports/PLAN_G2_N22_EXAM_AUDIT.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/PLAN_G2_N22_EXAM_AUDIT.md)

- **目標**：完成內湖 112-1 與獅湖 113-1 期中考 N-2-2 範疇 5 道高階思維真題（線段模型、文具店購物、天平數感）之純 SVG 教具組件與題庫封裝。
- **題目清單**：
  - [x] **Step 1 (Q1)**: 彩帶 90cm 用掉一些剩 58cm 線段模型 (`g2_n22_q1_tape_ribbon_demo.html`) `[VISUAL]` (已由 AGY 法官眼睛實機審查 PASS，線段 58:32 真確比例、零溢出)
  - [ ] **Step 2 (Q2)**: 文具店買手電筒42與自動筆29進位直式 (`g2_n22_q2_store_add_demo.html`) `[VISUAL]`
  - [ ] **Step 3 (Q3)**: 珊珊55元買自動筆29元退位直式 (`g2_n22_q3_store_sub_demo.html`) `[VISUAL]`
  - [ ] **Step 4 (Q4)**: 44+34 與 44+22 高階數感天平比大小 (`g2_n22_q4_balance_compare_demo.html`) `[VISUAL]`
  - [ ] **Step 5 (Q5)**: 緞帶剪掉47剩68原長跨百進位拼合 (`g2_n22_q5_ribbon_splice_demo.html`) `[VISUAL]`
  - [ ] **Step 6 (Data & Gate)**: 題庫資料 `data/units/G2/N-2-2.json` 封裝與 `tools/verify_g2_n22_cdp.js` 驗證 (Exit 0)

---

## 7. 二年級第四單元：G2-N-2-4 簡單加減估算 歷屆真題與教具閉環工程 (2026-11-17 啟動)
> 完整考卷探勘與規格計畫書：[`reports/PLAN_G2_N24_ESTIMATION_EXAM_AUDIT.md`](file:///d:/ANTIGRAVITY/028-1_國小數學APP/reports/PLAN_G2_N24_ESTIMATION_EXAM_AUDIT.md)

- **目標**：從 `EXAM REAL/G2/` 34 份實體段考中挑選出 5 道涵蓋生活購物、預算檢驗、整十整百概數之高階真題，由工兵梯隊派工封裝題庫與純 SVG 教具組件，經 CDP 390px 實機出圖與 AGY 視覺多模態眼睛審核，確認無誤後整合至前端大廳。
- **題目清單**：
  - [x] **Step 1 (Q1)**: 內湖 111-2 體育用品店 3 物估算湊 500 元 (`g2_n24_q1_sports_estimate.html`) `[VISUAL]` (已由 AGY 實機眼睛審核 PASS，高 355px，零溢出)
  - [x] **Step 2 (Q2)**: 內湖 112-2 美食餐廳帶 1000 元買蛋糕三明治夠不夠 (`g2_n24_q2_restaurant_budget.html`) `[VISUAL]` (已由 AGY 實機眼睛審核 PASS，高 321px，零溢出)
  - [x] **Step 3 (Q3)**: 內湖 112-1 文具店鉛筆盒與自動筆買兩樣大約幾元 (`g2_n24_q3_stationery_estimate.html`) `[VISUAL]` (已由 AGY 實機眼睛審核 PASS，高 374px，零溢出)
  - [x] **Step 4 (Q4)**: 永安 113-2 算式 299+200 最接近整百數定位 (`g2_n24_q4_numberline_estimate.html`) `[VISUAL]` (經外科手術精修游標初位，已由 AGY 實機眼睛審核 PASS，高 313px，零溢出)
  - [x] **Step 5 (Q5)**: 獅湖 111-2 零用錢 203+199 大約多少錢整百匯流 (`g2_n24_q5_pocket_money_estimate.html`) `[VISUAL]` (已由 AGY 實機眼睛審核 PASS，高 311px，零溢出)
  - [x] **Step 6 (Data & Gate)**: 題庫資料 `data/units/G2/N-2-4.json` 封裝與驗收守門員 `tools/verify_g2_n24.js` (Exit 0)
  - [x] **Step 7 (Integration & Deploy)**: 使用者確認截圖雙簽放行，全站守門員全綠通過，執行 Cloudflare Pages 正式發布上線







---

# 🎯 當前執行工程：G2-N-2-3 加減應用問題真題題庫與互動教具交付 (PLAN+PR Protocol v3.1)

> 規劃日期：2026-11-17  
> 架構審核：通道三 (035 金鑰池 Gemini 2.5 Pro 首席架構師核准)  
> 執行模式：PLAN+PR Protocol v3.1（雙簽門禁 + 工兵單步施工 + CDP 390px 實機出圖 + 軌道 B 眼睛覆核）  

## 1. 核心規格與邊界 (Given-When-Then)

- **Given (情境前提)**：
  - 二年級第三單元 N-2-3【加減應用問題】需要建立真實考題題庫與互動微教具。
  - 考題 100% 來自臺北市內湖國小（113-1/111-1）與高雄市獅湖國小（113-1）段考真題，精選 6 題涵蓋加數未知、被加數未知、減數未知、逆向比較（易錯）、進階兩步驟加減、高階兩步驟複合等題型，杜絕重複與死板純計算。
  - 語音呼叫微軟曉臻高音質語音（`AudioManager.play(text)`），全站單例。
- **When (觸發條件)**：
  - 人類確認計畫後，派發工兵生成 `data/units/G2/N-2-3.json`、6 套互動微組件 `app/components/g2_n23_q*.html`，並撰寫專屬 CDP 驗證腳本 `tools/verify_g2_n23_cdp.js`。
- **Then (交付成果)**：
  - 6 題題庫 JSON 嚴格對齊真題原文、圖形要求與解答。
  - 6 套日系繪本微組件支援 390px 視口單屏無滾動（高 $\le 420\text{px}$）、具備真實指針事件、零劇透。
  - 執行 `tools/verify_g2_n23_cdp.js` 驗證 Exit Code 0，產出 `_scratch/verify/preview_390.png` 與 sidecar JSON。
  - 經 AGY 本地實機多模態眼睛審核無文字壓線、無組件穿模後，更新 `data/curriculum.json` 並通過 `tools/verify_curriculum_131.js`。
- **嚴格禁區**：
  - 嚴禁 AGY 手寫業務代碼。
  - 嚴禁靜態死圖或假按鈕。
  - 學生作答前嚴禁在 DOM 渲染解析或答案提示。

## 2. 通用功能與接口驗收地圖 (Feature Map)

| 編號 | 功能模組 | 描述 | 驗收標準與指令 |
| :--- | :--- | :--- | :--- |
| **F-01** | **真題題庫資料契約** | `data/units/G2/N-2-3.json` 6 題真題封裝 | `node -e "const d=require('./data/units/G2/N-2-3.json'); console.log(d.questions.length);"` 回傳 6 |
| **F-02** | **微教具動態渲染組件** | `app/components/g2_n23_q[1-6]_*.html` 6 套微教具 | `[VISUAL]` 390px 視口高 $\le 420\text{px}$，支援括號未知數與直式運算 |
| **F-03** | **CDP 實機自動化硬門禁** | `tools/verify_g2_n23_cdp.js` 逐題實測 | 390×844 視口零溢出、零報錯、正錯解邏輯斷言全通過，Exit Code 0 |
| **F-04** | **全站課綱 131 閉環總檢** | `tools/verify_curriculum_131.js` 納入 N-2-3 | 131 條目通過、N-2-3 標記 ready (6題) 且題庫組件齊全，Exit Code 0 |

## 3. 微粒度單步施工清單 (Step-by-Step Checklist)

- [x] **Step 1: 建立 N-2-3 題庫資料契約與 CDP 驗證骨架**
  - 工兵生成 `data/units/G2/N-2-3.json`（6 題完整資料）與 `tools/verify_g2_n23_cdp.js` 測試框架。
  - 驗收：`node -e "require('./data/units/G2/N-2-3.json')"` 成功解析。
- [x] **Step 2: 實作 6 套互動微教具組件**
  - Q1: `app/components/g2_n23_q1_cookies_demo.html` (起司草莓餅乾 Bar Model)
  - Q2: `app/components/g2_n23_q2_pingpong_demo.html` (桌球社男女生加減互逆)
  - Q3: `app/components/g2_n23_q3_anya_book_demo.html` (安妮亞看故事書進度條)
  - Q4: `app/components/g2_n23_q4_jumprope_compare_demo.html` (跳繩比賽逆向比較線段)
  - Q5: `app/components/g2_n23_q5_bus287_flow_demo.html` (287公車上下車兩步驟)
  - Q6: `app/components/g2_n23_q6_fair_crepe_demo.html` (美食嘉年華購物兩步驟複合)
  - 驗收：`node tools/verify_g2_n23_cdp.js` 退出碼 0。
- [x] **Step 3: 實機截圖出圖與 AGY 軌道 B 多模態審查**
  - 執行全域出圖腳本產出 `_scratch/verify/preview_390.png` 與 sidecar JSON。
  - AGY 調用 `read_file` 進行眼睛覆核（無穿模、文字無壓線、單屏合規）。
- [x] **Step 4: 課綱大廳 131 整合與收工**
  - 更新 `data/curriculum.json` 中 N-2-3 狀態為 `ready`（6 題）。

---

# 🎯 全新三單元連發攻堅工程：G2-N-2-5、G2-N-2-6、G2-N-2-7 (PLAN+PR Protocol v3.1)

> 規劃日期：2026-11-17  
> 架構審核：通道三 (035 金鑰池 Gemini 2.5 Pro 首席架構師核准)  
> 推進策略：管線沙盒化並行施工（Stage 1 規格雙簽 ➜ Stage 2 工兵獨立施工 ➜ Stage 3 實機出圖審查 ➜ Stage 4 閉環發布）  
> 真題來源：臺北市內湖國民小學 111~113、高雄市獅湖國民小學 111~113 實體段考卷全通讀

---

## 1. 核心規格與邊界 (Given-When-Then)

- **Given (情境前提)**：
  - 二年級核心單元 N-2-5 (幣值解題)、N-2-6 (乘法啟蒙)、N-2-7 (九九乘法) 已具備四幕式概念小教室，但尚無段考真題題庫與考題微教具。
  - 三單元全部真題 100% 來自臺北市內湖與高雄市獅湖實體段考卷，字字對齊，嚴禁湊數與降級。
- **When (觸發施工)**：
  - 人類雙簽核准 Stage 1 規格後，分批指派通道一 (OpenCode CLI) 施工落盤各單元獨立 JSON 題庫與純 SVG 考題微教具。
- **Then (交付成果)**：
  - **G2-N-2-5**：5 道幣值真題（千元拆換、數錢數感、找零、生活購物）+ 5 套錢幣微教具 + `verify_g2_n25_cdp.js` (Exit 0)。
  - **G2-N-2-6**：5 道乘法真題（幾個幾辨析、手鍊單位量、手指頭連加轉乘法、春捲盤子）+ 5 套乘法微教具 + `verify_g2_n26_cdp.js` (Exit 0)。
  - **G2-N-2-7**：5 道乘法表真題（倍數分配律數感、積的增減比較、九九雙向對稱、飛鏢轉盤乘法表、年齡倍數）+ 5 套乘法表微教具 + `verify_g2_n27_cdp.js` (Exit 0)。
  - CDP 產出 15 張 390px 手機實機截圖，AGY 本地眼睛多模態審查通過，全站課綱 131 閉環總檢全綠。
- **邊界禁區 (Strict Prohibitions)**：
  - 嚴禁 AGY 動手寫業務代碼。
  - 嚴禁題目未作答前在 DOM 劇透答案或解析。
  - 教具高度嚴格限制 $\le 420\text{px}$，390px 視口零橫溢。

---

## 2. 三單元真題矩陣與教具設計規格 (SSOT)

### 💰 單元一：G2-N-2-5【解題：100 元、500 元、1000 元】(5 題)
| 題號 | 原卷出處與題型 | 原卷題目原文 | 算理與教具規格 | 驗收標記 |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | 內湖 112-2 期中 一、(4)<br>[千元多元拆解] | `1 張 1000 元可以換成 1 張 500 元加上（ ）張 100 元和 10 個 10 元。` | 算理：$1000 - 500 - 100 = 400$（4 張百元鈔）。<br>教具：自動換幣機，千元鈔拖入後動態展示 500+400+100 拆解。 | `[VISUAL]` |
| **Q2** | 內湖 112-2 期中 一、(5)<br>[多元幣值累加數感] | `四個百、十七個十和十二個一合起來是多少元？` | 算理：$400 + 170 + 12 = 582$ 元（滿十進百跨位加法）。<br>教具：錢幣計數盤，百元鈔、十元硬幣、一元硬幣點選進位融合。 | `[VISUAL]` |
| **Q3** | 獅湖 111-2 期中 二<br>[找零與最少張數] | `小明帶 1000 元買了 765 元的外套，老闆要找回多少元？如果只用百元鈔和十元硬幣付 765 元，最少要拿幾張百元鈔？` | 算理：找零 $1000 - 765 = 235$ 元；付 765 元至少要 8 張百元鈔。<br>教具：收銀台找零模擬器，千元付費與最少鈔票數天平。 | `[VISUAL]` |
| **Q4** | 內湖 112-2 期中 四、1.(2)<br>[千元生活預算檢驗] | `美食餐廳：蛋糕 198 元、三明治 105 元。媽媽帶 1000 元要買一個蛋糕和一個三明治，請問 1000 元夠不夠？買完剩下幾元？` | 算理：$198 + 105 = 303$ 元，1000 元夠，剩下 $1000 - 303 = 697$ 元。<br>教具：餐盤購物車與千元皮夾，扣除餐點後動態展示剩餘鈔票硬幣。 | `[VISUAL]` |
| **Q5** | 獅湖 111-2 期中<br>[幣值組合消費] | `小歆原有 1 張 500 元和 3 張 100 元，買了一本 380 元的字典，還剩下多少元？` | 算理：總額 $500 + 300 = 800$ 元，剩餘 $800 - 380 = 420$ 元。<br>教具：錢包卡片，展示 500+300 扣除 380 後破百找零算理。 | `[VISUAL]` |

### ✖️ 單元二：G2-N-2-6【乘法啟蒙：幾個幾與乘號】(5 題)
| 題號 | 原卷出處與題型 | 原卷題目原文 | 算理與教具規格 | 驗收標記 |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | 獅湖 113-1 期末 一、3<br>[乘法本質迷思破解] | `下面哪一個說法不是「3×5」？① 3的5倍 ② 5有3個 ③ 3有5個 ④ 3+3+3+3+3` | 算理：$3\times 5$ 是 3 的 5 倍（3 有 5 個），絕非 5 有 3 個！<br>教具：乘法概念顯微鏡，點選動態展示「5 個 3」與「3 個 5」矩陣對比。 | `[VISUAL]` |
| **Q2** | 內湖 113-1 期末 一、(3)<br>[單位量與乘法式子] | `一串手鍊有 9 顆珠子，7 串有多少顆珠子？乘法算式記作？① 9×9 ② 7×9 ③ 9×7 ④ 7×7` | 算理：每串 9 顆（被乘數）$\times$ 7 串（乘數）$= 63$ 顆。<br>教具：美麗珠串展示架，拉動滑桿動態增減珠串，顯示 $9\times 7$。 | `[VISUAL]` |
| **Q3** | 內湖 111-1 期末 三、5<br>[身體具象連加轉乘法] | `7 隻手一共有幾根手指頭？用乘法算式記作（ ）×（ ）＝（ ）。` | 算理：每隻手 5 根指頭，7 隻手，$5 \times 7 = 35$ 根。<br>教具：小手手點名陣列，點選小手高亮，展示 $5+5+...+5 = 5\times 7$。 | `[VISUAL]` |
| **Q4** | 內湖 113-1 期末 六、(1)<br>[生活盤子分裝] | `家人點了 6 盤炸春捲，每盤有 4 個炸春捲，請問他們一共點了多少個炸春捲？` | 算理：每盤 4 個 $\times 6$ 盤 $= 24$ 個。<br>教具：日系美食盤子分裝台，點選盤子擺放春捲，動態生成乘法式。 | `[VISUAL]` |
| **Q5** | 內湖 112-1 期末 一、2<br>[連加與乘式順序陷阱] | `5+5+5+5=20，寫成乘法算式是？① 4×5=20 ② 5×4=20 ③ 5+4=20` | 算理：被乘數（單位量 5）在前，乘數（個數 4）在後，記作 $5\times 4=20$。<br>教具：積木堆疊轉換器，動態將 4 條 5 格積木旋轉合併為 $5\times 4$。 | `[VISUAL]` |

### 🔢 單元三：G2-N-2-7【十十乘法：乘法表與規律】(5 題)
| 題號 | 原卷出處與題型 | 原卷題目原文 | 算理與教具規格 | 驗收標記 |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | 獅湖 113-1 期末 四、10<br>[分配律初探/高階數感] | `5 的 4 倍和 5 的 5 倍合起來是 5 的（ ）倍，也就是（ ）。` | 算理：$4 + 5 = 9$ 倍，也就是 $5 \times 9 = 45$（乘法分配律直覺體會）。<br>教具：雙色倍數條形積木，4 格與 5 格拼接成 9 格，顯示 $5\times 9 = 45$。 | `[VISUAL]` |
| **Q2** | 內湖 112-2 期中 一、(7)<br>[乘數與積的連動變化] | `10×3 比 10×8 的乘數少（ ），積少（ ）。` | 算理：乘數少 $8 - 3 = 5$；積少 $5 \times 10 = 50$。<br>教具：數線跳跳梯，展示青蛙跳 8 次與跳 3 次的差額 5 次（50）。 | `[VISUAL]` |
| **Q3** | 內湖 112-2 期中 一、(8)<br>[積是 24 的算式檢索] | `在九九乘法表裡，積是 24 的乘法算式有哪四個？` | 算理：$3\times 8=24, 8\times 3=24, 4\times 6=24, 6\times 4=24$。<br>教具：九九乘法表熱點九宮格，點選 24 時高亮對稱的 4 個交叉點。 | `[VISUAL]` |
| **Q4** | 內湖 111-1 期末 三、6<br>[飛鏢同心圓乘法盤] | `完成乘法表：中間的數是 7，乘以第二圈的數（3, 6, 8, 9），等於最外圈的數。` | 算理：$7\times 3=21, 7\times 6=42, 7\times 8=56, 7\times 9=63$。<br>教具：純 SVG 旋轉飛鏢輪盤，轉動指針即時計算扇形乘積。 | `[VISUAL]` |
| **Q5** | 內湖 112-2 期中 四、2<br>[年齡倍數綜合解題] | `曉玉今年 8 歲，爸爸的年紀是曉玉的 5 倍，請問爸爸今年是幾歲？去年是幾歲？` | 算理：今年 $8\times 5 = 40$ 歲；去年 $40 - 1 = 39$ 歲。<br>教具：父女年齡天平時光機，滑動倍數拉桿直觀展示 5 倍與時間回推。 | `[VISUAL]` |

---

## 3. 微粒度工兵管線施工清單 (Pipelined Checklist)

- [x] **Step 1: G2-N-2-5 幣值題庫與 5 套考題微教具落盤**
  - 資料契約：`data/units/G2/N-2-5.json`（5 題真題）
  - 微教具組件：`app/components/g2_n25_q[1-5]_*.html`
  - CDP 驗收：`tools/verify_g2_n25_cdp.js`（Exit Code 0）
  - 軌道 B 眼睛審查：5 題 390px 實機截圖全綠 (無穿模/無文字遮擋/高度 337~415px <= 420px)
- [x] **Step 2: G2-N-2-6 乘法啟蒙題庫與 5 套考題微教具落盤**
  - 資料契約：`data/units/G2/N-2-6.json`（5 題真題）
  - 微教具組件：`app/components/g2_n26_q[1-5]_*.html`
  - CDP 驗收：`tools/verify_g2_n26_cdp.js`（Exit Code 0）
  - 軌道 B 眼睛審查：5 題 390px 實機截圖全綠 (無穿模/無文字遮擋/高度 330~407px <= 420px)
- [x] **Step 3: G2-N-2-7 九九乘法題庫與 5 套考題微教具落盤**
  - 資料契約：`data/units/G2/N-2-7.json`（5 題真題）
  - 微教具組件：`app/components/g2_n27_q[1-5]_*.html`
  - CDP 驗收：`tools/verify_g2_n27_cdp.js`（Exit Code 0）
  - 軌道 B 眼睛審查：5 題 390px 實機截圖全綠 (無穿模/無文字遮擋/高度 358~418px <= 420px)
- [x] **Step 4: 15 題 390px 實機出圖與 AGY 軌道 B 眼睛審查**
  - 批量產出 15 張 390px 實機截圖至 `_scratch/verify/`
  - AGY 逐張審查無穿模、無文字壓線、無未作答劇透 (15 題全量 PASS)
- [x] **Step 5: 課綱大廳 131 閉環總檢與 Git 交付**
  - 更新 `data/curriculum.json`，執行 `verify_curriculum_131.js` 驗收 Exit Code 0 (ALL PASS)
  - 執行 `node tools/verify_curriculum_131.js` 驗收 Exit Code 0。
