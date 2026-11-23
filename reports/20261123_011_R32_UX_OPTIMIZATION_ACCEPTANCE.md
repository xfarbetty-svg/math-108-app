# R-3-2 Q07/Q08 防劇透初始狀態、圖例一致性與寬螢幕比例精修 — 5 欄結案報告

日期：2026-11-23　｜　序列：20261123_011

## 1. 範圍
- `app/js/r32_pattern_engine.js`：
  - Q07（作品貼膠帶）：初始載入維持 `1 張`，重繪所有作品紙後於頂層繪製醒目共用膠帶＋紅色虛線叉叉（`stroke-dasharray="4,2"`）與「共用」標籤；狀態列改為結構推導提示（`目前 N 張：上緣 N 段 ＋ 下緣 N 段 ＋ 接縫 N-1 段`），**徹底杜絕直接印出正解「＝ 14 段」之劇透**。
  - Q08（梯形桌併桌）：初始載入維持 `1 張`，先繪製所有桌子與座位圓點，再於相接斜邊頂層繪製紅色虛線叉叉與「−2 人」標籤，避免被後續桌子座位遮擋；狀態列改為結構推導提示（`目前 N 張：相接斜邊少 2*(N-1) 個座位`），**徹底杜絕直接印出正解「＝ 14 人」之劇透**。
  - Q09、Q10：同步優化狀態列結構提示，全線消除「＝ 22 人」、「＝ 13 根」等預告正解字眼。
- `app/components/pattern_reasoning_lab.html`：
  - 修正 `<meta name="viewport">` 誤打之多餘字符 `>>`（消除畫面左上方懸浮 `>`）。
  - `body.q-mode` 隱藏 `.view-container`，徹底消除底層 Act 1 青蛙與舊按鈕殘影。
  - 電腦寬螢幕（1280×800）自適應：新增 `@media (min-width: 521px)`，使 `body` 與 `.q-scene` 合理延展置中至最大寬度 `720px`（落於規格要求 `680px～760px` 區間），`body.q-mode .q-scene` 移除內嵌卡片邊框，消除桌面版雙層空黑框。
  - 針對非互動靜態題型（Q01～Q04），加入 `.q-scene:not(.interactive) svg { max-height: 380px !important; width: auto !important; }`，杜絕桌面版 SVG 因寬度延展導致高度溢出 420px 門禁。
- `tools/verify_r32_interactive_cdp.js`：
  - 升級為序列 `011`，新增 `initExpected` 斷言（驗證 Q07、Q08 初始數量皆為 1）。
  - 擴充 `LEAK_WORDS` 劇透字眼過濾清單（包含 `＝ 14 段`、`＝ 14 人`、`＝ 22 人`、`＝ 13 根`）。
  - 實機截取 `_init.png`（初始載入畫面）與 `_step.png`（點擊增加後的推演畫面）。
- 嚴格守門：隔離 `_scratch/` 與既有未提交檔，未碰觸 `017\` 或「子由」。

## 2. 變更
- **防劇透初始推導（Q07 & Q08）**：
  - 載入時 Q07 顯示 1 張作品（「➖ 少貼 1 張」停用，「➕ 多貼 1 張」啟用），狀態列提示「`目前 1 張：上緣 1 段 ＋ 下緣 1 段（作品獨立）`」。學生點擊 ➕ 逐步推演至 5 張，狀態列顯示「`目前 5 張：上緣 5 段 ＋ 下緣 5 段 ＋ 接縫 4 段（相鄰共用少貼 4 段）`」，保留學生自行運算 5+5+4＝14 段之思維空間。
  - 載入時 Q08 顯示 1 張桌子（「➖ 少 1 張」停用，「➕ 多 1 張」啟用），狀態列提示「`目前 1 張：獨立梯形桌，共有 5 個座位`」。點擊 ➕ 推演至 4 張，狀態列提示「`目前 4 張：相接斜邊少 6 個座位（被併掉不坐人，每多 1 張多 3 人）`」，不直接印出 14 人。
- **圖例與 SVG 視覺 100% 一致（Q07）**：
  - 接縫處明確呈現「黃色醒目共用膠帶」＋「清晰紅色虛線叉叉（`stroke-dasharray="4,2"`）」＋「紅色『共用』文字標籤」，與下方圖例文字「`黃色＝膠帶　紅色叉叉＝共用接縫（少貼 1 段）`」完全對應。
- **寬螢幕（1280×800）比例舒展置中**：
  - 手機版（390×844）維持 390px 緊湊單屏入眼（高度 $\le 420\text{px}$、零橫向溢出）。
  - 桌面版（1280×800）寬度自適應展開至 720px 置中（`m.left === m.right === 280px`），消除雙層空黑框與多餘內框，圖形、文字、按鈕皆獲得最佳可讀性與操作舒適度。

## 3. 驗證指令
```bat
node --check app/js/r32_pattern_engine.js
node tools/verify_r32.js
node tools/verify_r32_interactive_cdp.js
node tools/verify_r31_r32_d31_dual_cdp.js
node tools/verify_curriculum_131.js
node tools/verify_g3_remaining_concepts.js
node tools/verify_app_shell.js
node tools/verify_tts_polyphone.js
node tools/verify_g3_contract_240.js
node tools/verify_shell_choices_cdp.js
node tools/verify_g3_viewport_width.js --only pattern_reasoning
```

## 4. 真實 Exit Code
- 上述 11 道門禁指令全部 **Exit Code 0**！
  - `verify_r32_interactive_cdp.js`：6 題 × 2 視口 × 2 模式 = 24 組合全部通過，初始為 1、推演遞增、零劇透、零黑填充、間距 $\ge 12\text{px}$。
  - `verify_r31_r32_d31_dual_cdp.js`：3 單元 × 10 題 × 2 視口 = 60 組合真實點擊全數通過，桌面置中嚴格檢驗通過。
  - `verify_g3_viewport_width.js`：10 題 × 2 視口 = 20 次實機量測 0 溢出。
  - `verify_app_shell.js`、`verify_shell_choices_cdp.js`：整合測驗全線綠燈。

## 5. 證據
- 實機截圖檔案：
  - `_scratch/r32_interactive/20261123_011_Q07_desktop_light_init.png`（Q07 桌面初始 1 張無劇透）
  - `_scratch/r32_interactive/20261123_011_Q07_desktop_light_step.png`（Q07 桌面推演 2 張醒目共用膠帶＋紅色虛線叉叉）
  - `_scratch/r32_interactive/20261123_011_Q08_desktop_light_init.png`（Q08 桌面初始 1 張 5 座位無劇透）
  - `_scratch/r32_interactive/20261123_011_Q08_desktop_light_step.png`（Q08 桌面推演 2 張斜邊扣減 −2 人）
  - 以及對應之 Dark Mode 與 Mobile（390×844）截圖，已逐張目視檢核無誤。
- 線上部署：
  - Commit 與 Push 完成後同步上線 Cloudflare Pages（https://math-108.pages.dev）。
