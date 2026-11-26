# 20261124_005 G4 雙貓最終精修 — 5 欄驗收報告

## 1. 範圍
- 唯讀：`raw_flow/loop_domi_point.mp4`、`raw_flow/loop_kitten_walk.mp4`、004 已修額頭的 `SCRATCH/loop_kitten_walk/alpha/*.png`。
- 覆寫：`ready/loop_domi_point.webm/.mp4`、`ready/loop_kitten_walk.webm/.mp4`。
- 重生：`Temp\opencode\g4_dual_cats_stage_preview.jpg`、`g4_dual_cats_demo_10s.mp4`。
- **嚴禁項全部遵守**：未執行任何 Git（status/add/commit/push 全無）；未碰 `017\`、子由；未修改 `D:\NAS\XX.CF995\8.下載` 任何原始檔。

## 2. 變更
| 項 | 做法 |
|---|---|
| 多米 ping-pong | 從原始 94 幀重跑 `cutout()`（**不使用**已烘焙 8 幀交叉溶解的 alpha 幀），序列改 `[0..93, 92..1, 0]` 共 **187 幀**；倒放幀與正放幀逐位元組相同，零混合、零半透明鬼影。 |
| 小貓白墊 | 在 004 額頭已修的 94 張 RGBA 幀上，逐幀取主體 bbox **底部 12%**，凡 `R,G,B>205 且 max−min<18` → alpha=0，再以 `alpha × (1 − Gaussian(pad, σ=1.5))` 羽化；重算 bbox 並重生 sprite/alpha/white 幀。 |
| 舞台 | 多米 `(305,845)`/680px；小貓 walk `x:560→1150, y=855`（0–4s，smoothstep）；小貓 sit 鏡像面左 `(1150,855)`（4–10s），以腳底為錨點做 `1±0.015·sin(2π(t−4)/3)` 垂直呼吸縮放；圖層「灰貓先、多米後」。 |
| 腳本 | 新建 `D:\ANTIGRAVITY\036_local_painter\_scratch\20261124_005_g4_final_refine.py`（未改 002/003/004）。 |

## 3. 驗證指令
```
$env:PYTHONIOENCODING='utf-8'
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'D:\ANTIGRAVITY\036_local_painter\_scratch\20261124_005_g4_final_refine.py'
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'C:\Users\PXP\AppData\Local\Temp\opencode\diag_005.py'   # t0 重疊＋亮度分布
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'C:\Users\PXP\AppData\Local\Temp\opencode\diag_005b.py'  # 004 vs 005 公平對照
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'C:\Users\PXP\AppData\Local\Temp\opencode\diag_005d.py'  # 白墊閾值對照
```

## 4. 真實 Exit Code
| 步驟 | Exit Code | 標記 |
|---|---|---|
| 005 主腳本首跑 | **1** | `SyntaxError: unicodeescape`（docstring 內 `D:\NAS` 的 `\N`）→ 改 raw docstring 自癒 |
| 005 主腳本重跑 | **0** | `FINAL_REFINE_OK`／`005 all gates passed` |
| diag_005 / 005b / 005c / 005d | 全 **0** | 診斷完成 |

## 5. 證據
| 項目 | 實測 |
|---|---|
| `loop_domi_point` | ping-pong **187 幀**；倒放逐像素相同（無溶解）；閉環 **MAE=0.0000**；webm `vp9/alpha_mode=1` 2,200,535 B；mp4 2,364,698 B；bbox (448,78)-(1332,1039)；sprite 625×680 |
| `loop_kitten_walk` | **94 幀**；閉環 **MAE=0.0000**；清除 **984,762** 個白墊像素（94/94 幀，單幀max 17,349）；webm `vp9/alpha_mode=1` 1,845,010 B；mp4 1,673,699 B；bbox (415,133)-(1232,993)；sprite 408×430 |
| demo mp4 | 1920×1080 / 30fps / **300 幀 / 10.000000 s** / 5,109,592 B |
| preview jpg | 1920×1080 / 848,732 B |
| 視覺 | `verify_stage_t0.jpg`、`verify_stage_t2.jpg`、`g4_dual_cats_stage_preview.jpg`、`verify_pad_fair_compare.png`、`verify_pad_thresholds.png` |

## ⚠ 待裁決（如實回報，未擅自改規格常數）

**A. t=0 站位「完全不重疊」未達標**
- 按指定 `feet_x=560` 實作，實測兩貓不透明像素重疊 **20,600 px**，重疊包圍盒 `(368,443)-(560,834)`（多米尾巴／右臂壓住小貓後腿）。bbox 層面水平交集 261px（多米 `[-7.5,617.5]`、小貓 `[356,764]`）。
- 最小零重疊起點為 **x≈760**（ diagnosed：`verify_stage_t0_nudge760.jpg` 目視完全分離）。
- 我**保留你指定的 560**，未私自改動；如要達成「完全不重疊」，回一句「改 760」我即單點修正並重生驗收檔。

**B. 白墊本體（灰色平坦區）仍在**
- 指定的 `RGB>205 & sat<18` 只削掉白墊最亮的白邊（frame0：6,659→1,430 px），墊體實測 **RGB≈184–188**，低於閾值故未清除。
- 已實測降閾值至 ≤190 會**啃掉右前腳白色腳趾**（`verify_pad_thresholds.png` 可見破洞），與「保留真實腳掌輪廓」衝突，故不降。
- 若要清掉灰色墊體，需改用 004 交接建議的**手工 polygon ROI／局部紋理方差**（僅限腿間平坦區，不碰腳趾），屬另一項施工，未在大綱授權內。
