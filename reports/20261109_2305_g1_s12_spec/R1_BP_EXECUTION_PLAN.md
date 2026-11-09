# R1 施做計畫：S-1-2 形體操作物理堆疊積木台 `<stack-physics-bench>` 落地

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261109_2305_g1_s12_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1：BP 細部施做計畫與清單
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE1_PLAN_S12_20261109 -->

---

## 一、藍圖對齊與邊界審查

### 1.1 AC 對齊核對（AC-06-1 ~ AC-06-4）

| AC | 驗收重點 | 施做對應 | 邊界/風險控制 |
|---|---|---|---|
| **AC-06-1** 模式切換與屬性反射 | `mode` 變更即時重繪；派發 `bench:modechange`，`detail={mode, canStack, canRoll}` | `static get observedAttributes()` 監聽 `mode`；`attributeChangedCallback` → `render()`；事件於重繪後 `dispatchEvent(new CustomEvent(...,{bubbles:true,composed:true}))` | 僅接受白名單 `cubes/spheres/cylinders-upright/cylinders-horizontal`；非法值 fallback 為 `cubes`，仍派發事件以利除錯 |
| **AC-06-2** 平面堆疊穩固 `STACK_STABLE` | `cubes`/`cylinders-upright` 預設 3 層；垂直對齊、接觸面平整；$Y=160$ 基準線；派發 `bench:stacked`；綠色「✓ 平面接觸，穩固堆高！」 | 幾何以 $Y=160$ 為地面基準向上堆疊；正方體/直立圓柱使用固定 x 中軸對齊；渲染成功標籤 + 於完成時派發 `bench:stacked`（`detail:{status:'STACK_STABLE',layers:3,mode}`） | 堆疊座標以整數/簡化小數計算，避免浮點縫隙視覺；標籤用 `<text>`/`<rect>` 置於安全區內 |
| **AC-06-3** 曲面滾落 `ROLL_COLLAPSE` | `spheres`/`cylinders-horizontal` 嘗試堆第 2 層失敗；沿弧線滑落彈跳滾至右側；紅色「✕ 曲面無法堆疊，滾落滑開！」；派發 `bench:collapsed` | 上層物件套用 SVG/CSS 動畫沿指定弧線 `d="M 160 100 Q 195 90 230 135"`（或等效位移/路徑動畫）；動畫結束或觸發時派發 `bench:collapsed`（`detail:{status:'ROLL_COLLAPSE',mode}`） | 動畫採 `@keyframes`/SMIL 輕量實作（擇一，確保零依賴且體積可控）；若動畫受限，至少保證終態位置在右側地面 + 事件/標籤正確 |
| **AC-06-4** 無障礙與控制台乾淨 | 390px 熱區 $\ge 44 \times 44\text{px}$；`aria-label` 正確播報形體特徵；`CONSOLE_NOISE_COUNT = 0` | 互動按鈕使用 `<button>` 或可聚焦元素，CSS `min-width/min-height:44px`；每模式按鈕具描述性 `aria-label`（含形體+可堆疊/可滾動特徵）；Shadow DOM 內樣式隔離 | 不使用已棄用 API、不留 `console.log/warn/error`；CDP 頁面攔截 console 計數驗證 |

### 1.2 邊界審查結論
- **單檔體積硬閘門**：`app/components/stack-physics-bench.js` 純文字 $\le 12,288\text{ B}$（UTF-8 bytes）。施做策略：無外部庫、無冗長註解、共用繪圖 helper、壓縮重複 SVG 屬性、字串模板精簡。每步完成後以位元組數自檢；Step 4 前必過 G-5。
- **三端自適應**：SVG `viewBox="0 0 320 200"` + `width="100%"`/`preserveAspectRatio="xMidYMid meet"`；容器 `max-width` 配合 390/768/960 安全邊距；390px 下控制項不溢出、熱區 $\ge 44\times44$。
- **命名空間（G-4）**：SVG 元素建立僅用 `document.createElementNS('http://www.w3.org/2000/svg', tag)` 或 innerHTML 中顯式 `xmlns="http://www.w3.org/2000/svg"`；禁止其他命名空間。
- **零外部依賴**：僅原生 `HTMLElement`、Shadow DOM、CustomEvent；不引入框架/CDN。

---

## 二、物理與幾何演算法細節

