## 2026-11-22 App Shell 統一 A/B/C/D 選項（最新交接）
- 外殼已統一渲染題幹＋4 選項＋作答回饋（concept/steps/trap）；S-3-2 教具內重複選項列已移除並維持 260px；G3 教具舊選項列由 iframe 注入 CSS 隱藏。
- 新閘門 `tools/verify_shell_choices_cdp.js`：20/20 組合（360/390 × Light/Dark × 5 單元）Exit 0，截圖在 `_scratch/shell_choices_shots/`。
- 十道腳本全數 Exit 0；`verify_s34.js` 首輪因殘留 `q-badge` CSS Exit 1，已單點清除後重跑 Exit 0。
- 驗收報告：`reports/20261122_005_APP_SHELL_CHOICES_RENDER.md`。`AGENTS.md`、`handoff.md`、N315/N316 reports、`_scratch/` 為既有未提交工作，未 stage。
- 本框已 45+ 步，請開新框接續。

# 交接（2026-11-22 第三批收官）

## 已完成
- commit `91c08b1`：R-3-1/R-3-2/D-3-1 共 26 題真題替換＋三教具不劇透場景＋S-3-4 q=2 裁切修復＋驗收報告。
- 六道法定閘門全綠（Exit 0），證據見 `reports/20261122_R31_R32_D31_REAL_EXAM_FIX.md`。

## 待覆核（下框第一件事）
- D-3-1 `?q=10` 重截 PNG 大小未變，舊 act 表格疑似仍從 q-scene 下方透出／右側裁切；需用真 CDP（非 Chrome CLI 快取）重截並目視。詳見報告 DEGRADED 標註。

## 未提交（使用者工作，勿動）
- `M AGENTS.md`、`?? reports/20261122_N315_ACCEPTANCE.md`、`?? reports/20261122_N316_ACCEPTANCE.md`、`_scratch/` 全部。

## 環境
- 本框已 45+ 步，請開新框繼續。

## 2026-11-22 G3 窄屏寬度零裁切修復（交接）
- 體檢：tools/verify_g3_viewport_width.js，224 path × 2 視口；pre 80 異常 → post 0 溢出 Exit 0。
- 修復 11 支元件：6 支響應式寬度、2 支 .q-focus CSS nesting 還原、5 支高度收斂；新增 tools/_cdp_util.js、verify_d31_q10_cdp.js、verify_g3_viewport_width.js。
- D-3-1 ?q=10 四張雙模式截圖目視確認舊表格殘影消失，CDP Exit 0。
- 驗收報告：reports/20261122_G3_VIEWPORT_WIDTH_FIX.md

## 2026-11-22 S-3-2 四大災難根治（交接）
- commit `cc71420` 已 push 上線（Cloudflare Pages 部署成功）；4 檔：教具 HTML、S-3-2.json、verify_s32.js、reports/20261122_004_S32_ONESCREEN_FIX.md。
- 假 L 尺移除；Q01 左正方形/右等邊菱形＋三角板切換；Q02/Q10 點擊＋檢測鍵；Q05–Q09 乾淨幾何；Q07 吸管拼框；補 4 選項列；高度 420→260。
- 四道門禁 Exit 0；CDP 20 張雙視口雙模式截圖 FAILURES=0；互動實測 FAILURES=0；證據在 `_scratch/s32_shots/`（已隔離）。
- 關鍵發現：外殼 index.html/shell.js 從未渲染 4 選項，原「選項被擠出螢幕」真因是選項 DOM 不存在；本次於教具內補四列緊湊選項列（未自建提交按鈕、未嵌答案）。
- 工作區 `M AGENTS.md`、`M handoff.md`、`?? N315/N316 報告` 仍為使用者原有工作，勿動。
- 本框已 45+ 步，請開新框繼續。



## 2026-11-23 S-3-4 Q01 木棍圖重畫 + G3 題庫開發備註清洗（交接）
- commit `a6fa716` 已 push origin main；pre-push hook 自動部署 Cloudflare Pages 成功（https://828aa95d.math-108.pages.dev）。
- 教具：`app/components/solid_geometry_lab.html?q=1` 重畫為帶端點圓點的獨立木棍（圖①3／圖②5／圖③7 根），新增 2 根用暖色區分；每根可點擊變色、右上角 `#stickCount` 即時計數；白話操作說明已補上，移除「後面還有……／兩小題一起看／原卷」等內部備註。
- 題庫清洗：`S-3-4`、`S-3-2`、`D-3-1`、`N-3-16`、`N-3-17` 共 67 處欄位（題幹／concept／steps／trap／title），移除學年期標籤、括號工程說明、複合選項結尾、嚴禁拆題、共用同一組、原卷／基準檔等用語；出處保留於 `exam_source`／`source_paper`。自行業餘掃描 234 題的非中繼欄位為 0 命中。
- 驗收四道全 Exit 0：`verify_s34.js`、`verify_shell_choices_cdp.js`（20/20 組合）、`verify_g3_contract_240.js`、`verify_g3_viewport_width.js --phase post`（448 次量測 0 溢出）。
- 截圖目視：`_scratch/s34_q1_shots/S-3-4_q1_390x844_{light,dark}.png` 已確認木棍可逐根辨識、無與題幹重疊。
- 隔離未提交：`M AGENTS.md`、`M handoff.md`（本段交接追加）、`?? reports/20261122_N315_ACCEPTANCE.md`、`?? reports/20261122_N316_ACCEPTANCE.md`、`_scratch/` 全數未 stage。
- 步數已達 45+，請開新框繼續。
