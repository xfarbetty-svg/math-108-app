# R1 施做計畫書：S-1-1 幾何形體旋轉投影儀 `<isometric-rotator>` 落地

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261109_2225_g1_s11_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1：BP 細部施做計畫與清單
4. **編寫角色**：BP (Big Pickle)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: BP_STAGE1_PLAN_S11_20261109 -->

> **BP 職責聲明**：本文件只拆卡、定錨數值、定死驗收判準，**零業務代碼寫入**。代碼 100% 由通道 1 本地 OpenCode CLI (GLM) 帶手腳落地，落盤後 BP 以 `git diff` 逐行盲審 R0 數值，不採信工兵自報。

---

## 一、藍圖對齊與邊界審查

### 1.1 AC-05-1 ~ AC-05-4 逐條核對

| AC | R0 原文要求 | R1 落點（可機械檢驗的實體） | 檢驗手段 |
| :--- | :--- | :--- | :--- |
| AC-05-1 | `shape` / `angle` / `show-labels` 雙向狀態機，派 `rotator:change`，`detail={shape,angle,isSquare}` | `observedAttributes` 三項 + `attributeChangedCallback` + `_emit()` | 探針讀 attribute 回寫值與事件 `detail` 全欄位比對 |
| AC-05-2 | 0°→45°→90°→360° 旋轉，4 個 12×12 直角折線釘在頂點同步轉，4 邊等長標記不穿模 | 逐頂點座標顯式計算（不用 `<g transform>`），折線以通用內縮公式生成 | 讀 `polygon[points]` 反算邊長／內角／旋轉矩陣誤差 |
| AC-05-3 | `cylinder-unfold` + `progress 0~1`，側面展開藍色長方形、上下底面綠色圓形、兩行標籤 | 三階段進度插值（滾動→展開→翻面拓印） | 讀 `progress` 對照表逐點驗 `w / cx / ry / opacity` |
| AC-05-4 | 390px 實機，熱區 ≥ 44×44，`aria-label` 正確，CONSOLE_NOISE_COUNT = 0 | 控制列為 HTML（非 SVG）44px 熱區 + 動態 `aria-label` / `aria-valuetext` | `getBoundingClientRect()` 量測 + CDP Runtime/Log 攔截 |

### 1.2 邊界審查：T-05 只做「元件 + 元件級驗收」

R0 第四節列 5 項交付物，但 T-05 任務卡只涵蓋前 3 項。BP 明令切開，**禁止工兵越界**：

| R0 交付物 | 歸屬 | 本階段處理 |
| :--- | :--- | :--- |
| 1. `app/components/isometric-rotator.js` | **T-05** | 全量落地 |
| 2. `tests/ac_isometric_rotator.html` | **T-05** | 全量落地，掛 G-8 閘門 |
| 3. `tests/ac_unit_s11.js` | **T-05（骨架）/ T-06（掛閘門）** | 交付可執行骨架，**暫不納入 `tools/ac_gate_s11.js`**，避免對不存在的 `app/unit_s11.html` 假綠 |
| 4. `data/curriculum_v3/g1_s11_shape_identify.json` | T-06 | 本階段不動 |
| 5. `app/unit_s11.html` | T-06 | 本階段不動 |

> 理由：`app/unit_s11.html` 尚未存在，若此刻把 `ac_unit_s11.js` 掛上閘門，探針會取不到 `#questionStem` 而必然 FAIL；若寫成「取不到就 PASS」則是典型 [FAKE-GREEN]。故 T-05 只交骨架，T-06 建頁後再入閘。

### 1.3 體積預算（硬上限 12,288 B，單檔）

R0 定死單檔 ≤ 12,288 B。BP 逐區塊配額，超支即退工：

| 區塊 | 內容 | 預算 (B) |
| :--- | :--- | ---: |
| CSS | `:host`、SVG 樣式、控制列、`prefers-reduced-motion` | 2,300 |
| 常數與 helper | `NS`、`el()`、`clamp`、`r3()`、`rot()`、`rad()` | 1,200 |
| 骨架 | `class` + `attachShadow` + 控制列 DOM + `_build()` | 1,700 |
| 正方形 + 長方形 | 頂點、折線、刻痕、標註 | 1,500 |
| 三角形 + 圓形 | 頂點、角弧、半徑、圓心 | 1,300 |
| 圓柱三階段 | 滾動紋、展開長方形、底面翻轉 | 2,600 |
| 生命週期與事件 | `connected/disconnected`、rAF 清理、guard、`_emit` | 1,000 |
| **合計** | | **11,600** |
| **餘裕** | 供除錯與註解 | **688** |

### 1.4 三端自適應策略

