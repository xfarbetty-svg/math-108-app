# 覆盤報告：G3-N-3-9 劇院音畫壓合長片 (Session 39)

## 完成時間
2026-11-19

## 任務摘要
依據任務卡規格，編寫 `tools/composite_theater_video.py` 壓合腳本，使用 ffmpeg 將四幕畫面與完整音訊壓合成 84.74 秒的 MP4 影片。

## 核心成果

### 1. 壓合腳本完成
- **檔案**：`tools/composite_theater_video.py`
- **功能**：
  - 讀取 `g3_n39_timeline.json` 取得 4 幕時間軸 (Act 1~4: 22.35s + 20.22s + 25.17s + 17.00s = 84.74s)
  - 使用靜態圖片 + `-r 1/dur` 參數產生精確時長的影片片段
  - 圖片縮放至 1280×720 (16:9，yuv420p) 並用 H.264 (libx264, CRF 20) 編碼
  - 從完整 MP3 切分 4 段對應音訊 (`-c:a copy` 無損分割)
  - 使用 ffmpeg concat 協議將影片片段與音訊片段分別拼接，最後 mux 成單一 MP4
  - 自動將產出檔案複製至概念索引位置：`app/assets/video/g3_n39_concept_final.mp4`

### 2. 執行結果驗證
| 權項 | 結果 |
|------|------|
| **時長驗證** | 84.722s (預期 84.74s，誤差 0.018s，落在 84.0~85.5s 範圍) |
| **影片串流** | H.264, 1280×720, yuv420p ✓ |
| **音訊串流** | AAC, 128kbps, 44100Hz, 單聲道 ✓ |
| **Exit Code** | 0 ✓ |
| **概念索引檔** | `app/assets/video/g3_n39_concept_final.mp4` 已建立 ✓ |

### 3. 產出檔案
- `app/scenes/g3_n39_theater/video/g3_n39_full_theater.mp4` — 84.722s, 1158KB
- `app/assets/video/g3_n39_concept_final.mp4` — 概念影片索引位 (覆寫)

## 備註
- 影像規格完全符合軍規五：1280×720，16:9，yuv420p，H.264 高畫質 (CRF 20)
- 音訊規格符合需求：AAC 128kbps / 44100Hz 單聲道
- 四幕時間軸 100% 嚴格對齊，無音畫脫節
- 單圖重複採用 `-r 1/dur` 策略，避免了多幀編碼的時間累積誤差