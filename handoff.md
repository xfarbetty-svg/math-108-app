# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪
- **【Stage 3.5 工單重工完成，待 BP 盲審】**：依 `R1_CHALLENGER_TICKETS.md`（8 張）＋ `R1_BP_TICKET_RULING.md`（全部 ACCEPTED）重工 T-01~T-04，全部以機械化閘門 exit code 驗收。
  - `app/components/ten-frame-grid.js`（277 行 / 10,642 B）：30px 格 + 33px 不重疊熱區 + padding 4（單盒 177px，兩盒 354px 並排）；`blocked{value,reason}` 事件；漸層雙變數 `--tfg-hi/--tfg-fill`；重連不炸。AC-01-1~8 全 PASS。
  - `app/components/dual-track-diff.js`（169 行 / 7,377 B）：單一幾何公式 `STEP=29.333`、`r=12.667`，虛線 `72.667→97.333` 不穿圓片，金框 `88.00×33.33` 完整包住多出圓片。AC-02-1~7 全 PASS（含 reduced-motion）。
  - `app/components/balance-beam.js`（285 行 / 12,260 B）：明訂 deg、半隱式 Euler、`scale=dt/16.667`，收斂 `|θ_target-θ|<0.1°` 且 `|θ'|<8°/s` 連續 2 幀。AC-03-1~8 全 PASS（120Hz vs 60Hz 差 4.0%）。
  - `app/playground.html`（419 行 / 17,928 B）：新增分解樹（`9＋4`→`1`/`3`、`9＋1＝10`、`10＋3＝13`，由 `ten-frame:full` 驅動）與 300ms 拋物線（控制點 -60px）；390px 緊湊排版讓兩盒同列。390/768/960 三輪全綠。
- **【新增驗收基礎設施】**：
  - `tools/ac_gate.js`：機械化閘門，一次跑 G-1 語法 / G-4 外部資源 / G-5 體積 / T-01~T-03 全量 AC，**只認 process exit code**。
  - `tools/ac_run.js`：CDP 驅動器，直開真實 `file://` 頁面跑互動 AC、攔截 console error/warning、可 `--shot=` 截圖。
  - `tests/ac_t01.html`(8) / `ac_t02.html`(7) / `ac_t03.html`(8) / `ac_t04_body.js` / `ac_geometry_body.js`(7)。
- **【交付報告】**：`reports/20261105_2035_g1_visual_spec/R3_WORKER_BUILD_REPORT.md`（五欄交付 + TCK 對照矩陣 + D-01~D-13 + TCK-09）。
- **【規格回寫】**：`R1_BP_EXECUTION_PLAN.md` 末尾新增「附錄 R1.1」，把 TCK-06/07 的公式與量綱、T-04 分解樹座標、驗收機械化寫回規格（原文未刪，保留盲審軌跡）。

## 🚦 目前狀態
- **當前版本**：`v3.5.0` (AutoFlow Stage 3.5 Rework Delivered)
- **健康狀態**：🟢 `node tools/ac_gate.js` → `GATE_GREEN (12 checks, 0 failed)`，Exit Code 0
- **體積**：10,642 / 7,377 / 12,260 B，合計 **30,279** B（上限 30,720）
- **Git 狀態**：本輪已 commit（無遠端 remote）
- **雲端額度消耗**：$0.00（全地端 Chrome/CDP 驗證）

## ➡️ 下一步（開新框首要任務）
1. **BP 盲審**：`git diff` 對照 R1 + 附錄 R1.1，逐條標 PASS/FAIL；重點覆核 D-01~D-13。
2. **裁決 TCK-09（新開，阻擋 G-8）**：R1 AC-01-4 要求 44px 熱區，但 TCK-02「30px 格 + 3px 間距」+ TCK-05(d)「熱區不得重疊」使三者不可同時成立（44px pitch × 5 格 → 單盒 ≥232px → 兩盒 ≥464px > 390px）。本輪取 33px 熱區，需 BP 三選一：
   - (A) 接受 33px 並改 AC-01-4；(B) 390px 改上下堆疊換回 44px（需改寫 `playground.html` 手機排版與 `AC-04-6`）；(C) 放寬「不得重疊」。
3. **裁決 D-12 / D-13**：為體積閘門移除滿十角標 `.badge`；調試台暴露 `window.__t04` 量測鉤子。
4. **裁決 D-11**：`tools/run_worker_tasks.py` 提示詞寫 `grid:change`/`theme`/`top`/`bottom`，與 R1 正本衝突，建議廢棄。
5. **G-8 人類手感驗收**：手機 390px 實機把玩 33px 熱區、天平阻尼手感、分解樹三步節奏（工兵不得自評）。

## ⚠️ 注意事項
- **無頭 Chrome 的 rAF 只跳 1 幀**（無 BeginFrame，實測 `RAF n=1`）：動畫/物理驗收一律用元件公開的 `step(dtMs)` 鉤子確定性驅動，或改用 CDP 真實視口。
- **`Number(null)` = 0 的陷阱**：讀 attribute 數值前先判 `getAttribute(...) === null`，否則預設值會被吃掉（T-03 damping 曾因此靜默變無阻尼）。
- **`balance-beam.js` 只剩 28 B 餘裕**：下一輪任何新增都要先壓縮，否則 G-5 直接紅燈。
- **AGY WRITE-FILE LOCKED**：AGY 決策大腦嚴禁親自動手寫業務組件代碼。
- **Windows CLI 子進程必須注入 DEVNULL**：呼叫 `opencode` 必須 `stdin=subprocess.DEVNULL` 且 `shell=True`，否則卡死。
- 本機未配置 GitHub 遠端 remote，備份保留於本機 Git 版控。
- 本次收工電腦無 Obsidian MCP 工具，L3 筆記暫未同步。

## 🕐 最後更新
- 時間：2026-11-06T05:10:00+08:00
- 更新者：Worker（AutoFlow 施工工兵，通道 1 本地 CLI）
- Git push 狀態：本地已 commit（無遠端 remote）