| 視口 | SVG 實際寬 | 縮放比（viewBox 320） | 版面行為 | 量測判準 |
| :--- | ---: | ---: | :--- | :--- |
| 390px 手機 | 358px（卡片內距 16×2） | 1.119 | 滑桿獨占一行（高 44），形體鈕 5×44 + 4×8 gap = 252px 單行 | `scrollWidth ≤ clientWidth`、每鈕 ≥ 44×44 |
| 768px 平板 | 420px（`max-width`） | 1.313 | 滑桿 + 形體鈕同列，置中 | 同上，無元素超出 viewBox |
| 960px 桌面 | 480px（`max-width`） | 1.500 | 同平板，字級隨縮放等效 18px | 同上 |

- 熱區一律用 **HTML 控制列**（固定 44px CSS），不靠 SVG 命中區縮放，避免 390px 下被 viewBox 縮成 39px。
- SVG：`svg{display:block;width:100%;height:auto;max-width:420px;margin:0 auto}`，`@media(min-width:768px)` 提至 480px。

### 1.5 R0 → R1 差異裁決（BP 已定案，施工照此，不得自行變更）

| # | 項目 | R0 / Showcase 現況 | R1 裁決與理由 |
| :--- | :--- | :--- | :--- |
| D-1 | 畫布 | Showcase `viewBox="-110 -90 220 180"`；R0 寫 320×220 | **採 R0 的 `viewBox="-160 -110 320 220"`**。正方形 90px 仍置中 ±45，四周留給旋轉外接圓（矩形半對角 69.5）與標籤 |
| D-2 | 直角記號 | Showcase 用 4 個 12×12 `<rect>` 硬寫座標，其中 2 個貼在頂點外側造成「浮框」 | 改 **12px 折線 `polyline`（3 點）內縮通用式**，任何凸多邊形皆可算，且旋轉後仍釘在頂點 |
| D-3 | 旋轉實作 | Showcase 用 `<g transform="rotate(deg)">` | 改 **逐頂點顯式座標計算**。`getBBox()` 對 transform 的語義有版本差異，顯式座標可被探針以 `points` 屬性反算，避免「看起來對、量不到」 |
| D-4 | 配色 | Showcase 為深色底（`#0F172A`） | 正式題卡頁為淺色底（`#F8FAFC`），**改淺色系調色盤**並以 `--ir-*` CSS 變數對外開放，供 T-06 主題化 |
| D-5 | 圓柱運動學 | Showcase 無此樣品 | 採 **課本展開圖模型（直立圓柱）**，「滾動」以側面滾紋位移 + 長方形長出表現，不追求剛體純滾動的嚴格運動學。教學目標是「展開圖 = 長方形 + 2 圓」，非物理模擬 |
| D-6 | 閘門 G 編號 | R0 只列 G-1/2/4/5/8，缺 3/6/7 | **補齊 G-1~G-8 八道**（沿用首批元件閘門語義），編號不得跳號 |

---

## 二、組件幾何與數學演算法細節

### 2.0 座標系與共用常數

- SVG 命名空間：`http://www.w3.org/2000/svg`（唯一允許的 URL）。
- `viewBox="-160 -110 320 220"`，原點 `(0,0)` 為幾何中心，y 軸向下（SVG 慣例）。
- 角度單位：屬性為**度**，三角函式前統一 `rad(θ)=θ*Math.PI/180`。
- 座標輸出精度：`r3(v)=Math.round(v*1000)/1000`（3 位小數，兼顧探針容差與體積）。
- 色彩變數：`--ir-ink:#0F172A`、`--ir-shape:#0284C7`、`--ir-shape-fill:rgba(2,132,199,.14)`、`--ir-right:#CA8A04`、`--ir-tick:#DB2777`、`--ir-arc:#7C3AED`、`--ir-side:#2563EB`、`--ir-base:#16A34A`、`--ir-muted:#64748B`。

**核心旋轉公式（全形體共用，唯一真相）**

```
rot(x, y, θ) = ( x·cosθ − y·sinθ ,  x·sinθ + y·cosθ )
```

以原點為軸心；所有頂點 `V(θ) = rot(V0.x, V0.y, θ)`，**禁止**用 `<g transform>` 代替（D-3）。

### 2.1 正方形（`shape="square"`）

| 項目 | 數值 |
| :--- | :--- |
| 邊長 | 90px |
| 四頂點（θ=0） | `V0(-45,-45)`、`V1(45,-45)`、`V2(45,45)`、`V3(-45,45)` |
| 外接圓半徑 | 63.640（旋轉掃掠極限，`±160 / ±110` 內安全） |
| 本體 | `<polygon>`，`fill:var(--ir-shape-fill)`、`stroke:var(--ir-shape)`、`stroke-width:2.5`、`stroke-linejoin:round` |
| 直角記號 | 4 條 `polyline`，腿長 12px，`stroke:var(--ir-right)`、`stroke-width:1.8`、`fill:none` |
| 等長刻痕 | 4 條 `line`，長 10px，外側偏移 3→13px，`stroke:var(--ir-tick)`、`stroke-width:2` |
| 角度讀值 | SVG `text.angle-out` 固定於 `(-150,-96)`，內容 `45°`，13px 粗體 `var(--ir-side)`（不隨形體旋轉） |
| 說明文字 | `text.caption` 固定於 `(0,96)`，置中 12px：`4 個角都是直角，4 條邊一樣長 → 不管怎麼轉都是正方形` |

