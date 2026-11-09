# R1_BP_EXECUTION_PLAN — D-1-1 統計與分類 `<data-sorter-bench>`

- **角色**：AutoFlow 現場指揮官 Big Pickle (BP)
- **階段**：Stage 1 細部任務拆解
- **依據藍圖**：`R0_AGY_BLUEPRINT.md` v1.0.0（D-1-1）
- **目標產物**：單檔 Web Component + 獨立 AC 驗收頁（15 項自動測試全綠）
- **體積硬閘門**：`app/components/data-sorter-bench.js` ≤ **12,288 B**（零外部依賴）

---

## 1. 任務拆解卡

### T-01 散落區與抽屜幾何
- **目的**：建立 SVG 視口內的靜態/動態幾何骨架，確保版面可容納散落區、3 個分類抽屜、正字/直條區與操作提示。
- **輸入**：`setData({ categories, counts })`；預設 3 類、各 2~6 個。
- **幾何規格**：
  - SVG `viewBox="0 0 360 220"`，背景透明/淺底（內嵌於組件樣式）。
  - **散落區**（頂部）：`x=12, y=12, w=336, h=62`；物件以網格+微隨機偏移排列（確定性 seed，避免重繪抖動），每項含圖示/emoji 或簡化 SVG path + 類別識別。
  - **分類抽屜區**（中部）：3 槽等分，`y=82, h=54`，左右留白 12；每槽含標籤（類別名）、顏色框、抽屜內堆疊計數顯示。
  - **統計區**（底部）：`y=144, h=64`，左側/分欄呈現正字劃記或直條圖（T-03/T-04 切換）。
- **實作要點**：
  - 單一 render 函式依 state 輸出 SVG 字串/節點；避免全域字串替換樣式（遵守全域防錯 #6）。
  - 幾何常數集中定義（便於壓縮與校準 D-03 比例尺）。
- **完成定義**：初始 `UNCLASSIFIED` 可見散落物件與空抽屜；`reset()` 回復初始幾何狀態。

### T-02 分類收納狀態機
- **目的**：實作 `UNCLASSIFIED → SORTING → TALLY_ACTIVE` 的資料流與互動，保證「不重不漏」。
- **狀態與資料**：
  - `pool`: 待分類項目陣列（含 `id`, `type/category`）。
  - `bins`: `{ [category]: count }` 或陣列計數。
  - `sorted`: boolean（全部入庫時 true）。
  - `view`: `'tally' | 'bar'`。
- **方法行為**：
  - `sortItem(itemType)`: 從 `pool` 取出**第一個**符合 `itemType` 的未分類項（或依 id）；移入對應 bin；派發 `sorter-event { type:'sort', state }`；若 pool 清空則進入 `TALLY_ACTIVE`。
  - `autoSort()`: 依 pool 順序逐項分類（可同步完成以利測試穩定；若做動畫，須提供完成後狀態一致且測試可等待/同步路徑）。完成後 `sorted=true`。
  - `reset()`: 清空 bins、重建 pool、`view='tally'`、`sorted=false`。
- **邊界**：對不存在類別或空 pool 呼叫 `sortItem` 不拋錯（no-op + 可選事件），不破壞計數守恆。
- **完成定義**：`sum(bins)+pool.length === totalInitial` 恆成立；AC-09-1 通過。

### T-03 正字劃記 5 劃演繹
- **目的**：以 SVG 向量筆劃精確呈現正字計數，支援 0~上限（至少覆蓋測試所需 7）。
- **筆劃定義（單一「正」字，局部座標，5 劃順序固定）**：
  1. **橫**（頂）：`M x1 y1 L x2 y1`
  2. **豎**（中軸）：`M x3 y1 L x3 y2`
  3. **短橫**（左內）：`M x4 y3 L x3 y3`
  4. **短豎**（左內下）：`M x4 y3 L x4 y4`
  5. **底長橫**（封底）：`M x1 y5 L x2 y5`
  - 各類別在統計區分欄繪製；每滿 5 劃另起一個「正」字偏移 `dx`，餘數劃依序追加。
