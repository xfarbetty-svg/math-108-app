# R1_BP_EXECUTION_PLAN — N-1-4 毛玻璃遮罩數線反推儀 `<glass-number-line>`（Stage 1 細部拆解）

- **指揮**：Big Pickle (BP)
- **依據**：`R0_AGY_BLUEPRINT.md` v1.0.0
- **條目**：N-1-4（一年級：加減應用、未知數在不同位置、數線逆運算反推）
- **交付目標**：單檔 Web Component，零外部依賴，`<= 12,288 B`
- **狀態**：Stage 1 計畫（待實作）

---

## 1. 任務拆解卡

| 卡號 | 名稱 | 目標 | 輸入/依據 | 實作要點 | 產出/介面 | 驗收掛鉤 |
|---|---|---|---|---|---|---|
| **T-01** | 數線刻度幾何 | 建立 0~20 數線的確定性座標系，作為所有互動的單一真值來源 | SVG 視口 `360×220`；主軸 `X0=30`、`X20=330`；`step=15px`；主刻度 `0,5,10,15,20` | 1) 以常數定義 `VIEW_W=360, VIEW_H=220, X_START=30, X_END=330, TICK_MIN=0, TICK_MAX=20, STEP=15`。2) 封裝 `tickToX(k)=X_START + k*STEP`，禁止散落魔術數字。3) 繪製水平主軸、次刻度（每格）、主刻度加粗與下方數字標籤。4) 座標只用整數 px/刻度索引運算，避免浮點累積。 | 靜態 SVG 幾何；內部 `tickToX`/`xToNearestTick`（若拖曳用）；刻度 DOM/SVG 結構可供測試查驗 | AC-08-1（座標精度/磁吸基準） |
| **T-02** | 毛玻璃遮罩與磁吸步進 | 讓未知數位置可視化為「可定位的遮罩」，並強制吸附到刻度 | T-01 座標系；遮罩 `24×30`、圓角 `4`、含 `?` | 1) 建立遮罩盒 SVG 群組（毛玻璃感可用半透明填色+描邊+模糊/紋理替代，須控體積；不可引外部濾鏡資源）。2) `moveToTick(k)`：夾限 `k∈[0,20]`，中心 `cx=tickToX(k)`，同步內部 `currentTick`。3) 若支援拖曳：pointer move 時用 `xToNearestTick(x)` 計算最近刻度並吸附（snap），僅在刻度變更時更新。4) 發出 **`numline:snap`**（AC-08-1 指定）與/或統一 **`numline-event`**（介面約定）；實作以「兩者皆發、detail 一致」降低驗收歧義（見 D-03 備註）。5) 遮罩顯示 `?`，揭曉後切換為真實數字。 | `moveToTick(k)`（內部/公開視實作取捨，至少行為可測）；事件 `numline:snap`；狀態 `currentTick` | AC-08-1 |
| **T-03** | 反向倒退拋物線 | 將「逆運算」具象為從終點往起點回溯的跳躍動畫，破除「見加就加」 | 情境 `add_start`：`(□)+jump=end`；狀態機 `MASKED→DRAG_REVERSE/REVERSE→SNAPPED→REVEALED` | 1) `setEquation({ mode:'add_start', start, jump, end })`：驗證 `start+jump===end` 且皆在 0~20；初始化遮罩在未知位置（依模式，`add_start` 未知為 start）與終點標記。2) `stepReverse()`：以終點 `end` 為基準，向左回溯 `jump` 格（`end-jump=start`），繪製弧形拋物線箭頭並標註 `-jump` 或逆算語意（視覺可標 `倒退 jump`/`-4`，教學語意以 AC 文字為準）。3) 動畫可用 CSS transition/`requestAnimationFrame` 簡版，須控體積；動畫結束落點必須精確 `tickToX(start)`。4) 抵達後狀態 `SNAPPED`/`REVERSE_ACTIVE`（依內部命名，對外 `getState().status` 可測且一致）；發出事件。 | `setEquation`、`stepReverse`、拋物線 SVG path、狀態轉移 | AC-08-2、AC-08-1（落點磁吸） |
| **T-04** | 揭曉破招與減法未知數模式 | 在正確位置揭曉答案與破招算式；支援減法兩種未知數的視覺/算理呈現 | AC-08-3、AC-08-4；狀態機終態 `REVEALED` | 1) `reveal()`：僅在已抵達/可推導正確答案時執行；遮罩漸變透明（opacity/transition），顯露金色數字；上方浮出破招算式（`add_start`: `12 - 5 = 7`）。2) `setScenario('sub_unknown', { start: 15, end: 9 })`（AC-08-4）/等價 API：標記 15、9，兩點間高亮區間框選，顯示「跨越 6 格」，`(□)=6`，算理 `15-9=6`。3) 減法被減數未知 `(□)-4=8` 歸類為逆向加回 `8+4=12`（藍圖痛點），以統一方程模型表示（見 D-03）。4) `reset()` 清空狀態/圖層/事件殘留，回可再初始化狀態。5) `getState()` 回傳 `{ mode, start, jump, end, currentTick, status, revealed }`，欄位缺省以 `null/false` 明確表示。 | `reveal`、`reset`、`getState`、`setScenario`（或由 `setEquation` 覆蓋並提供相容入口）、破招文字/區間高亮 | AC-08-3、AC-08-4 |

