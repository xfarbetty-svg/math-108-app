# 工單 2 (Gate 1) 任務卡：15 秒真實音畫對嘴與肢體定格測試片 (Proof of Concept Clip)

> **工兵指派**：A-SERVER 通道二 OpenCode (Model: opencode/deepseek-v4.1-flash-free)
> **執行規範**：自主帶手腳編寫合成腳本 `D:\ANTIGRAVITY\036_local_painter\tools\compose_test_motion.py`，支援純 Python + FFmpeg 渲染出 15 秒測試 MP4。

---

## 🎯 任務目標
基於 Gate 0 已特採通過之母本資產，製作前 15 秒真實音畫對嘴與肢體切換測試片：
- **輸出檔案**：`D:\ANTIGRAVITY\028-1_國小數學APP\reports\test_mimi_motion.mp4`
- **時長**：15.0 秒整（精確對齊配音）
- **視訊規格**：1366 × 768，24 fps，H.264 編碼，yuv420p
- **音訊規格**：截取自 `D:\ANTIGRAVITY\028-1_國小數學APP\app\scenes\g3_n39_theater\audio\act1.mp3` 前 15.0 秒

---

## 🧩 輸入資產路徑
1. **底圖與動作**：
   - `D:\ANTIGRAVITY\036_local_painter\theater\assets\mimi_v2\classroom_16x9_base.png` (1366×768)
   - `D:\ANTIGRAVITY\036_local_painter\theater\assets\mimi_v2\pose_point_right.png` (1366×768)
2. **六組羽化口型**：
   - `D:\ANTIGRAVITY\036_local_painter\theater\assets\mimi_v2\mouth_01.png` ~ `mouth_06.png` (256×256, RGBA)
3. **配音檔案**：
   - `D:\ANTIGRAVITY\028-1_國小數學APP\app\scenes\g3_n39_theater\audio\act1.mp3`

---

## ⚙️ 合成技術規格與卡點

### 1. 嘴部精確座標與縮放貼合：
- 母本 1024×1024 中嘴部中心為 `(540.0, 506.0)`，原始裁切方框為 112px。
- 在 1366×768 底圖中（左側 768×768 區域，縮放比率 0.75）：
  - 嘴部中心座標：`cx = 405.0, cy = 379.5` (整數 `(405, 380)`)。
  - 貼合尺寸：`mouth_target_size = 112 * 0.75 = 84` px（或含羽化 96px）。
  - 將 256×256 的口型縮放為目標尺寸，以 `(cx, cy)` 為中心使用 Alpha 遮罩無縫貼上。

### 2. 音訊驅動 12fps 阿德曼定格對嘴：
- 定格偶動畫最地道的格率為 12fps（每 2 幀換一次口型）：
- 解析音訊 RMS 音量包絡（分成 12 分段/秒）：
  - 靜音 / 呼吸停頓（RMS < 閾值）：`mouth_01.png`（閉嘴微笑）。
  - 低音量：`mouth_02.png` / `mouth_03.png`。
  - 中～高音量：`mouth_04.png` / `mouth_05.png` / `mouth_06.png`。
- 說話時隨波形動態輪替，避免單一口型卡死。

### 3. 肢體卡點切換：
- `0.0s ~ 10.0s`：「嗨！小朋友，我是米米！你看，我這裡有一條超好吃的巧克力！」$\rightarrow$ 使用 `classroom_16x9_base.png`（雙手垂下放鬆站立）。
- `10.0s ~ 15.0s`：「我們把它平分成 12 塊。我拿了其中的 3 塊……」$\rightarrow$ 切換為 `pose_point_right.png`（抬起右手指向右側黑板）。
- 切換瞬間使用 2 幀的定格淡化或直接俐落切換（符合偶動畫手動換偶特質）。

### 4. 自然眨眼（每 3.5 秒一次）：
- 在 3.5s、7.5s、11.5s 處各眨眼一次，閉眼持續 2~3 幀（眼睛中心約在 `(356, 290)` 與 `(454, 290)`，貼合 2 幀微閉眼皮）。

### 5. 輸出與驗收：
- 使用 Python 生成影格並透過本地 `ffmpeg`（或直接使用 Python `subprocess.run(["ffmpeg", ...])`）壓製為 MP4。
- 驗證輸出檔案 `reports/test_mimi_motion.mp4` 存在、長度 15.0 秒、檔案大小 > 1MB。
- 驗證成功後印出 `[GATE 1 PASS]`。
