# R1_CHALLENGER_TICKETS: 外部獨立盲審挑錯工單 (Stage 1.5)

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應藍圖**：R0_AGY_BLUEPRINT.md
3. **文件性質**：階段 1.5：外部獨立盲審挑錯工單與雙軌分流
4. **編寫角色**：Challenger（獨立盲審）／BP 分流欄留白待簽
5. **放行狀態**：❌ **不予放行**（8 張工單，4 張 HIGH；BP 未簽分流前不得進 Stage 3 驗收）

> **獨立性聲明**：本工單僅提出缺陷與風險，**不代替 BP 裁決、不代替 AGY 終審**。分流欄標記 `[待 BP 簽核]` 並附建議值；由 BP 另開簽核記錄，避免「挑錯者自審自放」的假獨立。
>
> **審查範圍**：R0 → R1 任務卡規格（靶心 2）＋ 已落盤實作交叉核對（`app/components/*.js`、`tests/ac_t0*.html`）。實作核對屬超範圍發現，但因已阻擋驗收，一併列出。

---

## 🔴 一、製程級缺陷（先於規格）

### 🎫 TCK-01｜HIGH｜Challenger 關卡被跳過，盲審已失去「事前擋門」意義
**證據**
- `reports/.../R1_CHALLENGER_TICKETS.md`（本檔）在 R2 雙簽前**不存在**。
- `R2_AGY_PLAN_REVIEW.md:8` 已落 `MUTUAL_CONSENT_APPROVED_20261106_AGY` 鋼印，`:32` 憑證 `AF-028-1-GO-20261106-G1-V01` 已核發 T-01~T-04 施工授權。
- `git status --porcelain`：`?? app/components/`（3 檔）、`?? tests/`、`?? tools/`、`?? R1_BP_EXECUTION_PLAN.md`、`?? R2_AGY_PLAN_REVIEW.md` —— 全部未入版控。
- `handoff.md:18` 宣稱「🟢 PRISTINE (工作區乾淨)」、`:19`「本地即將 Commit」，與實況不符。

**風險**：AGY 在沒有挑錯工單的情況下雙簽放行，代碼已先行落盤（T-01/T-02/T-03 共 3 檔、29,907 bytes）。Stage 1.5 從「事前擋門」退化成「事後追認」，R0 的 Sample-Driven Development 只剩形式。另 `tests/ac_t02.html` 存在但 `ac_t03.html` 缺失，驗收資產不對稱。

**修改建議**：
1. R2 鋼印標記 `PROVISIONAL`（暫行），待本工單分流完成後由 AGY 重簽 `RE-SIGNED`。
2. 修正 handoff 的 PRISTINE 宣稱，改為逐檔列出未追蹤資產。
3. Git 鋼印一次：`git add app tests tools reports && git commit`，讓後續 `git diff` 盲審有基準線（目前 `git diff` 對三支元件**完全看不到內容**，BP 的「git diff 逐行盲審」實務上無法執行）。

**BP 建議分流**：`[建議 ACCEPTED]` — 阻擋 Stage 3，先補簽核與 commit 基準線。　**實際裁決**：`[待 BP 簽核]`

---

## 🟠 二、規格級缺陷（R0 → R1 斷裂）

### 🎫 TCK-02｜HIGH｜390px「兩盒並排」在算術上不可能，AC-04-2 註定 FAIL
**證據（純算術，無需瀏覽器）**
- R1:66 `grid-template-columns: repeat(5, 36px)` + R1:65 `gap 4px` → 陣列寬 `5×36 + 4×4 = 196px`。
- R1:67 `padding 6px`、`border 2px` → 單盒寬 `196 + 12 + 4 = 212px`。
- 兩盒並排 `= 424px > 390px`（尚未計盒間距）。
- R1:325 卻斷言「放大至 36px…**390px 下仍可兩盒並排**」，直接違反 R1:266 `AC-04-2 scrollWidth ≤ 390`。
- 根因：R0:67 原定 36px、Showcase 實作 26px（R1:64 自承），BP 單方面放大 10px 卻未重算兩盒總寬。

