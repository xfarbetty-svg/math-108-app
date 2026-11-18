# 任務卡：G3-N-3-9 分數情境劇院全幕音畫壓合長片 (MP4)

<!-- STATUS: APPROVED_FOR_DISPATCH -->
<!-- DISPATCH_TARGET: Channel 1 (OpenCode CLI) -->

> **單元編號**：108 課綱 `G3-N-3-9`（簡單同分母分數：12 塊巧克力平分情境）  
> **核心目標**：將已驗證通過的一體化教室四幕（Act 1 ~ Act 4）畫面與曉臻自然女聲完整音訊，壓製為單一完整的標準教學長片（MP4）。  
> **工兵單位**：通道一 OpenCode CLI（P0: deepseek-v4.1-flash-free / P1: nemotron-3.5-lightning-free）

---

## 1. 核心輸入資產 (SSOT)

1. **時間軸與台詞設定**：
   - `app/scenes/g3_n39_theater/audio/g3_n39_timeline.json`
   - Act 1: 時長 22.35s (0.00 ~ 22.35s)
   - Act 2: 時長 20.22s (22.35 ~ 42.57s)
   - Act 3: 時長 25.17s (42.57 ~ 67.74s)
   - Act 4: 時長 17.00s (67.74 ~ 84.74s)
   - 總片長：84.74 秒
2. **視覺畫面截圖**（已由通道三 4/4 審查通過）：
   - `reports/screenshots/theater_act1.png`
   - `reports/screenshots/theater_act2.png`
   - `reports/screenshots/theater_act3.png`
   - `reports/screenshots/theater_act4.png`
3. **完整自然女聲音訊**：
   - `app/scenes/g3_n39_theater/audio/g3_n39_hsiaochen.mp3`（或分幕音訊 `act1.mp3` ~ `act4.mp3`）

---

## 2. 施工要求與產出規格

1. **編寫自動壓合工具腳本**：`tools/composite_theater_video.py`
   - 支援讀取 `g3_n39_timeline.json` 自動計算各幕時長。
   - 使用系統已安裝的 `ffmpeg` 將四幕畫面依序對齊時間軸，並合流音訊。
   - 影像規格：1280x720 或 1536x864（保持 16:9，yuv420p，H.264 編碼，CRF 18~22 高畫質）。
   - 音訊規格：AAC 128kbps / 44100Hz 或 24000Hz 立體聲/單聲道。
   - 支援轉場或精確時間切換，時間軸與音訊必須 100% 嚴格對齊，無音畫脫節。
2. **目標產出檔案**：
   - 劇院專用長片：`app/scenes/g3_n39_theater/video/g3_n39_full_theater.mp4`
   - 全站概念影片索引位：`app/assets/video/g3_n39_concept_final.mp4`（若不存在則建立目錄並拷貝）
3. **驗證與防錯守門**：
   - 腳本執行必須以真實 Exit Code 0 結束。
   - 執行 `ffprobe` 檢驗產出的 MP4：
     - 時長必須落在 84.0s ~ 85.5s（與 84.74s 對齊）。
     - 影片串流與音訊串流均正常存在，無損毀。