- **演繹規則**：計數 `k` → 繪製 `floor(k/5)` 個完整正字 + `k%5` 劃（順序 1→5）。`k=7` 必得 1 個完整正字 + 第 1、2 劃。
- **實作要點**：筆劃用 `<path>`/`<line>`，`stroke-linecap="square"` 或一致端點；座標整數化/固定小數以利體積與精確比對。禁止以文字「正」替代筆劃（AC 要求筆劃精確性）。
- **完成定義**：AC-09-2 可由 DOM/SVG 子節點數或筆劃序列驗證。

### T-04 直條統計圖切換與極值分析
- **目的**：提供 tally ↔ bar 視圖切換，並輸出極值/總計摘要。
- **視圖切換**：
  - `toggleBarView(bool)`: `true` → `view='bar'`；`false` → `view='tally'`；派發 `sorter-event { type:'view', state }`。
  - **bar 模式**：每類一根垂直柱，`height = count * 12`（px，SVG 單位）；柱頂標示數值；底部對齊統計區基線。
- **摘要/狀態**：
  - `getState()` 回傳 `{ sorted, currentView: 'tally'|'bar', totals: {...}, most, least }`（與藍圖介面對齊）。
  - **AC-09-3 相容**：提供 `getSummary()`（或等價別名）回傳各類數量、最大值類別、最小值類別、總計數；若最大/最小並列，採**穩定規則**（見 D-03/邊界）並在測試矩陣固定。
- **完成定義**：AC-09-3、AC-09-4 通過；切換不改變底層計數資料。

---

## 2. AC-09-1 ～ AC-09-4 逐條具體驗收步驟

### AC-09-1（分類不重不漏 — ITEM_SORT）
- **Given**：建立 `<data-sorter-bench>`，`setData({ categories:['蘋果','香蕉','橘子'], counts:[2,1,1] })`（或等價），記錄 `total=4`，散落區顯示 4 件。
- **When**：呼叫 `sortItem('蘋果')` 一次；再呼叫 `autoSort()` 完成剩餘。
- **Then（可觀測斷言）**：
  1. 第一次 `sortItem` 後：蘋果 bin 計數 +1，散落區待分類總數 -1（守恆 `binSum + poolCount == 4`）。
  2. `autoSort()` 後：`poolCount == 0`，`binSum == 4`，各類計數與設定一致。
  3. `getState().sorted === true`（或等價完成旗標）。
  4. 過程/完成觸發 `sorter-event` 且 `detail.type === 'sort'`（至少驗證最後一次或關鍵次數）。
- **失敗判準**：任一計數不守恆、重複入庫、pool 未清空但宣告 sorted。

### AC-09-2（正字劃記筆劃精確性 — TALLY_STROKE）
- **Given**：單一類別初始計數 0，視圖為 tally。
- **When**：將該類別計數自 0 增加至 7（透過受控 API：`setData` 指定 counts、或測試用 `autoSort` 對應資料、或元件公開的測試友善路徑；驗收頁以**公開 API** 驅動）。
- **Then（可觀測斷言）**：
  1. 該類別正字區共呈現 **7 劃**：第 1 組完整 5 劃 + 第 2 組 2 劃。
  2. 筆劃順序符合 T-03（1.橫 2.豎 3.短橫 4.短豎 5.底長橫；第 6 劃=橫、第 7 劃=豎）。
  3. SVG 內可查得對應筆劃元素數（`line/path`）或可辨識的筆劃標記屬性；**不接受**僅顯示文字「正下」。
- **失敗判準**：劃數 ≠ 7、順序錯、用純文字冒充筆劃。

