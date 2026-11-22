# 20261122_005 — 外殼缺 4 選項：盤點與施工計畫

> 階段：第一階段（唯讀）已完成；第二階段待使用者回「繼續」後施工。
> 硬約束：嚴禁碰觸 `017\` 或「子由」；不覆蓋既有未提交檔（`AGENTS.md`、`handoff.md`、兩份 N31x_ACCEPTANCE）。

## 一、第一階段盤點（唯讀，已查證）

### 1. 根因：外殼從未讀取 `choices`

| 查證點 | 事實 |
|---|---|
| `app/shell.js` `renderQuestion()`（456–518 行） | 只做：進度文字、試卷來源、題目標題、進度圓點、上一題/下一題 disabled、嵌入教具 iframe（`stageFrame.src = component_path`）。**全文沒有 `q.choices` / `answer_index` / `explanation` 的讀取。** |
| `app/index.html` `unitExamWrap`（462–472 行） | 只有 `dots`、`stageTitle`、`<iframe id="stageFrame">`、`stage-nav`（上一題/✔檢查答案/下一題/交卷）。**沒有任何選項容器。** |
| `btnCheckMain`（shell.js 838 行）→ `triggerCheckAnswer()`（763–778 行） | 只延伸進 iframe 找 `.check-btn / .btn-ok / #btnCheck / .btn.good / .btn.primary` 或 `contentWindow.check()`作答判定 **100%  delegate 給教具**。 |
| 題庫現況 | 24 單元每題皆有 `choices`(4)、`answer_index`、`explanation{concept,steps,trap}`（S-3-4 為 4 題其餘 10 題）。**資料完整，是外殼端死資料。** |

結論：教具若沒自畫選項，手機上就沒有任何 A/B/C/D 可點；即使有選項（如 S-3-2），若教具沒有 check 按鈕，底部「✔ 檢查答案」也是空轉，永不顯示對錯與 `concept/steps/trap`。

### 2. 全站 24 單元教具選項盤點

**A. 教具自帶選項列（19 單元 / 18 檔）— 但外殼仍不顯示詳解：**

| 單元 | 教具檔 | 選項元件 | check |
|---|---|---|---|
| N-3-1 | `ten_thousand_lab.html` | `option-btn` | 有 |
| N-3-2 | `vertical_calc_lab.html` | `option-btn` | 有 |
| N-3-3 | `multiplication_lab.html` | `option-btn` | 有 |
| N-3-4 | `division_lab.html` | `option-btn` | 有 |
| N-3-5 | `division_vertical_lab.html` | `option-btn` | 有 |
| N-3-6 | `multiplication_division_relation_lab.html` | `option-btn` | 有 |
| N-3-7 | `two_step_problem_lab.html` | `option-btn` | 有 |
| N-3-8 | `estimation_lab.html` | `option-btn` | 有 |
| N-3-9 | `fraction_lab.html` | `option-btn` | 有 |
| N-3-10 | `decimal_place_lab.html` | `option-btn` | 有 |
| N-3-11 | `number_line_lab.html` | `option-btn` | 有 |
| N-3-12 | `millimeter_ruler_lab.html` | `option-btn` | 有 |
| N-3-13、S-3-1 | `angle_explorer_lab.html` | `option-btn` | 有 |
| N-3-14 | `area_square_lab.html` | `option-btn` | 有 |
| N-3-15 | `capacity_volume_lab.html` | `option-btn` | 有 |
| S-3-3 | `circle_lab.html` | `option-btn` | 有 |
| **S-3-2** | `square_rectangle_lab.html` | `.opt`（cc71420 剛補） | **無** |
| **R-3-2** | `pattern_reasoning_lab.html` | `.opt-btn` | **無** |

**B. 完全沒有選項可點（5 單元）— 手機上真題测验是「死題」：**

| 單元 | 教具檔 | 現況 |
|---|---|---|
| **S-3-4** | `solid_geometry_lab.html` | 只有 SVG 木棍/圆規/積木可點標記，無選項、無 check |
| **N-3-16** | `weight_concept_lab.html` | 重量操作教具，無選項、無 check |
| **N-3-17** | `time_concept_lab.html` | 時鐘教具，無選項、無 check |
| **R-3-1** | `multiplication_division_lab.html` | 僅 `checkAct3()` 活動回饋，無 A/B/C/D |
| **D-3-1** | `table_cross_lab.html` | 僅表格高亮 + `checkTrain/checkPromo` 活動回饋，無 A/B/C/D |

> 抽測 5 單元（S-3-2 / S-3-4 / N-3-16 / R-3-2 / D-3-1）正好涵蓋「有選項無 check」「完全無選項」兩類，代表性足夠。

## 二、第二階段施工計畫（待「繼續」）

1. **外殼選項列（`app/index.html`）**：在 `stageFrame` 與 `stage-nav` 之間插入
   `<div id="shellOptions" class="shell-options" role="radiogroup">` + `<div id="shellFeedback" class="shell-feedback">`（預設隱藏），並補 RWD CSS：A/B/C/D 兩欄網格、≥40px 觸控區、Light/Dark 皆清晰、單屏總高 ≤740px。
2. **外殼渲染與作答（`app/shell.js`）**：
   - `renderQuestion()` 讀 `q.choices` 產生 4 顆 `A/B/C/D` 按鈕，重置選取與回饋。
   - 點選項 → 記錄 `state.selectedChoice`、切 `.selected`。
   - `btnCheckMain` 改為：未選 → 提示；已選 → 比對 `answer_index`，標記選錯/正解，展開 `explanation.concept / steps / trap`（文字由 JSON 來，零冗餘）；並保留原有教具操作 proxy。
   - iframe onload 時注入「shell owns options」樣式，**統一隱藏教具內重複的選項列（含 S-3-2、R-3-2）**，确保畫面只有一組 A/B/C/D；教具的操作互動（量、轉、撥）不受影響。
3. **S-3-2 去重**：移除 `square_rectangle_lab.html` 內 `#options` / `CHOICES` / `.opt` 渲染（由外殼統一接管），單點改寫不擴大戰線；`verify_s32.js` 只驗題庫契約，不受影響。
4. **雙視口 CDP**：新增 `tools/verify_shell_choices_cdp.js`，360×800 與 390×844 逐一抽測 5 單元，驗證 4 顆選項存在且唯一（shell 一組、iframe 內為 0 或隱藏）、點 D → 按檢查 → 對錯與 `concept/steps/trap` 正確顯示、零橫向溢出、零 console error。
5. **門禁 + 发布**：跑 `verify_app_shell.js`、`verify_curriculum_131.js`、`verify_g3_contract_240.js`、`verify_s32.js`、`verify_r32.js`、`verify_s34.js`、`verify_n316.js`、`verify_d31.js` 及新增 CDP；全綠後隔離 `_scratch/`、只 stage 本次改动，`git commit` + `git push origin main`，回報 5 欄。

## 三、風險與對策

- **教具自身 check 按鈕被隱藏後 proxy 空轉**：外殼已接管判定，proxy 保留但不影響外殼回饋。
- **單屏高度**：options 採 2×2 紧凑網格（約 84px）、回饋折疊面板；iframe 維持 `fitFrame` 自動量高 ≤420px。
- **既有未提交檔**：`AGENTS.md`、`handoff.md`、兩份 reports 不 stage、不覆蓋。
