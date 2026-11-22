# 20261122 G3 全線 360/390 窄屏寬度零裁切修復驗收

## 5 欄結案
| 欄位 | 內容 |
|---|---|
| 範圍 | G3 24 單元／234 題／224 個不重複 `component_path` × 360×800、390×844；`D-3-1 ?q=10` 雙模式真實 CDP 覆核 |
| 變更 | 11 支元件：6 支固定 390px → `width:100%; max-width:390px`＋`viewport=device-width`；`table_cross_lab`／`pattern_reasoning_lab` 還原被拆斷的 `.q-focus` CSS（消除 CSS nesting 導致的 q-scene 覆蓋失效）；5 支 auto-height 教具收斂 gap/padding ≤420px；浮動徽章／SVG 通用的 right 安全區約束。新增 `tools/_cdp_util.js`、`tools/verify_d31_q10_cdp.js`、`tools/verify_g3_viewport_width.js` |
| 驗證指令 | `node tools/verify_d31_q10_cdp.js`；`node tools/verify_g3_viewport_width.js --phase pre`；`node tools/verify_g3_viewport_width.js --phase post`；`node tools/verify_g3_contract_240.js` |
| 真實 Exit Code | pre = 1（80/448 異常，如實記錄）→ post = **0**（448/448 0 溢出）；D-3-1 = **0**；題庫契約 = **0** |
| 證據 | `_scratch/g3_width_audit/WIDTH_AUDIT_REPORT.md`（修復前）、`WIDTH_AUDIT_REPORT_post.md`（修復後）、`audit_pre.json`／`audit_post.json`、`d31_q10/*.png` 4 張 |

## 修復前後
- 修復前：80/448 量測異常，11 支元件（固定 390px、CSS nesting 斷裂、高度 426–457px、放大鏡 SVG 誤判）。
- 修復後：448/448 0 溢出；D-3-1 ?q=10 由親自目視確認舊表格殘影／分頁按鈕重疊消失，`全票` 欄完整入屏，Light/Dark 皆然。

## 量測口徑
- 整頁與 iframe `scrollWidth > clientWidth`；所有可見 DOM（含分頁、浮動徽章、底部欄）`getBoundingClientRect().right > 視口寬`；SVG `<text>` `x > viewBoxWidth − 16`；容器高 > 420px。
- 非零原點的 nested SVG（放大鏡，內容被 `#app overflow:hidden` 裁去）排除誤判；此為量測口徑修正，非靜默吞錯。

## 提交
- 隔離 `_scratch/`、既有未提交 `AGENTS.md`、`handoff.md` 與 N31x 報告後，僅提交 11 支元件、3 支工具腳本與本報告。
