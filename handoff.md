# handoff｜028-1 國小數學APP

⏯️ **目前做到哪**
- S-3-4 Q2 圓規複製教具已改造並上線：commit `2d59575`（Build `20261123_073824`），已 push origin main；pre-push hook 與 `release.py` S3 雙部署 Cloudflare Pages，S4 探針 HTTP 200 且版號吻合。

🚦 **目前狀態**
- 可運行：`solid_geometry_lab.html?q=2` 的 4 段折線可點擊量距 → 圓規按垂直平分線定位、張角隨段長、兩腳對齊端點 → 「📍 移到 A 點虛線截取此段」逐段截取彩色實線＋圓弧刻度 → 進度 `已複製 N/4` → 「↺ 重置」；q=1/3/4 未動，不代答選擇題。
- `release.py` S1 全 20 道守門員 Exit 0；自建 `verify_s34_q2_compass_cdp.js` 四組合（390×844／360×800 × Light/Dark）× 4 段全綠（兩腳誤差 0.06–0.12px、總長 259.9px、console 0 錯）；4 張截圖目視無穿模。
- 工作樹：本檔與 `reports/20261123_007_S34_Q2_COMPASS_ACCEPTANCE.md` 待提交，其餘乾淨。

➡️ **下一步（1-3 項）**
1. 開工先 `git status`，把本檔與 007 驗收報告 commit + push（或由下框收工一併處理）。
2. 手機實測 https://math-108.pages.dev 的 S-3-4 Q2，確認圓規張合與截取手感。
3. 可考慮把 `verify_s34_q2_compass_cdp.js` 加入 `release.py` S1 常駐閘門（目前為獨立腳本）。

⚠️ **注意事項 / 踩坑**
- `verify_g3_remaining_concepts.js` 的靜態伺服器原把 `?q=` 當檔名 → 已修 `req.url.split('?')[0]`。
- S-3-2／S-3-4 教具沒有 `switchAct`，驗證器已改驗真實 API；勿還原舊 act 斷言。
- 圓規 `transform` 有 .28s 過渡，CDP 量測需等 ≥360ms；360px 下要比較 `getScreenCTM()`（不是 `getCTM()`）才不會被 viewBox 縮放騙到。
- Gate 4 TTS 請求數曾抖動（1 vs 2），已補發一次；2 套教具曾缺 `audio_manager.js`，已補；`release.py` commit message 已改如實。
- `_scratch/` 與 `reports/*.png` 被 gitignore，一次性腳本與截圖不會進 Git；另如需留存要改 `.gitignore`。

🕐 **最後更新**
- 2026-11-23 by Hy4 flash Free @ DESKTOP-6ELKIRH；Git：主變更 `2d59575` ✅ 已推；同步檔 `8437f5f` ✅ 已推（含本檔與 007 報告）。

---

### 歷史交接索引（細節見各驗收報告）
- `2d59575` S-3-4 Q2 圓規複製教具（本日）— `reports/20261123_007_S34_Q2_COMPASS_ACCEPTANCE.md`（先前受阻記錄：`20261123_006_*`）。
- `a6fa716` S-3-4 Q01 木棍重畫＋G3 題庫 67 處開發備註清洗；四道閘門全綠。
- `cc71420` S-3-2 四災難根治（假尺移除、幾何重繪、420→260px）；外殼從未渲染選項，真因是 DOM 不存在。
- `91c08b1` R-3-1／R-3-2／D-3-1 共 26 題真題替換；D-3-1 `?q=10` 殘影已由 CDP 重截確認消失。
- 早期：App Shell 統一 A/B/C/D（`20261122_005_*`）、G3 窄屏 224 path 零溢出（`20261122_G3_VIEWPORT_WIDTH_FIX.md`）。

---

### 2026-11-23 S-3-4 雙視口升級（Build 20261123_094918 / commit c7b6535 已 push + 部署）
- 修改：`app/index.html`（>520px `.stage-frame` max-width 680 置中）、`app/components/solid_geometry_lab.html`（等角 3D 千/百/十/一；Q03 進位按鈕＋防劇透 result-note；Q02 ①~④ 標籤＋逐步脈衝引導）、`tools/release.py`（commit message 如實更新）。
- 新增：`tools/verify_s34_dual_viewport_cdp.js`（390×844 / 1280×800 × Light/Dark × Q01~Q04 全綠）。
- 驗證：`verify_s34.js`、`verify_s34_q2_compass_cdp.js`（4 組合 4 段全綠）、`verify_s34_dual_viewport_cdp.js` 全綠；`release.py` S1 全數 Exit 0；S4 線上 HTTP 200 版號吻合。
- 現況：`git status` clean；Cloudflare Pages https://math-108.pages.dev 已生效。
- 下一步：目視複核線上 S-3-4 Q01~Q04 寬螢幕置中效果；可考慮把雙視口腳本納入 release.py S1 常駐。