**直角折線通用式（正方形／長方形共用，取代 Showcase 硬寫座標）**

對每個頂點 `V`，取相鄰頂點 `A`（前）、`B`（後）：

```
u = normalize(A − V)          v = normalize(B − V)          L = 12
P1 = V + L·u                  P2 = V + L·u + L·v            P3 = V + L·v
polyline points = "P1 P2 P3"
```

驗算（θ=0，V0=(-45,-45)，A=V3=(-45,45)，B=V1=(45,-45)）：`u=(0,1)`、`v=(1,0)` → `(-45,-33) (-33,-33) (-33,-45)`，兩腿各 12px、斜邊 16.971px，且完全貼在兩條邊上，不出框。

### 2.2 長方形（`shape="rectangle"`）

| 項目 | 數值 |
| :--- | :--- |
| 尺寸 | 寬 120 × 高 70（`W=120, H=70`） |
| 四頂點 | `(-60,-35)`、`(60,-35)`、`(60,35)`、`(-60,35)` |
| 半對角 | 69.462（旋轉 90° 時佔 `±60`，安全） |
| 直角記號 | 同 2.1 通用式，4 條 |
| 等長刻痕 | **長邊 1 道、短邊 2 道**（相距 6px，沿邊方向 `±3d`）→ 合計 6 條 `line` |
| 說明文字 | `4 個角都是直角；長邊一樣長、短邊一樣長` |

> 刻痕語義：同一組刻痕數 = 等長。這是小一「等長記號」的正規約定，長寬不同必須用 1 道 vs 2 道區分，不得四邊都畫 1 道（會誤導成正方形）。

### 2.3 三角形（`shape="triangle"`，正三角形）

| 項目 | 數值 |
| :--- | :--- |
| 邊長 | `a = 110` |
| 外接圓半徑 | `R = a/√3 = 63.5085`（重心 = 外心 = 原點） |
| 三頂點 | `V0(0,-63.5085)`、`V1(55, 31.7543)`、`V2(-55, 31.7543)` |
| 內角 | 三角皆 60°，和 180° |
| 等長刻痕 | 3 條（三邊等長） |
| 角弧 | 3 條 `path`，半徑 18px：`M V+18·u A 18 18 0 0 1 V+18·v`（`u`、`v` 為兩鄰邊單位向量），`stroke:var(--ir-arc)`、`stroke-width:1.6`、`fill:none` |
| 角度標註 | 3 個 `text`「60°」，位置 = `V + 34·bisector`（角平分線單位向量），11px `var(--ir-arc)` |
| 說明文字 | `3 條邊一樣長，3 個角都是 60°` |

> 旋轉不變性自檢：三邊 110.000 ±0.02、三角 60.000° ±0.05，任意 θ 皆成立。

### 2.4 圓形（`shape="circle"`）

| 項目 | 數值 |
| :--- | :--- |
| 半徑 | `r = 55` |
| 本體 | `<circle cx=0 cy=0 r=55>`，同形體配色 |
| 圓心 | `<circle r=3.5>` 實心 `var(--ir-shape)` |
| 半徑線 | `<line (0,0) → (55·cosθ, 55·sinθ)>`，`stroke-dasharray:4 3`、`stroke-width:1.6` |
| 圓周記點 | `<circle r=4>` 於 `(55·cosθ, 55·sinθ)`，`fill:#F87171`——**旋轉唯一可見證據**，用來向孩子證明「點在動，圓沒變」 |
| 半徑標籤 | `text`「半徑」於 `0.62r` 處，隨 θ 平移（文字防倒置，見 2.6） |
| 說明文字 | `不管轉到哪裡，看起來都一樣圓` |

### 2.5 圓柱 3D → 2D 拓印展開（`shape="cylinder-unfold"`）

**幾何常數（鎖死，不得調參）**

| 常數 | 值 | 來源 |
| :--- | ---: | :--- |
| 底面半徑 `R` | 28 | 版面適配（雙圓左右並排不溢出 ±160） |
| 柱高 `H` | 70 | 與長方形高一致 |
| 圓周長 `C` | `2πR = 175.9292` | 展開長方形的寬 |
| 六等分刻線間距 `C/6` | 29.3215 | 滾動刻度 |
| 展開長方形 | `x=-87.9646, y=-10, w=175.9292, h=70` | `x = -C/2` |
| 左底面終點 | 圓心 `(-122, 25)`，`r=28` | 與長方形左緣間距 6.04 |
| 右底面終點 | 圓心 `(122, 25)`，`r=28` | 與長方形右緣間距 6.04 |
| 起始姿態 | 圓柱中心 `cx = -87.9646`（= 長方形左緣） | 滾動起點 |

