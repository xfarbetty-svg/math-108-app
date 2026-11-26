# 20261124_006 G4 雙貓收尾（起跑 x=760 + 腳底局部 ROI）— 5 欄驗收報告

## 1. 範圍
- 在 005 成果上做單點修正：小貓起跑 x 560→**760**；在 005 已清白邊的 RGBA 幀上追加**局部 ROI** 清灰墊。
- 覆寫 `ready/loop_kitten_walk.webm/.mp4`；多米 ping-pong 母片（187 幀）**未動**。
- 重生 `Temp\opencode\g4_dual_cats_stage_preview.jpg`、`g4_dual_cats_demo_10s.mp4`。
- **未執行任何 Git**（status/add/commit/push 全無）；未碰 `017\`、子由、`D:\NAS\XX.CF995\8.下載`。

## 2. 變更
| 項 | 做法 |
|---|---|
| 起跑站位 | `WALK_X0=760`，`feet_y=855`，0–4s smoothstep 至 `x=1150`；其餘舞台參數（多米 305/845/680、sit 鏡像 1150/855、±1.5%/3s 呼吸、灰貓先多米後）沿用 005。 |
| 灰墊 ROI | sprite 座標多邊形 `[(0,396),(258,396),(258,418),(0,418)]`（映射全幀 `(415,926)-(932,970)`）；**僅 ROI 內**用局部亮度 `mn>180 & sat<18` + 1.5px 高斯羽化 → alpha 衰減。**全域閾值仍維持 005 的 >205，未下調**；ROI 右界 258 避開右前腳白趾（x≈255–315）。 |
| 腳本 | 新建 `D:\ANTIGRAVITY\036_local_painter\_scratch\20261124_006_g4_roi_start760.py`；未改 002/003/004/005。 |

## 3. 驗證指令
```
$env:PYTHONIOENCODING='utf-8'
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'D:\ANTIGRAVITY\036_local_painter\_scratch\20261124_006_g4_roi_start760.py'
& 'D:\ANTIGRAVITY\036_local_painter\.venv\Scripts\python.exe' `
  'C:\Users\PXP\AppData\Local\Temp\opencode\diag_005.py'   # t0 真實像素重疊
```

## 4. 真實 Exit Code
| 步驟 | Exit Code | 標記 |
|---|---|---|
| 006 主腳本 | **0** | `FINAL_006_OK`／`005 all gates passed` |
| t0 重疊診斷 | **0** | `t0_overlap_pixels=0` |

## 5. 證據
| 項目 | 實測 |
|---|---|
| t=0 零重疊 | 兩貓不透明像素交集 **0 px**（`-`）；目視 `verify_stage_t0.jpg` 完全分離 |
| ROI 清墊 | **779,249** 像素（94/94 幀，單幀 max 10,159）；`verify_pad_roi_before_after.png` 左＝有白墊、右＝墊體消失、白色腳趾完整；墊中心 alpha 255→5 |
| 閉環 | 小貓 **MAE=0.0000**（94 幀）；多米 ping-pong **MAE=0.0000**（187 幀，倒放逐像素相同） |
| webm | 小貓 `vp9/alpha_mode=1` 1,842,623 B；多米 2,200,535 B；四支 loop 全數 alpha_mode=1 |
| mp4 | 小貓 1,671,576 B；多米 2,364,698 B |
| preview | 1920×1080 / 848,732 B（t=6s，mirror sit 面左、呼吸微動、無白墊、無手臂重影） |
| demo | 1920×1080 / 30fps / **300 幀 / 10.000000 s** / 5,088,424 B |

**結論：三項精修全部達標，無未達標項。可收工。**
