# R3_WORKER_BUILD_REPORT: T-01 ~ T-04 施工交付與逐條 AC 實測（Stage 3.5 工單重工版）

## 📌 文件屬性表頭 (Document Attributes Header)
1. **任務編號**：20261105_2035_g1_visual_spec
2. **對應文件**：R0_AGY_BLUEPRINT.md → R1_BP_EXECUTION_PLAN.md（+ 附錄 R1.1）→ R1_CHALLENGER_TICKETS.md → R1_BP_TICKET_RULING.md
3. **文件性質**：階段 3.5：工兵依 8 張裁決工單重工後的交付報告（待 BP 盲審）
4. **編寫角色**：Worker（AutoFlow 施工工兵，通道 1 本地 CLI）
5. **鋼印狀態**：<!-- AUTOFLOW_VERIFIED_SIGNATURE: WORKER_STAGE35_REWORK_20261106 -->

> **工兵聲明**：本報告只陳述「已落盤檔案 + 可重跑指令 + 真實 Exit Code + 實測輸出」。
> 未經 BP 盲審前，任何 PASS 都只是「工兵自報」，需由 BP 以 `git diff` 與重跑指令覆核。
> 本輪所有數字均來自 `node tools/ac_gate.js`（機械化 exit code 閘門）與 `node tools/ac_run.js`（CDP 真實視口）。

---

## 一、工單落地對照（TCK-01 ~ TCK-08）

| 工單 | 處方 | 落地位置 | 實測證據（原始輸出） |
| :--- | :--- | :--- | :--- |
| **TCK-01** 流程跳階 | 補 Git 基準線、handoff 不得再宣稱 PRISTINE | `handoff.md` 已改寫為逐檔現況；本輪 `git add -A && git commit` | `git log` 可見基準 commit，後續 `git diff` 有內容 |
| **TCK-02** 390px 算術 | 30px 格 / gap 3px / padding 4px | `ten-frame-grid.js` `--tfg-cell:30px;--tfg-pitch:33px;padding:4px` | `AC-01-8 :: box1=177.0 box2=177.0 stageScrollWidth=390`；`AC-04-6 :: left=[16,220 w=177] right=[197,220 w=177] sameRow=true` |
| **TCK-03** 分解樹無主 | 拋物線 250~350ms + 分解樹納入 T-04 | `playground.html` `#treeSvg` + `window.__t04` 量測鉤子 | `T04-05 :: treeStep=3 tnA=9 ＋ 4 tnC=9 ＋ 1 ＝ 10 tnD=10 ＋ 3 ＝ 13 branches=150,30,108,64 \| 150,30,192,64`<br>`T04-06 :: flightMs=300(250~350) controlDy=-60 flights=1` |
| **TCK-04** 生命週期 | T-01 重連不炸；T-03 `replaceChildren()` | `ten-frame-grid.js` `disconnectedCallback` 不清 `_cells` + `connectedCallback` 重建檢查；`balance-beam.js` `_build()` 首行 `this._root.replaceChildren()`、`disconnectedCallback` 保留 `_built=true` | `AC-01-5 :: quiet500ms=true dotsBefore=10 dotsAfterReconnect=10 clicked=true grew=1 throwFree=true`<br>`AC-03-8 :: before=1/1/10 afterReconnect=1/1/10`<br>`AC-02-6 :: before=1/1/13 afterReconnect=1/1/13` |
| **TCK-05** 事件/色票漂移 | 刪 `ten-frame:tap`、鎖定走 `blocked`、漸層雙變數 | `ten-frame-grid.js` 僅派 `fill/full/reset/overflow/blocked`；`--tfg-hi` 由 JS `lighten()` 依 `fill-color` 推導 | `AC-01-6 :: n=2 reasons=locked,readonly`<br>`AC-01-7 :: fill=#2563EB hi=rgb(113,154,242) blueish=true` |
| **TCK-06** T-02 幾何矛盾 | 單一 `r` 公式、虛線不穿圓片 | `dual-track-diff.js` `STEP=(W-2·PAD)/9`、`R=clamp(STEP/2-2,10,16)`，虛線與金框全由 `R` 推導 | `AC-02-1 :: step=29.333(expect 29.333) r=12.667(expect 12.667) boxW=88.00(expect 88.00) boxH=33.33 boxY=43.33`<br>`AC-02-4 :: links=5 y1=72.67(expect 72.67) y2=97.33(expect 97.33)`<br>`AC-02-7 :: box=[158.0,43.3 88.0x33.3] coins=[162.0,47.3..246.0,72.7]` |
| **TCK-07** T-03 量綱 | 明訂 deg、dt 歸一、時間量綱收斂 | `balance-beam.js` 標頭與 `_advance()`：`scale=dt/16.6667`、`|θ'|×60 < 8°/s` 連續 2 幀；`get velocity()` 對外可驗 | `AC-03-7 :: t60=700.0ms t120=672.0ms diff=4.0% (<=15%)`<br>`AC-03-5 :: theta=-9.462 target=-9.462 settledAt=104frame` |
| **TCK-08** 驗收不可機械化 | 建 runner、補 `ac_t03.html`、AC-01-5 改驗 | 新增 `tools/ac_gate.js`（exit code 閘門）；`ac_t03.html` 補齊；AC-01-1/5 改寫 | `node tools/ac_gate.js` → `GATE_GREEN (12 checks, 0 failed)`，**exit 0** |