### T-01~T-04 相依與里程碑
1. **M1（T-01 完成）**：座標函數與刻度渲染穩定，單元斷言 `tickToX(0)=30`、`tickToX(20)=330`、`tickToX(k)-tickToX(k-1)=15`。
2. **M2（T-02 完成）**：遮罩可磁吸並發事件，AC-08-1 可獨立通過。
3. **M3（T-03 完成）**：`add_start` 逆算動畫與落點正確，AC-08-2 通過。
4. **M4（T-04 完成）**：揭曉與 `sub_unknown` 情境完成，AC-08-3/04 通過；執行體積/語法閘門與 15 項測試全綠。

---

## 2. AC-08-1 至 AC-08-4 逐條具體驗收步驟

> 驗收頁：`tests/ac_glass_number_line.html`。每條 AC 以「前置 → 操作 → 斷言 → 證據」記錄；失敗即顯示紅色與實際值。建議測試透過公開 API + 事件監聽 + `getState()` + SVG 幾何屬性（`transform`/`x`/`cx`/path 端點）驗證，不依賴私有變數名稱（除非刻意暴露測試鉤子且不影響體積）。

### AC-08-1（數線步進磁吸 - `SNAP_TICK`）
- **Given**：數線刻度 0~20，`step=15px`，組件已掛載。
- **When**：拖曳遮罩或呼叫 `moveToTick(k)`（測試至少覆蓋 `k=0,7,12,20` 與邊界夾限）。
- **Then**：遮罩盒中心座標精確吸附在 `30 + k*15 px`；發出 `numline:snap` 事件。

| 步驟 | 操作 | 斷言（Pass 條件） | 證據 |
|---|---|---|---|
| 1 | 建立 `<glass-number-line>` 並 append 至測試容器，等待 connected/render。 | 元素存在；`typeof el.getState === 'function'`（或等價 API 可用）。 | DOM 查詢結果 |
| 2 | 註冊 `el.addEventListener('numline:snap', handler)` 收集事件。 | handler 可觸發。 | 事件陣列長度 |
| 3 | 呼叫 `el.moveToTick(7)`（若 API 名不同，驗收頁以實際公開 API 對齊並記錄）。 | 無例外；`getState().currentTick===7`（或等價欄位）。 | `getState()` JSON |
| 4 | 讀取遮罩中心 X：由遮罩群組 `transform`/`cx`/`x+width/2` 推算。 | 中心 X **===** `30+7*15 = 135`（允許字串數值轉型後嚴格相等；不得用模糊前綴比對）。 | 實際 X 與期望 X |
| 5 | 檢查最新 `numline:snap`。 | `event.type` 為 `numline:snap`（或 `detail.type==='snap'` 依實作）；`detail.tick===7`；攜帶狀態資訊不衝突。 | event.detail |
| 6 | 邊界：`moveToTick(-1)`、`moveToTick(99)`。 | 夾限至 `0`/`20`；中心 X 為 `30`/`330`；不產生 NaN/越界 SVG。 | X 與 currentTick |
| 7 |（若有拖曳）模擬 pointer 拖曳到刻度 12 附近。 | 吸附到 `tick=12`、中心 `210`，發出 snap。 | 事件與座標 |

### AC-08-2（未知起點逆算 - `REVERSE_WALK`）
- **Given**：情境 `(□) + 5 = 12`。
- **When**：呼叫 `stepReverse()` 或點擊「倒退反推」。
- **Then**：自刻度 12 向左回溯 5 格拋物線，抵達刻度 7，狀態轉為 `REVERSE_ACTIVE`（或等價「反推進行/完成可辨識」狀態，見 D-03）。

