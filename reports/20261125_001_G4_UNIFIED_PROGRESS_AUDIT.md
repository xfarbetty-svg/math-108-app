# 20261125_001 G4 統一規格書與進度盤點（唯讀）

> 宣告：本報告僅做唯讀盤點。未修改任何正式程式／題庫／教具，未執行 Git 操作，未碰 `017` 或「子由」，未改 NAS 原始檔。唯一寫入為本報告檔。

## 1. NotebookLM 連線狀態

| 項目 | 結果 |
|---|---|
| 官方 `notebooklm` MCP | ❌ 卡在 OAuth（port 14713 另一實例待授權），`list_notebooks`／`list_sources` 皆失敗 |
| 備援通道 | ✅ 本機 `notebooklm-mcp.exe --transport stdio` via `nlm.py`（handoff.md:34 記載） |
| 筆記本 | `小學1-6年級數學APP教材庫` = `e7559548-f722-4f07-9494-b4d865eb54bb`（36 sources） |
| `[SPEC][G4-UNIFIED]` 正確 ID | `1db23388-0375-454a-9842-a58fd7d234bf`（handoff 記錄的 `8724c388...` 已失效） |
| `00_MASTER_PROTOCOL` 正確 ID | `dabd877e-b33b-49d5-90b1-2eee3814e067` |
| 讀取方式 | `source_get_content`（需 `source_id`，非 `notebook_id`）→ 全文已讀 |

## 2. 兩份法典重點

- **`[SPEC][G4-UNIFIED]`**：SSOT 為 AMD3950（100.91.241.21）`D:\ANTIGRAVITY\028-1_國小數學APP`；遠端驗收 `:18080`（禁佔 8080 SpotCam）；A Server 零件僅寫 `D:\CCY\ANTIGRAVITY\scratch\g4_parts\`。四節點分工：
  - AMD3950-AGY：N-4-10～N-4-13、S-4-2（5 單元）
  - AMD3950-OPENCODE：N-4-4～N-4-8（5 單元）
  - ASERVER-AGY：S-4-5～S-4-8（4 單元）
  - ASERVER-OPENCODE：N-4-9、R-4-2、R-4-4、D-4-1（4 單元）
- 硬約束：滿編 10 題、跨 2–3 校真卷、4 選項、concept/steps/trap、真實學校／學年度／頁碼；教具雙分頁、預設 🌱 概念探索（三活動三情境、與真題零重複）、`?q=1..10` 零劇透、高 ≤415px、390px 零溢出、Light/Dark 雙模式；三道門禁 + 通道三 + `register_g4_unit.py` + `verify_curriculum_131.js`；本階段不碰 `UNIT_CONCEPT_MOVIES`。
- **`00_MASTER_PROTOCOL`**：讀前必檢 ACTIVE SSOT、ARCHIVE（G3 舊參數）禁套用；查無資料即煞車列《缺漏資訊清單》；完工僅新增 `[LOG] YYYYMMDD_代號_任務類型_RESULT`，禁改 `00_`／`SSOT` 來源。

## 3. G4 進度盤點（以 NotebookLM [LOG] ＋ 本機檔案為準）

本機實測 `data/units/G4/` 共 10 份題檔、`app/components/*g4*lab.html` 共 11 份教具。

| 節點 | 負責單元 | 已完工（事由） | 下一個 ⬜ 待開工 |
|---|---|---|---|
| AMD3950-AGY | N-4-10～13, S-4-2 | N-4-10、N-4-12（[LOG]＋題檔＋教具＋verify 全在）；N-4-11 看板標施工中 | **N-4-13**（看板 item 6） |
| AMD3950-OPENCODE | N-4-4～8 | N-4-4、N-4-5（[LOG] 全綠；`N-4-4.json`／`N-4-5.json`／`two_step_adv`／`fraction_mixed`／`verify_n44*`／`verify_n45*` 全在） | **N-4-6 等值分數**（看板 item 9，教具 `equiv_fraction_g4_lab.html`） |
| ASERVER-AGY | S-4-5～8 | S-4-5（[LOG]＋題檔＋`perp_parallel_g4_lab.html`） | **S-4-6**（看板 item 13） |
| ASERVER-OPENCODE | N-4-9, R-4-2, R-4-4, D-4-1 | N-4-9、R-4-2（[LOG]＋題檔＋教具） | **R-4-4**（看板 item 17） |

### ⚠️ 規格書看板滯後
看板仍將 **N-4-5、N-4-12、S-4-5** 標為 ⬜ 待開工／🔄 施工中，但 NotebookLM [LOG] 與本機題檔／教具／verify 腳本已證明三者完工。故「排在最前面的 ⬜ 待開工」若以看板字面判讀會與事實衝突，需人類裁決以 **[LOG]＋本機檔案** 為準。

## 4. 本節點身分推斷與待確認

- 執行環境：hostname `DESKTOP-6ELKIRH`、工作目錄即 AMD3950 主倉庫、.runner 為 OpenCode → 推斷為 **AMD3950-OPENCODE**（非 AGY；AGY 為零寫碼權決策層）。
- 依上述推斷，應認領 **N-4-6 等值分數**（`equiv_fraction_g4_lab.html`）；若以看板字面則為 N-4-5（但實已完成）。
- **待人類確認**：(1) 節點身分是否為 AMD3950-OPENCODE；(2) 認領 N-4-6 是否正確。

## 5. 紅線核查

`[PASS]` 零碰 `017`／「子由」／NAS 原始檔；零 Git 操作；零 API Key 硬編碼；Python 執行前皆設 `$env:PYTHONIOENCODING='utf-8'`；未呼叫 `dispatch_worker.py`／OpenCode CLI（本節點使用自身工具）。
