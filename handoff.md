# handoff｜028-1 國小數學APP

⏯️ **目前做到哪**
- R-3-2 Q07（作品貼膠帶）與 Q08（梯形桌併桌）UX 精修已完工並通過 11 道門禁全綠驗收。
  - 防劇透：Q07/Q08 初始狀態由預設 5張/4張改為「從 1 張開始」，狀態列僅提供結構推導提示，杜絕印出正解（＝14段 / ＝14人）。
  - 圖例一致性：Q07 相接處改以頂層繪製黃色醒目共用膠帶＋紅色虛線叉叉＋「共用」文字標籤，100% 對齊圖例說明。
  - 桌面寬螢幕（1280×800）自適應：展開至 720px 置中（margin left/right 280px），消除雙層空黑框。
  - 驗收報告：`reports/20261123_011_R32_UX_OPTIMIZATION_ACCEPTANCE.md`。

🚦 **目前狀態**
- 可運行：本地 11 道驗證閘門全部 Exit Code 0，即將 git commit + push 部署至 Cloudflare Pages。
- 隔離未提交：`reports/screenshots/concept_preview_mobile.png`、`_scratch/`。

➡️ **下一步（1-3 項）**
1. 執行 `git add` 與 `git commit`，並推送到遠端 `git push origin main` 觸發 Cloudflare Pages 部署。
2. 驗證線上版本（https://math-108.pages.dev）之 R-3-2 Q07/Q08 運作正常。
3. 輸出 5 欄結案報告回覆使用者。

⚠️ **注意事項 / 踩坑**
- Q07 兩張紙相接處若在同一 loop 繪製，第二張紙的白色矩形會蓋住第一張繪製的共用叉叉。必須採用「兩階段分層繪製（two-pass）」：先畫完所有作品紙底圖，頂層再覆蓋接縫膠帶與叉叉。
- 桌面版 `body` 展開至 720px 時，靜態題型（Q01～Q04）的 SVG 需設定 `max-height: 380px !important; width: auto !important;`，防止 SVG 等比放大導致教具總高度溢出 420px 門禁。
- 延續舊坑：`verify_g3_remaining_concepts.js` 已修 `?q=` 當檔名問題；圓規 `transform` 過渡 0.28s，CDP 需等 ≥360ms。

🕐 **最後更新**
- 2026-11-23 by Gemini 3.8 Flash；Git：準備 push（含 R-3-2 UX 精修、011 驗收報告與本檔）。

---

### 歷史交接索引（細節見各驗收報告）
- `20261123_011_*`：R-3-2 Q07/Q08 防劇透初始狀態、圖例叉叉一致性與桌面 720px 寬螢幕精修。
- `20261123_008_*`：R-3-1／R-3-2／D-3-1 30 題 CDP 60 組合唯讀盤點。
- `c7b6535`／`049028a` S-3-4 雙視口升級（Build 20261123_094918）已 push 部署；`2d59575` S-3-4 Q2 圓規複製教具已 push 部署（報告 `20261123_007_*`）。
- `a6fa716` G3 題庫 67 處開發備註清洗；`cc71420` S-3-2 四災難根治；`91c08b1` R-3-1／R-3-2／D-3-1 共 26 題真題替換。
- 早期：App Shell 統一 A/B/C/D（`20261122_005_*`）、G3 窄屏 224 path 零溢出（`20261122_G3_VIEWPORT_WIDTH_FIX.md`）。