| 步驟 | 操作 | 斷言 | 證據 |
|---|---|---|---|
| 1 | `el.setEquation({ mode:'add_start', start:7, jump:5, end:12 })`。 | `getState()` 反映 `mode/start/jump/end`；未知起點被遮罩表達；終點 12 可辨識。 | state |
| 2 | 監聽 `numline-event`/狀態變化；呼叫 `el.stepReverse()`。 | 觸發反推流程；狀態進入 reverse 類型（`REVERSE_ACTIVE`/`DRAG_REVERSE` 過渡後可接受，最終落點前後可觀測）。 | 事件序列 |
| 3 | 等待動畫完成（輪詢 `getState()` 或監聽完成事件；測試設 timeout 上限，如 3s）。 | 拋物線/path 存在或曾建立；語意為自 12 向左 5 格。 | SVG path/動畫完成旗標 |
| 4 | 檢查落點。 | 遮罩/指示器落在刻度 7：中心 X `135`；`currentTick===7` 或等價起點揭曉前位置正確。 | 座標與 state |
| 5 | 檢查狀態。 | `status` 表示已完成反推（建議接受 `REVERSE_ACTIVE`/`SNAPPED`/`REVERSE_DONE` 其一並在 D-03 固定；驗收頁以藍圖字串 `REVERSE_ACTIVE` 為主，若實作採更精細狀態則需同時滿足「可辨識為反推已抵達」）。 | `getState().status` |

### AC-08-3（遮罩揭曉破招 - `REVEAL_ANSWER`）
- **Given**：已反向抵達正確起點刻度 7（承接 AC-08-2 情境）。
- **When**：呼叫 `reveal()`。
- **Then**：遮罩盒子漸變透明，金色顯露數字 `7`，數線上方浮出破招算式 `12 - 5 = 7`，狀態為 `REVEALED`。

| 步驟 | 操作 | 斷言 | 證據 |
|---|---|---|---|
| 1 | 在 AC-08-2 完成態呼叫 `el.reveal()`。 | 無例外。 | — |
| 2 | 檢查遮罩視覺。 | 遮罩 opacity 降低/透明（`opacity < 1` 或等價 class/style）；不再以實心遮蓋數字。 | computed style / SVG attribute |
| 3 | 檢查揭曉數字。 | 畫面/DOM/SVG text 含數字 `7`；呈現為金色（`#...`/`gold`/`rgb` 等價，驗收以包含金色系或指定 token 為準）。 | textContent + fill/style |
| 4 | 檢查破招算式。 | 上方浮出/顯示算式文字包含 `12 - 5 = 7`（允許全形/半形空白差異時須在測試正規化，但**實際顯示建議半形標準式**）。 | textContent 正規化比對 |
| 5 | 檢查狀態。 | `getState().status === 'REVEALED'` 且 `getState().revealed === true`。 | state |
| 6 | 冪等/重入（建議）。 | 重複 `reveal()` 不拋錯、不破壞狀態。 | 第二次呼叫後 state |

### AC-08-4（減法未知數切換 - `SUB_UNKNOWN`）
- **Given**：情境 `15 - (□) = 9`。
- **When**：呼叫 `setScenario('sub_unknown', { start: 15, end: 9 })`。
- **Then**：數線標記 15 與 9 兩點，兩點之間的間距高亮框選，顯示「跨越 6 格」，揭曉 `(□) = 6`。

| 步驟 | 操作 | 斷言 | 證據 |
|---|---|---|---|
| 1 | `el.reset()` 後呼叫 `el.setScenario('sub_unknown', { start: 15, end: 9 })`（若採 `setEquation` 統一，驗收頁呼叫對應公開入口並記錄 D-03 決策）。 | 無例外；模式進入減法未知數（sub_unknown）。 | state.mode |
| 2 | 檢查兩點標記。 | 刻度 15 與 9 位置有可見標記（點/圈/標籤）；X 分別為 `30+15*15=255`、`30+9*15=165`。 | SVG 元素座標 |
| 3 | 檢查區間高亮。 | 9~15 之間存在高亮框選（rect/path/區間標示），覆蓋範圍與兩刻度一致（寬度約 `6*15=90px`）。 | 幾何屬性 |
| 4 | 檢查跨越文字。 | 顯示文字包含 `跨越 6 格`。 | textContent |
| 5 | 檢查揭曉結果。 | 顯示包含 `(□) = 6` 或等價 `□=6`/`? = 6`（以教學可讀為準；測試接受藍圖字串語意）。 | textContent |
| 6 | 算理一致性。 | `15-9===6`；`getState()` 中 `jump===6`（若模型如此表達）或等價欄位一致。 | state |

---

## 3. 偏離與邊界裁決

