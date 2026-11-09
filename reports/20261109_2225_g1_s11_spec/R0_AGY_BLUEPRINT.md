# R0 規格藍圖：S-1-1 形體之辨認（034 向量等角旋轉投影儀）

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261109_2225_g1_s11_spec
2. **對應課綱**：教育部 108 課綱數學領域 S-1-1 形體之辨認
3. **文件性質**：階段 0：AGY 決策大腦規格藍圖 (Given-When-Then AC)
4. **編寫角色**：AGY (決策大腦，零業務代碼寫入權)
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: AGY_STAGE0_BLUEPRINT_S11_20261109 -->

---

## 🎯 一、 教學痛點與破招目標

低年級（小一）在幾何形體學習上存在兩大核心思維陷阱：
1. **幾何方位僵化偏誤 (Orientation Bias)**：
   * 孩子看見正放的正方形認得，但一旦將正方形旋轉 $45^\circ$，常被誤導判斷為「菱形」或「不是正方形」。
   * **破招**：透過等角旋轉投影儀，讓孩子自由旋轉 $0^\circ \sim 360^\circ$，在旋轉過程中，4 個直角（$90^\circ$ 直角標記）與 4 條邊長實時跟隨高亮，向孩子證明「無論怎麼轉，4 個角永遠是直角、4 條邊永遠等長，它永遠都是正方形！」
2. **立體至平面的拓印轉換 (3D to 2D Unfold/Stamp)**：
   * 孩子無法想像圓柱體滾動後會展開出什麼形狀，以為圓柱只能滾出圓形。
   * **破招**：提供「圓柱展開/拓印模式」，動態演示圓柱在紙面上滾動，側面展開為「長方形」，上下底面拓印為「圓形」。

---

## 📐 二、 元件架構規格 (T-05: `<isometric-rotator>`)

* **目標標籤**：`<isometric-rotator>`
* **代碼檔案**：`app/components/isometric-rotator.js`
* **元件性質**：原生 Web Component (`HTMLElement` + Shadow DOM)，零外部依賴。
* **體積限制**：單檔純文字大小 $\le 12,288\text{ B}$（12 KB 硬閘門）。
* **畫布規格**：SVG 視口自適應，預設 $320 \times 220$（支援 390px 手機寬度安全邊距）。

---

## 🧪 三、 驗收條件 (Given-When-Then AC)

### AC-05-1: 屬性宣告與雙向狀態機
* **Given**：載入 `<isometric-rotator shape="square" angle="0" show-labels="true">`。
* **When**：讀取或變更屬性：
  * `shape`：可為 `"square"`、`"rectangle"`、`"triangle"`、`"circle"`、`"cylinder-unfold"`。
  * `angle`：數值 $0 \sim 360$（度）。
  * `show-labels`：布林值，控制角標與邊長標籤顯示。
* **Then**：元件內部即時重新渲染 SVG，且派發自定義事件 `rotator:change`，`detail` 包含 `{ shape, angle, isSquare: true/false }`。

### AC-05-2: 旋轉流動與特徵鎖定 (Feature Invariance)
* **Given**：`shape="square"`，初始 `angle="0"`。
* **When**：使用者拖動角度滑桿或調用 `.setAngle(deg)`，角度由 $0^\circ \to 45^\circ \to 90^\circ \to 360^\circ$。
* **Then**：
  1. 正方形以中央為軸心流暢旋轉。
  2. 4 個直角記號（黃色直角摺角折線）精準釘在 4 個頂點，隨頂點坐標同步旋轉。
  3. 4 邊外側保持等長標籤或等長記號，無穿模或脫節現象。

### AC-05-3: 圓柱拓印展開模式 (Cylinder 3D to 2D Stamp)
* **Given**：`shape="cylinder-unfold"`。
* **When**：觸發拓印動畫或設定進度 `progress`（$0 \sim 1$）。
* **Then**：
  1. 圓柱側面在下方平展滾動，展開出鮮明的藍色「長方形」壓痕。
  2. 上下兩個圓形底面以虛線平翻拓印出兩個綠色「圓形」。
  3. 畫面標籤清晰標示「側面展開是長方形」、「底面拓印是圓形」。

### AC-05-4: 觸控熱區與無障礙
* **Given**：390px 手機實機環境。
* **When**：孩子使用拇指操作底部角度滑桿或切換形狀按鈕。
* **Then**：按鈕熱區 $\ge 44 \times 44\text{px}$，`aria-label` 正確描述形體特徵與角度，無控制台報錯（CONSOLE_NOISE_COUNT = 0）。

---

## 📋 四、 交付產物清單

1. `app/components/isometric-rotator.js`（核心教具元件，$\le 12,288\text{ B}$）
2. `tests/ac_isometric_rotator.html`（專屬 AC 驗收網頁）
3. `tests/ac_unit_s11.js`（CDP 探針驗證腳本）
4. `data/curriculum_v3/g1_s11_shape_identify.json`（10 題段考真題題庫）
5. `app/unit_s11.html`（S-1-1 正式自適應題卡頁面）

---

## 🛡️ 五、 守門硬指標 (Gate Checks)
- [ ] G-1: JavaScript 語法檢查 Exit Code 0（`node -c`）。
- [ ] G-2: 控制台 0 報錯、0 警告。
- [ ] G-4: 命名空間僅限 `http://www.w3.org/2000/svg`。
- [ ] G-5: 單檔體積 $\le 12,288\text{ B}$。
- [ ] G-8: 三端視口（390px 手機 / 768px 平板 / 960px 桌面）CDP 實機測試全綠。
