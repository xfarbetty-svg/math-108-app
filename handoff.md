# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N-3-10 米米概念小教室成片 — 本地完成，尚未部署**（本次主線）：
  - 腳本：`docs/mimi_classroom/N310_script.json`（6 幕／10 姿勢庫中 7 姿勢；S06 拆 A/B 段）。
  - 成片：`app/assets/classroom_videos/N310_Final.mp4`（1920×1080／30fps／108.000s／3240 幀／18.12 MB／H.264+AAC）。
  - 圖卡：`_scratch/mimi_n310/blackboard_montage.png`（6 幕黑板拼圖，已目視驗收無穿模／無字遮擋）。
  - 管線：`tools/mimi_classroom/20261120_002_n310_build.py`；定點整數斷言 `36+28==64`、`50-14==36` 與進退位中間值全過。
  - 語音：zh-TW-HsiaoChenNeural／-5%／動作提前 0.3s／口白後停 1.2s；去背採全圖連通泛洪（腳不與邊緣連通自然保留），底色修補 + `cv2.seamlessClone(NORMAL_CLONE)`、領口 source y<510 不進 mask、mouth_frames RMS gate 對嘴。
  - **嚴禁動作已遵守**：未執行 `git push`、未執行 `tools/release.py`、未呼叫視覺模型／ComfyUI。
- **N34 米米概念小教室 — 已全數完成並正式上線**（上一次主線）：
  - 成片：`app/assets/classroom_videos/N34_Final.mp4`（1920×1080/30fps/101.633s/H.264+AAC/約 19.5 MB）。
  - 掛載：`app/shell.js` 的 `UNIT_CONCEPT_MOVIES` 新增 `N-3-4`／`N-3-5` → 上述影片（原假設「已掛載」實為缺漏，已補）。
  - 部署：`python tools/release.py` Build `20261120_171001` 全綠（S1 20 gates／S2 push／S3 wrangler／S4 版號吻合），正式網址 https://math-108.pages.dev。
  - 线上驗真：`shell.js` 精確映射 N34/N35 = True、影片 HEAD = HTTP 200，微電影按鈕可見。
- **S1 守門員時序強化（必要副作用）**：`verify_audio_singleton.js`（輪詢等 AudioManager／TTS）、`verify_app_shell.js`（`Execution context was destroyed` 重試）、`verify_concept_hub_cdp.js`（重試＋等年級導航＋防空結果假綠）；檢驗標準未變。
- **純文件入庫**：`a420f8b` 收納 3 個未提交檔（108課綱分析 md、N34 掛載方案、RETRO_S39 覆盤）。

---

## 🚦 目前狀態與客觀事實
- 🟢 **全站已上線且 worktree clean**；`main...origin/main` 同步，最後 commit `55ec16b`（release Build 20261120_171001）。
- 🟢 G3-N-3-9 黏土定格劇院與 N34 概念小教室影片並存正常。
- ⚠️ `tools/release.py:160` commit message 寫死「G3 N-3-9…」，實際本次含 N34 掛載；語意落差已知、未改（選配）。
- ⚠️ 環境副作用未還原：系統 Python 裝 mediapipe 0.10.21，numpy 2.4.6→1.26.4、protobuf→4.25.9、pyyaml；本流程已不依賴 mediapipe。
- 📝 L3 筆記：無 Obsidian MCP，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
0. 待使用者目視驗收 `_scratch/mimi_n310/blackboard_montage.png` 與 `N310_Final.mp4` 後，再另行決定是否掛載 `app/shell.js` 的 `UNIT_CONCEPT_MOVIES`（N-3-10）並走發布門禁；**本輪不做**。
1. 手機實機開 https://math-108.pages.dev → G3 N-3-4／N-3-5 概念小教室，點「微電影」確認播放。
2. 選配：修正 `tools/release.py:160` 寫死的 commit message，語意反映目前主線。
3. 無其他待辦；新任務可直接開工。

---

## ⚠️ 規則提醒與避坑指南
- **CDP 時序是頑疾**：S0 改 `sw.js` CACHE_NAME 會觸發 `skipWaiting()`＋`clients.claim()`，造成 `Execution context was destroyed`；測試端已加重試，勿反向下修檢驗標準。
- **只重繪 Layer 2**：S05 直式修正只動黑板圖卡＋重新合成，勿重跑 edge-tts／ComfyUI。
- **去背鐵律**：白鍵泛洪去背＋底部實心雙腳；禁呼叫視覺模型重畫兔子。
- **單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`（實測約 19.5 MB）。

---

## 🕐 最後更新
- **時間**：2026-11-20 17:14
- **更新者**：OpenCode @ DESKTOP-6ELKIRH
- **Git 狀態**：✅ 已推（`221f8b1`，main 與 origin/main 同步）