### D-01：獨立體積預算 `<= 12,288 B`
- **裁決**：`app/components/glass-number-line.js` 以 **UTF-8 位元組數** 計，**必須 <= 12288**（12 KiB 硬上限）。驗收頁/測試檔不計入組件體積。
- **量測方式**：`node -e "fs.statSync('app/components/glass-number-line.js').size"` 或等價；CI/驗收腳本記錄實際 bytes。
- **超標處置**：禁止引入外部依賴換取功能；優先壓縮 SVG 模板字串、合併重複 path、縮短內部識別字、移除非必要註解/空白、以資料驅動生成刻度。動畫改用最小 CSS/transform。若仍超標，**不得放寬 D-01**，需砍非 AC 必要視覺效果並回報 BP。
- **風險**：毛玻璃視覺 + 拋物線 + 多模式文字易膨脹；T-01 即採用函數生成刻度，避免 21 個刻度硬編碼。

### D-02：數線步進 `step=15px` 座標精度
- **裁決**：`step` 固定 `15`（px/刻度），由 `(330-30)/20` 推導，**實作只允許整數刻度索引 `k` 與整數座標**：`x = 30 + k*15`。禁止累加浮點、禁止 `Math.round(k*15.0001)` 類補償。
- **精度規則**：
  - 磁吸結果必須**全等**於目標刻度座標（型別轉換後數值相等）。
  - `xToNearestTick` 使用 `Math.round((x - X_START) / STEP)` 後夾限 `[0,20]`。
  - SVG `path`/`transform` 輸出可為整數字串；避免科學記號。
- **邊界**：`k<0 -> 0`、`k>20 -> 20`；非整數輸入 `Math.round` 後再夾限（或明確拒絕，測試以公開行為為準，預設寬容夾限）。
- **驗收容忍度**：座標斷言 **0 px 誤差**（因全為整數運算）；動畫過程中允許過渡值，但**完成態**必須落在精確刻度。

### D-03：兩種未知數模式的統一狀態機
- **問題**：藍圖同時出現 `add_start`、`sub_unknown`、`setEquation`、`setScenario`；減法有「被減數未知 `(□)-4=8`」與「減數未知 `15-(□)=9`」兩類。狀態名在 Mermaid/AC 中有 `MASKED/DRAG_REVERSE/SNAPPED/REVEALED` 與 `REVERSE_ACTIVE`。
- **裁決（統一模型）**：
  1. **內部 canonical model**：`{ mode, start, jump, end, unknown }`，滿足模式約束：
     - `add_start`（加法起點未知）：`unknown='start'`，`start + jump = end`，破招 `end - jump = start`。
     - `sub_end`（減數未知/終點跨度）：`unknown='jump'`，`start - jump = end`，破招 `start - end = jump`。AC-08-4 `15-(□)=9` 歸此類（`start=15,end=9,jump=6`）。
     - `sub_start`（被減數未知）：`unknown='start'`，`start - jump = end`，破招 `end + jump = start`（對應藍圖痛點 A）。
  2. **公開 API 相容**：
     - 必備：`setEquation(...)`、`stepReverse()`、`reveal()`、`reset()`、`getState()`（依藍圖 §3）。
     - AC-08-4 要求的 `setScenario('sub_unknown', { start, end })`：**必須提供**（可作為薄封裝，換算 `jump=start-end` 後呼叫內部統一入口）。若體積緊張，`setScenario` 僅支援 AC 指定簽名。
  3. **狀態機對齊**：
     - 對外 `status` 至少可表達：`MASKED`（初始化遮罩）→ `REVERSE_ACTIVE`（反推進行/已觸發，滿 AC-08-2 字面）→ `SNAPPED`（可選細分）→ `REVEALED`。
     - `stepReverse()` 在 `add_start` 執行拋物線回溯；在 `sub_end`/AC-08-4 可直接計算跨度並進入可揭曉態（區間高亮即「反推視覺」），避免為動畫硬撐體積；但**AC-08-4 未要求拋物線**，以 AC 文字為準。
  4. **事件命名**：AC-08-1 指定 `numline:snap`；§3 指定 `numline-event`。裁決：**snap 時發 `numline:snap`**；關鍵狀態轉移另發 `numline-event`（`detail: { type, tick, status, equation }`）。兩者 payload 不矛盾即可，驗收頁主要監聽 AC 指定事件。
- **禁止事項**：不得為不同模式複製兩套座標/繪圖邏輯；不得在 `sub_unknown` 與 `add_start` 使用不相容的 `getState()` 欄位語意（`start/jump/end` 保持算式真值）。

---

## 4. 交付清單

