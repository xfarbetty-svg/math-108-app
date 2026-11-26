# 斷點交接日誌 (handoff.md)

## ⏯️ 目前做到哪
- **N-4-2 高位估算精算直式裁切修復完工（2026-11-25 02:32）**：
  - 修改 `app/components/mul_div_g4_lab.html`：「🌱 概念探索 → ③ 高位估算大挑戰」點擊「揭開精算直式」時，自動收合 `.stage-hint`、將 `.est-box.revealed` 切換為左右雙欄並排（左：`.est-left` 選項與回饋；右：`.est-reveal` 直式），並壓縮展開後乘法直式列高（表頭 `14px`／數字列 `18px`／進位列 `11px`／橫線列 `4px`）。
  - 驗收全綠：`node tools/verify_n42_cdp.js` Exit Code 0；390×844 實機截圖（`tools/_scratch/n42_est_reveal.png`）確認總高 `382.19px`（`appBottom = 388.19px <= 415px`）、橫向 `390px` 零溢出，`58×317` 至底部總和 `18386`（`totalBottom = 308.69px < stageBottom = 364.19px`）完整可見。
- **G4 近期單元狀態**：
  - `N-4-1`（一億以內的數）：已 commit `1a6cd99`，4 閘門 Exit 0。
  - `N-4-2`（較大位數乘除計算）：已建立 `mul_div_g4_lab.html`、`N-4-2.json`（10 題）與 `verify_n42*.js`，CDP 全綠。
  - `N-4-3`（兩步驟應用問題與併式）：已 commit `9182e85`、`33be110`（`two_step_expr_g4_lab.html`、`N-4-3.json`、`verify_n43*.js`、`reports/20261125_N43_ACCEPTANCE.md`）。
  - `G4 雙貓動畫`：已完成 006 最終 ROI 精修（`reports/20261124_006_G4_FINAL_ROI_ACCEPTANCE.md`）。

## 🚦 目前狀態
- `app/components/mul_div_g4_lab.html` 已通過 `verify_n42_cdp.js` 與 390×844 實機截圖目視驗收。
- 工作區尚有多筆未提交／未追蹤檔案（含 `app/components/mul_div_g4_lab.html`、`AGENTS.md`、`app/shell.js`、`data/units/G4/N-4-2.json`、`tools/verify_n42*.js`、`tools/verify_n43*.js`、`GEMINI.md`、`app/assets/domi_poses/` 等），待使用者確認 commit 範圍後再行提交與推送。
- 本機未掛載 Obsidian MCP 工具，L3 筆記未更新。

## ➡️ 下一步（接續建議）
1. 確認工作區待提交檔案清單，執行 `git add` / `commit` / `push`（僅納入確認過之檔案，`_scratch/` 與 `handoff.md` 維持隔離）。
2. 待確認：`R-3-1／R-3-2／D-3-1` 教具 P0～P3 微調（`reports/20261123_008_R31_R32_D31_AUDIT.md`）。
3. 推進 G4 後續單元真題與教具開發。

## ⚠️ 注意事項
- `_scratch/`、`handoff.md`、憑證檔維持隔離不進 commit；嚴禁碰 `017\` 或「子由」，嚴禁修改 `D:\NAS\XX.CF995\8.下載` 原始檔。
- 實機測試主入口需於根目錄啟動本機靜態 server（如 `python -m http.server 8000 --bind 127.0.0.1`），直接開 `file://` 會因 `fetch()` 限制無法載入 JSON 題庫。

## 🕐 最後更新
- **時間**：2026-11-25 02:45 (UTC+8)
- **更新者**：Antigravity @ DESKTOP-6ELKIRH
- **Git Push 狀態**：❌ 待推（待使用者確認 commit 範圍與訊息草稿後執行）

