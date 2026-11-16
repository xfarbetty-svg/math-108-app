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



