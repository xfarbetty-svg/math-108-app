# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N34 米米概念小教室（當前主線）**：
  - 第一步完成：建立 `docs/mimi_classroom/`、`tools/mimi_classroom/mimi_assets/`（7 張圖，雜湊與來源一致）、
    `_scratch/mimi_n34/`；`N34_script.json` 完成（S01 pose 修正為 PNG）。
  - `tools/mimi_classroom/20261120_001_stage1_build.py` 執行 Exit 0：6 段曉臻女聲 WAV 共 101.64 秒
    （全數 `local_edge_tts`，語速 -5%）、`timeline.json`、7 張去背 PNG、`stage1_report.json`。
  - 稽核：`visual_model_called=False`、`comfyui_redraw_called=False`、`bottom_gradient=False`、
    `foot_guard_ratio=0.06`（底部 6% 實心雙腳）。
  - 第二步已查證並寫成交接設計：`docs/mimi_classroom/N34_STEP4_HANDOFF.md`
    （LivePortraitKJ 12 節點 API workflow + Audio-Driven Gate 的 RMS/0.15s 滯回演算法）。
- **G3-N-3-9（既有已上線）**：黏土定格全片 84.72 秒 / 18.72 MB，`tools/release.py` 四階段全綠，
  https://math-108.pages.dev 正式生效；APP 已裝配 `#clayVideo` 播放器與 `UNIT_CONCEPT_MOVIES["N-3-9"]`。

---

## 🚦 目前狀態與客觀事實
- 🟡 **N34 做一半**：語音與去背已驗收（Exit 0），但 `mimi_talking_loop.mp4` 與
  `preview_lipsync.mp4` **尚未產出**（步數上限中斷）。第二階段 OpenCV 黑板合成**必須等驗收後才開工**。
- 🟢 **本站線上穩定**：G3-N-3-9 全片與小教室雙端裝配完成，既有功能正常。
- 🧱 **關鍵路徑**：
  - 台詞/圖層設定：`docs/mimi_classroom/N34_script.json`
  - 對嘴施工指南：`docs/mimi_classroom/N34_STEP4_HANDOFF.md`
  - 建置腳本：`tools/mimi_classroom/20261120_001_stage1_build.py`
  - 時間軸/去背：`_scratch/mimi_n34/timeline.json`、`nobg/`、`audio/`
  - ComfyUI：`http://127.0.0.1:8188`（1071 節點）；模型 `036_local_painter\ComfyUI\models\liveportrait`
  -  driving 範例：`...\ComfyUI-LivePortraitKJ\assets\examples\driving\d0.mp4`（3.12s）
- 📝 **L3 筆記**：無 Obsidian MCP 工具，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. **開新對話框，第一句貼**：「讀 `docs/mimi_classroom/N34_STEP4_HANDOFF.md`，接著做 N34 步驟 4」。
2. 依交接文件：複製 `mimi_apose_closed.png` 進 ComfyUI `input/` → 跑 12 節點 workflow →
   產出 `mimi_talking_loop.mp4` → 用 RMS gate 合成 `preview_lipsync.mp4`。
3. 請使用者驗收嘴型與節奏；**通過後**才做第二階段 OpenCV 黑板教具繪製與 `N34_Final.mp4`。

---

## ⚠️ 規則提醒與避坑指南
- **LivePortrait 關鍵陷阱**：啟用 retargeting 時，`relative_motion_mode` 必須用 `"relative"`（或任何
  非 `"off"` 值）才會「鎖頭鎖眼、只動嘴唇」；用 `"off"` 反而讓頭部跟著驅動影片動。
  另：本機無音訊驅動唇形模型，不安裝 MuseTalk/Wav2Lip，避免動到 RTX 5060 環境。
- **去背鐵律**：底部 6% 保留實心雙腳，不加透明漸層；禁呼叫視覺模型或 ComfyUI 重畫兔子。
- **Cloudflare Pages 單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`。
- **PWA 快取破除**：重大更新必跑 `tools/release.py` 更新版號與 `sw.js`。
- **本次未動的使用者工作**：`docs/108課綱...md` 修改與 `reports/retros/RETRO_S39_COMPOSITE_VIDEO.md` 保持原樣。

---

## 🕐 最後更新
- **時間**：2026-11-20
- **更新者**：Antigravity (AGY 監工) @ DESKTOP-6ELKIRH
- **Git 狀態**：✅ 已推（origin/main：e08cad8 + d542eb7；pre-push hook 已自動部署 Cloudflare Pages）
