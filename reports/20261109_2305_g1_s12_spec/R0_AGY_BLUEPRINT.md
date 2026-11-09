# R0 規格藍圖：S-1-2 形體之操作（034 向量物理堆疊積木台）

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261109_2305_g1_s12_spec
2. **對應課綱**：教育部 108 課綱數學領域 S-1-2 形體之操作（堆疊、滾動、滑動）
3. **文件性質**：階段 0：AGY 決策大腦規格藍圖 (Given-When-Then AC)
4. **編寫角色**：AGY (決策大腦，零業務代碼寫入權)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: AGY_STAGE0_BLUEPRINT_S12_20261109 -->

---

## 🎯 一、 教學痛點與破招目標

低年級（小一）在幾何形體操作上的關鍵認知盲區：
1. **「形體接觸面特徵」與「物理運動狀態」脫節**：
   * 孩子只會憑直覺亂疊，不理解「平面接觸才能平穩堆高」、「曲面接觸必定滾落滑開」的幾何原理。
   * **破招**：透過 `<stack-physics-bench>` 視覺對比實驗台，提供「正方體堆疊」與「球體堆疊」即時動態模擬，直觀演示平面吸附穩固 vs 曲面弧線滑落。
2. **圓柱體的方向雙重性（立放可堆 vs 橫放會滾）**：
   * 孩子常將圓柱體簡單歸類為「會滾動所以不能堆」或「可以堆所以不會滾」。
   * **破招**：演示圓柱「直立平放（平面接觸）」可順利往上堆疊；「橫躺側放（曲面接觸）」則會在斜坡或推擠下向前滾動。

---

## 📐 二、 元件架構規格 (T-06: `<stack-physics-bench>`)

* **目標標籤**：`<stack-physics-bench>`
* **代碼檔案**：`app/components/stack-physics-bench.js`
* **元件性質**：原生 Web Component (`HTMLElement` + Shadow DOM)，零外部庫依賴。
* **體積限制**：單檔純文字大小 $\le 12,288\text{ B}$（12 KB 硬閘門）。
* **畫布規格**：SVG 視口預設 $320 \times 200$，支援 390px 手機安全邊距。

---

## 🧪 三、 驗收條件 (Given-When-Then AC)

### AC-06-1: 模式切換與屬性反射
* **Given**：載入 `<stack-physics-bench mode="cubes">`。
* **When**：變更 `mode` 屬性為 `"cubes"`、`"spheres"`、`"cylinders-upright"`、`"cylinders-horizontal"`。
* **Then**：
  1. 元件內部即時重繪對應形體幾何。
  2. 派發自定義事件 `bench:modechange`，`detail` 包含 `{ mode, canStack: boolean, canRoll: boolean }`。

### AC-06-2: 平面堆疊穩固狀態機 (`STACK_STABLE`)
* **Given**：`mode="cubes"` 或 `mode="cylinders-upright"`。
* **When**：觸發堆疊操作（預設放置 3 層）。
* **Then**：
  1. 物件垂直對齊整齊立於地面（$Y=160$ 基準線），接觸面平整無縫。
  2. 派發自定義事件 `bench:stacked`，狀態標記為 `STACK_STABLE`。
  3. 顯示綠色成功標籤「✓ 平面接觸，穩固堆高！」。

### AC-06-3: 曲面滾落狀態機 (`ROLL_COLLAPSE`)
* **Given**：`mode="spheres"` 或 `mode="cylinders-horizontal"`。
* **When**：嘗試向上堆疊第 2 顆球或橫躺圓柱。
* **Then**：
  1. 上層球體無法立足，沿弧線路徑滑落並彈跳滾出至右側地面。
  2. 顯示紅色警告標籤「✕ 曲面無法堆疊，滾落滑開！」。
  3. 派發自定義事件 `bench:collapsed`，狀態標記為 `ROLL_COLLAPSE`。

### AC-06-4: 熱區無障礙與控制台乾淨
* **Given**：390px 手機實機環境。
* **When**：點擊切換模式按鈕。
* **Then**：按鈕熱區 $\ge 44 \times 44\text{px}$，`aria-label` 正確播報形體特徵，控制台 0 報錯、0 警告（`CONSOLE_NOISE_COUNT = 0`）。

---

## 📋 四、 交付產物清單

1. `app/components/stack-physics-bench.js`（核心純向量教具，$\le 12,288\text{ B}$）
2. `tests/ac_stack_physics_bench.html`（專屬 AC 驗收頁面）
3. `tests/ac_unit_s12.js`（CDP 探針驗證腳本）
4. `data/curriculum_v3/g1_s12_stack_roll.json`（10 題段考真題題庫）
5. `app/unit_s12.html`（S-1-2 正式自適應題卡頁面）

---

## 🛡️ 五、 守門硬指標 (Gate Checks)
- [ ] G-1: JavaScript 語法檢查 Exit Code 0（`node --check`）。
- [ ] G-2: 控制台 0 報錯、0 警告。
- [ ] G-4: 命名空間僅限 `http://www.w3.org/2000/svg`。
- [ ] G-5: 單檔體積 $\le 12,288\text{ B}$。
- [ ] G-8: 三端視口（390px / 768px / 960px）CDP 實機測試全綠。
