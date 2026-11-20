# N34 step 4 交接：LivePortrait 嘴唇循環 + Audio-Driven Gate

> 狀態：`mimi_talking_loop.mp4` 與 `preview_lipsync.mp4` **尚未產出**（步數上限中斷）。
> 本檔保存已查證的節點 schema 與設計，下一個對話框可直接施工，不必重查。

## 已查證環境（Exit 0）
- ComfyUI `http://127.0.0.1:8188` 線上，1071 個節點。
- `LivePortraitProcess` / `DownloadAndLoadLivePortraitModels` / `LivePortraitCropper` /
  `LivePortraitLoadCropper` / `LivePortraitRetargeting` / `LivePortraitComposite` 均已註冊。
- 本機**沒有**音訊驅動唇形模型（MuseTalk / Wav2Lip / SadTalker 都不存在），
  因此採用「影片驱动嘴唇循環 + WAV RMS gate」方案，不安裝新模型。
- 模型檔：`D:\ANTIGRAVITY\036_local_painter\ComfyUI\models\liveportrait\`（齐全）。
- 驅動影片：`...\ComfyUI-LivePortraitKJ\assets\examples\driving\d0.mp4`（3.12s，建議用 25fps 輸出 → 3.12 秒循環）。
- ComfyUI 輸入資料夾：`D:\ANTIGRAVITY\036_local_painter\ComfyUI\input`；
  **`mimi_apose_closed.png` 不在其中，需先複製進去**（純檔案複製，非重繪）。
- 既有成功案例：`reports\task_b_liveportrait\mimi_liveportrait_test.mp4`（1024×1024 / 25fps / 3.12s），
  代表米米立繪可被 LivePortrait 人臉偵測處理。

## 關鍵節點參數（已由 /object_info 驗證）
- `LivePortraitLoadCropper`: `onnx_device="CPU"`, `keep_model_loaded=true`, `detection_threshold=0.5`
- `LivePortraitCropper`: `dsize=512`, `scale=2.3`, `vx_ratio=0`, `vy_ratio=-0.125`,
  `face_index=0`, `face_index_order="large-small"`, `rotate=true`
- `LivePortraitRetargeting`: `eye_retargeting=false`, `eyes_retargeting_multiplier=1.0`,
  `lip_retargeting=true`, `lip_retargeting_multiplier=1.0`
- `LivePortraitProcess`: `lip_zero=false`, `lip_zero_threshold=0.03`, `stitching=true`,
  `delta_multiplier=1.0`, `mismatch_method="cycle"`, `relative_motion_mode="relative"`,
  `driving_smooth_observation_variance=0.000003`, `opt_retargeting_info=<retargeting>`
  - **重要**：原始碼 `live_portrait_pipeline.py:243` 顯示，只要 `relative_motion_mode != "off"`
    且启用 retargeting，就會用 `x_s + eyes_delta + lip_delta`，即「鎖頭鎖眼、只動嘴唇」。
    因此請用 `"relative"`；用 `"off"` 反而會讓頭部跟著驅動影片動。
- `LivePortraitComposite`: 把 512 Crop 的結果貼回原始 source 尺寸。
- `CreateVideo`: `fps=25`；`SaveVideo`: `format="mp4"`, `codec="h264"`,
  `filename_prefix="mimi_n34/mimi_talking_loop"`。

## ComfyUI API 工作流（直接照此建立 prompt）
```
1 DownloadAndLoadLivePortraitModels {precision:"fp16", mode:"human"} -> pipe
2 LivePortraitLoadCropper {onnx_device:"CPU", keep_model_loaded:true} -> cropper
3 LoadImage {image:"mimi_apose_closed.png"} -> IMAGE, MASK
4 LivePortraitCropper {pipeline:1, cropper:2, source_image:3, ...} -> src_crop, crop_info
5 LoadVideo {file:"d0.mp4"} -> VIDEO
6 GetVideoComponents {video:5} -> IMAGE(全部幀), AUDIO, ...
7 LivePortraitCropper {pipeline:1, cropper:2, source_image:6, ...} -> drv_crop, drv_crop_info
8 LivePortraitRetargeting {driving_crop_info:7[1], eye_retargeting:false, lip_retargeting:true} -> RETARGETINGINFO
9 LivePortraitProcess {pipeline:1, crop_info:4[1], source_image:4[0], driving_images:7[0],
                       relative_motion_mode:"relative", opt_retargeting_info:8, ...} -> IMAGE, LP_OUT
10 LivePortraitComposite {source_image:3[0], cropped_image:9[0], liveportrait_out:9[1]} -> full_images
11 CreateVideo {images:10[0], fps:25} -> VIDEO
12 SaveVideo {video:11[0], filename_prefix:"mimi_n34/mimi_talking_loop", format:"mp4", codec:"h264"}
```
提交 `POST /prompt`，輪詢 `GET /history/{prompt_id}`，輸出影片通常在
`ComfyUI/output/mimi_n34/mimi_talking_loop*.mp4`，再複製到
`_scratch/mimi_n34/mimi_talking_loop.mp4`。

## Audio-Driven Gate（純 Python/ffmpeg，不需 ML）
1. 由 `_scratch/mimi_n34/timeline.json` 取得六段 `start_seconds / duration_seconds`。
2. 用 `ffmpeg -i <wav> -f f32le -ac 1 -ar 24000 -` 解出 PCM，frame size = `24000/30 = 800` samples。
3. 每 30fps frame 算 RMS；`rms > RMS_THR`（建議 0.01，可先掃描分位數）→ speaking。
4. 作 0.15s（=5 frames）滞回：連續靜音 >5 frames 才切回閉嘴；避免抖動。
5. speaking frame → 取 `mimi_talking_loop.mp4` 對應 frame（循環取模）；
   silent frame → 取 `mimi_apose_closed.png`。
6. 如需貼到場景去背立繪：先比對 `nobg/<pose>.png` 與 closed source 尺寸；
   以 `|loop_frame - closed| > 8` 產生嘴唇變化 mask（膨脹 + feather）只貼嘴部 ROI，
   其餘保留場景 pose。此步驟屬數位影像處理，禁止呼叫視覺模型或重繪。
7. 串接六段音訊（ffmpeg concat 或 numpy 寫 wav），以
   `ffmpeg -framerate 30 -i frame_%06d.png -i narration_all.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest ...`
   輸出 `_scratch/mimi_n34/preview_lipsync.mp4`。

## 验收與後續
- 必須先讓使用者驗收 `preview_lipsync.mp4` 的嘴型自然度與 RMS gate 節奏，
  **通過後才可**開始第二階段 OpenCV 黑板教具繪製與 `N34_Final.mp4` 合成。
- 全程禁止：`visual_model_called=true`、`comfyui_redraw_called=true`、底部透明漸層。
