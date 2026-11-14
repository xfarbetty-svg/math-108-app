# 任務卡：G3-N-3-1 一萬以內的數具象實驗室升級與掛載 (Visual-First 落地)

> 施工單位：通道一（本地 OpenCode CLI / Model: opencode/glm-5.3-flash-free）  
> 監工驗收：AGY 架構師（依據人類指令：A 方案邊做邊看，立即將日系擬物教具升級融入 N-3-1 並掛載上線）  
> 交付標準：`tools/verify_n31.js` 與 `tools/verify_curriculum_131.js` 機械化閘門全部 Exit Code 0 全綠！

---

## 🎯 核心任務目標

### 任務一：將 `app/g3_showcase.html` 之日系擬物視覺精華融合至 `app/components/ten_thousand_lab.html`
- **風格對齊**：
  - 背景配色：`--bg: #fff9f0`、卡片白色圓角 `18px`，柔和暖色系。
  - 徹底告別粗糙的純灰色框線，全面重用 `g3_showcase.html` 的 CSS 類別與擬物特效。
- **三大核心教具無縫整合**：
  1. **跳數小火車**（q=3 與 q=9）：重用純 SVG 蒸氣火車頭、輪子、木紋車廂、拋物線跳數弧線與插旗！
  2. **立體卡牌桌遊盤**（q=5、q=6、q=8）：重用 3D 厚卡牌質感、雙槽對照、高位比大小冠冕光暈！
  3. **四艙位值與進位收納台**（q=1、q=2、q=4、q=7、q=10）：重用 3D 翡翠綠千位箱、珊瑚紅百位板、雙 0 幽靈占位、以及滿十進千大金塊融合飛入動畫！
- **重要防錯守門**：
  必須嚴格保留 `tools/verify_n31.js` 靜態掃描之關鍵類別與函式名稱：
  - q=1: `blk1000`, `expandFormula`
  - q=2: `digit-tile`, `liftDigit`
  - q=3: `car`, `fillCars`
  - q=4: `word-btn`, `placeWord`
  - q=5: `cmp-num`, `cmpStep`
  - q=6: `card-slot`, `arrangeCards`
  - q=7: `coin-area`, `sumCoins`
  - q=8: `diff-calc`, `calcDiff`
  - q=9: `rule-input`, `findRule`
  - q=10: `carry-box`, `combineCarry`

### 任務二：課綱真理同步 (`data/curriculum.json`)
- 將三年級 `N-3-1` 單元狀態正式翻綠：
  - `"status": "ready"`
  - `"question_count": 10`
  - `"verified_source": "永安國小 114-1 期中（是非/選擇/跳數/讀寫/比大小）＋ 內湖國小 114-1 期中（卡牌/錢幣進千/差值/規律/位值進位）"`

### 任務三：守門員條目同步 (`tools/verify_curriculum_131.js`)
- 在 `EXPECTED_READY_CODES` 陣列中加入 `'N-3-1'`（ready 條目總數變為 12 條）。

---

## 🛡️ 驗收檢驗流程
工兵完成代碼後，必須在終端執行並確保全部 PASS：
```bash
node tools/verify_curriculum_131.js
node tools/verify_n31.js
```
兩者皆為 Exit Code 0，即刻向 AGY 回報完工。