---

## 二、交付五欄表（缺欄即 [UNVERIFIED]）

### 2.1 T-01 `<ten-frame-grid>` 十格陣與滿十閉鎖

| 欄位 | 內容 |
| :--- | :--- |
| **範圍** | `app/components/ten-frame-grid.js`（277 行 / 10,642 bytes） |
| **變更** | 30px 格 + 33px 不重疊熱區 + padding 4；`blocked{value,reason}` 事件；`--tfg-hi/--tfg-fill` 雙變數漸層；重連不清 `_cells`；滿十 300ms 震動→金色閉鎖 |
| **驗證指令** | `node --check app/components/ten-frame-grid.js`<br>`node tools/ac_gate.js`（內含 T-01 頁） |
| **真實 Exit Code** | `node --check` → **0**；gate T-01 → **0**（8/8 PASS） |
| **證據** | `PASS AC-01-1 :: maxDots=10 dots=10 fill=10 overflow+blocked=15 (>=15)`<br>`PASS AC-01-2 :: fill->full=300.1ms (expect 270~330)`<br>`PASS AC-01-3 :: borderColor=rgb(250,204,21)`<br>`PASS AC-01-4 :: slot=30.0x30.0 hit=33.0x33.0 gapX=0.0 gapY=0.0 noOverlap=true`<br>`PASS AC-01-5 :: quiet500ms=true dotsBefore=10 dotsAfterReconnect=10 clicked=true grew=1 throwFree=true`<br>`PASS AC-01-6 :: n=2 reasons=locked,readonly`<br>`PASS AC-01-7 :: fill=#2563EB hi=rgb(113,154,242) blueish=true`<br>`PASS AC-01-8 :: box1=177.0 box2=177.0 stageScrollWidth=390 (<=390)` |

### 2.2 T-02 `<dual-track-diff>` 雙軌差值探照燈

| 欄位 | 內容 |
| :--- | :--- |
| **範圍** | `app/components/dual-track-diff.js`（169 行 / 7,377 bytes） |
| **變更** | 幾何收斂為單一解析式（`STEP`→`R`→圓心/虛線/金框全推導）；虛線邊到邊不穿圓片；金框完整包住多出圓片；重連不疊層 |
| **驗證指令** | `node --check app/components/dual-track-diff.js`<br>`node tools/ac_gate.js`（T-02 + T-02-RM 兩輪） |
| **真實 Exit Code** | `node --check` → **0**；gate T-02 → **0**（7/7）、T-02-RM → **0**（7/7） |
| **證據** | `PASS AC-02-1 :: step=29.333(expect 29.333) r=12.667(expect 12.667) boxW=88.00(expect 88.00) boxH=33.33 boxY=43.33`<br>`PASS AC-02-2 :: diffBox=0 label=一樣多 formula=5 ＝ 5`<br>`PASS AC-02-3 :: clampedTop=10 invalid=1 attempted=11 insideViewBox=true`<br>`PASS AC-02-4 :: links=5 y1=72.67(expect 72.67) y2=97.33(expect 97.33)`<br>`PASS AC-02-5 :: reducedMode=true animationName=none rule=true`<br>`PASS AC-02-6 :: before=1/1/13 afterReconnect=1/1/13`<br>`PASS AC-02-7 :: box=[158.0,43.3 88.0x33.3] coins=[162.0,47.3..246.0,72.7]` |