**風險**：T-01 的 9+4 湊十情境本質需要「左盒滿十 + 右盒剩 3」同屏對照（R0:69-72）。兩盒放不下 → 學童必須橫向捲動才能看見「湊十」因果，算理演示直接失效；且 G-3「無橫向滾動」硬閘門必紅。

**修改建議（三選一，BP 定案）**：
- (A) 單格降為 `30px` + `gap 3px` + `padding 4px` → 單盒 `170+16=186`，兩盒 `382px` 可容納（熱區仍以透明外擴維持 44px，但**須處理相鄰重疊**）。
- (B) 390px 下改為「上下堆疊兩盒」＋「暫存搬移」動畫，≥768px 才並排。
- (C) 保留 36px，改單盒多輪（先 9 格，再切換到第二盒），放棄 R0 的雙盒對照。
- 無論何者，AC-01-4 需追加「相鄰熱區不得重疊」的幾何斷言（見 TCK-05d）。

**BP 建議分流**：`[建議 ACCEPTED]`（採 A，最小改動且保留 R0 雙盒對照）。　**實際裁決**：`[待 BP 簽核]`

### 🎫 TCK-03｜HIGH｜算理核心「拋物線補位 + 分解樹」被移出後無人承接
**證據**
- R0:70-72 把 `TAP_TO_FILL`（拋物線飛入）、`SUMMARY`（分解樹 4→1+3、9+1=10、10+3=13）列為樣品 03 的核心狀態機與驗收點（R0:74-75）。
- R1:326 裁決「拋物線飛補**由 T-04 情境按鈕編排**」，但 T-04 規格（R1:248-257）只有三顆情境按鈕＋參數面板＋事件日誌，**完全沒有拋物線與分解樹的實作條目、數值、AC**。
- 分解樹在 R1 全檔 **0 次命中**（`grep 分解樹` 僅命中 R0:72、R0:75）；「拋物線」亦僅 R1:326 一句轉包給 T-04，無規格、無 AC。

**風險**：T-01 交付後只剩「點格子變圓點 + 滿十鎖框」，即 R0:13 明確批判的「80 顆小黑點」——視覺好看但算理不見。9+4=13 的教學閉環（9+1=10 → 10+3=13）沒有任何元件負責，二年後驗收會再度死無對證。

**修改建議**：
1. 新增 `T-05` 任務卡（或併入 T-04 成為明確子項），鎖死：拋物線控制點數值、飛行時長 250~350ms（R0:74）、分解樹節點文字與分支線座標、與 `ten-frame:full` 事件的同步時序。
2. 若決定不做，須由 AGY 明文降級並在 R0 劃線刪除，**不得靜默蒸發**（違反「禁靜默吞錯」）。

**BP 建議分流**：`[建議 ACCEPTED]`（補 T-05，排在 T-04 前）。　**實際裁決**：`[待 BP 簽核]`

---

## 🟡 三、實作級缺陷（已落盤，阻擋驗收）

### 🎫 TCK-04｜HIGH｜生命週期不對稱：T-01 重連必拋錯、T-03 重連重複建 DOM
**證據**
- `ten-frame-grid.js:89` `disconnectedCallback` 內 `this._cells = []`，但 `:76` `_built` 維持 `true`。
  `:80` `connectedCallback` 只在 `!_built` 時重建 → 重連後 `_cells` 為空、DOM 仍在 → 任一格點擊 `_fillTo` 存取 `this._cells[i]` 必 `TypeError`（`_onClick` 內無 try/catch）。
- `balance-beam.js:80-83` 反向：`disconnectedCallback` 把 `_built = false`，`:75` 重連時重新 `_build()`，而 `_build()` `:129-130` 直接 `appendChild(style/svg)` **未清空 shadowRoot** → 每重連一次就疊一層 SVG、重複 `<style>`。
- `tests/ac_t01.html:56,82` 只驗 `remove()`，從未驗「移除後再插回」。

**風險**：T-04 調試台本質就是反覆換參數、重掛元件；390/768/960 切換若走重掛即觸發上述兩顆地雷。G-7「移除元件後 500ms 無殘留」只測單向，抓不到這類不對稱。

