# N-3-17 時鐘教具重修與補齊 10 題驗收報告（2026-11-22）

## 1. 範圍
G3 `N-3-17`「時間（『日』、『時』、『分』、『秒』）」：現有 5 題體檢、`time_concept_lab.html` 時鐘教具重修、`Q06–Q10` 補題、`shell.js` 題號參數傳遞、兩支驗證腳本解硬編碼、四道門禁、Light/Dark 390×844 CDP 截圖目視、`git commit` + `git push origin main` 上線。全程由本機 OpenCode CLI（Hy4 Flash）主導，未呼叫 Antigravity／視覺模型。

## 2. 原 5 題與舊時鐘缺陷診斷明細

### 2.1 原 Q01–Q05 盤點
| 題號 | 題型 | 正解／索引 | 判定 |
|---|---|---|---|
| Q01 | 秒針一圈＝60 秒＝1 分 | `60秒 (1分鐘)`／1 | 數學正確、無重複 |
| Q02 | 24 小時制 15:40→下午 3:40 | `下午 3 時 40 分`／0 | 正確 |
| Q03 | 10:25→11:10 經過 45 分 | `45 分鐘`／1 | 正確（借 1 時→70−25） |
| Q04 | 2 日 6 時＝54 時 | `54 小時`／2 | 正確 |
| Q05 | 11:40＋80 分＝下午 1:00 | `下午 1:00`／1 | 正確 |

真題本身全對、無鬧割；**真正缺陷是帳實不符**：`N-3-17.json` `question_count:5` 對上 `curriculum.json` 的 `10`；`verify_curriculum_131.js` 只查 `>0`、`verify_n317.js` 把「5 題／答案 `[1,0,1,2,1]`」硬編碼，反而把缺口合法化。

### 2.2 舊教具六大缺陷
| # | 缺陷 | 實證 |
|---|---|---|
| B1 | `?q=` 完全未實作 | 教具無 `URLSearchParams`；`shell.js:501` 直接 `frame.src = q.component_path`。10 題永遠同一時刻，連動＝0 |
| B2 | 鐘面只有 4 個數字 | SVG 寫死 12/3/6/9，缺 1–11 |
| B3 | Dark 未用 theme tokens | 自訂色票＋硬編碼 `#fff/#64748b`；`updateClock()` inline `body.style.background` 晝夜漸層直接蓋掉深色底；theme bridge 設了 `data-theme` 但 CSS 無對應規則 |
| B4 | 指針配色不符 | 黃時針／白分針／純紅秒針，非指定深灰米白、鼠尾草綠亮青、暖橘紅 |
| B5 | 固定 `width:390px` | 窄於 390px 橫向溢出 |
| B6 | **三針從未真正轉動（CDP 新抓到的更深缺陷）** | 舊碼把 SVG 屬性語法 `style.transform="rotate(300deg, 100, 100)"` 寫進 CSS；Chrome 判為無效值，`style.transform` 實測為空字串。角度公式 `(h%12)*30+m*0.5` 雖對，但視覺上是死針 |