### 2.3 T-03 `<balance-beam>` 幾何向量等號天平

| 欄位 | 內容 |
| :--- | :--- |
| **範圍** | `app/components/balance-beam.js`（285 行 / 12,260 bytes，餘裕 28 B） |
| **變更** | 明訂 deg；半隱式 Euler + `scale=dt/16.667`；收斂 `|θ_target-θ|<0.1°` 且 `|θ'|<8°/s` 連續 2 幀；`_build()` 先 `replaceChildren()`；新增 `velocity` getter 供驗收 |
| **驗證指令** | `node --check app/components/balance-beam.js`<br>`node tools/ac_gate.js`（T-03 頁） |
| **真實 Exit Code** | `node --check` → **0**；gate T-03 → **0**（8/8 PASS） |
| **證據** | `PASS AC-03-1 :: theta=-14.04 (expect -14.04) balanced=false`<br>`PASS AC-03-2 :: theta=0.000 settledAt=42frame balancedEvents=1`<br>`PASS AC-03-3 :: maxAbsTheta=4.76 nan=false`<br>`PASS AC-03-4 :: f1=5 ＝ 2 ＋ 3 \| f2=2 ＋ 3 ＝ 5 \| balanced=true`<br>`PASS AC-03-5 :: theta=-9.462 target=-9.462 settledAt=104frame maxAbs=13.95`<br>`PASS AC-03-6 :: cancelAnimationFrameCalls=1 eventsAfterRemove=0`<br>`PASS AC-03-7 :: t60=700.0ms t120=672.0ms diff=4.0% (<=15%)`<br>`PASS AC-03-8 :: before=1/1/10 afterReconnect=1/1/10` |

### 2.4 T-04 `app/playground.html` 三端調試台 + 算理演出

| 欄位 | 內容 |
| :--- | :--- |
| **範圍** | `app/playground.html`（419 行 / 17,928 bytes）+ `tools/ac_run.js`（CDP 驗收器） |
| **變更** | 新增分解樹 `#treeSvg`（三步：拆 4→1+3 / 9+1=10 / 10+3=13，由 `ten-frame:full` 驅動）；拋物線 300ms、控制點 -60px；390px 專用緊湊排版讓兩盒同列；`window.__t04` 量測鉤子 |
| **驗證指令** | `node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=390x900`<br>`node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=768x1000`<br>`node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=960x1000` |
| **真實 Exit Code** | 390 → **0**（12 checks）、768 → **0**（11 checks）、960 → **0**（11 checks），三輪皆 `CONSOLE_NOISE_COUNT=0` |
| **證據** | `PASS AC-04-2 :: scrollWidth=390 stageW=378 viewport=390`<br>`PASS AC-04-6 :: left=[16,220 w=177] right=[197,220 w=177] sameRow=true`<br>`PASS T04-05 :: treeStep=3 tnA=9 ＋ 4 tnC=9 ＋ 1 ＝ 10 tnD=10 ＋ 3 ＝ 13 branches=150,30,108,64 \| 150,30,192,64`<br>`PASS T04-06 :: flightMs=300(250~350) controlDy=-60 flights=1`<br>`PASS AC-04-3 :: 768:cols=2(w=768) 960:cols=2(w=960)`<br>`PASS AC-04-4 :: entries=20(expect 20) ten=true diff=true balance=true`<br>`PASS AC-04-5 :: 外部資源數=0`<br>截圖：`evidence/t04_390.png`(44,826 B) / `t04_768.png`(76,859 B) / `t04_960.png`(86,679 B) |

### 2.5 幾何實測

| 欄位 | 內容 |
| :--- | :--- |
| **範圍** | `tests/ac_geometry_body.js`（以外部公式反推渲染值） |
| **變更** | GEO-01~04 改驗 30/33/177；GEO-06 改以 `STEP`、`R` 外部公式對照渲染後圓片直徑與步距 |
| **驗證指令** | `node tools/ac_run.js app/playground.html tests/ac_geometry_body.js --viewport=960x1000` |
| **真實 Exit Code** | **0**（7/7 PASS） |
| **證據** | `GEO-01 slot=30x30`、`GEO-03 slotColGap=3 hit=33`、`GEO-04 frameW=177`、`GEO-06 coin=30.9x30.9(expect 30.9) stepX=35.8(expect 35.8) scale=1.2`、`GEO-07 lever=240x8 fulcrum=40x70` |