**修改建議**：
1. T-01：`disconnectedCallback` 不應清 `_cells`（DOM 未銷毀），或在重連時 `_cells` 為空則強制 `_build()`。
2. T-03：`_build()` 先 `this._root.replaceChildren()`；`disconnectedCallback` 保留 `_built = true` 以免重建。
3. 兩支元件的 AC 各補一條：`append → remove → append` 後 `.dot` / `svg` 節點數與首次掛載相同（防止重複疊層）。

**BP 建議分流**：`[建議 ACCEPTED]` — 退回 GLM 重工，與 T-05 同批。　**實際裁決**：`[待 BP 簽核]`

### 🎫 TCK-05｜MEDIUM-HIGH｜T-01 實作與事件契約 3 處漂移，G-6 必紅
**證據**
- (a) **未登記事件**：`ten-frame-grid.js:171` 派 `ten-frame:tap`，R1:90-97 事件表**無此事件**。G-6 要求「事件名與 detail 與表格 100% 一致」，已破。
- (b) **語意誤用**：`:167-169` 在 `interactive="false"` 或 `locked` 時派 `ten-frame:overflow`（`attempted = cur+1`）。唯讀被點擊不是「滿十溢出」，父層無法區分「學童點太多次」與「元件被鎖」，`detail` 也失去 R1:96 定義的 `{value:10, attempted:11}` 語意。
- (c) **主題色未穿透**：R1:68 要求藍版 `#60A5FA → #2563EB`，但 `:34` `radial-gradient(circle at 30% 30%, #F87171, var(--tfg-fill))` 把**內圈紅色寫死**，`fill-color="#2563EB"` 只換外圈 → 藍版圓點中心仍為鮭紅色，與 R0 色票不符。
- (d) **熱區重疊**：`:25` 以 `width/height:44px; margin:-4px` 在 36px 軌道內擴張，相鄰格（gap 4px）的 44px 熱區**水平重疊 4px**；重疊處由後繪元素吃下點擊，學童會「點 A 得 B」。R1:71 寫的是「以透明 padding 擴張」，實作改成負 margin，屬未報備的寫法變更。

**修改建議**：刪 `ten-frame:tap` 或在 R1 正式登記；鎖定態改用獨立事件 `ten-frame:blocked {value, reason:"locked"|"readonly"}`；漸層內圈改 `color-mix()` 或雙 CSS 變數 `--tfg-hi/--tfg-fill`；熱區改用 `::after` 絕對定位覆蓋並將 grid gap 提高至 8px 或以 `padding` 外擴且不侵佔鄰格。

**BP 建議分流**：`[建議 ACCEPTED]`（(a)(c) 必改；(b) 需同步改 R1 契約；(d) 併 TCK-02 一起重算）。　**實際裁決**：`[待 BP 簽核]`

### 🎫 TCK-06｜MEDIUM｜T-02 幾何數值自相矛盾，Worker 只能猜
**證據**
- R1:126 同一列寫「`r = 12`（直徑 24）… 以 `r=16` 為上限，390px 下自動降為 `r=12`」；但 R1:123 固定 `viewBox 0 0 320 200`、R1:124 上軌 `y=60` / 下軌 `y=110`。上下圓心距 50px，`r=16` 時邊到邊僅 `50-32=18px`、`r=12` 時 `26px`，**皆非** R1:125 宣稱的「軌間距 24px（圓片邊到邊）」。
- R1:128 對齊虛線 `y 65 → 95`，在 `r=16` 下會**穿過圓片內部**（上圓底 76、下圓頂 94）。
- AC-02-1（R1:159）用「`step` 由實際圓心間距量測」自我參照，等於「用實作量到的值驗實作」，無論對錯恆 PASS。
- `dual-track-diff.js:13` `STEP = (VBW - PAD*2)/(MAX-1)`，`:175` 金框寬 `diff*STEP` —— 與 R1:129「寬 = `diff × step`」一致，但 R1 從未定義 `step` 的解析式，數值正確性無法外部覆核。

**風險**：`r=16`／`r=12` 兩套幾何會讓金框與虛線在不同寬度下錯位；AC 自我參照等於沒有驗收標準。

