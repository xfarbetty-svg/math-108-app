# 2026-11-23 R-3-1 概念小教室影片 + S-3-4 透視盒／破音字根治 五欄結案驗收

| 欄位 | 內容 |
|---|---|
| **範圍** | ① 新製 G3 R-3-1《乘法與除法的關係》概念小教室影片（4 幕、13 cues）並掛載 `app/shell.js`；② S-3-4 第 2 幕透明壓克力透視盒、米米走位 x=240、圓錐圖示上移 10px；③ 「量」破音字動詞 liáng → 二聲「涼」全链路根治；④ 步數上限 50 設定（全域＋專案）。未碰 `017\`、未碰「子由」，`_scratch/` 與 `handoff.md` 隔離。 |
| **變更** | 新增 `tools/classroom_engine/units/r31_mul_div.py`、`opencode.json`；重渲染 `app/assets/classroom_videos/R31_Final.mp4`（109.967s / 9.40 MiB / 1920×1080 / 30fps / AV diff 0.015s）與 `S34_Final.mp4`（106.133s / 9.50 MiB / AV diff 0.000s）；修改 `app/shell.js`（映射＋標題）、`app/js/audio_manager.js`、`tools/classroom_engine/tts_pipeline.py`、`tools/verify_tts_polyphone.js`、`tools/classroom_engine/units/s34_geometry.py`；新增本報告與 `20261123_012_TTS_LIANG_CONVERSION_TABLE.md`。 |
| **驗證指令** | `python -m tools.classroom_engine.units.s34_geometry` → Exit 0（重渲染 2 次，第二次修正第 3 cue 遮擋）；`python -m tools.classroom_engine.units.r31_mul_div` → Exit 0（重渲染 3 次，最終移除陣列標籤疊字）；`node tools/verify_curriculum_131.js`；`node tools/verify_app_shell.js`；`node tools/verify_tts_polyphone.js`；`node tools/verify_r31.js`；`node tools/verify_s34.js`；`ffprobe` 雙片串流檢查；ffmpeg 抽幀目視。 |
| **真實 Exit Code** | S34 最終渲染 **0**；R31 最終渲染 **0**；`curriculum_131` **0**；`app_shell` **0**（CONSOLE_NOISE_COUNT=0）；`tts_polyphone` **0**（25/25 PASS）；`verify_r31` **0**；`verify_s34` **0**；全集 `GATES_EXIT=0`。 |
| **證據** | R31 關鍵影格：`_scratch/classroom_r31/keyframes/01..06.png` — ① 12 顆蘋果 3 盤每盤 4 顆；② 3×4 陣列精準 12 顆零重疊、焦點框依序框住 `4×3=12`、`12÷4=3`、`12÷3=4`；③ `24÷6=4 → 6×4=24 ✓ / 20 ✗` 與 `23÷6=3餘5 → 3×6+5=23 ✓`、方框逆推 `□×5=35→7`、`36÷□=9→4`；④ 三大口訣垂直分欄＋米米 `pose_cheer`。字幕中心 y=960，距底 76px 無裁切。S34 關鍵影格：`_scratch/classroom_s34/keyframes/extra_cube.png`、`extra_rolling_final.png` — 正面 `fill-opacity=0.25`、背面 3 條虛線與第 8 頂點空心虛線點透出；米米 x=240 未遮左卡膠囊；圓錐標籤不再壓底邊弧線。TTS 對照表見 `reports/20261123_012_TTS_LIANG_CONVERSION_TABLE.md`。 |

## 線上網址（部署後）
- R31: https://math-108.pages.dev/app/assets/classroom_videos/R31_Final.mp4
- S34: https://math-108.pages.dev/app/assets/classroom_videos/S34_Final.mp4

## 自癒紀錄（如實記載）
1. S34 首輪渲染後抽幀發現第 2 幕第 3 cue 米米仍在 x=580 遮擋左卡 → 改 x=240 重渲染，Exit 0。
2. R31 首輪抽幀發現陣列「第 N 排：4 顆」標籤壓到圓點 → 移除標籤重渲染，Exit 0。
3. PowerShell `chcp 65001 >nul` 在終端產生非阻擋的 `out-file` 編碼警告；所有 Python／Node 程序以 UTF-8 正常讀寫，exit code 不受影響。
