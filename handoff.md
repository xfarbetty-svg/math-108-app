# 斷點交接日誌 (handoff.md)

## ⏯️ 目前做到哪
- **G4 首站 N-4-1（一億以內的數）完工（2026-11-24）**：不含微電影，僅觀念小教室＋10 題真題庫。
  - 新建 `app/components/place_value_g4_lab.html`：八位位值表（萬級千萬～萬｜個級千～個）、活動一真實 pointerdown/move/up 拖曳磁吸、活動二點擊零位亮燈（前導／級尾省略／讀零三類）、活動三高位逐欄比對；一步一步看算理（作答前不洩漏）；`?q=1..10`；`theme-tokens.css` 雙模式；body margin:0/padding:8px/height:auto/min-height:0，禁 100vh。
  - 新建 `data/units/G4/N-4-1.json`（math-app-unit-v1，10 題 4 選項）：永安 114-1 期中 p1（Q01–Q03）、獅湖 114-1 期中 p1/p2/p3（Q04–Q07、Q09–Q10）、內湖 113-1 期中 p1（Q08）；填充題改編為 4 選項，逐題 concept/steps/trap＋頁碼出處。
  - `data/curriculum.json` N-4-1：upcoming→ready、question_count=10、verified_source/component_path/concept_path 補齊；未改 `app/shell.js` 影片映射。
  - 新建 `tools/verify_n41.js`、`tools/verify_n41_cdp.js`；`verify_curriculum_131.js` 的 EXPECTED_READY_CODES 加入 N-4-1（陳舊期待值單點修正 59→60 / 72→71）。
  - 閘門全綠 Exit 0：static／CDP（390×844 雙模式＋1280×800、教具 ≤420px、零溢出、拖曳/亮燈/逐欄比對）／capture_preview 雙模式截圖／curriculum_131 總檢。
  - 目視修正 Q04：60006000 個級千位為 6，正確讀法「六千萬六千」（原誤設「六千萬零六千」已單點修正）。
  - 施工計畫：`reports/20261124_007_N41_PLAN.md`；抽字暫檔與截圖在 `tools/_scratch/`（隔離不入 Git）。
- **G4 雙貓最終精修全數達標（2026-11-24）**：004（額頭修復）→005（ping-pong＋白邊）→006（起跑 x=760＋局部 ROI）三段收尾完成。
  - 多米 `loop_domi_point`：ping-pong **187 幀**（正放 0..93 ＋精確倒放 92..1 ＋首幀回收），倒放逐像素相同 → 零半透明重影，**MAE=0.0000**；webm vp9/alpha_mode=1，2,200,535 B。
  - 小貓 `loop_kitten_walk`：005 全域 `RGB>205 & sat<18` 清白邊 ＋ 006 局部 ROI（sprite `x0–258 / y396–418`，映射全幀 `(415,926)-(932,970)`，局部 `mn>180 & sat<18` ＋ 1.5px 羽化）清灰墊，共 **779,249 px**；白色腳趾完整，**MAE=0.0000**；webm 1,842,623 B。
  - 舞台：多米 `(305,845)/680px`；小貓 walk `x=760→1150, y=855`（t=0 兩貓不透明像素交集 **0 px**）；sit 鏡面朝左 `(1150,855)` ＋ ±1.5%/3s 呼吸縮放。
  - 驗收檔：`Temp\opencode\g4_dual_cats_stage_preview.jpg`（1920×1080 / 848,732 B）、`g4_dual_cats_demo_10s.mp4`（1920×1080 / 30fps / 300 幀 / 10.000s / 5,088,424 B）。
  - 5 欄報告：`reports/20261124_005_G4_FINAL_REFINE_ACCEPTANCE.md`、`reports/20261124_006_G4_FINAL_ROI_ACCEPTANCE.md`。
- G3 24/24 概念影片與 YouTube 總合集（`M4N_UNwBT5Y`）已於 2026-11-23 收官，詳見 `reports/` 與 `CHANGELOG.md`。

## 🚦 目前狀態
- N-4-1 四道閘門全 Exit 0；CURRICULUM_131_VERIFIED ALL PASS；雙模式截圖目視高對比、無暗字融背。
- 006 主腳本 Exit 0（`FINAL_006_OK`）；四支 loop webm 全數 alpha_mode=1；demo／preview 均已更新。
- **Git 完全未執行**：使用者明確禁令（status/add/commit/push 全禁），本機改動只存在於工作區，另一台電腦看不到。
- 工作能力正常；本框已達步數上限，建議開新框。

## ➡️ 下一步（接續建議）
1. 若要入版控：先取得使用者解除 Git 禁令的明確授權，再一次 commit N-4-1 教具／題庫／課綱／兩支 verify 腳本與 handoff（本輪依既有禁令未執行 Git）。
2. G4 26 條真題／教具啟動前，先依 AGENTS.md 鐵律一～三確立角色規格與題庫 SSOT。
3. 先前待確認：`R-3-1／R-3-2／D-3-1` 教具 P0～P3 微調（`reports/20261123_008_R31_R32_D31_AUDIT.md`）。

## ⚠️ 注意事項
- **勿全域降亮度清白墊**：實測閾值 ≤190 會啃掉右前腳白色腳趾（對照圖 `Temp\opencode\verify_pad_thresholds.png`）；務必維持「全域 >205 ＋ 局部 ROI」雙層做法。
- ffmpeg 9.0 gyan 解 webm alpha 恆為 255（容器標籤），視覺驗收看 sprite/alpha PNG 與 demo 合成，勿用 webm 解碼 alpha 判斷。
- 多米 ping-pong 已推翻 002 的 `seamless()`；重建時切勿再對尾 8 幀做 cross-dissolve。
- `_scratch/`、`handoff.md`、憑證檔維持隔離不進 commit；嚴禁碰 `017\` 或「子由」，嚴禁修改 `D:\NAS\XX.CF995\8.下載` 原始檔。

## 🕐 最後更新
- **N-4-1 交付**：2026-11-24（UTC+8），4 閘門 Exit 0，Git 依既有禁令未執行。
- **時間**：2026-11-24（UTC+8）
- **更新者**：OpenCode CLI @ DESKTOP-6ELKIRH
- **Git Push 狀態**：❌ 未推（使用者明確嚴禁任何 Git 操作，含 status）
