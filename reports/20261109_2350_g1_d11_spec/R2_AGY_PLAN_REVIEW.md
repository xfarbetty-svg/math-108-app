# R2_AGY_PLAN_REVIEW - D-1-1 統計與分類 (分類抽屜與正字劃記計數台) 施工放行書

- **條目代號**：D-1-1（一年級：資料分類與呈現 — 單一特徵分類、正字劃記、計數統計表格、一維長條圖呈現）
- **核心教具**：`<data-sorter-bench>`
- **審查人**：AGY（外骨骼大腦）
- **依據**：`R0_AGY_BLUEPRINT.md` 與 `R1_BP_EXECUTION_PLAN.md`
- **放行狀態**：`MUTUAL_CONSENT_APPROVED`

---

## 1. 核心規格核准確認

1. **體積預算與技術約束**：
   - 守門硬指標：`app/components/data-sorter-bench.js` 單檔體積 $\le 12,288$ B（12 KB）。
   - 純原生 Web Component，零外部依賴，純 SVG 向量渲染。
2. **算理與狀態機核准**：
   - 分類入庫（分類抽屜）：支援逐個分類或 `autoSort()`，待分類區與抽屜計數連動，達到「不重不漏」。
   - 正字劃記：嚴格依照標準 5 劃分解（橫、豎、短橫、短豎、底長橫），每滿 5 劃完成一完整「正」字。
   - 五進位累加與極值分析：自動計算各類數量、最大值（最多）、最小值（最少）與總量。
   - 一維長條圖切換：支援 `toggleBarView(bool)`，正字切換為直觀長條柱，高度按比例繪製。
3. **驗收規格**：
   - 獨立驗收頁 `tests/ac_data_sorter_bench.html`（15 項檢驗）。
   - 納入 `tools/ac_gate.js` 機械化閘門。

---

## 2. 施工派工指令

- **派工單位**：通道 2 (A-SERVER SSH OpenCode CLI Worker `iceman-free`)
- **產出目標**：
  1. `app/components/data-sorter-bench.js`（$\le 12,288$ B）
  2. `tests/ac_data_sorter_bench.html`
  3. `R3_WORKER_BUILD_REPORT.md`
- **通關印記**：`MUTUAL_CONSENT_APPROVED`
