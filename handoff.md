# handoff｜028-1 國小數學APP

⏯️ **目前做到哪**
- R-3-1／R-3-2／D-3-1 唯讀地毯盤點已完成並落檔：`reports/20261123_008_R31_R32_D31_AUDIT.md`。30 題（各 10 題）＋3 教具 HTML 全數解析，CDP 60 組合（390×844／1280×800）量測＋60 張截圖 `exit 0`；正式題庫／教具**零修改**，未碰 `017\` 或「子由」。
- 已定位使用者回報症狀根因：舊分頁殘留、R-3-2 黑方塊、覆蓋層造成假互動。

🚦 **目前狀態**
- 可運行：線上版本不受影響（本輪未改正式檔）；`git status` 僅 `reports/20261123_008_R31_R32_D31_AUDIT.md` 為 untracked。
- **暫停中**：等待使用者確認「繼續」才開工修復，嚴禁直接施工。
- 盤點結論：R-3-1 Q01–Q10 舊分頁「互逆家族／天平移項／驗算偵探／魔術箱」可見＋`q-scene`(z=450) 覆蓋教具；R-3-2 Q01–Q10 缺 `.q-scene/.b/.t/.s` CSS → 方塊純黑、數字不可見，scene 為 static 把互動區擠出 420px；D-3-1 Q01–Q10 表格圖文全對，舊 nav 被遮罩覆蓋，僅 scene `<td>` 十字高亮有效（實測 0→5 格），桌面 1280px 留白約 453px/側。

➡️ **下一步（1-3 項）**
1. 等使用者說「繼續」後，依報告第六節 P0→P1→P2→P3 施工：P0 補 R-3-2 CSS＋隱藏舊分頁；P1 R-3-1 去舊分頁／還原真實互動；P2 D-3-1 去舊 nav／修桌面留白；P3 全閘門回歸。
2. 修後重跑 `audit_3units.cjs`（temp 路徑見下）60 組合＋`verify_r31/r32/d31.js`＋`tools/release.py`，目視截圖確認無黑方塊、舊分頁消失、按鈕真實可點。
3. 施工前先把本輪盤點報告 commit + push（本次收工待辦）。

⚠️ **注意事項 / 踩坑**
- 盤點工具（不在 repo，換電腦需重寫）：`C:\Users\PXP\AppData\Local\Temp\opencode\audit_3units.cjs`、`click_probe.cjs`、`extract_scenes.py`；复用 repo 內 `tools/_cdp_util.js`。
- 證據（gitignore，不進 Git）：`_scratch/audit_20261123_008/measurements.json`＋60 張 PNG；需留存要改 `.gitignore`。
- R-3-2 的 `#q-scene` 是 `position:static`（rect y=21..386），與 R-3-1／D-3-1 的 absolute/z=450 不同，勿套用同一假設。
- R-3-1 Q3/Q4 場景文字其實正確，使用者感受到的「圖文未對應」源自互動天平被覆蓋；勿误改題庫或場景內容。
- 延續舊坑：`verify_g3_remaining_concepts.js` 已修 `?q=` 当檔名問題；S-3-2／S-3-4 無 `switchAct`，驗證器勿還原舊 act 斷言；圓規 `transform` 過渡 0.28s，CDP 需等 ≥360ms。

🕐 **最後更新**
- 2026-11-23 by Hy4 flash Free @ DESKTOP-6ELKIRH；Git：✅ 已推（commit `b3c8c2c`，含 008 盤點報告、AGENTS.md 里程碑與本檔）。

---

### 歷史交接索引（細節見各驗收報告）
- 盤點 `20261123_008_*`：R-3-1／R-3-2／D-3-1 30 題 CDP 60 組合唯讀盤點（本輪，待修復）。
- `c7b6535`／`049028a` S-3-4 雙視口升級（Build 20261123_094918）已 push 部署；`2d59575` S-3-4 Q2 圓規複製教具已 push 部署（報告 `20261123_007_*`）。
- `a6fa716` G3 題庫 67 處開發備註清洗；`cc71420` S-3-2 四災難根治；`91c08b1` R-3-1／R-3-2／D-3-1 共 26 題真題替換。
- 早期：App Shell 統一 A/B/C/D（`20261122_005_*`）、G3 窄屏 224 path 零溢出（`20261122_G3_VIEWPORT_WIDTH_FIX.md`）。
