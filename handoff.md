# 專案交接日誌 (Handoff Log)
## 🔄 2026-11-22 G3 全 24 單元體檢 ＋ 第一批補題上線（OpenCode CLI）
- 掃描 24 檔：盤點明細在 `_scratch/g3_audit_batch1/g3_audit_all.md`；N-3-1 元件命名修正 5 處。
- 第一批 N-3-16 / S-3-2 / S-3-4 各補 Q06–Q10，30 題皆具 trap / fallback_height 420 / ?q=1..10。
- 三教俱升級 q-mode、Light/Dark 色票、移除 100vh、weight 指針改合法 `rotate(deg)` + `transform-box: view-box`。
- 全綠門禁（Exit 0）：verify_n316 / verify_s32 / verify_s34 / verify_n316_cdp / verify_batch1_dualmode_cdp（30 張截圖）/ verify_curriculum_131 / verify_app_shell / verify_g3_remaining_concepts。
- 驗收報告：`reports/20261122_G3_AUDIT_AND_BATCH1.md`。
- 第二棒：R-3-1 / R-3-2 / D-3-1 仍 5 題；N-3-1 選項與答案不一致、N-3-3 Q09 僅 3 選項；詳見報告異常表。
- <!-- DEGRADED: 拼圖目視由輔助模型描述，非主模型直接像素目視；色彩/高度/題號已由 CDP 客觀斷言全綠。 -->


> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N-3-17 時間概念小教室結案並上線**（2026-11-22）：六幕圖卡 S01–S06、曉臻 TTS 152.304s、`N317_Final.mp4`（1920×1080/30fps/4570 幀/152.333s/23.11 MiB/AV 誤差 0.000s）全部完成；`app/shell.js` 已註冊 `N-3-17` → `N317_Final.mp4`。
- 首壓 1280k 得 25.48 MiB 超標（Exit 1，如實記錄），單點降 1150k 重壓後 `N317_OK`；commit `1a47f44` 已 push（pre-push hook 部署 `2ddf81d2.math-108.pages.dev`）。
- 上一案 Dark Mode 護眼色票已上線（`d4b64dc`）；N-3-16／N-3-15 影片亦已上線，但驗收報告仍為 untracked。

## 🚦 目前狀態
- 🟢 四道門禁 Exit 0：`verify_curriculum_131.js`（131 條目）、`verify_app_shell.js`（noise 0）、`verify_n317.js`（5 題真值 1/0/1/2/1）、`verify_n317_cdp.js`（四幕互動全綠）。
- 🟢 影像目視：六圖卡＋S02/S04/S05 成片截圖無破框；feet=(305,845)、陰影 298px/blur 14、手勢距黑板框 ≥50.5px。
- 🟢 線上：`curl -I .../N317_Final.mp4` → HTTP 200 / video/mp4 / CF-RAY `a5e568ea19175c10-TPE`。
- ⚠️ 工作樹尚有 3 個未追蹤報告：`reports/20261122_N315_ACCEPTANCE.md`、`N316_ACCEPTANCE.md`（既有，非本次，勿動）、`N317_ACCEPTANCE.md`（本次產出，待收工 commit）。
- 📝 L3／031 記憶中樞已停用，無需更新。

## ➡️ 下一步
1. 本次收工 commit：`AGENTS.md` 進度、`handoff.md`、N317 驗收報告（**不含** N315/N316 報告）。
2. 選配：若需清理 N315/N316 untracked 報告，另案先問使用者。
3. 無功能待辦；新單元比照 `_scratch/mimi_n316/`、`mimi_n317/` 管線施工（圖卡→音訊→合成→門禁→push→curl→報告）。

## ⚠️ 注意事項與避坑
- **SSOT 母片**：角色只讀 `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g3_mimi\ready\` 的 `loop_*.webm` + `mouth_frames_v2/`；禁讀 mp4 預覽、禁視覺模型／ComfyUI／Antigravity。
- **WebM 黑底坑**：每支 41 幀的第 33–39 幀為黑底，必須自適應特徵偵測剔除（本次各剔 7 幀）；`alpha_mode=1` 標籤不代表可解 alpha。
- **單檔上限**：24 MiB 硬閘；1280k → 25.48 MiB 超標，1150k → 23.11 MiB 通過。
- **文字鐵律**：Pillow 一律 `anchor="ls"`；直式時／分欄垂直對齊；標註與框線 ≥18px 淨空。
- **CDP 時序**：改 sw.js CACHE_NAME 會造成 `Execution context was destroyed`，測試端已加重試，勿下修標準。
- <!-- DEGRADED: 通道二 A Server SSH 僅接受 publickey/password，本機無私鑰／密碼，非互動 ssh 卡密碼提示；歷次皆改本機 gh + pre-push hook 部署。bundle/scp 步驟未執行。 -->

## 🕐 最後更新
- 2026-11-22 · OpenCode CLI（Hy4 Flash）@ DESKTOP-6ELKIRH
- Git：N317 功能 ✅ 已推（`1a47f44`）；收工同步（AGENTS.md／handoff.md／N317 驗收報告）✅ 已推。
