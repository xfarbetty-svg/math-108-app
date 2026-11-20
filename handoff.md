# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N34 米米概念小教室（當前主線）**：
  - 第一步完成：`docs/mimi_classroom/`、`tools/mimi_classroom/mimi_assets/`（7 張圖，雜湊與來源一致）、
    `_scratch/mimi_n34/`；`N34_script.json` 完成（S01 pose 修正為 PNG）。
  - `tools/mimi_classroom/20261120_001_stage1_build.py` 執行 Exit 0：6 段曉臻女聲 WAV 共 101.64 秒
    （全數 `local_edge_tts`，語速 -5%）、`timeline.json`、7 張去背 PNG、`stage1_report.json`。
  - 稽核：`visual_model_called=False`、`comfyui_redraw_called=False`、`bottom_gradient=False`、
    `foot_guard_ratio=0.06`（底部 6% 實心雙腳）。
  - **第二步（N34 步驟 4）已完成並產出兩支影片**（詳見本檔「狀態」與下方路徑）：
    `mimi_talking_loop.mp4`（1024²/25fps/78 幀/3.12s）與
    `preview_lipsync.mp4`（1024²/30fps/3049 幀/101.63s + AAC，1.69 MB）。
  - 使用者已驗收初版並回報「領口閃動」；已修正並重新產出，待再次確認。
- **G3-N-3-9（既有已上線）**：黏土定格全片 84.72 秒 / 18.72 MB，`tools/release.py` 四階段全綠，
  https://math-108.pages.dev 正式生效；APP 已裝配 `#clayVideo` 播放器與 `UNIT_CONCEPT_MOVIES["N-3-9"]`。

---

## 🚦 目前狀態與客觀事實
- 🟢 **N34 步驟 4 產出完成**：兩支影片皆經 ffprobe 驗證 Exit 0。
  - 說話/靜音切換已改為**單一底圖（loop 閉合度最高幀 n=68）＋僅嘴部 ROI 羽化貼合**，
    實測領口區 (y515–600, x380–650) mean abs diff = **0.0 / max 0**，領口不再跳動。
  - 第二階段 OpenCV 黑板教具**必須等使用者確認修正版後才開工**。
- 🟢 **本站線上穩定**：G3-N-3-9 全片與小教室雙端裝配完成，既有功能正常。
- 🧱 **關鍵路徑**：
  - 台詞/圖層設定：`docs/mimi_classroom/N34_script.json`
  - 原始施工指南（僅供參考，實際做法已偏離）：`docs/mimi_classroom/N34_STEP4_HANDOFF.md`
  - 建置腳本：`tools/mimi_classroom/20261120_001_stage1_build.py`
  - 時間軸/去背：`_scratch/mimi_n34/timeline.json`、`nobg/`、`audio/`
  - **產出影片**：`_scratch/mimi_n34/mimi_talking_loop.mp4`、`_scratch/mimi_n34/preview_lipsync.mp4`
  - **修正合成腳本**：`_scratch/mimi_n34/20261120_006_audio_gate_preview_roi.py`
  - **嘴部 ROI 遮罩**：`_scratch/mimi_n34/20261120_006_mouth_roi_mask.png`（ROI x442–538 / y430–490，領子 y≈514 起）
  - **領口比對驗證**：`_scratch/mimi_n34/20261120_007_collar_compare.png`
  - 可複用函式 `composite_mouth(base, moving_frame, mask)` 已內建於 006 腳本，供後續姿勢立繪使用
    （其他姿勢 ROI 座標需各自校正）。
- ⚠️ **環境副作用（待處理）**：監聽 8188 的系統 Python 已裝 mediapipe 0.10.21，
  `numpy 2.4.6→1.26.4`、`protobuf→4.25.9`，可能影響 rembg（需 numpy≥2.3）與 google-api-core。
  目前 N34 流程已不依賴 mediapipe（改用既有影片），**建議下個框評估是否還原**。
- 📝 **L3 筆記**：無 Obsidian MCP 工具，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. **開新對話框，第一句貼**：「讀 `handoff.md`，繼續 N34 第二步驗收與第三階段施工」。
2. 請使用者確認修正版 `preview_lipsync.mp4` 領口已不跳動（比對圖 `20261120_007_collar_compare.png`）。
3. 確認後才做第二階段 OpenCV 黑板教具繪製與 `N34_Final.mp4` 合成。
4. 視情況還原系統 Python 的 numpy/protobuf（見上方環境副作用）。

---

## ⚠️ 規則提醒與避坑指南
- **ComfyUI LivePortrait 依賴陷阱（本次實測）**：12 節點 workflow 直接跑會在節點 2 失敗——
  先缺 `insightface`；改 `LivePortraitLoadMediaPipeCropper` 後，mediapipe 1.2.3 改包裝缺
  `mediapipe.framework`（0.10.21 才有）。本機兩個 Python 環境都缺，**未重跑 LivePortrait**，
  talking loop 改用既有真實驅動影片 `036_local_painter\reports\task_b_liveportrait\mimi_liveportrait_test.mp4`
  （純複製，嘴部確有診斷性開合，78 幀與 d0.mp4 完全一致）。
- **LivePortrait 參數陷阱**：啟用 retargeting 時 `relative_motion_mode` 必須用 `"relative"`
  （非 `"off"`）才會「鎖頭鎖眼、只動嘴唇」。本機無音訊唇形模型，不裝 MuseTalk/Wav2Lip。
- ** lipsync 鐵律（本次使用者驗收要求）**：說話與停頓必須共用同一底圖，只貼嘴部 ROI + 羽化，
  嚴禁切換不同立繪（領巾 vs 翻領會閃）；ROI 下緣不得觸及脖子與綠色翻領。
- **去背鐵律**：底部 6% 保留實心雙腳，不加透明漸層；禁呼叫視覺模型或 ComfyUI 重畫兔子。
- **Cloudflare Pages 單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`。
- **PWA 快取破除**：重大更新必跑 `tools/release.py` 更新版號與 `sw.js`。
- **本次未動的使用者工作**：`docs/108課綱...md` 修改與 `reports/retros/RETRO_S39_COMPOSITE_VIDEO.md` 保持原樣。

---

## 🕐 最後更新
- **時間**：2026-11-20
- **更新者**：OpenCode 監工 @ DESKTOP-6ELKIRH
- **Git 狀態**：handoff 更新已 commit（未 push；pre-push hook 會自動部署 Cloudflare Pages）