**進度 `p ∈ [0,1]` 三階段插值（唯一公式，探針逐點對照）**

```
w(p)   = C · clamp((p − 0.15) / 0.45, 0, 1)          // 長方形寬
cx(p)  = −C/2 + w(p)                                 // 圓柱中心 = 展開前緣
op(p)  = 1                     , p ≤ 0.60
         1 − (p − 0.60) / 0.20 , 0.60 < p < 0.80      // 圓柱淡出
         0                     , p ≥ 0.80
dash   = "6 4" (p < 0.70) / none (p ≥ 0.70)           // 虛線壓痕轉實線
t      = clamp((p − 0.80) / 0.20, 0, 1)               // 底面翻面
左底面 = lerp((0,−10) → (−122,25), t)
右底面 = lerp((0, 60)  → (122, 25), t)
ry     = 8 + 20·t      （8 → 28，橢圓翻成圓）
rx     = 28            （恆定）
底透明度 = clamp(t / 0.30, 0, 1)
```

**分層 Z-order（後蓋前）**：長方形壓痕 → 六等分刻線 → 底面圓 → 圓柱本體 → 文字標籤。

**圓柱本體（滾動中）**

- 柱身 `rect`：`x=cx−28, y=−35, w=56, h=70, rx=6`，`fill:rgba(148,163,184,.28)`、`stroke:#94A3B8`。
- 上／下底 `ellipse`：`cx, cy=∓35, rx=28, ry=8`。
- 滾動紋 3 條（證明「在滾」）：`x = cx + 22·sin(φ + k·120°)`，`k=0,1,2`，`y=−35→35`，`φ = 360°·(p−0.15)/0.45`，`stroke:#CBD5E1`、`opacity:.55`。|22·sin| ≤ 22 < 28，**恆不超出柱身，無需 clipPath**（省體積且免 id 衝突）。
- 一圈 = 一個圓周長：`φ` 走完 360° 時 `w` 恰好走完 `C`，語意自洽。

**文字標籤（R0 原文，逐字不得改）**

| 標籤 | 位置 | 樣式 |
| :--- | :--- | :--- |
| `側面展開是長方形` | `(0, 78)` 置中 | 12px 粗體 `var(--ir-side)` |
| `底面拓印是圓形` | `(0, 96)` 置中 | 12px 粗體 `var(--ir-base)` |
| `上底面` | 左圓內 `(-122, 31)` | 10px `#15803D` |
| `下底面` | 右圓內 `(122, 31)` | 10px `#15803D` |

> `text.caption` 在圓柱模式**不顯示**（改由上述四條標籤承擔），避免與 `y=96` 的綠標籤重疊。

### 2.6 標註同步變換（Feature Invariance 三件套）

| 標註 | 通用演算法 | 不變量 |
| :--- | :--- | :--- |
| 直角折線 | 2.1 的 `P1/P2/P3`，隨頂點座標即時重算 | `|P1−V| = |P3−V| = 12`、`|P2−V| = 16.9706` |
| 等長刻痕 | `M=(P+Q)/2`、`d=normalize(Q−P)`、`n=(−d.y,d.x)`；若 `dot(n, M−重心)<0` 則 `n=−n`；線段 `M+3n → M+13n`；雙刻痕再加 `M±3d` | 刻痕中點落在邊中點、垂直於邊、恆朝外 |
| 文字防倒置 | `textRotation = θ + (cos θ < 0 ? 180 : 0)`，以 `transform="translate(mx,my) rotate(textRotation)"` 套用 | 任何 θ 下文字不倒反 |

**旋轉不變性自檢（元件內 `getMetrics()` 對外公開，供探針外部複核）**

```
sides[i] = |V[i] − V[(i+1)%n]|
angle[i] = acos( clamp( dot(V[i-1]−V[i], V[i+1]−V[i]) / (|u|·|v|), −1, 1 ) ) · 180/π
```

| 形體 | 邊長期望 | 內角期望 | 容差 |
| :--- | :--- | :--- | :--- |
| 正方形 | 90.000 ×4 | 90.000° ×4 | 邊 ±0.02 / 角 ±0.05° |
| 長方形 | 120 / 70 各 ×2 | 90.000° ×4 | 同上 |
| 三角形 | 110.000 ×3 | 60.000° ×3 | 同上 |
| 圓形 | —（無頂點） | — | 半徑 55.000 ±0.01 |

### 2.7 屬性、事件、API 契約（SSOT：attribute 為唯一輸入源）

