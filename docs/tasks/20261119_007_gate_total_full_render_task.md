# 工單 4 (Gate Total) 任務卡：全片 84.74 秒阿德曼定格與黑板動態教具複合交付 (Final Video Master)

> **工兵指派**：A-SERVER 通道二 OpenCode (Model: opencode/deepseek-v4.1-flash-free)
> **執行規範**：編寫 `D:\ANTIGRAVITY\036_local_painter\tools\render_full_theater_video.py`，將米米定格動畫音畫對嘴底層與 `blackboard_visuals.py` 黑板動態層完整複合，壓製出 84.74 秒全片！

---

## 🎯 任務目標
將 Gate 0（底圖）、Gate 1（定格偶音畫微動）與 Gate 2（右側黑板向量教具）三層資產完全融合，壓製出 108 課綱 G3-N-3-9 單元情境小教室正式版教學影片：
- **輸出目標 1**：`D:\ANTIGRAVITY\028-1_國小數學APP\app\scenes\g3_n39_theater\video\g3_n39_full_theater.mp4`
- **輸出目標 2**：`D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\video\g3_n39_concept_final.mp4`
- **總時長**：84.74 秒整（2,034 幀，24 fps）
- **視訊規格**：1366 × 768，H.264 High / yuv420p
- **音訊規格**：使用完整配音 `D:\ANTIGRAVITY\028-1_國小數學APP\app\scenes\g3_n39_theater\audio\g3_n39_hsiaochen.mp3`（AAC 編碼）

---

## ⚙️ 全流程複合技術規格

### 1. 全程音畫對嘴與微動（0.0s ~ 84.74s）：
- 讀取完整音訊 `g3_n39_hsiaochen.mp3`，計算 12fps（1,017 分段）之 RMS 音量包絡。
- 6 組口型隨音量開合，靜音時閉嘴微笑（`mouth_01`）。
- 每隔約 3.5 秒自然閉眼 3 幀（第 84, 180, 276, 372, 468, 564, 660, 756, 852, 948... 幀）。
- 肢體切換卡點（對齊台詞分鏡）：
  - `0.0s ~ 10.0s`：自然站立 (`classroom_16x9_base.png`)
  - `10.0s ~ 52.0s`：抬右手指向黑板 (`pose_point_right.png`)
  - `52.0s ~ 62.0s`：切回自然站立（強調地基不動）
  - `62.0s ~ 67.74s`：切換抬右手（指向分子相加結果）
  - `67.74s ~ 84.74s`：切回自然站立（向學生微笑揮手/挑戰引導）

### 2. 黑板教具動態疊加：
- 對每一幀調用 `blackboard_visuals.py` 之 `render_blackboard_overlay(t)`，將其 RGBA 圖層疊加於背景之上。

### 3. 壓製與交付檢核：
- 透過 ffmpeg 管道串流或影格壓製成 MP4。
- 驗證：
  1. 時長精確為 84.74s（允許誤差 $\pm 0.1s$）。
  2. 檔案大小 $> 10\text{ MB}$（徹底告別 4 張死圖）。
  3. 檔案同步拷貝至 `app/assets/video/g3_n39_concept_final.mp4`。
  4. Exit Code 必須為 0！
