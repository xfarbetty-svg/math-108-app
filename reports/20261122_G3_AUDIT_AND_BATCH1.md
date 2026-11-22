# 20261122 G3 全 24 單元體檢 ＋ 第一批補題上線驗收報告

## 5 欄結案摘要

| 欄位 | 內容 |
|---|---|
| 範圍 | G3 全 24 單元題庫／教具體檢；第一批 N-3-16、S-3-2、S-3-4 各補 Q06–Q10（15 題）並升級 3 教具 |
| 變更 | 三題庫 30 題補齊 trap／fallback_height 420／?q=1..10；N-3-1 元件命名修正 5 處；三教具支援 q-mode、Light/Dark 色票、移除 100vh、指針改合法 rotate(deg) |
| 驗證指令 | `node tools/verify_n316.js` / `verify_s32.js` / `verify_s34.js` / `verify_n316_cdp.js` / `verify_batch1_dualmode_cdp.js` / `verify_curriculum_131.js` / `verify_app_shell.js` / `verify_g3_remaining_concepts.js` |
| 真實 Exit Code | 全部 0（8 道指令，含 30 張雙模式截圖與 131 條目／app shell 全綠） |
| 證據 | `_scratch/g3_audit_batch1/g3_audit_all.md`、`screenshots/` 30 張、`montage_all.png`；本報告下列明細 |

## 一、全 24 單元盤 point 明細（掃描時點：補題前）

| 單元 | 課綱宣告 | JSON 宣告 | 實際 | 題數一致 | 教具檔 | id | 選項 | 答案 | 路徑 | 詳解 | fallback |
|---|---:|---:|---:|:---:|---|---:|---:|---:|---:|---:|---:|
| D-3-1 | 10 | 5 | 5 | ❌ | components/table_cross_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |
| N-3-1 | 10 | 10 | 10 | ✅ | components/ten_thousand_lab.html | 0 | 1 | 2 | 0 | 0 | 6 |
| N-3-10 | 10 | 10 | 10 | ✅ | components/decimal_place_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-11 | 10 | 10 | 10 | ✅ | components/number_line_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-12 | 10 | 10 | 10 | ✅ | components/millimeter_ruler_lab.html | 0 | 0 | 0 | 0 | 0 | 10 |
| N-3-13 | 10 | 10 | 10 | ✅ | components/angle_explorer_lab.html | 0 | 0 | 0 | 0 | 0 | 10 |
| N-3-14 | 10 | 10 | 10 | ✅ | components/area_square_lab.html | 0 | 0 | 0 | 0 | 0 | 10 |
| N-3-15 | 10 | 10 | 10 | ✅ | components/capacity_volume_lab.html | 0 | 0 | 0 | 0 | 0 | 10 |
| N-3-16 | 10 | 5 | 5 | ❌ | components/weight_concept_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |
| N-3-17 | 10 | 10 | 10 | ✅ | components/time_concept_lab.html | 0 | 0 | 0 | 0 | 10 | 10 |
| N-3-2 | 10 | 10 | 10 | ✅ | components/vertical_calc_lab.html | 0 | 0 | 0 | 0 | 0 | 8 |
| N-3-3 | 10 | 10 | 10 | ✅ | components/multiplication_lab.html | 0 | 1 | 0 | 0 | 0 | 0 |
| N-3-4 | 10 | 10 | 10 | ✅ | components/division_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-5 | 10 | 10 | 10 | ✅ | components/division_vertical_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-6 | 10 | 10 | 10 | ✅ | components/multiplication_division_relation_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-7 | 10 | 10 | 10 | ✅ | components/two_step_problem_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-8 | 10 | 10 | 10 | ✅ | components/estimation_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| N-3-9 | 10 | 10 | 10 | ✅ | components/fraction_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| R-3-1 | 10 | 5 | 5 | ❌ | components/multiplication_division_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |
| R-3-2 | 10 | 5 | 5 | ❌ | components/pattern_reasoning_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |
| S-3-1 | 10 | 10 | 10 | ✅ | components/angle_explorer_lab.html | 0 | 0 | 0 | 0 | 0 | 10 |
| S-3-2 | 10 | 5 | 5 | ❌ | components/square_rectangle_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |
| S-3-3 | 10 | 10 | 10 | ✅ | components/circle_lab.html | 0 | 0 | 0 | 0 | 0 | 0 |
| S-3-4 | 10 | 5 | 5 | ❌ | components/solid_geometry_lab.html | 0 | 0 | 0 | 0 | 5 | 5 |