| 屬性 | 型別 | 預設 | 防護（guard 必須回寫 attribute） |
| :--- | :--- | :--- | :--- |
| `shape` | enum `square\|rectangle\|triangle\|circle\|cylinder-unfold` | `square` | 非法值 → 回寫 `square`，**不得 throw** |
| `angle` | 0..360 整數 | `0` | `round` 後 `clamp(0,360)`；`NaN/Infinity` → `0`；幾何用 `angle % 360` |
| `show-labels` | boolean 字串 | `true` | 僅 `"false"` 視為關閉；關閉時 `g.labels` 設 `visibility:hidden` + `aria-hidden="true"` |
| `progress` | 0..1 浮點 | `0` | `r3(clamp(0,1))`；非圓柱模式忽略但不得報錯 |

| 事件（`bubbles:true, composed:true`） | detail | 時機 |
| :--- | :--- | :--- |
| `rotator:change` | `{shape, angle, isSquare, sides, angles}` | 任一屬性變更後、渲染完成時，**每輪只派 1 次**（rAF 期間合流） |
| `rotator:stamp-start` | `{progress:0}` | `stamp()` 啟動 |
| `rotator:stamp-end` | `{progress:1}` | 動畫抵達 1（含 reduced-motion 直達） |

| 公開方法 | 行為 |
| :--- | :--- |
| `setAngle(deg)` | 等價 `setAttribute('angle', deg)` |
| `setShape(name)` | 等價 `setAttribute('shape', name)` |
| `stamp(ms=1200)` | rAF 推進 `progress` 0→1，寫回 attribute；`prefers-reduced-motion` 時 1 幀直達 1 |
| `reset()` | `progress=0`、`angle=0`，取消進行中 rAF |
| `getMetrics()` | 回 `{shape, angle, isSquare, vertices, sides, angles}`（唯讀快照，供探針） |

`isSquare` 判定：`shape==='square'` → `true`；`shape==='rectangle' && |W−H| < 0.01` → `true`（本規格 120×70 恆 `false`）；其餘 `false`。

### 2.8 狀態機（四態，禁止跳階）

| 狀態 | 進入條件 | 允許轉移 |
| :--- | :--- | :--- |
| `INIT` | `connectedCallback` 首次 | → `IDLE`（建構完成） |
| `IDLE` | 靜止 | → `ROTATING`（滑桿 input）／`STAMPING`（`stamp()`）／`IDLE`（屬性外部變更） |
| `ROTATING` | 拖曳中 | → `IDLE`（pointerup / change 結束） |
| `STAMPING` | `stamp()` 啟動 | → `IDLE`（`p` 抵 1，派 `stamp-end`）；`reset()` 可中斷 → `IDLE` |

---

## 三、工兵施工任務卡 T-05 分步清單

```mermaid
flowchart LR
    S1["Step 1 骨架 + Shadow DOM<br/>風險 低"] --> S2["Step 2 旋轉與標註<br/>風險 中（幾何精度）"]
    S2 --> S3["Step 3 圓柱拓印<br/>風險 高（進度插值）"]
    S3 --> S4["Step 4 驗收頁 + 探針 + 閘門<br/>風險 低"]
    S4 --> BP["BP 盲審 git diff + 逐條 AC"]
    BP --> AGY["AGY 終審"]
```

| 欄位 | 內容 |
| :--- | :--- |
| **任務編號** | T-05 |
| **目標元件** | `<isometric-rotator>`（原生 Web Component，Shadow DOM） |
| **對接課綱** | 108 課綱 S-1-1 形體之辨認 |
| **負責工兵** | 通道 1 本地 OpenCode CLI (GLM)，`stdin=subprocess.DEVNULL` + `shell=True` |
| **依賴** | 無（可立即開工）；複用 T-02/T-03 的 IIFE + `attributeChangedCallback` 骨架慣例 |
| **預估** | 4 步 × (1 輪施工 + ≤1 輪修正)；連續 2 輪 FAIL 即熔斷回報 |

### 🎫 Step 1：元件骨架與 Shadow DOM

| 項目 | 規格 |
| :--- | :--- |
| **檔案** | `app/components/isometric-rotator.js`（新建，≤ 12,288 B） |
| **結構** | `(function(){ 'use strict'; ... })()` IIFE，**禁 `type="module"`**（`file://` 直開鐵律） |
| **類別** | `class IsometricRotator extends HTMLElement`，`attachShadow({mode:'open'})` |
| **observedAttributes** | `['shape','angle','show-labels','progress']` |
| **DOM 骨架** | `<style>` + `<svg viewBox="-160 -110 320 220" role="img">` + `g.body` / `g.labels` / `g.fx` + `<div class="bar">` |
| **控制列** | `<input class="slider" type="range" min=0 max=360 step=1>`（外包 `.slider-wrap` 高 44px）＋ 5 顆 `button[data-shape]` 44×44 ＋ 1 顆 `button.stamp` 44×44（僅圓柱模式顯示，其餘 `hidden`） |
| **註冊** | `customElements.get('isometric-rotator') || customElements.define(...)`（防重複定義 throw） |
| **生命週期** | `connectedCallback` 冪等建構（`_built` 旗標）；`disconnectedCallback` 取消 rAF、解綁監聽，**不得清空 `_built` 造成重連疊層** |
| **DoD** | `node --check` exit 0；頁面插入後 `shadowRoot !== null`；空殼渲染 320×220 不報錯 |
| **預算** | ≤ 3,900 B（CSS 2,300 + helper 1,200 + 骨架 1,700 中的本步部分） |

