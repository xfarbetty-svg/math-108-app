# N-4-3 教學邏輯與互動全面升級驗收報告（2026-11-25）

## 交付五欄

| 欄位 | 內容 |
|---|---|
| 範圍 | `app/components/two_step_expr_g4_lab.html` 全面重構；`tools/verify_n43.js`、`tools/verify_n43_cdp.js` 升級守門。**未觸碰**題庫 JSON、`curriculum.json`、`app/shell.js`、017／子由、N-4-1／N-4-2 |
| 變更 | ① 真題 `?q=1..10` 改「兩階段算式組合器」：階段 A 只用線段圖＋積木按鈕組合，初始 DOM 零算式和零答案；驗證成功或按「看算理拆解」才展開階段 B 的均一兩步驟；② 概念模式三活動改用三道不同生活例題（鉛筆／餅乾／紙藤），活動一支援點擊＋拖曳雙操作、活動二提供兩種合法列式切換、活動三三選一附錯誤解析；③ 收緊版面 max-width／overflow，修復右側邊框裁切 |
| 驗證指令 | `node tools/verify_n43.js`；`node tools/verify_n43_cdp.js`；`node tools/verify_curriculum_131.js` |
| 真實 Exit Code | 三者皆 **0**（`N43_STATIC_ALL_PASS`／`PASS verify_n43_cdp`／`CURRICULUM_131_VERIFIED — ALL PASS`） |
| 證據 | `MAX_HEIGHT light=359.6 dark=359.6 desktop=347.6`（≤420）、`MAX_WIDTH light=390 dark=390`（零溢出）；Q1~Q10×Light/Dark 初始 DOM 實測 `leakExp=false／leakFinal=false／stepsHidden=true`；Q2 點積木組出 `(568−28)÷20` → 驗證成功 → 展開 `540÷20＝27`；截圖 `tools/_scratch/n43_q2_light.png`、`n43_q2_dark.png`、`n43_concept_act0_light.png`、`n43_concept_act2_light.png` 目視無劇透、無疊字、無右框裁切 |

---

## 一、真題演練：先組合、後展開（十題全數套用）

- **階段 A（零劇透）**：標題改為「先找中間量・組合併式」；線段圖 `diagramHTML(d.viz)` 只呈現題目既有條件（例如 Q2 只顯示 `568 顆草莓 → 壓爛 28 顆 → 每 20 顆裝 1 盒`），不再出現 `(568−28)÷20` 或 `27 盒`。
- 由_expression_自動生成積木按鈕：Q2 提供 `568／28／20／−／÷／(／)`；學生依序點選排出完整併式，按「✓ 驗證算式」做字串正規化比對，正確才高亮並自動展開階段 B；錯誤只給引導提示（「第一步要先算哪兩個數？」），不洩漏答案。
- **階段 B（展開才寫入 DOM）**：`stepsBox` 初始 `hidden=true`，展開後才插入均一風格三行：`第一步：先算剩下的草莓 → 568−28＝540`、`第二步：再算裝成幾盒 → 540÷20＝27`、`併式：(568−28)÷20＝27`。按「🔍 看算理拆解」亦可在未組合時主動展開。
- CDP 逐題（10×2 主題）機械檢查初始 `innerText` 不含 `s.exp` 與 `＝s.final`，確保十題無一劇透。

## 二、概念探索：三道獨立生活例題

| 活動 | 例題 | 互動設計 |
|---|---|---|
| 一・先乘後減 | 鉛筆 15 元買 4 枝、付 100 元，找回幾元？ | 三槽位＋四積木；先點積木再點槽位（或反向），並保留真實 `pointerdown/move/up` 拖曳；放入即高光吸附並顯示即時提示，完成後才揭示 `100 − 15 × 4 ＝ 40` |
| 二・連除與括號 | 360 顆餅乾，每 6 顆一包、每 5 包一盒 | 兩種合法列式切換：`360÷6÷5`（由左而右）vs `360÷(6×5)`（括號先算）；點第一步區塊高亮，明確顯示中間量（60 包／30 顆），移除舊版混亂紅字 |
| 三・線段配對 | 240 條紙藤平分 12 人，5 人共幾條？ | 三段線段圖＋三選項：`240÷12×5`（正解）、`240÷(12×5)`、`240×12÷5`；點選即顯示具體錯誤原因（把 12 與 5 先乘成 60 人／順序相反） |

## 三、算式引擎與安全性

- AST 引擎（`tokenize → parse → firstReducible → 逐次化簡 → render`）與 `evalAST` 等價驗證完整保留；`__N43_SELFTEST__` Q1~Q10 全綠，Q1 仍為 `240÷12＝20 → 20×5＝100`，無憑空 `+`、無重複 12。
- 教具內部仍無題幹、4 選項與提交按鈕（外殼 `shellStem`／`shellOptions` 統一呈現）；CDP 實測 `.opt/.option-btn/.shell-opt` 為 0。
- `theme-tokens.css`＋`html[data-theme="dark"]` 覆寫，Light/Dark 截圖目視對比通過；無 100vh，iframe resize 訊息正常。

## 四、驗收強化

- `verify_n43.js` 新增 6 道守門：零劇透 `viz`／`steps` 資料、線段圖只用 `d.viz`、兩階段組合器函式存在、階段 B 初始隱藏、三活動不同例題、點擊＋拖曳雙操作。
- `verify_n43_cdp.js` 新增三類實測：每題初始 DOM 零劇透、Q2 完整組合→驗證→展開、Q1 拆解按鈕、概念三活動文本差異與三選項數。
- 遭遇一次失敗（Q9 只有 4 個相異積木，原閾值 5 過嚴）已單點修正閾值為 4 後重測通過，未放寬任何劇透檢查。

## 五、後續

- 依「完工即停」本輪不 commit／push、不部署、不碰其餘單元；已寫入 `[LOG][OPENCODE][N-4-3]` 至 NotebookLM 對應筆記本。