**修改建議**：刪除「上限 16／自動降 12」的雙軌寫法，改為 `r` 由容器寬度 **單一公式** 決定（例：`r = clamp(10, (W-2*PAD)/(MAX-1)/2 - 2, 16)`），並把 `step`、金框 `x/width`、虛線 `y1/y2` 全部改寫為 `r` 的函式寫進 R1；AC-02-1 改為「金框寬 = `3 × STEP`，且 `STEP` 符合公式 ±0.5px」。

**BP 建議分流**：`[建議 ACCEPTED]`。　**實際裁決**：`[待 BP 簽核]`

### 🎫 TCK-07｜MEDIUM｜T-03 物理規格未定單位與時間步，實作自行偷渡兩個換算
**證據**
- R1:197 寫 `atan2(Δτ, k_arm)` —— `atan2` 回傳**弧度**，卻在 R1:200 用 `|θ_target - θ| < 0.1°`、R1:189 用 `±15°` 夾。單位從未定義。
- R1:198-199 `stiffness 0.012 / damping 0.18 / dt 夾在 [8,34]ms` 只說「夾 dt」，**沒說是否歸一化**；`θ''` 量綱為 per-frame²，60Hz 與 120Hz 行為必然不同，AC-03-2「1.2s 內收斂」在 120Hz 平板無從保證。
- 實作 `balance-beam.js:167` 自行加 `×180/π`、`:199` 自行加 `scale = dt/16.6667` —— 兩者都是 R1 未載明的補丁（結果大概率正確，但屬**未報備偏離**，AGY 無從終審）。
- AC-03-5（`damping=0.05` 5s 內收斂）與 AC-03-1（5 vs 2 時 `|θ|` 落 8~15°）在 R1 中從未實測：`callback` 亦僅在 `|vel|<0.5` 判定，`0.5°/frame` 在 120Hz = 60°/s，等於放任高速穿越零點仍判平衡（`:209-212` 直接 snap）。

**風險**：小一教具的「等號＝平衡」靠天平等速擺動建立直覺。收斂判定過鬆 → 槓桿還在甩就跳「＝」，等於教錯算理；dt 未歸一 → 同一份代碼在教室投影機（60Hz）與平板（120Hz）呈現兩種行為，無法驗收。

**修改建議**：R1 §T-03 補三段 —（1）`θ_target` 明訂 `deg`，公式寫 `θ_target = clamp(deg(atan2(Δτ, k_arm)), -15, 15)`；（2）積分改半隱式 Euler 且明訂 `scale = dt/16.667`，`stiffness/damping` 以 60Hz 為基準；（3）收斂判定改為**時間量綱**：`|θ_target-θ| < 0.1°` 且 `|θ'| < 8°/s` 持續 2 幀；AC 加「120Hz（`dt=8ms`）與 60Hz（`dt=16.7ms`）收斂時間差 ≤ 15%」。

**BP 建議分流**：`[建議 ACCEPTED]`（實作已對，需回寫規格並補 120Hz 驗收）。　**實際裁決**：`[待 BP 簽核]`

### 🎫 TCK-08｜MEDIUM｜驗收不可機械化，且 AC-01-5 是空檢查
**證據**
- 全部 AC 只存在於 `tests/ac_t01.html` / `ac_t02.html` 的**瀏覽器內手動腳本**，無 exit code、無自動觸發；`tests/ac_t03.html` 根本不存在。
- `ac_t01.html:22-26` 攔截 `console.error/warn` 計數，但 `ten-frame-grid.js` 全檔**零 `console.*` 呼叫**（grep 無命中）→ `consoleNoise` 恆為 0，「證明計時器已清」邏輯上不可能失敗。
- `ac_t01.html:92` `after === 0` 只證明 `:full` 未在 `remove()` 後觸發，卻在 `:65-68` 已先 `await wait(600)` 走完整個 300ms 融合，時序上本來就不會再發 —— 檢查無區辨力。
- R1:101 AC-01-1「連續點擊 25 次，`overflow` 計數 = 15」：`ten-frame-grid.js:166` 在 `FUSION_TRIGGER` 期間**靜默 `return`**（不派任何事件），任何人為放慢點擊（300ms 內只點得到 2 下）就會小於 15 → 測試與元件皆脆弱。
- R1:231 AC-03-3 寫「連續 **3 次**抖動輸入（5→6→5→6）」——實際是 4 次變更，指令與斷言不符。