### 🎫 Step 2：旋轉與標註邏輯（rotate + feature invariance）

| 項目 | 規格 |
| :--- | :--- |
| **核心** | `rot(x,y,θ)` 單一公式；`_shapeData(shape)` 回 `{vertices, nominalSides, kind}` |
| **渲染** | `_render()`：清 `g.body`/`g.labels` 後依 `shape` 分派 `_drawSquare` / `_drawRect` / `_drawTriangle` / `_drawCircle` |
| **直角折線** | 2.1 通用式，4 條 `polyline.right-angle` |
| **等長刻痕** | 2.6 通用式；正方形 4、長方形 6（長 1／短 2）、三角形 3，class `line.tick` |
| **文字** | `text.caption` 固定 y=96；邊長／角度標註隨形體旋轉並套用防倒置 |
| **事件** | 屬性變更 → `_render()` → `_emit('rotator:change')`，同一輪 rAF 內合流僅派 1 次 |
| **DoD** | θ ∈ {0,15,30,45,90,135,180,270,360} 下，邊長／內角／旋轉矩陣誤差全在容差內；`polygon[points]` 可被外部反算 |
| **預算** | ≤ 2,800 B（正方形+長方形 1,500 + 三角形+圓形 1,300） |

**θ=45° 正方形驗算（供盲審對照）**：`V0(-45,-45)` → `(0, -63.640)`；`V1(45,-45)` → `(63.640, 0)`；四頂點構成外接圓半徑 63.640，邊長仍 90.000，內角仍 90.000°。

### 🎫 Step 3：圓柱拓印展開動畫

| 項目 | 規格 |
| :--- | :--- |
| **渲染函式** | `_drawCylinder(p)`：嚴格照 2.5 公式，**不得引入第二套插值** |
| **元素 class** | `rect.unfold-rect`、`line.seam`（5 條內部刻線，`k=1..5`）、`ellipse.base.left` / `.base.right`、`rect.cyl-body`、`line.roll-mark`（3 條）、`text.unfold-label` |
| **動畫** | `stamp(ms=1200)`：`performance.now()` 起算，rAF 每幀寫回 `progress` attribute；`_raf` 單一持有，重入先取消舊的 |
| **無障礙** | `prefers-reduced-motion: reduce` → 1 幀直達 `p=1`，仍派 `stamp-start` / `stamp-end` |
| **靜態** | 外部直接設 `progress="0.5"` 必須與動畫中同一幀結果**逐位相同**（同公式） |
| **DoD** | 對照表 5 點全中（見下）；`p=1` 時 `rx=ry=28`、`opacity=1`、標籤文字含「長方形」「圓形」 |
| **預算** | ≤ 2,600 B |

**進度對照表（探針硬編碼期望值，容差 ±0.5）**

| p | `w` | `cx` | 圓柱 `opacity` | 左底面 `(cx, cy, ry)` |
| ---: | ---: | ---: | ---: | :--- |
| 0.00 | 0.000 | −87.965 | 1 | (0, −10, 8) |
| 0.375 | 87.965 | 0.000 | 1 | (0, −10, 8) |
| 0.60 | 175.929 | 87.965 | 1 | (0, −10, 8) |
| 0.90 | 175.929 | 87.965 | 0 | (−61.0, 7.5, 18) |
| 1.00 | 175.929 | 87.965 | 0 | (−122, 25, 28) |

### 🎫 Step 4：驗收頁面 + CDP 探針 + 閘門腳本

| 子步 | 檔案 | 內容 | DoD |
| :--- | :--- | :--- | :--- |
| 4.1 | `tests/ac_isometric_rotator.html` | 仿 `ac_t01~t03.html`：`#stage` + `<pre id="result">`，自跑自印 `PASS/FAIL` 行，結尾 `RESULT_END`；`#stage{width:100%}` 供三端視口 | 390/768/960 三視口 `ALL_PASS` |
| 4.2 | `tests/ac_unit_s11.js` | body 式探針（`return out` 陣列），對 `app/unit_s11.html` 的 6 條 UR11-01~06 檢查；**檔頭註明「T-05 交付骨架，T-06 建頁後掛閘門」** | `node --check` exit 0；**不掛入 G-8** |
| 4.3 | `tools/ac_gate_s11.js` | 複製 `ac_gate.js` 結構：`COMPONENTS=['isometric-rotator.js']`、`PAGES=['tests/ac_isometric_rotator.html'] × 3 視口`、`LIMIT_EACH=12288`；含 G-1/G-2/G-4/G-5 | `node tools/ac_gate_s11.js` 印 `GATE_GREEN` 且 exit 0 |