### 2.1 共用座標系
- SVG 視口：`320 × 200`，左上原點。
- **地面基準線**：$Y = 160$（物件底部/接觸地面之 y）。
- 中軸參考：$X = 160$（堆疊置中）。
- 地面繪製：$y=160$ 水平線，視覺厚度 2–4px，延伸全寬安全區。

### 2.2 正方體堆疊（`mode="cubes"`，平面堆疊 / STACK_STABLE）
- **單體尺寸**：底寬 $W = 50$、高 $H = 34$（2D 正投影矩形/簡化立方體）。
- **排列規則**：自 $Y=160$ 基準線向上排列，共 3 層，吸附定位（無縫隙）。
  - 第 1 層（底）：`x = 160 - 25 = 135`，`y = 160 - 34 = 126`，`w=50,h=34`
  - 第 2 層：`x = 135`，`y = 126 - 34 = 92`，`w=50,h=34`
  - 第 3 層（頂）：`x = 135`，`y = 92 - 34 = 58`，`w=50,h=34`
- **吸附/穩固判定**：同 $x$ 垂直對齊；上下層 `y_{n} = y_{n-1} - H` 精確貼合。狀態 `STACK_STABLE`，`canStack:true, canRoll:false`。
- **視覺**：平面填色+描邊區分層次；接觸面平整。

### 2.3 球體滾落（`mode="spheres"`，曲面滾落 / ROLL_COLLAPSE）
- **單體參數**：半徑 $r = 25$。
- **初始嘗試堆疊**：底球置於地面上（圓心 $cx=160, cy=160-25=135$）；第 2 球嘗試置頂（理想不穩定位置附近，如 $cx=160, cy=135-50=85$ 附近）後觸發滾落。
- **滾落路徑（弧線）**：沿 `d="M 160 100 Q 195 90 230 135"` 滾落動畫（控制點形成向右上再落地的弧線）。
  - 起點約 $(160,100)$（上層球失穩瞬間參考）
  - 二次貝茲控制點 $(195,90)$
  - 終點 $(230,135)$（右側地面，圓心落點使球底貼 $Y=160$：$135+25=160$）
- **動畫**：沿路徑位移（可用 `animateMotion` path 或 `@keyframes` transform 模擬等效弧線），時長約 0.6–0.9s，`ease-in` 表現滑落加速；終態停於右側地面。狀態 `ROLL_COLLAPSE`，`canStack:false, canRoll:true`。
- **視覺**：圓形 `<circle>`；滾落後保留底球穩定 + 第 2 球停於右側。

### 2.4 圓柱直立（`mode="cylinders-upright"`，可堆疊 / STACK_STABLE）
- **幾何參數（2D 投影）**：視覺寬 $W_c = 40$、高 $H_c = 36$；頂/底橢圓 $rx=20, ry=6$ 表現圓柱端面（平面接觸）。
- **排列**：$Y=160$ 基準線向上 3 層，$X=160$ 置中吸附。
  - 第 1 層底部 $y_b=160$，本體頂 $y_t=124$（$H_c=36$）
  - 第 2 層 $y_b=124, y_t=88$
  - 第 3 層 $y_b=88, y_t=52$
- **特徵**：上下為**平面**端面接觸 → 穩固堆高。`canStack:true, canRoll:false`。派發 `bench:stacked` / `STACK_STABLE`，綠色標籤。

### 2.5 圓柱橫躺（`mode="cylinders-horizontal"`，會滾動 / ROLL_COLLAPSE）
- **幾何參數（2D 投影）**：橫向圓柱以圓角矩形/膠囊近似，長 $L_c = 50$、高（徑向）$D_c = 30$（等效 $r\approx15$ 曲面接觸），或以側視 `<rect rx>` + 端面弧線表現。
- **行為**：底層橫躺可置地面（曲面接觸線）；嘗試堆疊第 2 個橫躺圓柱時，因曲面接觸無法穩定，上層沿弧線/滾動位移滑落至右側地面（可重用與球體一致的弧線終態邏輯或等效 `translate`+`rotate` 動畫，終點落於 $Y=160$ 右側）。
- **滾動表現**：動畫含輕微旋轉（如 `rotate(90deg)` 累進）強化「滾動」認知；終態停右側。`canStack:false, canRoll:true`。派發 `bench:collapsed` / `ROLL_COLLAPSE`，紅色標籤。

