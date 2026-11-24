# [LOG][OPENCODE][N-4-3][2026-11-25] N-4-3 觀念小教室教具與真題庫完工驗收

> 課綱單元：四年級 N-4-3（整合 R-4-1）兩步驟應用問題與併式。施工者：OpenCode。全程遵守安全隔離紅線：未讀取／掃描／引用任何「017」或「子由」路徑；Python 執行前皆設定 `$env:PYTHONIOENCODING='utf-8'`；真題僅取自 `EXAM REAL/G4/` 合法台灣國小段考 PDF；未製作微電影、未改 `app/shell.js` 影片映射、未動 N-4-1／N-4-2 任何檔案。

## 標準 5 欄驗收

| 欄位 | 內容 |
|---|---|
| **範圍** | 僅 N-4-3 專屬：新建 `app/components/two_step_expr_g4_lab.html`、`data/units/G4/N-4-3.json`；`data/curriculum.json` 僅改 N-4-3 該筆；另建 N-4-3 專屬驗證腳本 `tools/verify_n43.js`、`tools/verify_n43_cdp.js`；`tools/verify_curriculum_131.js` 僅於 EXPECTED_READY_CODES 補入 `N-4-3` 以反映新ready條目。 |
| **變更** | 教具含三大互動活動：①算式合併天平（真實 pointerdown/move/up 拖曳算式積木與括號卡，拖曳 20px 驗證 transform 變動，即時判定括號必要性）②運算順序高亮階梯（先乘除後加減／括號優先，逐步化簡）③情境線段圖與併式配對（正確併式 vs 迷思對照）；支援 `?q=1..10`、`theme=dark/light`、一步一步看算理，作答前不渲染解析。題庫 10 題、每題 4 選項、完整題幹、concept/steps/trap 與學校＋學年度＋頁碼出處，跨 3 校（獅湖 3／永安 3／南湖 4）。課綱 N-4-3：`upcoming→ready`、`question_count 0→10`、補 `verified_source`／`component_path`／`concept_path`。 |
| **驗證指令** | `node tools/verify_n43.js`；`node tools/verify_n43_cdp.js`；`node tools/verify_curriculum_131.js`；CDP `Page.captureScreenshot` 產出 4 張 Light/Dark 截圖並以 read 工具目視。 |
| **真實 Exit Code** | 結構檢查 **0**（ALL PASS）；CDP 雙視口 **0**（PASS）；課綱總檢 **0**（ALL PASS，131 units／6 grades）；`git commit 9182e85` **0**。途中兩次失敗為驗證腳本自身 selector／期待值錯誤（非教具），已單點修正後重測通過，符合 3 次重試熔斷（實際 2 次）。 |
| **證據** | CDP 實測：Light 最高 333.7px、Dark 333.7px、Desktop 328.0px（皆 ≤420px）；390px 視口 Light/Dark `scrollWidth=390`（零橫向溢出）；10 題 × 2 模式 × 2 視口零 console error／exception；三大活動真實事件全綠（拖曳 transform 變動、第一步高亮、配對命中）。截圖：`tools/_scratch/n43_q1_light.png`、`n43_q2_light.png`、`n43_q2_dark.png`、`n43_q10_dark.png` 目視確認高對比、無暗字融背、無穿模、無文字遮擋。私下目視發現 Q1 積木曾顯示错误算式，已修正為 `(無括號) 240÷12 ×5`、Q2 為 `( 568−28 )÷20` 後重測通過。 |

## 真題出處明細（逐題合法真卷）
1. 獅湖 113-1 期末 p3 應用3：`240÷12×5＝100`
2. 獅湖 113-1 期末 p3 應用7：`(568−28)÷20＝27`
3. 永安 114-1 期末 p2 四(5)：`(40×7)＋199＝479`
4. 永安 114-1 期末 p2 六(3)：`48÷(60÷10)＝8`
5. 永安 114-1 期末 p2 六(4)：`(6500−300×5)÷5＝1000`
6. 南湖 111-1 期末 p3：`120×12÷240＝6`
7. 南湖 111-2 期中 p1 選擇1：`56×4÷7＝32`
8. 南湖 112-1 期末 p3 應用4：`840÷70×12＝144`
9. 南湖 113-1 期末 p3 應用3：`900÷25÷6＝6`
10. 獅湖 114-1 期末 p3 五(4)：`(1040−1018)×5＝110`

## 異動與後續
- 規格書正文係以本地 `nlm source content --profile dayou` 讀取（官方 MCP 無讀內文 API），上一輪 WIP 來源 `a7a9e2a3-d72b-4784-bafc-81765202e479` 已依指示刪除。
- 官方 notebooklm MCP 無 `delete_source` 工具，改由本地 `nlm source delete --profile dayou` 執行；如實記載。
- Git：主體 commit `9182e85`；本輪教具算理修正與驗證腳本另行 commit。依專案慣例 push 由 AGY／使用者統一處理。
