# 20261123_014 — N-3-1／N-3-2／N-3-3 概念影片與 N-3-9 響度統一結案報告

## ① 範圍（Scope）
- 補齊 `N-3-9` 漏網音軌響度（原 −19.37 LUFS → −14 LUFS 系列標準）。
- 新製作 3 支 G3 概念小教室四幕影片：`N-3-1` 一萬以內的數、`N-3-2` 加減直式計算、`N-3-3` 乘以一位數。
- 全程 `full_stage` 全畫面走位、米米兔 4 組現成 3D PNG 姿勢（`pose_wave / pose_point / pose_think / pose_cheer`，嚴禁 SVG 自繪角色）、四幕暖米色無限畫布、−14 LUFS。
- 掛載「概念小教室」按鈕，抽幀自檢、全套門禁與部署上線。

## ② 變更（Changes）
| 檔案 | 變更 |
|---|---|
| `app/assets/video/g3_n39_concept_final.mp4` | 兩次 FFmpeg `loudnorm` 量測＋線性校正，`-c:v copy` 無損視訊流；−19.37 → **−14.29 LUFS**，TP −1.28 dBTP |
| `tools/classroom_engine/units/n31_numbers.py` | 新增：生活大數／位值表與零的讀寫／高位比大小＋「3 個千 15 個百＝4500」／三大口訣 |
| `tools/classroom_engine/units/n32_add_sub.py` | 新增：購物湊整找零／5319+806 進位與 2015−207 退位／3002−1458 連續退位＋加減互逆驗算／三大口訣 |
| `tools/classroom_engine/units/n33_multiply.py` | 新增：整百整十倍數／34×2、248×3 直式拆解／305×4 與 250×4 含 0 陷阱／三大口訣 |
| `app/assets/classroom_videos/N31_Final.mp4` | 新成片 101.033s / 9.01 MiB / 1920×1080 / 30fps / −14.04 LUFS |
| `app/assets/classroom_videos/N32_Final.mp4` | 新成片 97.767s / 8.49 MiB / 1920×1080 / 30fps / −14.04 LUFS |
| `app/assets/classroom_videos/N33_Final.mp4` | 新成片 97.067s / 8.35 MiB / 1920×1080 / 30fps / −14.03 LUFS |
| `app/shell.js` | `UNIT_CONCEPT_MOVIES` 與 `UNIT_CONCEPT_MOVIE_TITLES` 新增 N-3-1／N-3-2／N-3-3 映射 |
| `tools/verify_n31.js` | 單點修正陈旧期待值：Q1 選項數 2 → 4（SSOT 題庫已於前期擴充為 4 選項，守門員未同步） |

視覺防錯：首輪抽幀發現 3 處缺陷並外科手術修正後重渲染——N-3-1 合成題紅框兩行文字重疊、N-3-2 連續退位區兩組 verdict 與註記重疊、N-3-3 四位數乘積 1220 因直式函式僅 3 欄而錯位；同時把第三幕 feedback badge 由 y=235 上移至 y=205，不再壓住卡片標題。

## ③ 驗證指令（Commands）
```bat
python -m py_compile tools/classroom_engine/units/n31_numbers.py tools/classroom_engine/units/n32_add_sub.py tools/classroom_engine/units/n33_multiply.py
python -m tools.classroom_engine.units.n31_numbers
python -m tools.classroom_engine.units.n32_add_sub
python -m tools.classroom_engine.units.n33_multiply
node tools/verify_curriculum_131.js
node tools/verify_app_shell.js
node tools/verify_tts_polyphone.js
node tools/verify_n31.js
node tools/verify_n32.js
node tools/verify_n33.js
node tools/verify_n33_concept.js
git add <上列檔案> && git commit && git push origin main
```

## ④ 真實 Exit Code（Verified）
| 指令 | Exit Code |
|---|---|
| 3 支影片初版渲染 | 0 / 0 / 0 |
| 3 支影片修正後重渲染 | 0 / 0 / 0 |
| `verify_tts_polyphone.js` | 0（25 checks） |
| `verify_n32.js` | 0（N32_ALL_VERIFIED） |
| `verify_n33.js` | 0（N33_ALL_VERIFIED） |
| `verify_curriculum_131.js` | 0（131 units / 6 grades） |
| `verify_n31.js` | 0（N31_FULL_VERIFIED，10 題 CDP 全綠） |
| `verify_app_shell.js` | 0（CONSOLE_NOISE_COUNT=0） |
| `verify_n33_concept.js` | 0（N33_CONCEPT_LAB_VERIFIED） |
| loudnorm 重新封裝（4 支） | 0 |

> 首次執行 `verify_n31.js` 回傳 Exit 1（陈旧 Q1 選項期待值），已單點修正並重跑為 Exit 0，如實記錄。

## ⑤ 證據（Evidence）
- 抽幀：`_scratch/classroom_n31/keyframes/`、`_scratch/classroom_n32/keyframes/`、`_scratch/classroom_n33/keyframes/` 各 **7 張**（4 幕全覆蓋）；肉眼複檢零重疊、零裁切、米米兔未遮擋卡片文字、底部字幕黑框距視口底邊 ≥76px（中心 y=960）。
- 串流：3 支皆 1920×1080 / h264+aac / AV 誤差 ≤0.004s / 體積 8.35–9.01 MiB（<24.5 MiB 硬閘門）。
- 響度：`g3_n39 −14.29`、`N31 −14.04`、`N32 −14.04`、`N33 −14.03` LUFS，TP ≤ −1.28 dBTP，與 N34 −14.45／R32 −14.03 同系列。
- 隔離：`_scratch/` 已於 `.gitignore`；`handoff.md` 未納入本次提交。
- 部署：`git push origin main` 完成後由 Cloudflare Pages 自動部署，線上-validation 以 `https://math-108.pages.dev` 為準。