### 2.6 狀態與事件契約（統一）
- `bench:modechange`：`detail = { mode: string, canStack: boolean, canRoll: boolean }`
- `bench:stacked`：`detail = { status: 'STACK_STABLE', layers: 3, mode: string }`
- `bench:collapsed`：`detail = { status: 'ROLL_COLLAPSE', mode: string }`
- 所有 CustomEvent：`{ bubbles: true, composed: true }`（穿透 Shadow DOM）。

---

## 三、工兵施工任務卡 T-06 分步清單

### T-06 總覽
- **目標**：交付零依賴、可驗收、體積合規的 `<stack-physics-bench>` 及配套測試。
- **約束**：單檔 `stack-physics-bench.js` $\le 12,288\text{ B}$；SVG NS 僅 `http://www.w3.org/2000/svg`；390/768/960 三端適配；Console 0 噪音。

### Step 1：原生 Web Component 骨架與 Shadow DOM
**檔案**：`app/components/stack-physics-bench.js`
- [ ] 定義 `class StackPhysicsBench extends HTMLElement`；`constructor` 建立 `attachShadow({mode:'open'})`。
- [ ] `static observedAttributes = ['mode']`；`connectedCallback` 初始渲染；`attributeChangedCallback` 觸發重繪 + `bench:modechange`。
- [ ] 模式白名單與 `canStack/canRoll` 映射表（單一資料結構驅動）。
- [ ] Shadow DOM 模板：容器、模式切換按鈕列（4 模式）、SVG 畫布（`viewBox="0 0 320 200"`）、狀態訊息區。
- [ ] 基礎樣式：`:host{display:block}`、SVG 響應式、按鈕 `min-width:44px;min-height:44px`、`touch-action:manipulation`。
- [ ] `customElements.define('stack-physics-bench', StackPhysicsBench)`（含重複定義防護）。
- [ ] **自檢**：`node --check app/components/stack-physics-bench.js` → Exit 0；記錄當前位元組數。

### Step 2：平面堆疊模式（`cubes`, `cylinders-upright`）
**檔案**：`app/components/stack-physics-bench.js`（增量）
- [ ] 實作 `renderCubes()`：依 2.2 參數繪製 3 層正方體（$W=50,H=34,Y=160$ 基準向上、$X$ 置中吸附）。
- [ ] 實作 `renderCylindersUpright()`：依 2.4 參數繪製 3 層直立圓柱（平面端面）。
- [ ] 兩模式完成後：顯示綠色「✓ 平面接觸，穩固堆高！」；派發 `bench:stacked`（`STACK_STABLE`, `layers:3`）。
- [ ] `aria-label` 範例語意：「正方體，可平面堆疊、不可滾動」/「直立圓柱，可平面堆疊、不可滾動」。
- [ ] **自檢**：語法 OK；位元組數累計仍 $\le 12,288$；390px 按鈕熱區目視/樣式確認。

### Step 3：曲面滾落模式（`spheres`, `cylinders-horizontal`）
**檔案**：`app/components/stack-physics-bench.js`（增量）
- [ ] 實作 `renderSpheres()`：底球 $r=25$ 穩定；第 2 球沿 `M 160 100 Q 195 90 230 135` 弧線滾落動畫至右側地面（2.3）。
- [ ] 實作 `renderCylindersHorizontal()`：橫躺圓柱曲面接觸；第 2 個滾落至右側（2.5，含滾動視覺）。
- [ ] 兩模式完成後：顯示紅色「✕ 曲面無法堆疊，滾落滑開！」；派發 `bench:collapsed`（`ROLL_COLLAPSE`）。
- [ ] `aria-label`：「球體，不可堆疊、會滾動」/「橫躺圓柱，不可堆疊、會滾動」。
- [ ] 動畫實作保持輕量（優先 CSS keyframes/transform），確保體積與效能。
- [ ] **自檢**：語法 OK；**位元組數 $\le 12,288$（G-5 硬閘門）**；事件與狀態文案正確。