### 4.1 程式與頁面
| 類型 | 路徑 | 說明 | 閘門 |
|---|---|---|---|
| Web Component（主交付） | `app/components/glass-number-line.js` | 自訂元素 `<glass-number-line>`，純原生、零依賴 | `size <= 12288` bytes；`node --check` Exit 0 |
| AC 驗收頁 | `tests/ac_glass_number_line.html` | 瀏覽器可開啟的自動測試頁，載入組件並執行 15 項測試，顯示 Pass/Fail 與摘要 | 15/15 通過 |
| Stage 1 計畫（本文件） | `R1_BP_EXECUTION_PLAN.md` | 任務拆解、AC 步驟、D 裁決、測試矩陣 | 已交付 |
|（可選）體積/語法檢查紀錄 | `tests/r1_gate_report.txt` 或驗收頁內嵌顯示 | 記錄 bytes 與 `node --check` 結果 | 證據留存 |

### 4.2 測試矩陣（15 項）

| ID | 對應 | 類型 | 測試項目 | 期望 |
|---|---|---|---|---|
| TM-01 | T-01/AC-08-1 | 幾何 | `tickToX` 映射（抽樣 0/1/7/12/20） | `30,45,135,210,330` |
| TM-02 | T-01/D-02 | 幾何 | 相鄰刻度間距 | 恆為 `15` |
| TM-03 | T-02/AC-08-1 | 互動 | `moveToTick(7)` 後遮罩中心 X | `135` |
| TM-04 | T-02/AC-08-1 | 事件 | `moveToTick(7)` 發出 `numline:snap` | `detail.tick===7`（或等價） |
| TM-05 | T-02/D-02 | 邊界 | `moveToTick(-1)` / `moveToTick(99)` 夾限 | 落在 `0`/`20`，X `30`/`330` |
| TM-06 | T-03/AC-08-2 | 情境 | `setEquation(add_start,7,5,12)` 狀態正確 | mode/start/jump/end 一致 |
| TM-07 | T-03/AC-08-2 | 動畫/流程 | `stepReverse()` 後抵達刻度 7 | 落點 X `135`，狀態可辨識為 reverse 完成/active |
| TM-08 | T-03/AC-08-2 | 視覺語意 | 反推路徑自 12 向左 5 格 | 存在拋物線/箭頭或等價回溯視覺證據 |
| TM-09 | T-04/AC-08-3 | 揭曉 | `reveal()` 後遮罩透明 + 金色 `7` | opacity 降低；文字含 `7` 且金色系 |
| TM-10 | T-04/AC-08-3 | 揭曉 | 破招算式顯示 | 含 `12 - 5 = 7`（正規化後） |
| TM-11 | T-04/AC-08-3 | 狀態 | `reveal()` 後狀態 | `status==='REVEALED'`、`revealed===true` |
| TM-12 | T-04/AC-08-4 | 情境 | `setScenario('sub_unknown',{start:15,end:9})` | 標記 15、9；X `255/165` |
| TM-13 | T-04/AC-08-4 | 視覺 | 區間高亮與跨越文字 | 高亮覆蓋 9~15；含 `跨越 6 格` |
| TM-14 | T-04/AC-08-4 | 揭曉 | 減法未知數答案 | 含 `(□) = 6`/等價 `= 6` |
| TM-15 | Gate/D-01 | 工程 | 組件體積與語法（驗收頁可 fetch+檢查或由外部腳本結果嵌入） | `<=12288` bytes；`node --check` exit 0（外部證據） |

> **TM-15 執行備註**：瀏覽器驗收頁若受檔案存取限制無法直接量測 bytes/執行 node，則 TM-15 以「外部閘門證據」欄位呈現（命令與輸出貼附），頁內標示為 `MANUAL/EVIDENCED` 但仍計入 15 項完成度；最終交付必須兩者為真。

### 4.3 驗收執行指令（實作階段）
```powershell
# 語法閘門
node --check .\app\components\glass-number-line.js

# 體積閘門（PowerShell）
(Get-Item .\app\components\glass-number-line.js).Length

# 瀏覽器驗收
# 開啟 tests/ac_glass_number_line.html，確認 15/15 PASS
```

### 4.4 完成定義（DoD）
- [ ] `app/components/glass-number-line.js` 存在，`<= 12288` B，`node --check` 通過。
- [ ] `<glass-number-line>` 可註冊並渲染 360×220 數線。
- [ ] AC-08-1~AC-08-4 依本文件步驟全數通過。
- [ ] `tests/ac_glass_number_line.html` 15 項測試全綠，含 D-01/D-02 邊界與 gate 證據。
- [ ] `getState()`/事件 payload 可供測試與教學流程觀測，無未處理例外污染主控台（測試期可接受 info）。

---
*Stage 1 計畫完成 — 交付 BP 決策後進入實作。*