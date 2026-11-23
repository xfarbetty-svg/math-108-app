# R-3-2 Q05～Q10 動態推導教具重做 — 5 欄結案報告

日期：2026-11-23　｜　序列：20261123_010

## 1. 範圍
- `data/units/G3/R-3-2.json`：Q05–Q10 解說改為 3 步白話推導（答題後顯示），正解與 14/2/22/13 等真值不變。
- `app/components/pattern_reasoning_lab.html`：僅重做 `?q=5..10` 渲染路徑，移除「👆 點卡片：揭示下一項」劇透按鈕；Q01–Q04 與無 `?q` 的舊四活動（跳跳蛙／火柴棒／找規律／挑戰）完全不動。
- `app/js/r32_pattern_engine.js`（新增）：可復用 SVG 規律推導引擎，G4 同類題型掛 `PatternEngine.mount()` 即可。
- `tools/verify_r32_interactive_cdp.js`（新增）：config-driven 雙視口 × 雙模式 CDP 門禁，G4 僅需擴充 `SPECS`。
- `tools/verify_r31_r32_d31_dual_cdp.js`：Q05–Q10 改點擊真正的 ➕ 控制器（舊 `iv-card` 已移除）。
- 未碰觸 `017\`／子由；TTS 破音字沿用前次提交，未重複修改。

## 2. 變更
- Q05：亮橘帶綠葉柳丁 15–20 顆，每 2 顆亮藍虛線框成組；奇數最後 1 顆金環高亮「單獨剩 1 顆」，偶數顯示「剛好兩兩分完（剩 0 顆）」。
- Q06：12 顆彩色豆子依序排出，單顆點擊或「標記偶數＋1／奇數−1」分類，即時統計已標記顆數；**不計算最終得分**，留給學生作答。
- Q07：米白作品紙＋半透明亮黃膠帶，每多 1 張紅色虛線叉叉標出共用接縫（少 1 段），新增 3 段；`n` 張 = `3n−1`，5 張 14 段（與試卷正解一致）。
- Q08：亮藍梯形桌＋5 座位圓點，相接斜邊 2 座位紅色虛線叉叉，每多 1 張 +3 人，4 張 14 人。
- Q09：亮綠長方形桌＋10 座位，左右短邊各 2 座位叉叉（每接一次扣 4），每多 1 張 +6 人，3 張 22 人。
- Q10：木黃立體竹籤，共用竹籤金光閃爍＋叉叉「共用 1 根」，新補上/下/右 3 根亮橘，4 個 13 根。
- 統一 ➕/➖ 控制器、動畫高亮新增邊、狀態列只顯示數量結構不印選項答案；按鈕距狀態文字 16px（≥12px）；明亮高對比色，Light/Dark 皆可見，無純黑填充。

## 3. 驗證指令
```bat
node --check app/js/r32_pattern_engine.js
node tools/verify_r32.js
node tools/verify_r32_interactive_cdp.js
node tools/verify_r31_r32_d31_dual_cdp.js
node tools/verify_curriculum_131.js
node tools/verify_g3_remaining_concepts.js
node tools/verify_app_shell.js
node tools/verify_shell_choices_cdp.js
node tools/verify_tts_polyphone.js
node tools/verify_g3_contract_240.js
node tools/verify_g3_viewport_width.js
```

## 4. 真實 Exit Code
- 上述 10 道指令：全部 **Exit 0**（個別Gate由 PowerShell loop 逐一回報 PASS(0)）。
- 新增 CDP 門禁：`ALL_GREEN: 6 題 × 2 視口 × 2 模式 = 24 組合，四道硬斷言全數通過`，Exit 0。
- CDP 實測：教具高 420px、零橫向溢出、零 JS 錯誤、零純黑填充、按鈕/文字零重疊且間距 ≥12px。

## 5. 證據
- 截圖：`_scratch/r32_interactive/20261123_010_Q05..Q10_{mobile,desktop}_{light,dark}.png`（24 張），已逐張目視確認（Q05 分組、Q06 豆子、Q08/Q09 座位叉叉、Q10 深色模式數字對比）。
- 視覺覆盤後已修正 4 處：Q05 分組框跨列重疊與單獨剩餘空框、Q08/Q09 單桌靠左、Q10 深色模式數字黑底黑字。
- 已知取捨：指令稿 Q07 描述「第 1 張 4 段→16 段」與試卷正解 14 段衝突；依軍規一（真題神聖）以 SSOT 正解 `3n−1=14` 為準，保留「每多 1 張新增 3 段、接縫共用」核心推導。
- 部署：commit 與 push 結果見本檔提交紀錄；線上 https://math-108.pages.dev 。