### AC-09-3（五的倍數累加讀數 — FIVE_COUNT）
- **Given**：所有物件已全部分類完畢（`autoSort()` 完成或等價），例：`counts=[5,3,4]`，`categories=['蘋果','香蕉','橘子']`。
- **When**：呼叫 `getSummary()`（若介面以 `getState()` 為主，驗收頁亦驗證 `getState()` 含等價欄位；兩者一致）。
- **Then（可觀測斷言）**：
  1. 回傳各類數量：蘋果 5、香蕉 3、橘子 4。
  2. 最大值類別 = 蘋果（5）；最小值類別 = 香蕉（3）。
  3. 總計數 = 12。
  4. 回傳結構可程式化讀取（非僅畫面文字）。
- **失敗判準**：總計錯、極值類別錯、未完成分類仍回傳不一致摘要（依實作可定義為允許計算當前 bins，但測試以「全部分類完畢」情境為準）。

### AC-09-4（長條統計視圖切換 — BAR_CONVERT）
- **Given**：已完成計數（同上資料集，counts `[5,3,4]`）。
- **When**：呼叫 `toggleBarView(true)`。
- **Then（可觀測斷言）**：
  1. `getState().currentView === 'bar'`。
  2. 三類直條高度分別為 `60 / 36 / 48`（SVG 單位 px），符合 `height = count * 12`。
  3. 各直條頂部/鄰近位置標示對應數值 `5,3,4`（文字節點或 data 屬性可驗證）。
  4. 觸發 `sorter-event` 且 `detail.type === 'view'`。
- **附加回歸**：`toggleBarView(false)` 回到 tally，底層 totals 不變。

---

## 3. 偏離與邊界裁決

### D-01 獨立體積預算 ≤ 12,288 B
- **裁決**：硬性閘門。以**磁碟檔案位元組數**（UTF-8）衡量 `app/components/data-sorter-bench.js`；CI/驗收頁外可用 `fs.statSync().size` 或 PowerShell `(Get-Item).Length` 輔助，但最終以檔案實際大小為準。
- **策略**：
  - 無 runtime 依賴、無外部 CSS；SVG 模板壓縮（短屬性名、合併 path、共用常數）。
  - 避免冗長註解/空白；方法名保持 API 必要性（`setData/autoSort/toggleBarView/reset/getState` + `getSummary` 相容）。
  - 若逼近上限，優先精簡動畫與裝飾，**不得犧牲 AC-09-1~4 正確性**。
- **偏離處理**：超過 12,288 B 視為未交付；需重構壓縮後再驗收。

### D-02 正字 5 劃 SVG 向量坐標嚴謹性
- **裁決**：正字必須由**向量筆劃**構成，順序與構成符合 T-03。座標採**固定局部模板 + 平移**（per 類別、per 組），確保可測試、可重現。
- **嚴謹性要求**：
  - 5 劃幾何拓撲正確（頂橫、貫穿豎、左內「口」兩劃、底長橫），筆劃不合併成單一不透明塗色塊以規避劃數檢查。
  - 每劃獨立元素或可明確切分的子路徑（測試可數）。
  - 座標一致性：同一模板在不同類別僅做 `translate`/偏移，不因類別改變筆畫順序。
- **邊界**：`k=0` 無劃；`k>=5` 多組並排；上限由版面裁切或測試範圍約束（至少支援到 7）。

### D-03 直條圖高度比例尺
- **裁決**：嚴格採藍圖公式 `height = count * 12px`（SVG 單位）。**不**依最大值自動 normalize（避免 AC-09-4 數值斷言失效）。
- **基線與標示**：所有直條共用同一底部基線 `y_base`；`y_top = y_base - count*12`；頂部標示數值置於柱頂上方固定偏移。
- **極值並列規則（AC-09-3 邊界）**：若多類並列最大/最小，回傳**首次出現**（依 `categories` 順序）之類別，並在測試矩陣註明；避免非決定性。
- **viewBox 餘裕**：預期最大 count 在教具範圍內（例 ≤ 10）時 `120px` 內可容納；實作需確保不超出統計區。

---

## 4. 交付清單