### Step 4：驗收頁面與 CDP 探針腳本
**檔案**：`tests/ac_stack_physics_bench.html`、`tests/ac_unit_s12.js`
- [ ] `ac_stack_physics_bench.html`：
  - 引入 `../app/components/stack-physics-bench.js`；放置 `<stack-physics-bench mode="cubes">`。
  - 提供測試鉤子（`window.__benchEvents=[]` 監聽 `bench:modechange/stacked/collapsed`）。
  - viewport meta 適配行動裝置；控制台攔截計數（暴露 `window.__consoleNoiseCount`）。
  - 390/768/960 視覺檢查輔助樣式（不影響元件邏輯）。
- [ ] `ac_unit_s12.js`（CDP/Node 探針腳本，依專案既有探針慣例）：
  - 啟動/連線 CDP 載入驗收頁；切換 390/768/960 視口。
  - 驗證：四模式切換事件 `canStack/canRoll` 正確；`cubes/cylinders-upright` 觸發 `STACK_STABLE`；`spheres/cylinders-horizontal` 觸發 `ROLL_COLLAPSE`；熱區尺寸 $\ge 44$；`aria-label` 存在；Console 噪音 = 0。
  - 輸出明確 PASS/FAIL 與失敗原因；非零 exit code 表失敗。
- [ ] **自檢**：`node --check tests/ac_unit_s12.js` → Exit 0；本地開啟驗收頁無 console 錯誤。

### 施工順序與回滾點
1. Step 1 完成並語法綠燈 → 進 Step 2。
2. Step 2 完成且體積受控 → 進 Step 3。
3. Step 3 完成且 G-5 達標 → 進 Step 4。
4. 任一步 G-1/G-5 失敗即停工修復，不帶病進入下一步。

---

## 四、驗收硬閘門指標清單 (G-1 ~ G-8)

| Gate | 指標 | 驗證方法/命令 | 通過準則 | 負責步驟 |
|---|---|---|---|---|
| **G-1** | JavaScript 語法檢查 | `node --check app/components/stack-physics-bench.js`；`node --check tests/ac_unit_s12.js` | Exit Code = 0，無 SyntaxError | Step 1–4 |
| **G-2** | 控制台 0 報錯、0 警告 | CDP 載入 `tests/ac_stack_physics_bench.html` 攔截 console/error/warn；計算 `CONSOLE_NOISE_COUNT` | `CONSOLE_NOISE_COUNT = 0` | Step 4 |
| **G-3** | （預留/依專案總表；本任務未於藍圖列出） | — | N/A（不阻擋本卡，若專案 gate 表要求則補驗） | — |
| **G-4** | SVG 命名空間限定 | 靜態檢查/執行檢查：建立 SVG 元素僅用 `http://www.w3.org/2000/svg`；產出 DOM 無外來命名空間 | 僅出現 `http://www.w3.org/2000/svg` | Step 1–3 |
| **G-5** | 單檔體積硬閘門 | 量測 `app/components/stack-physics-bench.js` UTF-8 位元組數（如 PowerShell `(Get-Item ...).Length` 或 Node `fs.statSync().size`） | $\le 12,288\text{ B}$ | Step 1–3（持續），Step 4 前終檢 |
| **G-6** | （預留/依專案總表；本任務未於藍圖列出） | — | N/A | — |
| **G-7** | （預留/依專案總表；本任務未於藍圖列出） | — | N/A | — |
| **G-8** | 三端視口 CDP 實機測試全綠 | CDP 依序設 viewport 390×844、768×1024、960×720 載入驗收頁；執行 AC-06-1~4 探針 | 三端皆 PASS：模式/事件正確、狀態機正確、熱區≥44、aria 存在、Console 0 | Step 4 |

### 交付前最終核對（對應藍圖 §四）
- [ ] `app/components/stack-physics-bench.js` 存在且 $\le 12,288\text{ B}$、G-1/G-4 通過
- [ ] `tests/ac_stack_physics_bench.html` 可載入並暴露測試鉤子
- [ ] `tests/ac_unit_s12.js` 語法通過且探針覆蓋 AC-06-1~4、G-2/G-8
- [ ] （後續工項依藍圖）`data/curriculum_v3/g1_s12_stack_roll.json`、`app/unit_s12.html` 另案/續卡交付時再驗

---

**BP 簽核備註**：本計畫嚴格對齊 R0_AGY_BLUEPRINT.md（AC-06-1~AC-06-4、G-1/G-2/G-4/G-5/G-8、T-06 產物邊界），未擴寫業務實作代碼，僅提供可執行之原子施做規格與驗收閘門。
