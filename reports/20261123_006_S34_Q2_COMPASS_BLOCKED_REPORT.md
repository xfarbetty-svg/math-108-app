# S-3-4 Q2 圓規複製教具改造 — 結案報告（發布受阻）

## 1. 範圍
- 改動：`app/components/solid_geometry_lab.html`（僅 `?q=2` 的 `compassScene()`＋事件；q=1/3/4 未動）、`app/components/square_rectangle_lab.html`（自癒補 audio_manager）、`tools/release.py`（commit message 改如實）、`tools/verify_s34_q2_compass_cdp.js`（新）、`reports/20261123_001_S34_Q2_COMPASS_PLAN.md`（新）、`reports/20261123_02~05_S34_Q2_*.png`（截圖，被 .gitignore 排除）。
- 未碰 `017\`、未碰「子由」；一次性除錯腳本隔離於 `_scratch/`（已 gitignore）。

## 2. 變更
- 4 段折線甲可點擊（端點圓點＋透明加粗點擊區）；點擊後圓規以垂直平分線定位、張角依段長調整，兩腳精準對齊端點，高亮＋「✓ 已量取」，啟用「📍 移到 A 點虛線截取此段」。
- 按鈕：圓規保持同一張角移到虛線游標（A 或前段終點），畫等長彩色實線＋半圓弧刻度；右上進度 `已複製 N / 4 段`；截取後清選取（強制逐段量取）。「↺ 重置」歸零。
- 不渲染解析文字、不代答選擇題。版面 420px、零溢出、Light/Dark。
- 自癒：補兩套概念小教室的 `audio_manager.js`（原本 47 套中僅這 2 套缺，為 HEAD 既有問題）。

## 3. 驗證指令與結果
| 指令 | 結果 |
|---|---|
| `node -e "...new Function(script)..."` | Exit 0，JS_PARSE_OK |
| `node tools/verify_s34.js` | Exit 0，4 題契約全綠 |
| `node tools/verify_s34_q2_compass_cdp.js` | **Exit 0**，4 組合（390×844/360×800 × Light/Dark）×4 段，圓規兩腳誤差 0.06–0.12px、總長 259.9px、重置全綠 |
| `python tools/release.py`（第 1 次） | Exit 1：Gate 4 缺 audio_manager（既有）→ 已自癒 |
| `python tools/release.py`（第 2 次） | Exit 1：`verify_g3_remaining_concepts.js` S-3-2 呼叫 `switchAct()` 不存在（HEAD 既無，stale 驗證器）→ 依硬約束停手 |

## 4. 真實 Exit Code
- 教具本身與專屬 CDP：**0**（全綠）。
- 發布：`release.py` **1**（兩次皆為既有門禁債，非本次改動造成）。

## 5. 證據
- 截圖：`reports/20261123_02_S34_Q2_light_390x844.png`、`..._03_..._360x800.png`、`..._04_..._dark_390x844.png`、`..._05_..._dark_360x800.png`（已視覺覆核：無穿模、無文字遮擋）。
- CDP 輸出末行：`S34_Q2_COMPASS_CDP_VERIFIED — ALL PASS（4 組合 × 4 段量距＋截取＋重置）`。
- **未 commit、未 push、未部署**（硬約束：第 2 次非 0 停手）。目前工作樹含 S0 產生的 `VERSION`／`app/index.html`／`app/sw.js` 版號變更，以及既有未提交的 `AGENTS.md`／`handoff.md`／兩份 N315/N316 報告。

## 待使用者裁決
`tools/verify_g3_remaining_concepts.js` 的 S-3-2 段落仍呼叫已移除的 `switchAct()`（HEAD 版本即無此函式）。請決定：授權同步修正該 stale 驗證器後重跑 release（第 3 次），或維持停手。