## [WIP][AMD3950-OPENCODE][N-4-4] 2026-11-25 — 施工尚未開始（對話框步數額度到期）
- **已確認**：NotebookLM 筆記本 `e7559548-f722-4f07-9494-b4d865eb54bb` 可連線；統一規格書 source ID = `8724c388-44de-4728-ab96-da19921fc65e`（`[SPEC][G4-UNIFIED]`）。
- **連線方式變更**：官方 Google MCP（mcp-remote/OAuth, port 14713）token 過期且卡待授權，本框清除其進程/狀態，`notebooklm` MCP namespace 已離線、**本框不可再用**。改走本機 Python 版 `C:\Users\PXP\.local\bin\notebooklm-mcp.exe --transport stdio`（v4.2.5，auth 可用），呼叫器 `C:\Users\PXP\AppData\Local\Temp\opencode\nlm.py`（用法 `python nlm.py <tool> @args.json`）。
- **待辦**：先用 `tools/list` 查 `source_get_content` 正確參數名（本框誤用 `notebook_id` 被拒）→ 讀規格全文 → 再施工 N-4-4 三檔與三道門禁。
- **本框零專案更動**：未建 `app/components/two_step_adv_g4_lab.html`、`data/units/G4/N-4-4.json`、`tools/verify_n44*.js`；未碰 shell.js/curriculum.json/017/子由。工作區既有 uncommitted 變更是其他節點成果，**本框未 stage/commit**。
- **下一步**：請開新對話框接續，先讀規格再施工。

## [WIP][AMD3950-OPENCODE][N-4-6] 2026-11-25 — 教具與兩支門禁已落地，待題檔入場（對話框 30/30 段點）
- **已確認**：認領 N-4-6 等值分數（擴分、約分、簡單分數比較）；`[SPEC][G4-UNIFIED]` source `1db23388-0375-454a-9842-a58fd7d234bf` 已讀全文（規格：10 題／3 校以上、≤415px、三門禁、禁改 `UNIT_CONCEPT_MOVIES`）。
- **MCP 查證**：本機 `nlm.py` 可用；`source_get_content` 的正確參數是 `source_id`（非 `notebook_id`）；`source_search` 被禁用（Native source search experimental disabled），勿再試。
- **本框施工更動**（新檔，零既有檔覆寫）：
  - `app/components/equiv_fraction_g4_lab.html`：完整 10 題資料驅動教具，四類真實事件（expand/reduce/equal/compare）＋概念三活動（拖曳／約分配對／等值長條），含 `__N46_SELFTEST__`、Light/Dark、`≤415px` 框架。
  - `tools/verify_n46.js`：靜態契約（10 題／4 選項／無「分之」／check 真值／shell 映射）。
  - `tools/verify_n46_cdp.js`：CDP 實機（10 題×Light/Dark×390px＋1280px、零劇透、教具事件、算理 3 行、概念三活動、主入口 Q1~Q10）；port 9466/9467。
- **題檔已到（子代理完工，Exit 0）**：`data/units/G4/N-4-6.json` 已建立，10 題跨 3 校（永安 2／南湖 6／獅湖 2），基礎 5／進階 3／陷阱 2；pdfplumber 掃 71 份 G4 PDF＋4 份轉 150dpi 逐題目視核對。教具 `QS` 已逐題對齊題檔的 check/ans/數字（expand 7、equal 1、compare 3）。
- **QA 通道三首跑 FAIL（真實 bug，非假綠）**：`register_g4_unit.py --code N-4-6 --lab equiv_fraction_g4_lab.html` → Exit 1；`tools/_scratch/qa_review_N-4-6.json` 指出 `p` 字串中 `F(8)`／`F(18)`／`F(15)` 少傳分母參數（會顯示 undefined）。三處已修正，**尚未重跑**。
- **門禁現況**：`node tools/verify_n46.js` → Exit 1，唯一失敗項「shell.js 缺 N-4-6 概念映射」（屬 register 職責，非教具問題）；`verify_n46_cdp.js` 尚未跑。shell.js／curriculum.json／verify_curriculum_131.js 皆未被本框修改。
- **未碰**：`app/shell.js` 的 `UNIT_CONCEPT_MOVIES`（shell 映射留給 `register_g4_unit.py` 冪等寫入）、`data/curriculum.json`、`017`、子由、NAS；零 Git 操作；零 API Key 硬編碼。
- **下一步（新對話框）**：① 重跑 `python tools/register_g4_unit.py --code N-4-6 --lab equiv_fraction_g4_lab.html`（QA 第 2 次；若再 FAIL 依 3 次熔斷停手寫 `[LOG][BLOCKED]`）→ ② `node tools/verify_n46.js` → ③ `node tools/verify_n46_cdp.js` → ④ `node tools/verify_curriculum_131.js` → ⑤ 新增 `[LOG]` 5 欄結案 → 更新本 WIP 為完工。⚠️ 通道三 3 次熔斷額度已用 1 次。
