# 20261122_006 — 外殼統一 4 選項結案報告（5 欄）

| 欄位 | 內容 |
|---|---|
| **範圍** | `app/index.html`（題幹＋A/B/C/D／回饋面板 DOM 與 CSS）、`app/shell.js`（`renderShellQuestion` / `selectShellChoice` / `checkShellAnswer` / `hideIframeChoiceRows`、`btnCheckMain` 連動）、`app/components/square_rectangle_lab.html`（移除內建 `CHOICES`/`#options`/`.opt`）、`app/components/solid_geometry_lab.html`（配合微調）、`tools/verify_shell_choices_cdp.js`（新增雙視口雙模式 CDP）。**未碰觸 `017\` 或「子由」**。 |
| **變更** | 24 單元每題由外殼統一渲染 `q.stem` 與 A/B/C/D 四選項；點選 →「✔ 檢查答案」→ 標記對錯並展開 `explanation.concept / steps / trap`；iframe onload 注入 `shell-hide-choice-rows` 樣式隱藏教具重複選項列（`.options-grid/.opt-grid/#quest-options/.options/.option-btn/.opt-btn/.choice-btn`），S-3-2 內建列物理移除，畫面只剩一組乾淨選項。 |
| **驗證指令** | `node tools/verify_shell_choices_cdp.js`；`node tools/verify_app_shell.js`；`node tools/verify_s32.js`；`node tools/verify_r32.js`；`node tools/verify_s34.js`；`node tools/verify_n316.js`；`node tools/verify_d31.js`；`node tools/verify_curriculum_131.js`；`node tools/verify_g3_contract_240.js`；`node tools/verify_g3_viewport_width.js` |
| **真實 Exit Code** | 上述 10 道全部 **Exit 0**（無降級、無吞錯）；CDP 20/20 組合全綠（5 單元 × 360×800 / 390×844 × Light/Dark），零 Runtime exception、零橫向溢出。 |
| **證據** | CDP 輸出 `SHELL_CHOICES_CDP_VERIFIED (20/20 組合)`，截圖落於 `_scratch/shell_choices_shots/`（已隔離未入庫）；`APP_SHELL_CDP_VERIFIED`、`CURRICULUM_131_VERIFIED`、`G3 24 單元 234 題契約 PASS`、`448 次量測 0 溢出`。_commit `3015ea3`_ 已於 `origin/main`，`git rev-list --count origin/main..main = 0`；`git status` 僅存既有未提交檔 `AGENTS.md`、`handoff.md`、兩份 N31x_ACCEPTANCE 與本報告（未 staging `_scratch/`）。 |
