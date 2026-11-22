# S32 概念小教室影片驗收報告（2026-11-22）

## 1. 範圍
G3 `S-3-2`「正方形和長方形」概念小教室影片 `S32_Final.mp4`：六幕黑板圖卡（S01 共同特徵＋直角記號、S02 雙欄特徵卡、S03 周長算式對比、S04 周長反推、S05 拼圖陷阱紅色虛線叉叉、S06 三步口訣）、曉臻 TTS 旁白與對嘴時間軸、彌彌兔三層光影合成、`shell.js` 掛載、四道門禁與 Cloudflare Pages 上線。全程由本機 OpenCode CLI（Hy4 Flash）主導，未呼叫 Antigravity、視覺模型或 ComfyUI。

## 2. 變更
- `docs/mimi_classroom/S32_script.json`（SSOT）：六幕教材口白與黃金參數（feet_x=305 / feet_y=845 / render_height=680 / scale_from_2048=0.33203125 / 陰影 298px / warm 4% / 高光 −2% / alpha feather 1.5 / pause 1.5s / `zh-TW-HsiaoChenNeural` `-5%`）。母片只讀 `036_local_painter/theater/assets_hosts/g3_mimi/ready/`。
- `_scratch/mimi_s32/`（已 gitignore）：`20261122_001_build_s32_cards.py`、`20261122_002_build_s32_audio.py`、`s32_render_mp4.py`、S01–S06 圖卡、timeline、成片截圖、HANDOFF.md。
- `app/assets/classroom_videos/S32_Final.mp4`（22.73 MiB）。
- `app/shell.js`：`UNIT_CONCEPT_MOVIES` / `UNIT_CONCEPT_MOVIE_TITLES` 註冊 `S-3-2`。
- `tools/verify_s32_cdp.js`：播放器雙視口（390×844 / 1280×800）CDP 實測，含 Range 206 靜態伺服器。

## 3. 驗證指令與真實 Exit Code
| 指令 | Exit Code |
|---|---|
| `python _scratch/mimi_s32/20261122_001_build_s32_cards.py` | 0（`ALL_PASS`，6/6，正規化淨空檢查全綠） |
| `python _scratch/mimi_s32/20261122_002_build_s32_audio.py` | 0（163.1760s / 6 幕） |
| `python _scratch/mimi_s32/s32_render_mp4.py`（首壓 1150k → 24.70 MiB 超標 Exit 1；降 1050k 重壓） | 0（`S32_OK`） |
| `node tools/verify_curriculum_131.js` | 0（131 條目／6 年級） |
| `node tools/verify_app_shell.js` | 0（6 年級 × 131 卡 + N-1-1 全流程，CONSOLE_NOISE_COUNT=0） |
| `node tools/verify_s32.js` | 0（10 題契約、正解真值、trap/fallback/?q=） |
| `node tools/verify_s32_cdp.js` | 0（雙視口掛載與播放器中繼資料全綠、零例外） |
| `git commit` / `git push origin main` | 0（pre-push hook 自動部署） |
| `curl.exe -sS -I https://math-108.pages.dev/app/assets/classroom_videos/S32_Final.mp4` | 0（HTTP 200 / video/mp4） |

## 4. 證據
- **影片**：4896 frames / 163.200s；1920×1080 / 30fps / H.264 + AAC；容器、影像、音訊 duration 皆 163.200s，AV 誤差 **0.000s**；大小 **22.73 MiB < 24 MiB**。首壓 1150k 得 24.70 MiB 超標已如實記錄，單點降 1050k 重壓通過（並非[FAKE-GREEN]）。
- **站姿光影**：feet=(305,845)、render_height=680、union_bbox=[121,24,570,656]、left=−40 / top=189、mouth=(299,516)、patch=133×56；接觸陰影 298px / blur 14 / rgba(35,20,10,0.42)、暖光 4%、高光 −2%、alpha feather 1.5px。六支母片各剔除 7 幀黑底異常幀。
- **視覺目視**：六張圖卡逐張目視，橘色直角記號、S05 紅色虛線叉叉與「躲在裡面不算周長」標註清楚，文字零壓線破框；成片 S02（45s）、S05（120s）目視確認雙腳穩站講桌木板、陰影自然、手勢距黑板框 ≥50.5px、無遮擋。
- **播放器 CDP**：390×844 與 1280×800 兩視口皆確認 `btnConceptMovie` 指向 `assets/classroom_videos/S32_Final.mp4`、標題「概念小教室：正方形和長方形」、零橫向溢出；直接播放 `<video>` 回傳 1920×1080 / 163.2s / Range 206，零 Runtime exception。（初版誤用 `openUnit()` 取不到電影連結，改呼叫 `openConceptLab()` 後通過，已如實記錄。）
- **上線**：`HTTP/1.1 200 OK`、`Content-Type: video/mp4`。

## 5. 結論
所有關卡皆有真實 Exit Code 0，無 [FAKE-GREEN]、無 [UNVERIFIED]；首壓超標與 CDP 入口修復均如實記錄。影片已上線並可播放，本案結案。
