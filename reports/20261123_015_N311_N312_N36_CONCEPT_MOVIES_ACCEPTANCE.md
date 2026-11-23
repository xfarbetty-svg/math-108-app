# 20261123_015 — N-3-2 深色模式對比度修復 ＋ N-3-11／N-3-12／N-3-6 概念影片（第 2/3 批）結案報告

## ① 範圍（Scope）
- 修復 `N-3-2` 真題測驗（`vertical_calc_lab.html?q=1`，5319＋806）深色模式對比度 Bug：題幹、位值標頭、直式數字、算理按鈕文字在 Dark 下改高對比亮色。
- 新製作 3 支 G3 概念小教室四幕影片：`N-3-11` 整數數線、`N-3-12` 長度（毫米）、`N-3-6` 乘除應用解題。
- 全程 `full_stage` 全畫面走位、米米兔 4 組現成 3D PNG 姿勢（wave/point/think/cheer，嚴禁 SVG 自繪角色）、四幕暖米色無限畫布、−14 LUFS。
- 掛載「概念小教室」按鈕、抽幀自檢、全套門禁、部署上線。

## ② 變更（Changes）
| 檔案 | 變更 |
|---|---|
| `app/components/vertical_calc_lab.html` | 外科手術：4 個位值標頭改 `.place-label` class；新增 `<style id="n32-dark-contrast">`，Dark 下 `--text-dark:#f1f5f9`、位值標頭 `#e2e8f0`、直式數字/運算元/橫線亮色、opt-btn 亮字深底、按鈕白字保持 |
| `tools/classroom_engine/units/n311_number_line.py` | 新增：溫度計/尺規情境、三要素與每格 1/10/100 跳數、200→300 平分 5 格「間隔÷格數＝20」＋兩點距離 31−24＝7 雙陷阱、三大口訣 |
| `tools/classroom_engine/units/n312_millimeter.py` | 新增：硬幣/螞蟻/0.5mm 筆芯情境、放大直尺 1cm=10mm 與複名數換算、未從 0 量起「54−20＝34mm」陷阱、三大口訣 |
| `tools/classroom_engine/units/n36_mul_div_word.py` | 新增：分裝/倍數購物情境、線段圖(16×7=112)與分組圖(96÷8=12)、餘數進一法(26÷4=6…2→7頂)vs 去尾法(300÷85=3…45→3盒)雙陷阱、三大口訣 |
| `app/assets/classroom_videos/N311_Final.mp4` | 新成片 95.800s / 8.32 MiB / 1920×1080 / 30fps / −14.1 LUFS |
| `app/assets/classroom_videos/N312_Final.mp4` | 新成片 84.200s / 7.38 MiB / 1920×1080 / 30fps / −14.0 LUFS |
| `app/assets/classroom_videos/N36_Final.mp4` | 新成片 99.300s / 8.70 MiB / 1920×1080 / 30fps / −14.1 LUFS |
| `app/shell.js` | `UNIT_CONCEPT_MOVIES`／`UNIT_CONCEPT_MOVIE_TITLES` 新增 N-3-6／N-3-11／N-3-12 共 6 行映射 |

視覺防錯：渲染前先修正 3 支腳本中 7 處卡片水平重疊與 1 處卡片落入字幕安全區（N36 keywords y=900→800）；渲染後抽幀目檢 21 張關鍵影格，發現 N36 `07_act4_summary` 抽幀索引落在第 3 幕（cue:10），已從既有 MP4 補抽 cue:11（88.06s）並同步修正腳本。米米兔未遮擋卡片文字、零疊字、零裁切、字幕黑框距底 ≥76px（中心 y=960）。

響度：render_video.py 之單次 dynamic loudnorm 實測為 −13.0 LUFS（偏離 −14 約 1 dB），已於封裝後以 `volume −1.0/−1.0/−1.1 dB`＋`-c:v copy` 無損視訊線性校正至 −14.1／−14.0／−14.1 LUFS。

## ③ 驗證指令（Commands）
```bat
python -m py_compile tools/classroom_engine/units/n311_number_line.py tools/classroom_engine/units/n312_millimeter.py tools/classroom_engine/units/n36_mul_div_word.py
python -m tools.classroom_engine.units.n311_number_line
python -m tools.classroom_engine.units.n312_millimeter
python -m tools.classroom_engine.units.n36_mul_div_word
node tools/verify_curriculum_131.js
node tools/verify_app_shell.js
node tools/verify_tts_polyphone.js
node tools/verify_n32.js
node tools/verify_n311.js
node tools/verify_n312.js
node tools/verify_n36.js
git add <上列檔案> && git commit && git push origin main
```

## ④ 真實 Exit Code（Verified）
| 指令 | Exit Code |
|---|---|
| 3 支影片渲染（n311／n312／n36） | 0 / 0 / 0 |
| `python -m py_compile` 3 支 | 0 |
| `verify_curriculum_131.js` | 0（131 units / 6 grades） |
| `verify_app_shell.js` | 0（APP_SHELL_CDP_VERIFIED，CONSOLE_NOISE_COUNT=0） |
| `verify_tts_polyphone.js` | 0（25 checks） |
| `verify_n32.js` | 0（N32_ALL_VERIFIED） |
| `verify_n311.js` | 0（10 題數學真值全綠） |
| `verify_n312.js` | 0（10 題數學真值全綠） |
| `verify_n36.js` | 0（N36_ALL_VERIFIED） |
| 響度線性校正（3 支） | 0 / 0 / 0 |
| 串流複檢（解析度/AV/體積） | 0（STREAM_ALL_OK） |

> 本次無失敗重試；所有門禁一次性 Exit 0。

## ⑤ 證據（Evidence）
- 抽幀：`_scratch/classroom_n311/keyframes/`、`_scratch/classroom_n312/keyframes/`、`_scratch/classroom_n36/keyframes/` 各 **7 張**（4 幕全覆蓋）；contact sheet 目檢零重疊、零裁切、米米兔未遮擋卡片文字、字幕黑框距視口底邊 ≥76px（中心 y=960）。
- 串流：3 支皆 1920×1080 / h264+aac / AV 誤差 ≤0.007s / 體積 7.38–8.70 MiB（<24.5 MiB 硬閘門）。
- 響度：ebur128 實測 N311 −14.1、N312 −14.0、N36 −14.1 LUFS，與 N31/N32/N33 −14.x、N34 −14.45、R32 −14.03 同系列。
- 隔離：`_scratch/` 已於 `.gitignore`；`handoff.md` 未納入本次提交。
- 部署：`git push origin main` 完成後由 Pre-Push Hook / Cloudflare Pages 自動部署，線上以 `https://math-108.pages.dev` 為準。