**風險**：專案硬約束「只認 exit code」，但目前所有驗收都靠人眼看 `RESULT_BEGIN` 區塊，等於 `[UNVERIFIED]`。空檢查更糟：它會給出 PASS 的假安全感。

**修改建議**：
1. 新增 `tools/ac_runner.ps1`：以 Edge headless（`msedge --headless --dump-dom file:///.../tests/ac_t01.html`）抓 `RESULT_BEGIN…RESULT_END`，`FAIL` 出現即 `exit 1`，三支測試串成 G-1 之後的第二道閘門。
2. 補 `tests/ac_t03.html`（物理收斂、夾值、重連）。
3. AC-01-5 改驗「`remove()` 後 500ms 內 `balance:change`/`ten-frame:*` 全事件計數為 0」＋「重連後行為等價」（併 TCK-04）。
4. 融合期間的點擊改派 `ten-frame:blocked`（併 TCK-05b），AC-01-1 改為事件總和（`fill=10`、`blocked` 或 `overflow` ≥ 15、`dot ≤ 10`）而非硬編 15。
5. 修正 AC-03-3 文字為「4 次變更」。

**BP 建議分流**：`[建議 ACCEPTED]`（runner 為發布硬閘門前置）。　**實際裁決**：`[待 BP 簽核]`

---

## 🟢 四、通過項（避免只挑錯，供 AGY 終審參考）

| 檢查 | 實測 | 結果 |
| :--- | :--- | :--- |
| G-1 語法 `node --check` ×3 | `ten-frame-grid.js` / `dual-track-diff.js` / `balance-beam.js` | 全 **exit 0** |
| G-5 體積 | 10,233 / 7,610 / 12,064 bytes，合計 29,907 | 全 ≤ 12KB、合計 ≤ 30KB **PASS**（balance-beam 僅餘 224 bytes 餘裕，屬黃燈） |
| R1:42 行數 | 277 / 215 / 278 | 全 ≤ 300 **PASS**（balance-beam 僅餘 22 行餘裕） |
| G-4 零外部資源 | grep `https?://` 僅命中 `w3.org/2000/svg` | **PASS** |
| 鐵律五 離線 | 三檔皆傳統 IIFE、`customElements.define`、無 `type="module"` | **PASS** |
| 事件契約覆蓋 | `ten-frame:*` / `diff:*` / `balance:*` 骨架齊備 | 骨架 PASS，`ten-frame:tap` 越界（TCK-05a） |

---

## 📊 五、工單總覽與建議次序

| 工單 | 等級 | 主題 | 建議 | 阻塞 Stage 3 |
| :--- | :--- | :--- | :--- | :--- |
| TCK-01 | HIGH | Challenger 被跳過、AGY 已簽、未 commit | ACCEPTED | ✅ |
| TCK-02 | HIGH | 390px 兩盒並排算術不成立 | ACCEPTED（採 A） | ✅ |
| TCK-03 | HIGH | 拋物線／分解樹無主 | ACCEPTED（補 T-05） | ✅ |
| TCK-04 | HIGH | 生命週期不對稱（重連必爆／疊層） | ACCEPTED | ✅ |
| TCK-05 | MED-HIGH | T-01 事件與色票漂移、熱區重疊 | ACCEPTED（部分） | ✅ |
| TCK-06 | MEDIUM | T-02 幾何數值自相矛盾 | ACCEPTED | ◻ |
| TCK-07 | MEDIUM | T-03 單位／dt／收斂判定未定 | ACCEPTED（回寫規格） | ◻ |
| TCK-08 | MEDIUM | 驗收不可機械化＋空檢查 | ACCEPTED | ✅（G 閘門） |

> **建議施工批次**：批次 1（TCK-02/05 幾何與事件，同檔）→ 批次 2（TCK-04 生命週期）→ 批次 3（TCK-08 runner ＋ ac_t03）→ 批次 4（TCK-03 T-05 算理演出）→ AGY 重簽 R2 → BP 逐 AC 盲審。
>
> **簽核狀態**：`PENDING_BP_DISPOSITION` —— 本 Challenger 不代簽，BP 分流完成後另存 `R1_BP_TICKET_RULING.md` 並回報 AGY。
