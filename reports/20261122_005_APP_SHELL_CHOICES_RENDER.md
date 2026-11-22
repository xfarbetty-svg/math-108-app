# 20261122_005 — App Shell 統一渲染 🎯 真題測驗 A/B/C/D 選項（驗收報告）

## 5 欄結案

| 欄位 | 內容 |
|---|---|
| 範圍 | `app/index.html`、`app/shell.js`、`app/components/square_rectangle_lab.html`、`app/components/solid_geometry_lab.html`、`tools/verify_shell_choices_cdp.js`；未碰 `017\`、未碰「子由」；G1/G2 教具維持原樣（外科手術）。 |
| 變更 | 外殼在 iframe 下渲染題幹＋A/B/C/D（2×2 紧凑格、≥42px 觸控區、Light/Dark token）；點選高亮→「✔ 檢查答案」標正解/誤選並展開 `concept/steps/trap`；換題/換單元/概念模式重置；G3 教具內舊選項列由 iframe 注入 CSS 統一隱藏；S-3-2 移除上一輪臨時選項列（維持 260px）；移除代理 iframe `check()` 的舊路徑；S-3-4 清掉殘留 `q-badge` CSS（原 `verify_s34.js` 誤判）。 |
| 驗證指令 | `node tools/verify_shell_choices_cdp.js`；`node tools/verify_app_shell.js`；`node tools/verify_g3_viewport_width.js`；`node tools/verify_g3_contract_240.js`；`node tools/verify_curriculum_131.js`；`node tools/verify_s32.js` / `verify_s34.js` / `verify_n316.js` / `verify_r32.js` / `verify_d31.js` |
| 真實 Exit Code | 全部 **0**（10 支腳本，含新 CDP 20/20 組合；首輪 `verify_s34.js` Exit 1 → 單點移除殘留 CSS 後重跑 Exit 0）。 |
| 證據 | `SHELL_CHOICES_CDP_VERIFIED (20/20)`；`APP_SHELL_CDP_VERIFIED`；`G3_VIEWPORT_WIDTH` 0 溢出；20 張雙視口雙模式截圖於 `_scratch/shell_choices_shots/20261122_001..020_*.png`，已由 Hy4 Flash 目視 4 張代表圖（S-3-2 light/dark 360、R-3-2 dark 360、D-3-1 dark 390）。 |

## 第一階段：唯讀盤點（已查證）

- `renderQuestion()` 原本只更新進度／標題／圓點／iframe，全文無 `q.choices`、`answer_index`、`explanation`；`btnCheckMain` 只代理進 iframe 的 check 按鈕 → 外殼端是死資料。
- 題庫實查：59 份 JSON、405 題中 390 題具 4 選項；G3 24 單元全部 4 選項＋合法 `answer_index`；另有 15 題 G1 舊題為 3/10 選項、3 題 N-3-17 缺 `trap`，新外殼以「依實際選項數渲染＋缺欄位顯示『（本題題庫未提供）』」優雅降級，不改 SSOT。
- 教具自帶選項：G3 共 18 檔（`.options-grid` 15、`.opt-grid` 1、`#quest-options` 1、S-3-2 `.options` 1）；另 5 單元（S-3-4/N-3-16/N-3-17/R-3-1/D-3-1）完全無選項。

## 第二階段：實機 20 組合結果

| 視口 × 模式 | S-3-2 | S-3-4 | N-3-16 | R-3-2 | D-3-1 |
|---|---|---|---|---|---|
| 360×800 Light | 答對 | 答錯 | 答對 | 答錯 | 答對 |
| 360×800 Dark | 答對 | 答錯 | 答對 | 答錯 | 答對 |
| 390×844 Light | 答對 | 答錯 | 答對 | 答錯 | 答對 |
| 390×844 Dark | 答對 | 答錯 | 答對 | 答錯 | 答對 |

每格均驗證：外殼 4 顆選項且 iframe 可見重複選項 = 0、點選恰 1 顆高亮、檢查後正確/誤選標記與 `核心概念/解題步驟/常見陷阱` 展開、零橫向溢出、教具高 ≤420px（S-3-2 = 260px）、零 console error。

## 目視備註

- S-3-2 Light/Dark：題幹、4 選項、答對標記、詳解面板皆清晰，無兩組選項、無文字遮擋。
- R-3-2 / D-3-1 / S-3-4：外殼選項與回饋一致；iframe 內部既有深色文字對比偏低與局部裁切屬教具原況，非本輪改動，依軍規三不擴大戰線。
- 展開詳解後需垂直捲動（題幹＋4 選項＋完整詳解無法在 844px 內全數入屏）； 橫向溢出為 0，符合本輪「零橫向溢出」硬要求。

## 提交

僅 stage 上列 5 支程式碼／工具與本報告；`AGENTS.md`、`handoff.md`、既有未提交 reports、`_scratch/` 均隔離不提交。
