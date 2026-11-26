# 20261126_002 N-4-7 二位小數 — 研究階段 WIP 交接（未施工）

> 節點：AMD3950-OPENCODE｜工作區：`D:\ANTIGRAVITY\028-1_國小數學APP`｜對話框 30 步段點，依硬約束停手交接。
> 紅線宣告：本窗**零修改正式程式／題庫／教具／shell.js／curriculum.json**；零 Git 操作；零碰 017／子由／NAS；Python 執行前皆設 `$env:PYTHONIOENCODING='utf-8'`。

## 1. 已完成的讀取（皆 Exit 0）

| 項目 | 結果 |
|---|---|
| 官方 notebooklm MCP | `list_sources` 可用但 `get_source` **只回中繼資料、無內文** |
| 備援通道 | 本機 `C:\Users\PXP\AppData\Local\Temp\opencode\nlm.py` → `source_get_content`（參數 `source_id`），Exit 0 |
| `[SPEC][G4-UNIFIED]` | source `1db23388-0375-454a-9842-a58fd7d234bf`，全文 5453 字已讀 |
| 最新 `[LOG]` | `d5ea9dc6-9045-43ea-99d2-b2927cf58bf7`（20261126_D41_SURGICAL_FIX_RESULT）＋ `89b9554b-…`（N-4-6 OPENCODE 完工LOG）全文已讀，5 欄格式已知 |
| 本機盤點 | `data/units/G4/` 18 份題檔、`app/components/*g4*lab.html` 19 份教具；**N-4-7、N-4-8 皆未落地** |

## 2. 認領確認

使用者已明確確認認領 **N-4-7 二位小數**（百分位、位值比較與直式加減；課綱 full_text 見 `data/curriculum.json:575-581`）。
統一規格看板第 10 項：AMD3950-OPENCODE (4/5)，品牌教具 **`decimal_hundredth_g4_lab.html`**，狀態 ⬜ 待開工。

## 3. 規格摘要（施工時逐條遵守）

- 滿編 10 題、跨 2–3 校真卷、4 選項、完整題幹、`concept / steps / trap / check`、真實學校／學年度／頁碼出處。
- 教具雙分頁：預設 🌱 概念探索（三活動三情境、與真題零重複），保留 🔊 語音導讀、📝 算草稿；`?q=1..10` 進真題並隱藏頂部頁籤。
- 教具不自帶 `.stem`／`.opts`／換題鈕；高度 ≤ **415px**（展開算理後亦須）；390×844 與 1280×800 零橫向溢出、零內部垂直捲軸；Light/Dark 雙模式高對比；接 `theme-tokens.css` 並監聽 `THEME_CHANGE`。
- 零劇透兩階段：初始無答案／無解析，按「驗證算式／🔍 看算理拆解」才展開。
- 三門禁＋通道三（8 把 Gemini Key 邏輯審題、僅輔助）＋ `register_g4_unit.py`＋ `verify_curriculum_131.js`；同一問題最多 3 次重試即熔斷。
- **本階段禁改 `app/shell.js` 的 `UNIT_CONCEPT_MOVIES`**（由 register 冪等寫入概念映射）。

## 4. 可直接複用的模板（已讀）

| 用途 | 檔案 | 關鍵結構 |
|---|---|---|
| 題檔 | `data/units/G4/N-4-6.json` | `$schema=math-app-unit-v1`、`unit_id=G4-N-4-7`、`question_count=10`、`questions[].explanation.{concept,steps,trap,check}`、`component_path=components/decimal_hundredth_g4_lab.html?q=N` |
| 教具 | `app/components/equiv_fraction_g4_lab.html`（412 行） | `QS` 10 題視覺資料 → `DATA` → `window.__N47_SELFTEST__`；`__N47_MODE__/__N47_Q__/__N47_TYPE__/__N47_READY__`；`RENDER` 分型渲染；`examView`＋`stepsBox`；`setAct()` 三活動；`notifyHeight()`；`THEME_CHANGE` 監聽 |
| 靜態門禁 | `tools/verify_n46.js`（66 行） | 10 題／4 選項／出處／component 路徑／check 真值／shell 映射／`UNIT_CONCEPT_MOVIES` 未污染 |
| CDP 門禁 | `tools/verify_n46_cdp.js`（約 200 行） | Chrome headless＋CDP，port 9466/9467；10 題×Light/Dark×390px＋1280px；`SPOILER`／`INTERACT` 分型；三活動真實事件；主入口全流程；截圖寫 `tools/_scratch/` |
| 註冊 | `tools/register_g4_unit.py` | 冪等寫 `CONCEPT_COMPONENTS`／`DEFAULT_CONCEPT_CODES`、更新 `curriculum.json` 與 `verify_curriculum_131.js`、自動跑 `verify_<slug>.js`／`_cdp.js` 與 131 驗證；內建 `UNIT_CONCEPT_MOVIES` 不變檢查 |

> 注意：N-4-6 教具內有先在講「分之」國字寫法之檢查；N-4-7 為小數單元，verify 腳本應改檢查小數點位值表／直式格線，勿照抄「分之」斷言。

## 5. 下一步（新對話框接續，建議順序）

1. 定向抽取真卷：僅掃 `EXAM REAL/G4/`，**第一層過濾任何含 017／子由路徑**，跳過禁擋檔；以 pdfplumber 抽字＋150dpi 原頁影像核對，湊 10 題（基礎 4–5／應用 3–4／陷阱 2），跨 2–3 校。
2. 寫 `data/units/G4/N-4-7.json`（10 題，check 用可運算 JS 算式，ans 與 answer_index 一致）。
3. 寫 `app/components/decimal_hundredth_g4_lab.html`：三活動建議「百分位位值表抽換／公尺公分換算比大小／直式加減整數倍格線」；四類視覺建議 `place / convert / compare / vertical`。
4. 寫 `tools/verify_n47.js`、`tools/verify_n47_cdp.js`（port 避開 9466/9467，例如 9476/9477）。
5. `$env:PYTHONIOENCODING='utf-8'; python tools/register_g4_unit.py --code N-4-7 --lab decimal_hundredth_g4_lab.html`（含通道三 QA＋131＋兩門禁）；3 次熔斷。
6. 寫 5 欄 `[LOG][AMD3950-OPENCODE][N-4-7][2026-11-26]` 回 NotebookLM（create_source，parent `notebooks/e7559548-f722-4f07-9494-b4d865eb54bb`）。

## 6. 本窗真實狀態

- 正式檔變更：**無**。
- 驗證指令執行：**無**（僅唯讀盤點與 NotebookLM 全文讀取）。
- Exit Code：nlm.py 讀規格／LOG 皆 **0**；其餘未執行。
- 未熔斷、未假綠、未宣稱完工。
