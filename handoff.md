# 斷點交接日誌 (handoff.md)

## ⏯️ 目前做到哪
- **2026-11-28 接續（G2 CDP 門禁時序修復 ＋ G4 發版）**：
  - `tools/verify_g2_n211_n212_cdp.js`：比照 `n29_n210` 把固定 `sleep(350)` 改為 `waitForFunction` 輪詢（15s 上限，確認 `location.pathname`＋`window.check`＋`.wrap`），消除抖動根因；10 題單跑 Exit 0。
  - 整套 20 道門禁（與 `release.py` S1 同清單）逐條實跑，`SUITE_FAIL_COUNT=0`，全數 Exit 0。
  - 發版條件盤點：26 支 G4 影片皆 <25 MiB（最大 20.07 MiB）；`_scratch/`、截圖、`client_secret/token*.json` 皆未進 Git；pre-push hook 會排除 `_scratch/` 後部署。

## 🚦 目前狀態
- 本機 HEAD `b363280`（＋ 本次門禁修復與 handoff 更新）；遠端原 `394df9f`。
- 工作區變更：`tools/verify_g2_n211_n212_cdp.js` 修改 ＋ `handoff.md` 修改 ＋ 26 支未追蹤 G4 mp4；皆為發版所需，無機密／暫存大檔。
- 執行 `python tools/release.py`（已設 `PYTHONIOENCODING=utf-8`）進行 S0–S4：版號注入 → 全量門禁 → commit/push（觸發 pre-push 部署）→ Pages 部署 → 線上探測。

## ➡️ 下一步（接續建議）
1. 確認 `release.py` S4 版號吻合；若中斷，手動還原 VERSION／`app/index.html`／`app/sw.js` 三處版號。
2. `curl -sIL` 探測 `G4_N41_Final.mp4` 與 `G4_D41_Final.mp4`，確認 HTTP 200 ＋ `Content-Type: video/mp4`。

## ⚠️ 注意事項
- Python 前必設 `$env:PYTHONIOENCODING='utf-8'`。
- 嚴禁碰 `017`／「子由」／`D:\NAS\XX.CF995\8.下載`；`_scratch/`、截圖、`client_secret*.json`、`token*.json` 永不進 Git／部署。
- `release.py` S0 每次把版號改成當下時間，失敗中斷後要手動還原三處。

## 🕐 最後更新
- **時間**：2026-11-28（UTC+8）
- **更新者**：OpenCode @ DESKTOP-6ELKIRH
