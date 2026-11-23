# 20261123_009 TTS 破音字（奇數／奇偶）發音修復 — 5 欄結案報告

## 1. 範圍（Scope）
- 全站語音朗讀唯一前處理入口：`app/js/audio_manager.js` 的 `cleanTextForSpeech()`。
- 該入口同時餵給三條 TTS 路徑，故一次修補全覆蓋：
  1. 本地 `/api/tts?text=`（Edge-TTS 曉臻）
  2. 雲端備援 `math3-bank.pages.dev/api/tts?text=`
  3. `new SpeechSynthesisUtterance(clean)`（Web Speech 兜底）
- 未碰觸：`017\`、`子由`、任何題庫 JSON、任何畫面 DOM、`tools/release.py`、`app/shell.js`。

## 2. 變更（Changes）
| 檔案 | 變更 |
|---|---|
| `app/js/audio_manager.js` | 新增 `POLYPHONE_FIXES` 字典（`奇數→基數`、`奇偶→基偶`）與 `fixPolyphonePronunciation()`；`cleanTextForSpeech()` 開頭呼叫該函式；對外暴露 `fixPolyphonePronunciation`。共 +21 / -2 行。 |
| `tools/verify_tts_polyphone.js` | 新增單元驗證腳本（21 項檢查，vm 載入真實模組，不修改原始碼）。 |

設計約束落實：
- 僅回傳新字串，傳入文字（等價於題庫／DOM 原文）不被就地竄改。
- 完整詞精確匹配（`split/join`），非單字替換 → 不誤傷「奇怪、神奇、好奇心」。
- 已評估並刻意不改：`差數／相差`（chā）、`幾分之幾`（jǐ）— 引擎讀音已正確，改動反而有誤傷風險。

## 3. 驗證指令（Verification commands）
```powershell
node tools/verify_tts_polyphone.js        # 新增單元驗證（21 checks）
node tools/verify_audio_singleton.js      # Gate 4 音訊單例 + CDP 實機
node tools/verify_r32.js                  # R-3-2 題庫契約
node tools/verify_curriculum_131.js       # 131 條目大廳總檢
node tools/verify_app_shell.js            # shell CDP 全流程
git status --short                        # 隔離確認
git log -1 --format="%h %s"               # commit 鋼印
```

## 4. 真實 Exit Code
| 檢查項 | Exit Code |
|---|---|
| `verify_tts_polyphone.js`（21/21 PASS） | **0** |
| `verify_audio_singleton.js`（Gate 4 ALL PASS，含 219 組件／47 教室／CDP 2 次 /api/tts） | **0** |
| `verify_r32.js`（10 題契約全綠） | **0** |
| `verify_curriculum_131.js`（131 條目／59 ready／72 upcoming 全綠） | **0** |
| `verify_app_shell.js`（6 年級 131 卡 + N-1-1 全流程，CONSOLE_NOISE=0） | **0** |
| `git commit` | **0** |
| `git push origin main` + pre-push Cloudflare Pages 部署 | **0** |
| 線上探針 `https://73da313f.math-108.pages.dev/app/js/audio_manager.js` | **HTTP 200** |

## 5. 證據（Evidence）
- **核心輸出**：輸入 `柳丁兩兩一數剩 1 顆的奇偶推理，總數是奇數`
  → TTS 字串 `柳丁兩兩一數剩 1 顆的基偶推理，總數是基數`（Exact match，21 項全綠）。
- **邊界**：`奇怪→奇怪`、`神奇→神奇`、`好奇心→好奇心`、`差數與相差→差數與相差`、`幾分之幾→幾分之幾`；來源 `stem` 原文不變。
- **隔離**：僅 stage `app/js/audio_manager.js` 與 `tools/verify_tts_polyphone.js`；既有未提交檔 `handoff.md`、`reports/screenshots/concept_preview_mobile.png` 保持未暂存；`_scratch/` 未納入。
- **Commit**：`094e82b fix(audio): TTS 全站破音字校正 奇數/奇偶→基數/基偶，僅作用於朗讀字串不動 DOM/題庫；新增 verify_tts_polyphone.js 21 項驗證`（2 files changed, 92 insertions(+), 2 deletions(-)）。
- **Push**：`0674bdb..094e82b main -> main`；pre-push hook 自動執行 `wrangler pages deploy`，回傳 `Deployment complete` / `https://73da313f.math-108.pages.dev`。
- **線上驗真**：webfetch 該 JS 檔確認 `POLYPHONE_FIXES`、`奇數→基數`、`奇偶→基偶`、`fixPolyphonePronunciation(text)` 皆已上線（純前端離線架构不變）。

> 註：本報告檔為新檔，依工作區命名規則編碼 `20261123_009`。未修改任何全域設定檔（AGENTS 等）。