> 4.3 為 R1 追加的驗收基建（非 R0 五項交付物）。**禁止**改動既有 `tools/ac_gate.js` 的 `COMPONENTS` 陣列，以免污染 T-01~T-03 已公布的 GATE_GREEN 基線。

**AC 探針清單（`ac_isometric_rotator.html` 內建，至少 12 條）**

| 探針 ID | 檢查 | 判準 |
| :--- | :--- | :--- |
| AC-05-1a | 掛載與屬性 | `shadowRoot` 存在、`shape` 回寫、`angle` 回寫 |
| AC-05-1b | 事件契約 | `rotator:change.detail` 四欄齊備且值正確，`isSquare===true` |
| AC-05-1c | guard | `angle=400`→`360`、`angle=-9`→`0`、`shape="oval"`→`square`，且 0 throw |
| AC-05-1d | 合流 | 連續改 3 次屬性僅派 1 次 `change`（同一 rAF） |
| AC-05-2a | 旋轉公式 | 9 個角度下 `V(θ)` 與 `rot(V0,θ)` 誤差 ≤ 0.02 |
| AC-05-2b | 邊長不變 | 4 邊 90.000 ±0.02 |
| AC-05-2c | 內角不變 | 4 角 90.000° ±0.05 |
| AC-05-2d | 直角記號 | `.right-angle` = 4；腿長 12 ±0.01；斜邊 16.9706 ±0.02 |
| AC-05-2e | 等長刻痕 | 正方形 4、長方形 6、三角形 3；中點落在邊中點 ±0.01 |
| AC-05-2f | 文字防倒置 | θ=180 時 `textRotation` 落在 (−90,90) |
| AC-05-3a | 進度對照 | 2.5 對照表 5 點全中（w / cx / ry / opacity） |
| AC-05-3b | 標籤 | `textContent` 同時含「側面展開是長方形」「底面拓印是圓形」 |
| AC-05-3c | 動畫 | `stamp()` 耗時 1050~1350ms、`stamp-end` 恰 1 次、結束 `progress=1` |
| AC-05-4a | 熱區 | 390px 下 5 鈕 + 滑桿外包各 ≥ 44×44 |
| AC-05-4b | 無障礙 | 每鈕 `aria-label` 非空、`aria-pressed` 同步；SVG `aria-label` 含形體與角度 |
| AC-05-4c | 版面 | `scrollWidth ≤ clientWidth+1`；`g.body` bbox 不超出 viewBox ±2 |

---

## 四、驗收硬閘門指標清單（G-1 ~ G-8）

| 閘門 | 檢驗方式（可複製執行） | 通過條件 |
| :--- | :--- | :--- |
| **G-1 語法** | `node --check app/components/isometric-rotator.js` | Exit Code `0` |
| **G-2 控制台** | `node tools/ac_gate_s11.js` 內 CDP 攔 `Runtime.exceptionThrown` + `Log.entryAdded` | `CONSOLE_NOISE_COUNT = 0`（error 與 warning 皆計） |
| **G-3 三端無破版** | 三視口跑 `ac_isometric_rotator.html` 並各截 1 張圖存 `evidence/` | 390/768/960 皆 `scrollWidth ≤ clientWidth+1`、無元素出 viewBox、標籤不與形體 bbox 相交 |
| **G-4 零網路依賴** | `Select-String -Pattern "https?://" app/components/isometric-rotator.js` | 唯一命中 `http://www.w3.org/2000/svg` |
| **G-5 體積** | `(Get-Item app/components/isometric-rotator.js).Length` | ≤ **12,288 B**（未壓縮；目標 ≤ 11,600） |
| **G-6 事件契約** | 探針比對 `rotator:change` / `stamp-start` / `stamp-end` 的 `detail` 鍵名與 2.7 表 | 100% 一致，無多餘鍵、無缺鍵 |
| **G-7 計時器衛生** | `stamp()` 跑到一半 `remove()`，觀察 500ms | `_raf === 0`、無 rAF 殘跑、無 console 輸出、無 `ResizeObserver` 洩漏 |
| **G-8 三端實機手感** | 人類專家手機／平板／桌機實拖 | 熱區 ≥ 44px、拖曳 60fps 無卡頓、`prefers-reduced-motion` 下不暈 |

**閘門機械化指令（BP 盲審時逐條貼真實輸出）**

```powershell
node --check app/components/isometric-rotator.js
node tools/ac_gate_s11.js
node tools/ac_run.js tests/ac_isometric_rotator.html tests/ac_unit_s11.js --viewport=390x900
(Get-Item app/components/isometric-rotator.js).Length
Select-String -Path app/components/isometric-rotator.js -Pattern "https?://"
```

