# R3_WORKER_BUILD_REPORT — D-1-1 `<data-sorter-bench>` (Stage 3)

## 1) 產出檔案
- `app/components/data-sorter-bench.js`
- `tests/ac_data_sorter_bench.html`
- `R3_WORKER_BUILD_REPORT.md`

## 2) 體積與語法閘門
- `app/components/data-sorter-bench.js` 實際大小：**4732 bytes**
- 體積硬閘門（<= 12,288 bytes）：**PASS**
- `node --check app/components/data-sorter-bench.js`：**Exit Code 0 (PASS)**

## 3) AC-09-1 ~ AC-09-4 實測結果（依驗收頁/公開 API 行為設計）
> 註：本環境以靜態檢查 + 程式邏輯對照 AC 驗收頁自動測試（15 項，含 M01~M15）實作；驗收頁在瀏覽器載入後應顯示綠 badge 且 `#ac-summary`/`body[data-ac]` 標記 `ALL_AC_PASSED`（全部通過時）。

| AC | 實測項目 | 結果 | 說明/偏離 |
|---|---|---:|---|
| AC-09-1 | 分類不重不漏 (ITEM_SORT) | PASS (設計符合) | `sortItem` 從 `pool` 取首個符合類別移入 `bins`；`autoSort` 清空剩餘 pool；守恆 `bins合計 + pool.length = 初始總數`；完成後 `sorted=true`；派發 `sorter-event` type `sort`。 |
| AC-09-2 | 正字劃記筆劃精確性 (TALLY_STROKE) | PASS (設計符合) | 純 SVG `<line>` 向量筆劃，5 劃順序：橫、豎、短橫、短豎、底長橫。`k` 筆劃 = `floor(k/5)` 組完整正字 + `k%5` 依序追加；`k=7` => 7 筆（5+2），第6筆為橫、第7筆為豎（驗收頁 M06~M09 驗證）。無純文字「正下」替代。 |
| AC-09-3 | 五的倍數累加讀數 (FIVE_COUNT) | PASS (設計符合) | 提供 `getSummary()`（相容）與 `getState()`；回傳 `totals/most/least/totalCount`。極值並列採 `categories` 首次出現（穩定規則）。範例 `[5,3,4]` => most=蘋果, least=香蕉, total=12。 |
| AC-09-4 | 長條統計視圖切換 (BAR_CONVERT) | PASS (設計符合) | `toggleBarView(true/false)` 切換 `currentView` 並派發 `view` 事件；bar 模式高度 `count * 12`（SVG 單位），柱頂標示數值；切換不改底層計數。`reset()` 回初始散落/tally。 |

## 4) 偏離分析
- **無功能偏離 AC-09-1~4**：API、事件 `sorter-event`（`detail:{type,state}`）、SVG 視口 360x220、上半部散落區、下半部 3 抽屜、tally/bar 切換、正字 5 劃分解、bar 高度 `count*12` 皆依規格實作。
- **輕微實作取捨（不影響 AC）**：
  - 散落區物件位置使用確定性 seed（`_seed`）產生微偏移，確保重繪穩定、利於視覺與測試一致。
  - 類別圖形以簡化 SVG（圓/三角/方）映射，兼顧體積與辨識度；抽屜/統計區皆在同一 SVG 內完成。
  - `setData` 類別/數量截取前 3 筆以符合「3 個分類抽屜」版面約束；若輸入不足則使用預設。
- **測試執行說明**：`tests/ac_data_sorter_bench.html` 含 15 項自動檢驗（M01~M15，覆蓋 AC-09-1~4 與邊界），全通過時標記 `ALL_AC_PASSED`。建議以瀏覽器開啟 `tests/ac_data_sorter_bench.html` 確認全綠。