## 3. 變更
- `app/components/time_concept_lab.html`：補 1–12 數字＋60 刻度（5 分大刻度）；`QUESTION_SCENES[1..10]`＋`?q=` 解析，每題對應時刻／橫幅／真實按鈕動作；三針改合法 CSS `rotate(deg)` + `transform-box:view-box`；移除 inline 晝夜背景，全面改用 `theme-tokens.css` 語意變數並定义 `html[data-theme="dark"]` 高對比指針色；`width:100%;max-width:390px`；高度 420px、無 `100vh`。保留原 4 幕與所有既有函式／按鈕契約。
- `data/units/G3/N-3-17.json`：`question_count:10`，補 Q06 秒針讀時刻（9 時 50 分 25 秒）、Q07 分秒換算（200 秒／320 秒 100 進位誘答）、Q08 時日反向換算（72 時＝3 日）、Q09 滿 60 進位加法（下午 3:25／2 時 85 分誘答）、Q10 借 1 時當 60 分減法（1 時 45 分／1 時 85 分誘答）。
- `app/shell.js`：僅對 `time_concept_lab.html` 的 iframe src 附加 `?q=${state.qIndex+1}`，其餘 130 單元不受影響。
- `tools/verify_n317.js`：改 10 題契約、答案序列 `[1,0,1,2,1,2,1,2,3,0]`、100 進位迷思誘答檢查、課綱帳實比對。
- `tools/verify_n317_cdp.js`：改 10 題；新增 `?q=1..10` 逐題時刻／時針角度／版面巡檢、Q06/Q09/Q10 真實按鈕、Dark 計算樣式高對比、Light/Dark 截圖輸出。
- `_scratch/fix_n317/`（已 gitignore）：診斷計畫、CDP log、兩張截圖。
- 既有未階段化的 `AGENTS.md`（前次 N-3-17 里程碑）保持原樣，未納入本次 commit。

## 4. 驗證指令與真實 Exit Code
| 指令 | Exit Code |
|---|---|
| `node tools/verify_curriculum_131.js` | 0（131 條目／6 年級／帳實一致） |
| `node tools/verify_app_shell.js` | 0（6 年級 × 131 卡，CONSOLE_NOISE_COUNT=0） |
| `node tools/verify_n317.js` | 0（完整 10 題真值＋100 進位誘答＋課綱帳實） |
| `node tools/verify_n317_cdp.js` | 0（四幕＋10 題連動＋Dark 高對比＋截圖，全綠） |
| `git commit` / `git push origin main` | 見下方「實際部署紀錄」 |
| `curl -I https://math-108.pages.dev/...` | 見下方「實際部署紀錄」 |

**CDP 實測證據**：body 420px、4 幕、60 刻度、12 數字、零橫向溢出；`?q=1..10` 時刻依序 10:00 / 15:40 / 10:25 / 09:00 / 11:40 / 09:50:25 / 00:03:20 / 00:00 / 14:45 / 08:20，時針角度逐題比對（如 Q06 295°、Q09 82.5°）；60 秒進 1 分、10:45+90→12:15、14:45+40→15:25、8:20+1:45→10:05 全數真實事件通過。Dark 計算樣式：底 `rgb(22,27,38)`、時針 `rgb(242,232,213)`、分針 `rgb(111,211,199)`、秒針 `rgb(255,154,107)`。

**雙模式目視（Hy4 Flash 親自）**：`_scratch/fix_n317/20261122_n317_light_q06.png` 米白底，深灰時針逼近 10、鼠尾草綠分針指 10、暖橘秒針指 5，1–12 數字與 60 刻度清晰；`..._dark_q06.png` 深藍底，米白／亮青／亮橘三針高對比，無黑針黑底、無重疊破版。

## 5. 結論
四道門禁真實 Exit 0，無 [FAKE-GREEN]、無 [UNVERIFIED]；舊「死針」與「5 題帳實不符」兩大根因已移除，10 題全數可連動授課。

### 實際部署紀錄（補登）
- `git commit` → Exit 0，`26b44c4`，6 檔案變更（585 insertions / 262 deletions）；`_scratch/`、`reports/20261122_N315_ACCEPTANCE.md`、`reports/20261122_N316_ACCEPTANCE.md` 均隔離未納入。
- `git push origin main` → Exit 0（`c6e769a..26b44c4`）；pre-push hook 觸發 Cloudflare Pages 實體部署成功，預覽 `https://4d010711.math-108.pages.dev`。
- `curl.exe -I https://math-108.pages.dev/app/components/time_concept_lab.html` → Exit 0（`HTTP/1.1 200 OK`，CF-RAY `a5e5b03389fe5c10-TPE`）。
- `curl.exe -s https://math-108.pages.dev/data/units/G3/N-3-17.json` → Exit 0，線上回傳 `"question_count": 10` 與 `G3-N-3-17-Q10`，確認新版題庫已上線。