---

## 三、G1 發布硬閘門現況

| 閘門 | 檢驗方式 | 結果 |
| :--- | :--- | :--- |
| G-1 語法 | `node --check` × 3（已納入 `ac_gate.js`） | ✅ 三檔 Exit 0 |
| G-2 控制台 | CDP `Runtime.consoleAPICalled` + `Log.entryAdded` | ✅ 三端 `CONSOLE_NOISE_COUNT=0` |
| G-3 三端無破版 | 390 / 768 / 960 截圖（本輪重拍） | ✅ 三張 PNG 已更新（人類手感仍待 G-8） |
| G-4 零網路依賴 | `ac_gate.js` G-4 檢查 | ✅ `url_hits=2 external=0`（僅 w3.org 命名空間） |
| G-5 體積 | `ac_gate.js` G-5 檢查 | ✅ 10,642 / 7,377 / 12,260 B（各 ≤12,288）；合計 **30,279** B ≤ 30,720 |
| G-6 事件契約 | 對照 R1 表格逐項 | ✅ `ten-frame:*` 5 種、`diff:*` 2 種、`balance:*` 3 種，無未登記事件（`ten-frame:tap` 已刪） |
| G-7 計時器衛生 | 移除元件後 500ms 觀察 | ✅ `AC-01-5`、`AC-03-6` 全綠 |
| G-8 人類手感 | 手機實機拖曳點擊 | ⏳ 待人類專家驗收（工兵不得自評） |
| **G-9 機械化閘門** | `node tools/ac_gate.js` | ✅ `GATE_GREEN (12 checks, 0 failed)`，**exit 0** |

---

## 四、規格偏離與裁決請求（BP 必查，禁靜默）

| 編號 | 項目 | R1 原文 | 實際施工 | 理由 |
| :--- | :--- | :--- | :--- | :--- |
| D-01 | T-01 熱區 | 44×44px 透明外擴 | **33×33px（pitch）**，視覺格 30×30 | 44px 熱區在 30px 格 + 3px 間距下必然重疊；TCK-05(d) 明文要求「不得重疊」，故取 pitch 為熱區。**與 R1 AC-01-4 的 44px 直接衝突 → 另立 TCK-09 待裁** |
| D-02 | T-02 圓片半徑 | 390px r=12 / ≥768px r=16 | 固定 `r=12.667`（由 `STEP` 推導，與寬度無關） | 貫徹 TCK-06「單一公式」；`viewBox` 320 固定，`svg{max-width:420px}` 僅縮放視覺 |
| D-03 | T-02 虛線 y | `65 → 95` | `72.667 → 97.333`（`60+R` / `110-R`） | 65→95 會穿過圓片本體（TCK-06 明確禁止） |
| D-04 | T-02 算式墨色 | `#F8FAFC` | 預設不變，playground 卡片覆寫 `--dtd-ink` | 淺色卡片上 `#F8FAFC` 幾乎不可見 |
| D-05 | T-03 物理驗證 | AC 以「秒」表述 | 元件公開 `step(dtMs)`，與 rAF 共用同一積分器；AC 以「幀」計 | 無頭 Chrome 無 BeginFrame（`RAF n=1`），虛擬時間無法驅動 rAF |
| D-06 | T-03 `balance:clamped` | `{requested, clamped:15}` | 多帶 `field`（`theta`/`left-weight`/`right-weight`） | 質量夾值與角度夾值需可區分；屬新增鍵，不破壞既有消費端 |
| D-07 | T-03 吊盤 | 只寫「槓桿繞 (170,90) 旋轉」 | 槓桿旋轉，吊盤依臂端座標**垂直懸掛** | 真實天平吊盤永遠鉛垂，否則砝碼會歪出盤面 |
| D-08 | T-03 砝碼排列 | 「單排最多 10，第 6 顆起折第二排」 | 每排 5 顆、最多 2 排 | 原文自相矛盾；以「第 6 顆折第二排」為準 |
| D-09 | T-04 事件日誌 | 所有事件全記 | `balance:change` 節流 120ms | 物理迴圈每秒 ~60 筆會瞬間洗掉 20 筆額度 |
| D-10 | T-04 全部重設 | 「reset() + 清空事件日誌」 | 先清空日誌、再 reset 三元件 | 先 reset 再清空會吞掉重設軌跡 |
| D-11 | 派工腳本 | `tools/run_worker_tasks.py` 提示詞寫 `grid:change`/`theme`/`top`/`bottom` | 一律以 R1 正本為準（`ten-frame:*`/`fill-color`/`top-count`/`bottom-count`） | 該腳本提示詞與契約衝突，照抄必 G-6 紅燈；建議 BP 廢棄 |
| D-12 | T-01 滿十角標 | R1 未載明（原實作有 `.badge` 顯示「10」） | **移除 `.badge`** | 為同時滿足「每檔 ≤12KB」與 TCK 新增程式碼，移除裝飾性角標；滿十訊號仍由金色閉鎖框 + `ten-frame:full` 承擔 |
| D-13 | T-04 調試鉤子 | R1 未載明 | `window.__t04 = {flightMs, flightDy, flightCount, treeStep}` | 拋物線時長與分解樹步進若無可讀狀態，驗收只能靠肉眼（TCK-08 禁止）；僅調試台暴露，元件本體不受污染 |