### 4.1 組件路徑
| 項目 | 路徑 | 說明 |
|---|---|---|
| Web Component（單檔） | `app/components/data-sorter-bench.js` | 自訂元素 `<data-sorter-bench>`，Shadow DOM/SVG，零外部依賴 |
| 語法檢查 | `node --check app/components/data-sorter-bench.js` | Exit Code 必須為 0 |

### 4.2 獨立 AC 驗收頁
| 項目 | 路徑 | 說明 |
|---|---|---|
| 驗收頁 | `tests/ac_data_sorter_bench.html` | 載入本地組件、執行 15 項自動測試、顯示 PASS/FAIL 與摘要 |
| 執行方式 | 瀏覽器開啟本地檔案（或本地靜態伺服器） | 無需網路/CDN |

### 4.3 測試矩陣（15 項，對應 AC-09-1~4 + 邊界）

| # | ID | 對應 | 測試項目 | 預期結果 |
|---|---|---|---|---|
| 1 | M01 | AC-09-1 | 元件註冊與掛載 | `customElements.get('data-sorter-bench')` 存在；DOM 可建立 |
| 2 | M02 | AC-09-1 | `setData` 初始散落計數 | pool 總數 = counts 合計；bins 初始為 0/空 |
| 3 | M03 | AC-09-1 | `sortItem` 單次守恆 | 呼叫後 pool-1、對應 bin+1、總和不變 |
| 4 | M04 | AC-09-1 | `autoSort` 完成不重不漏 | pool=0、bins 合計=初始總數、各類正確 |
| 5 | M05 | AC-09-1 | `sorted` 旗標與 sort 事件 | 完成後 `getState().sorted===true`；收到 `sorter-event` type `sort` |
| 6 | M06 | AC-09-2 | k=5 完整正字 | 單類 5 筆，構成 1 組完整正字 |
| 7 | M07 | AC-09-2 | k=7 筆劃總數 | 共 7 筆（5+2） |
| 8 | M08 | AC-09-2 | k=7 筆劃順序 | 第 6 筆=頂橫、第 7 筆=豎（符合順序 1,2） |
| 9 | M09 | AC-09-2 | 向量筆劃非純文字 | 存在可數的 `line/path` 筆劃元素（≥7） |
| 10 | M10 | AC-09-3 | `getSummary` 各類數量 | 回傳 totals 與設定 counts 一致 |
| 11 | M11 | AC-09-3 | `getSummary` 極值與總計 | most/least 正確；total=12（範例資料） |
| 12 | M12 | AC-09-3 | `getState` 欄位完整性 | 含 `sorted,currentView,totals,most,least` |
| 13 | M13 | AC-09-4 | bar 視圖切換與事件 | `toggleBarView(true)` 後 `currentView==='bar'`；收到 type `view` |
| 14 | M14 | AC-09-4 | bar 高度比例尺 | counts [5,3,4] → 高度 60,36,48（`count*12`） |
| 15 | M15 | AC-09-4/D-01邊界 | 數值標示 + reset 回歸 | bar 模式顯示 5,3,4；`reset()` 後回到未分類/tally 初始一致狀態 |

**通過標準**：15/15 PASS；任一 FAIL 即 Stage 1 驗收不通過。測試實作需可重跑（每次重建元件或 `reset`）。

---

## 5. BP 執行備註
- **介面對齊**：藍圖同時出現 `getSummary()`（AC 敘述）與 `getState()`（介面）— 兩者皆實作/相容，避免驗收歧義。
- **事件統一**：`sorter-event` 的 `detail.type` 使用 `sort | tally | view`（與藍圖一致）；state 快照最小但可驗證。
- **實作順序建議**：T-01 幾何骨架 → T-02 狀態機 → T-03 正字 → T-04 bar/摘要 → 驗收頁 15 測試 → 體積壓縮（D-01）→ `node --check`。

---
*BP Stage 1 拆解完成，待進入實作與驗收。*