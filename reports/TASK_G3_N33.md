# 任務卡：G3-N-3-3 乘以一位數（直式乘法算理教具與真題資料庫落地）

## 🎯 任務目標
落實三年級第三單元 `G3-N-3-3 乘以一位數` 的具象教具與真題題庫。
嚴格遵守「倒著做（Visual-First）」、「每單元 10 題實體段考真題」與「One-Screen 單屏免滑動」憲法標準。

---

## 📋 具體實作要求

### 檔案 1：`app/components/multiplication_lab.html`
- **風格與設計**：
  - 延續 `app/components/vertical_calc_lab.html` 的溫暖日系繪本擬物卡片風格（配色：`#fff9f0` 底色、`#ff8a65` 珊瑚紅、`#7bc9b2` 薄荷綠、`#ffd166` 檸檬黃）。
  - 純 SVG 繪製乘法直式結構：
    - 千位、百位、十位、個位對齊虛線與欄位文字。
    - 乘號 `×` 與底線 `line`。
    - 支援進位標籤（小圓圈帶數字，如 ②、④、⑤，珊瑚橘底白字，清晰漂浮於十位/百位上方）。
- **互動算理功能**：
  - 「一步一步看算理 ▶」步進演繹按鈕：
    - 步驟 0：顯示原式（如 $53 \times 2$ 或 $309 \times 3$）。
    - 步驟 1：個位相乘（高亮個位），若有進位，進位數浮現於十位上方。
    - 步驟 2：十位相乘，加上進位數（高亮十位與進位），若滿十進百，進位數浮現於百位上方。
    - 步驟 3：百位相乘，加上進位數，得出最終完整積。
  - 4 個選項按鈕與「檢查答案」即時回饋（答對綠色彈窗、答錯紅色彈窗）。
- **10 題資料完整映射（?q=1 到 ?q=10）**：
  - 1: 53 × 2 = 106 (內湖 113-1 期中)
  - 2: 33 × 4 = 132 (內湖 111-1 期中)
  - 3: 84 × 6 = 504 (永安 114-1 期中)
  - 4: 131 × 7 = 917 (內湖 114-1 期中)
  - 5: 309 × 3 = 927 (內湖 113-1 期中)
  - 6: 506 × 9 = 4554 (內湖 114-1 期中)
  - 7: 125 × 8 = 1000 (內湖 111-1 期中)
  - 8: 400 × 5 □ 500 × 4 (比大小，填 =，永安 114-1 期中)
  - 9: 495 × 6 估算最接近的數 (選 3000，內湖 114-1 期中)
  - 10: 弟弟有 200 元，哥哥買飛機花了弟弟的 3 倍，是多少元？(200 × 3 = 600，內湖 113-1 期中)
- **防抖與高度規範（鐵律）**：
  - `html, body { height: auto; min-height: auto; margin: 0; padding: 6px; box-sizing: border-box; }`
  - 嚴禁 `height: 100vh` 或 `min-height: 100%`！
  - 容器總高度控制在 350px~410px，手機 390px 視口零滑動、零橫向溢出。

---

### 檔案 2：`data/units/G3/N-3-3.json`
- 嚴格對齊 `data/units/G3/N-3-2.json` 的資料 Schema。
- 10 題完整資料結構（含 `id`: "G3-N-3-3-Q01"~"Q10"、`exam_source`、`section`、`question_num`、`title`、`stem`、`choices`、`answer_index`、`answer_raw`、`component`: "multiplication-lab"、`component_path`: "components/multiplication_lab.html?q=1"~"10"、`fallback_height`: 420、`explanation`: { "concept": "...", "steps": [...], "trap": "..." }）。

---

### 檔案 3：`data/curriculum.json` 更新
- 找到 `code == "N-3-3"`：
  - `status`: "ready"
  - `question_count`: 10
  - `verified_source`: "臺北市內湖國小 114-1/113-1/111-1 期中 ＋ 高雄市永安國小 114-1 期中"

---

## 驗收標準
1. 瀏覽器開啟 `app/components/multiplication_lab.html?q=1`~`?q=10` 均能正常渲染直式乘法與算理。
2. 點擊「一步一步看算理 ▶」每一步算理高亮與進位標籤清晰動態呈現。
3. `data/units/G3/N-3-3.json` 包含 10 題完整真題，JSON 語法驗證通過。
4. `data/curriculum.json` 課綱狀態正確更新為 ready。