---

## 五、新增工單請求：TCK-09（規格內部矛盾，需 BP/AGY 重簽）

| 項目 | 內容 |
| :--- | :--- |
| **衝突條文** | R1 AC-01-4「觸控熱區 ≥44×44px」 vs TCK-02「30px 格 + 3px 間距」+ TCK-05(d)「相鄰熱區不得重疊」 |
| **算術證明** | 兩顆相鄰熱區要各 44px 且不重疊，水平 pitch 至少 44px → 5 格需 220px，加 padding/border 後單盒 ≥232px，兩盒 ≥464px > 390px。三者不可同時成立 |
| **本輪取捨** | 保留「不重疊 + 兩盒並排（TCK-02 硬需求）」，熱區降為 **33×33px**（仍 > Apple 24px 最低建議，但 < 44px） |
| **請求裁決** | (A) 接受 33px 熱區並修改 AC-01-4；(B) 放寬「兩盒並排」為 390px 上下堆疊，換回 44px；(C) 放寬「不得重疊」 |
| **風險** | 若 BP 選 (B)，`playground.html` 的 390px 緊湊排版與 `AC-04-6` 需同步改寫 |

---

## 六、可重跑指令全集（BP 覆核用）

```powershell
# 機械化閘門（G-1 / G-4 / G-5 / T-01~T-03 全量 AC）—— 只認 exit code
node tools/ac_gate.js
# 期望：GATE_GREEN (12 checks, 0 failed)，Exit Code 0

# T-04 三端（CDP 真實視口）
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=390x900
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=768x1000
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=960x1000

# 幾何實測
node tools/ac_run.js app/playground.html tests/ac_geometry_body.js --viewport=960x1000

# 三端截圖（同時跑 AC）
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=390x900  --shot=reports/20261105_2035_g1_visual_spec/evidence/t04_390.png
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=768x1000 --shot=reports/20261105_2035_g1_visual_spec/evidence/t04_768.png
node tools/ac_run.js app/playground.html tests/ac_t04_body.js --viewport=960x1000 --shot=reports/20261105_2035_g1_visual_spec/evidence/t04_960.png
```

---

## 七、待 BP 裁決事項

1. **TCK-09**：44px 熱區與「兩盒並排 + 不重疊」的三角矛盾，需三選一。
2. **D-12**：為體積閘門移除滿十角標，是否接受？
3. **D-13**：`window.__t04` 調試鉤子是否准予保留？
4. **D-06**：`balance:clamped` 的 `field` 鍵是否准予保留？
5. **D-11**：`tools/run_worker_tasks.py` 是否作廢（提示詞與 R1 契約衝突）。
6. **G-8 人類手感**：手機 390px 實機把玩 33px 熱區、天平阻尼手感、分解樹三步節奏。

<!-- WORKER_SELF_CHECK: 本報告所有 Exit Code 均來自實際執行；所有 PASS 行均為工具原始輸出貼上，無人工改寫 -->