> 第一批已將 N-3-16／S-3-2／S-3-4 由 5 題補到 10 題；R-3-1／R-3-2／D-3-1 仍為 5 題，列為第二棒。

## 二、全 24 單元教具掃描異常彙整表（第二棒安排用）

| 單元 | 題號 |  severe | 類別 | 說明 |
|---|---|---|---|---|
| D-3-1 | G3-D-3-1-Q01 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| D-3-1 | G3-D-3-1-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| D-3-1 | G3-D-3-1-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| D-3-1 | G3-D-3-1-Q02 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| D-3-1 | G3-D-3-1-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| D-3-1 | G3-D-3-1-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| D-3-1 | G3-D-3-1-Q03 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| D-3-1 | G3-D-3-1-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| D-3-1 | G3-D-3-1-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| D-3-1 | G3-D-3-1-Q04 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| D-3-1 | G3-D-3-1-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| D-3-1 | G3-D-3-1-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| D-3-1 | G3-D-3-1-Q05 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| D-3-1 | G3-D-3-1-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| D-3-1 | G3-D-3-1-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| D-3-1 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |
| N-3-1 | G3-N-3-1-Q01 | ERROR | 选项数 | choices 数量 2 |
| N-3-1 | G3-N-3-1-Q01 | WARN | fallback_height | 实际 430，应为 420 |
| N-3-1 | G3-N-3-1-Q02 | ERROR | 答案一致性 | choices[0]=5 ≠ answer_raw=○１ 5（千位數字 2 ＋ 百位數字 3 ＝ 5） |
| N-3-1 | G3-N-3-1-Q03 | WARN | fallback_height | 实际 400，应为 420 |
| N-3-1 | G3-N-3-1-Q05 | ERROR | 答案一致性 | choices[0]=(1) 4368 比較小；(2) 6100 最大 ≠ answer_raw=(1) 圈 4368；(2) 圈 6100 |
| N-3-1 | G3-N-3-1-Q05 | WARN | fallback_height | 实际 430，应为 420 |
| N-3-1 | G3-N-3-1-Q07 | WARN | fallback_height | 实际 410，应为 420 |
| N-3-1 | G3-N-3-1-Q08 | WARN | fallback_height | 实际 400，应为 420 |
| N-3-1 | G3-N-3-1-Q10 | WARN | fallback_height | 实际 430，应为 420 |
| N-3-12 | G3-N-3-12-Q01 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q02 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q03 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q04 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q05 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q06 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q07 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q08 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q09 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-12 | G3-N-3-12-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q01 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q02 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q03 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q04 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q05 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q06 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q07 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q08 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q09 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-13 | G3-N-3-13-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q01 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q02 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q03 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q04 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q05 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q06 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q07 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q08 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q09 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-14 | G3-N-3-14-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q01 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q02 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q03 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q04 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q05 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q06 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q07 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q08 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q09 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-15 | G3-N-3-15-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-16 | G3-N-3-16-Q01 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| N-3-16 | G3-N-3-16-Q01 | ERROR | SVG 旋转 | style.transform 使用非法 rotate(deg,x,y) 且未设 transform-box: view-box |
| N-3-16 | G3-N-3-16-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-16 | G3-N-3-16-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-16 | G3-N-3-16-Q02 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| N-3-16 | G3-N-3-16-Q02 | ERROR | SVG 旋转 | style.transform 使用非法 rotate(deg,x,y) 且未设 transform-box: view-box |
| N-3-16 | G3-N-3-16-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-16 | G3-N-3-16-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-16 | G3-N-3-16-Q03 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| N-3-16 | G3-N-3-16-Q03 | ERROR | SVG 旋转 | style.transform 使用非法 rotate(deg,x,y) 且未设 transform-box: view-box |
| N-3-16 | G3-N-3-16-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-16 | G3-N-3-16-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-16 | G3-N-3-16-Q04 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| N-3-16 | G3-N-3-16-Q04 | ERROR | SVG 旋转 | style.transform 使用非法 rotate(deg,x,y) 且未设 transform-box: view-box |
| N-3-16 | G3-N-3-16-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-16 | G3-N-3-16-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-16 | G3-N-3-16-Q05 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| N-3-16 | G3-N-3-16-Q05 | ERROR | SVG 旋转 | style.transform 使用非法 rotate(deg,x,y) 且未设 transform-box: view-box |
| N-3-16 | G3-N-3-16-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-16 | G3-N-3-16-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-16 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |
| N-3-17 | G3-N-3-17-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q06 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q06 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q07 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q07 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q08 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q08 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q09 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q09 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-17 | G3-N-3-17-Q10 | WARN | 详解栏位 | 缺 concept / steps / trap |
| N-3-17 | G3-N-3-17-Q10 | WARN | fallback_height | 实际 undefined，应为 420 |
| N-3-2 | G3-N-3-2-Q01 | WARN | fallback_height | 实际 390，应为 420 |
| N-3-2 | G3-N-3-2-Q02 | WARN | fallback_height | 实际 400，应为 420 |
| N-3-2 | G3-N-3-2-Q03 | WARN | fallback_height | 实际 410，应为 420 |
| N-3-2 | G3-N-3-2-Q05 | WARN | fallback_height | 实际 390，应为 420 |
| N-3-2 | G3-N-3-2-Q06 | WARN | fallback_height | 实际 410，应为 420 |
| N-3-2 | G3-N-3-2-Q07 | WARN | fallback_height | 实际 430，应为 420 |
| N-3-2 | G3-N-3-2-Q09 | WARN | fallback_height | 实际 400，应为 420 |
| N-3-2 | G3-N-3-2-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| N-3-3 | G3-N-3-3-Q09 | ERROR | 选项数 | choices 数量 3 |
| R-3-1 | G3-R-3-1-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-1 | G3-R-3-1-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-1 | G3-R-3-1-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-1 | G3-R-3-1-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-1 | G3-R-3-1-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-1 | G3-R-3-1-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-1 | G3-R-3-1-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-1 | G3-R-3-1-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-1 | G3-R-3-1-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-1 | G3-R-3-1-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-1 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |
| R-3-2 | G3-R-3-2-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-2 | G3-R-3-2-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-2 | G3-R-3-2-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-2 | G3-R-3-2-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-2 | G3-R-3-2-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-2 | G3-R-3-2-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-2 | G3-R-3-2-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-2 | G3-R-3-2-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-2 | G3-R-3-2-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| R-3-2 | G3-R-3-2-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| R-3-2 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |
| S-3-1 | G3-S-3-1-Q01 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q02 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q03 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q04 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q05 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q06 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q07 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q08 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q09 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-1 | G3-S-3-1-Q10 | WARN | fallback_height | 实际 380，应为 420 |
| S-3-2 | G3-S-3-2-Q01 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| S-3-2 | G3-S-3-2-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-2 | G3-S-3-2-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-2 | G3-S-3-2-Q02 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| S-3-2 | G3-S-3-2-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-2 | G3-S-3-2-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-2 | G3-S-3-2-Q03 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| S-3-2 | G3-S-3-2-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-2 | G3-S-3-2-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-2 | G3-S-3-2-Q04 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| S-3-2 | G3-S-3-2-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-2 | G3-S-3-2-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-2 | G3-S-3-2-Q05 | WARN | 100vh | 存在 height:100vh（建议由外壳控制视口） |
| S-3-2 | G3-S-3-2-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-2 | G3-S-3-2-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-2 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |
| S-3-4 | G3-S-3-4-Q01 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-4 | G3-S-3-4-Q01 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-4 | G3-S-3-4-Q02 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-4 | G3-S-3-4-Q02 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-4 | G3-S-3-4-Q03 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-4 | G3-S-3-4-Q03 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-4 | G3-S-3-4-Q04 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-4 | G3-S-3-4-Q04 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-4 | G3-S-3-4-Q05 | WARN | 详解栏位 | 缺 concept / steps / trap |
| S-3-4 | G3-S-3-4-Q05 | WARN | fallback_height | 实际 undefined，应为 420 |
| S-3-4 | - | ERROR | 题数 | JSON question_count=5，题目=5，课纲宣告=10 |

## 三、第二批優先建議

1. R-3-1 / R-3-2 / D-3-1：各補 Q06–Q10（課綱宣告 10 題、實際 5 題）。
2. N-3-1：Q01 choices 僅 2 項；Q02／Q05 answer_raw 與 choices[answer_index] 不一致。
3. N-3-3：Q09 choices 僅 3 項。
4. 其餘單元的 trap／fallback_height 缺漏與 100vh 歡迎一併納入第二棒清洗。

## 四、雙模式目視與門禁

- CDP 390×844：N-3-16／S-3-2／S-3-4 × Q06–Q10 × Light/Dark 共 30 張截圖，主容器皆 420px、零橫向溢出、題號徽章與深色底色皆生效、0 console error。
- 拼圖：`_scratch/g3_audit_batch1/montage_all.png`（3 列单元 × 2 栏主题，每格 Q06–Q10）。
- 指針：`rotate(deg)` + `transform-box: view-box`，n316 CDP 實測 `rotate(270deg)`。
- 未呼叫 Antigravity；全程本機 OpenCode CLI 施工。
