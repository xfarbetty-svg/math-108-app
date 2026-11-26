# 20261124 貓咪原圖去背與雙軌入庫對照表

| 原檔名 | 新檔名 | 角色 | 動作 | 去背後 bbox (原圖座標) | 留白比例 | 母片 | App 精靈圖 |
|---|---|---|---|---|---|---|---|
| `Gemini_Generated_Image_7tsbrp7tsbrp7tsb (2).jpg` | `domi_wave.png` | 多米橘貓 | 風鏡藍裝・雙手高舉揮手 | (126,208)-(1677,2237) 1551×2029 | 26.8% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\domi_wave.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\domi_wave.png` |
| `Gemini_Generated_Image_7tsbrp7tsbrp7tsb (1).jpg` | `domi_thumb.png` | 多米橘貓 | 風鏡藍裝・豎大拇指 | (364,186)-(1634,2237) 1270×2051 | 39.4% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\domi_thumb.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\domi_thumb.png` |
| `Gemini_Generated_Image_7tsbrp7tsbrp7tsb.jpg` | `domi_point.png` | 多米橘貓 | 風鏡藍裝・單手指向前方 | (364,208)-(1654,2238) 1290×2030 | 39.1% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\domi_point.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\domi_point.png` |
| `Gemini_Generated_Image_lv7ne7lv7ne7lv7n (2).jpg` | `kitten_walk.png` | 銀灰短毛貓 | 黃領巾・行走側身 | (99,303)-(1771,2169) 1672×1866 | 27.5% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\kitten_walk.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\kitten_walk.png` |
| `Gemini_Generated_Image_lv7ne7lv7ne7lv7n (1).jpg` | `kitten_sit.png` | 銀灰短毛貓 | 黃領巾・坐姿正面 | (71,192)-(1694,2213) 1623×2021 | 23.7% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\kitten_sit.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\kitten_sit.png` |
| `Gemini_Generated_Image_lv7ne7lv7ne7lv7n.jpg` | `kitten_raise.png` | 銀灰短毛貓 | 黃領巾・坐姿抬手指向 | (72,195)-(1718,2212) 1646×2017 | 22.8% | `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g4_domi\ready\kitten_raise.png` | `D:\ANTIGRAVITY\028-1_國小數學APP\app\assets\domi_poses\kitten_raise.png` |

- 去背：白底 min-channel 閾值 10–30 軟過渡 + 白色去污染 + alpha Gaussian(0.75) ≈ 1.5px 柔化。
- 母片 2048×2048 RGBA（bbox 等比置中，上下留白 ≥77px）；App 精靈 992×1280 RGBA。
- 原始下載檔僅讀取，零修改；未執行任何 Git 操作。