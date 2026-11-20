# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N34 米米概念小教室（當前主線）**：
  - 第一步完成：6 段曉臻女聲 WAV 共 101.64 秒、7 張去背 PNG、`timeline.json`、`stage1_report.json`（皆 Exit 0）。稽核 `visual_model_called=False`／`comfyui_redraw_called=False`／`bottom_gradient=False`／`foot_guard_ratio=0.06`。
  - **第二步（對嘴預覽）已完成**：`mimi_talking_loop.mp4`（1024²/25fps/78幀/3.12s）＋
    `preview_lipsync.mp4`（1024²/30fps/3049幀/101.63s + AAC，2.43 MB）皆 Exit 0 產出。
  - 六場景 5 姿勢切換（S01 站／S02 托下巴／S03-S04 舉手／S05 拍手／S06 比讚）、
    `cv2.seamlessClone(NORMAL_CLONE)` 嘴部無縫融合、口腔 inpaint 修補、領口零閃動、
    新版 S02 手指清晰——皆已目視驗收通過（見驗證圖）。
- **G3-N-3-9（既有已上線）**：黏土定格全片 84.72 秒 / 18.72 MB，`tools/release.py` 四階段全綠，
  https://math-108.pages.dev 生效；APP 已裝配 `#clayVideo` 與 `UNIT_CONCEPT_MOVIES["N-3-9"]`。

---

## 🚦 目前狀態與客觀事實
- 🟢 **N34 對嘴預覽已完成並通過驗收**，下一步為最終合成 `N34_Final.mp4`（1920×1080/30fps，
  `docs/mimi_classroom/N34_script.json` 的 `paths.output_video`）。
- 🟢 **本站線上穩定**：G3-N-3-9 全片與小教室雙端裝配完成，既有功能正常。
- 🧱 **關鍵路徑**：
  - 台詞/圖層/黑板設定：`docs/mimi_classroom/N34_script.json`
  - 原始施工指南（做法已偏離，僅供參考）：`docs/mimi_classroom/N34_STEP4_HANDOFF.md`
  - 產出影片：`_scratch/mimi_n34/mimi_talking_loop.mp4`、`_scratch/mimi_n34/preview_lipsync.mp4`
  - 最終合成腳本：`_scratch/mimi_n34/20261120_012_final_preview_v3.py`（v3：inpaint + seamlessClone）
  - 新版去背：`_scratch/mimi_n34/014_rebg_think.py` → `nobg/mimi_think.png`（手指已下移）
  - 驗證圖：`20261120_011_scene_montage.png`（六場景拼圖）、`20261120_012_S02_zoom.png`（S02 特寫）
  - 來源素材：`tools/mimi_classroom/mimi_assets/`（新版 closed／think 已由使用者覆蓋更新）
  - 旁白：`_scratch/mimi_n34/narration_all.wav`、`timeline.json`、`nobg/`、`audio/`
- ⚠️ **環境副作用（未還原，依使用者指示維持）**：系統 Python 裝 mediapipe 0.10.21，
  numpy 2.4.6→1.26.4、protobuf→4.25.9、另裝 pyyaml；rembg/google-api-core 可能受影響。
  本流程已不依賴 mediapipe（嘴部動態移植自既有 LivePortrait 片段）。
- 📝 **L3 筆記**：無 Obsidian MCP 工具，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. **開新對話框，第一句貼**：「讀 `handoff.md`，繼續 N34 最終合成 `N34_Final.mp4`」。
2. 依 `N34_script.json` 的 `layers`（bg／blackboard_roi／mimi anchor `[340,620]` scale `0.72`）與六場景
   `blackboard_render`，做第二階段 OpenCV 黑板教具繪製並合成 1920×1080 最終片。
3. 壓片鎖 `-b:v 1800k -maxrate 2200k`（Cloudflare Pages 單檔 < 25 MiB），跑 `tools/release.py` 驗證。

---

## ⚠️ 規則提醒與避坑指南
- **ComfyUI 無法重跑（環境限制）**：8188 舊進程快取 mediapipe 1.2.3 狀態（缺 `mediapipe.framework`）；
  新開 8189 實例缺 torch/yaml/filelock。故 talking loop 採「既有真實 LivePortrait 嘴部動態移植到新版 closed 底圖」，
  非新版 source 重新推論。若要嚴格重跑需另備乾淨 Python 環境。
- **嘴部融合鐵律（驗收要求）**：先 inpaint 清底圖原張嘴口腔陰影（ROI `(424,442)-(568,512)`），
  再用 `cv2.seamlessClone(NORMAL_CLONE)`；`y>=510` 強制歸零避開脖子/翻領；禁強制亮度拉齊（會有矩形色差框）。
- **去背鐵律**：底部 6% 保留實心雙腳（foot_guard_rows≈122），不加透明漸層；禁呼叫視覺模型或 ComfyUI 重畫兔子。
- **真題神聖／言行一致／外科手術式精修**：詳見 `reports/retros/RETRO_S32/S35/S36`。
- **Cloudflare Pages 單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`。
- **PWA 快取破除**：重大更新必跑 `tools/release.py` 更新版號與 `sw.js`。
- **本次未動的使用者工作**：`docs/108課綱...md` 修改與 `reports/retros/RETRO_S39_COMPOSITE_VIDEO.md` 保持原樣。

---

## 🕐 最後更新
- **時間**：2026-11-20
- **更新者**：OpenCode @ DESKTOP-6ELKIRH
- **Git 狀態**：待回填（L2 commit + push 後更新）
