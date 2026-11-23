# handoff｜028-1 國小數學APP

⏯️ **目前做到哪**
- **S-3-4 幾何形體之操作概念小教室（微電影第 2 支）完工上線**：
  - **打破 25% 隔離牆**：升級 `tools/classroom_engine/stage_template.html` 支援 `full_stage` 模式，移除左側固定分割線，展開至 1920×1080 全屏無限畫布，並 100% 向下相容 S-3-3。
  - **米米兔 4 組高清教學姿勢**：自現有 3D 黏土風高精立繪提取並標準化至 `app/assets/mimi_poses/`（`pose_wave.png`, `pose_point.png`, `pose_think.png`, `pose_cheer.png`），經 Python RGBA 驗真無白邊且腳底基準線 1px 零誤差。
  - **全畫面平滑走位與音效節奏**：支援 `easeInOutCubic` 視口座標平滑走位、動態 `getBoundingClientRect()` 橘金焦點框、Web Audio 合成節奏提示音與 `✓` / `✗` 彈跳回饋。
  - **四幕考點與防超綱守門**：涵蓋正方體/長方體/球體/圓柱/圓錐之面、邊、頂點特徵，木棍排圖規律（Q01），圓規等距折線量取（Q02），嚴格排除五年級角柱/角錐超綱術語。
  - **成片驗真**：產出 `app/assets/classroom_videos/S34_Final.mp4`（1920×1080 / 30fps / 105.9s / 9.12 MiB / 影音誤差 0.001s），抽幀目視確認零遮擋無穿模。
  - **掛載上線**：已掛載至 `app/shell.js` 之 `UNIT_CONCEPT_MOVIES["S-3-4"]`。

🚦 **目前狀態**
- 可運行：本地 `verify_s34.js`、`verify_curriculum_131.js`、`verify_s33.js` 全套驗證閘門全部 Exit Code 0。
- 準備推送：Git commit + push 部署至 Cloudflare Pages。
- 隔離未提交：`reports/screenshots/`、`_scratch/`。

➡️ **下一步（1-3 項）**
1. 執行 `git add` 與 `git commit`，並推送到遠端 `git push origin main` 觸發 Cloudflare Pages 部署。
2. 驗證線上版本（https://math-108.pages.dev）之 S-3-4 概念小教室按鈕與影片播放運作正常。
3. 輸出 5 欄結案報告回覆使用者。

⚠️ **注意事項 / 踩坑**
- 米米兔座標系統：`#mimi-root` 位於外層 SVG 根節點，走位座標 `mimi.x` 與 `mimi.y` 必須為**螢幕座標（0..1920, 0..1080）**，不可直接傳入世界相機座標（如 4000+），否則角色會飛出螢幕外。
- 牌卡排版防遮擋：全畫面走位時，畫面左右兩側需各保留 ≥360px 淨空廊道（如米米兔站於 x=200 側邊），以確保教學動作與高光框不與圖形、公式文字發生重疊。
- 音效合成免外部依賴：利用 Python 標準庫 `wave` 搭配 FFmpeg `adelay` 與 `amix` 可在零外部檔案依賴下完成 48kHz 提示音精確混音。

🕐 **最後更新**
- 2026-11-23 by Gemini 3.8 Flash；Git：準備 commit & push S-3-4 概念小教室升級。

---

### 歷史交接索引（細節見各驗收報告）
- `20261123_012_*`（本期）：S-3-4 打破 25% 隔離牆、全畫面走位、4 姿勢圖與 S34_Final.mp4 交付。
- `20261123_011_*`：R-3-2 Q07/Q08 防劇透初始狀態、圖例叉叉一致性與桌面 720px 寬螢幕精修。
- `20261123_008_*`：R-3-1／R-3-2／D-3-1 30 題 CDP 60 組合唯讀盤點。
- `c7b6535`／`049028a` S-3-4 雙視口升級（Build 20261123_094918）已 push 部署；`2d59575` S-3-4 Q2 圓規複製教具已 push 部署。
- `a6fa716` G3 題庫 67 處開發備註清洗；`cc71420` S-3-2 四災難根治；`91c08b1` R-3-1／R-3-2／D-3-1 共 26 題真題替換。
- 早期：App Shell 統一 A/B/C/D（`20261122_005_*`）、G3 窄屏 224 path 零溢出（`20261122_G3_VIEWPORT_WIDTH_FIX.md`）。