**放行條件**：G-1~G-7 全綠且 `GATE_GREEN (0 failed)` 且 exit 0；G-8 由人類驗收簽核。任一 FAIL → 退回工兵，同一張卡連續 2 輪 FAIL 即熔斷上報 AGY。

---

## 五、派工、回報與盲審契約

**派工指令模板（Windows 必須注入 DEVNULL 破假死）**

```powershell
opencode run "<T-05 Step N 任務卡全文 + 本文件 2.x 對應數值段>" --auto
# 子進程：stdin=subprocess.DEVNULL, shell=True, encoding="utf-8", errors="replace"
```

**工兵交付格式（五欄缺一即 `[UNVERIFIED]`）**

1. **範圍**：本次動到的檔案與行數區間
2. **變更**：逐條對應 Step 的 DoD
3. **驗證指令**：實際跑過的完整指令
4. **真實 Exit Code**：貼終端原始輸出，不接受「應該沒問題」
5. **證據**：`GATE_GREEN` 行、三端截圖路徑、`(Get-Item).Length` 位元組數

**BP 盲審動作（不採信自報）**

- `git status` + `git diff --stat` 確認只有 T-05 允許的檔案被動到（越界即退回）。
- 逐行核對 2.1~2.5 的常數是否被偷改（90 / 120 / 70 / 110 / 55 / 28 / 70 / 175.9292 / 12）。
- 親跑 G-1~G-7 指令，貼真實輸出。
- 對 θ=45° 與 `p=0.90` 兩組關鍵數值手算複核。
- 產出 `R2_BP_REVIEW.md` 逐條標 PASS/FAIL，FAIL 一律開 TCK 工單。

**Git 鋼印**：`feat(s11): T-05 isometric-rotator 落地 (AC-05-1~4 PASS)`，工作區須乾淨。

---

## 六、風險與對策

| 風險 | 觸發條件 | 對策 |
| :--- | :--- | :--- |
| 體積超支 | 12,288 B 硬牆，圓柱段最肥 | 先砍 CSS 註解與重複 `setAttribute`（改 `el(name, attrs)` 批次），**禁砍功能**；仍超支則回報 BP 裁決 |
| 圓柱版面溢出 | 雙圓 + 長方形橫向佔 300px | 已鎖 `R=28`、圓心 `±122`，左右餘 10px；若標籤越界，縮字級至 10px，**不得改 R** |
| 直角記號浮框 | 沿用 Showcase 硬寫座標 | 強制通用內縮式（2.1），探針 `AC-05-2d` 量腿長擋下 |
| 長方形誤標成正方形 | 四邊都畫 1 道刻痕 | 長邊 1／短邊 2 硬規定，`AC-05-2e` 驗刻痕數 = 6 |
| 動畫與靜態不同步 | `stamp()` 另寫一套插值 | 只准一支 `_drawCylinder(p)`，`progress` 為唯一真相 |
| rAF 洩漏 | `remove()` 時動畫未收 | `disconnectedCallback` 必 `cancelAnimationFrame`；`AC-05-3c` + G-7 雙檢 |
| 探針假綠 | 探針自讀實作變數自我參照 | 期望值一律由測試端外部常數硬編碼（如 `C=2*Math.PI*28`） |
| 汙染舊基線 | 直接改 `tools/ac_gate.js` | 另開 `tools/ac_gate_s11.js`，舊閘門指令與數字不動 |

---

## 七、R0 → R1 追蹤矩陣（交付前自我核對）

| R0 要求 | 本文件落點 | 狀態 |
| :--- | :--- | :--- |
| 標籤 `<isometric-rotator>` | 三、T-05 表頭 | ✅ 已定 |
| 單檔 ≤ 12,288 B | 1.3 預算表 / G-5 | ✅ 11,600 目標 |
| viewBox 320×220、390px 安全 | 1.4 / 2.0 | ✅ |
| AC-05-1 雙向狀態機 | 2.7 / AC-05-1a~1d | ✅ |
| AC-05-2 特徵鎖定 | 2.1 / 2.6 / AC-05-2a~2f | ✅ |
| AC-05-3 圓柱拓印 | 2.5 / AC-05-3a~3c | ✅ |
| AC-05-4 熱區與無障礙 | 1.4 / 2.7 / AC-05-4a~4c | ✅ |
| G-1~G-8 八道閘門 | 四、閘門表 | ✅ 補齊 R0 缺號 |
| 交付物 1~3 | 三、Step 1~4 | ✅ T-05 範圍 |
| 交付物 4~5（題庫／題卡頁） | 1.2 邊界表 | ⏸ 移交 T-06 |

---

> **下一步**：本計畫經 AGY 核可後，BP 立即派工 Step 1（通道 1 本地 OpenCode CLI），落盤即以 `git diff` 盲審，逐條對照本文件 2.x 數值。
