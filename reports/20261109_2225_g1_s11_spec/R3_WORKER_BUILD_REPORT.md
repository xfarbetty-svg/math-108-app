# R3_WORKER_BUILD_REPORT

## 任務
- 任務：S-1-1 幾何形體旋轉投影儀 `<isometric-rotator>` 落地（AutoFlow v2.6.3 Worker）
- 依據：`R1_BP_EXECUTION_PLAN.md`、`R2_AGY_PLAN_REVIEW.md`
- 時間：2026-11-09（本地工作區 `C:\Users\xfarb\work_s11`）

## 建立檔案
| 檔案 | 程式行數 | 精確 Byte 數 |
|---|---:|---:|
| `app/components/isometric-rotator.js` | 98 | 8518 |
| `tests/ac_isometric_rotator.html` | 117 | 6427 |
| `R3_WORKER_BUILD_REPORT.md` | 37 | 3298 |

## 實作重點（符合指示）
1. **`<isometric-rotator>` 原生 Web Component**：IIFE 封裝、無 ES Module、可 `file://` 離線開啟；Shadow DOM。
2. **SVG**：`viewBox="-160 -110 320 220"`；單一旋轉群組 `<g id="rot" transform="rotate(θ)">` 包含形狀本體、直角記號（12x12px 黃色內縮折線）、邊長等長斜短線、文字標籤；文字標籤使用 `transform="rotate(-θ, x, y)"` 保持直立。
3. **5 種 shape**：`square`、`rectangle`、`triangle`、`circle`（含直徑虛線與圓心）、`cylinder-unfold`（藍色長方形側面 `k=0.55`、綠色上下底圓橢圓、圖說「示意圖，未按真實比例」與「側面展開是長方形／底面拓印是圓形」）。
4. **Attributes**：`shape`、`angle`、`show-labels`、`progress`（含基本防護/回寫）。
5. **Methods**：`setAngle(deg)`、`setProgress(p)`。
6. **Events**：`rotator:change`（`detail: {shape, angle, isSquare: shape === 'square'}`，`bubbles/composed`）、`rotator:unfolded`（圓柱展開完成時派發，`detail.progress`）。
7. **生命週期**：`disconnectedCallback` 不清空 `_built` 與內部狀態，重連走 `_sync()` 不重建、不拋 TypeError。
8. **體積**：`isometric-rotator.js` = **8518 B <= 12288 B**（硬閘門通過）。

## 驗收頁
- `tests/ac_isometric_rotator.html`：掛載 `<isometric-rotator>`，自動化檢查 **AC-05-1a~d / AC-05-2a~d / AC-05-3a~d / AC-05-4a~c**，結果輸出至 `window.__acReport`（含 `pass/fail/total/details/consoleNoise`）並顯示於頁面。

## 偏離事項 / 說明
1. **R1 與 R2/Prompt 的旋轉實作取捨**：R1（D-3）偏好逐頂點顯式座標計算以利探針；R2（D-04）核准「單一 `<g transform="rotate(θ)">`、杜絕各元素自行 sin/cos」；本次 **依使用者 prompt 與 R2 核准方向** 實作單一旋轉群組 + 標籤反向旋轉，滿足可視/互動與事件契約。
2. **圓柱展開為教學示意**：依 R2 D-02 採 `k=0.55`、藍色側面長方形隨 `progress` 展開、綠色底面橢圓顯現、標註「示意圖，未按真實比例」；未完整複製 R1 的逐幀滾動紋/多階段運動學（以控制體積與符合 prompt 核心需求）。
3. **AC 頁檢查為可執行契約檢查**：涵蓋屬性反射、`rotator:change` detail、方法、旋轉/記號/反向標籤、圓柱 progress/側面/底面/標註、390px 熱區/aria/console noise；若後續 BP/AGY 需要 R1 附錄更嚴格的幾何誤差探針（如 θ=45 頂點座標、刻痕中點誤差），可在不破壞公開契約下增補。

## 回報
- 落盤完成：3 檔皆已建立。
- `isometric-rotator.js`：**98 行 / 8518 bytes**（<= 12288）。
- `ac_isometric_rotator.html`：**117 行 / 6427 bytes**。
- `R3_WORKER_BUILD_REPORT.md`：**37 行 / 3298 bytes**。
