# 斷點交接日誌 (handoff.md)

## ⏯️ 目前做到哪
- **G3 概念影片第 1/3 批已全線完工並上線**：
  - `N31_Final.mp4`（101.033s / 9.01 MiB）、`N32_Final.mp4`（97.767s / 8.49 MiB）、`N33_Final.mp4`（97.067s / 8.35 MiB）；皆 1920×1080 / 30fps / h264+aac / AV diff ≤0.004s / −14.03~−14.04 LUFS。
  - 新增 3 個插件：`tools/classroom_engine/units/n31_numbers.py`、`n32_add_sub.py`、`n33_multiply.py`；皆 `full_stage` 四幕、米米兔 4 組現成 PNG 走位、焦点高光、字幕中心 y=960。
  - `N-3-9` 音軌由 −19.37 拉至 −14.29 LUFS（`-c:v copy` 無損視訊流）。
  - `app/shell.js` 的 `UNIT_CONCEPT_MOVIES` / `UNIT_CONCEPT_MOVIE_TITLES` 已掛載 N-3-1／N-3-2／N-3-3；線上 HTTP 200 `video/mp4`，shell.js 映射 True。
  - 7 道門禁全 Exit 0（curriculum131／app_shell／tts_polyphone／n31／n32／n33／n33_concept）；`verify_n31.js` 單點修正 Q1 選項數 2→4（陈旧期待值，SSOT 已是 4 選項）。
  - 五欄驗收報告：`reports/20261123_014_N31_N32_N33_CONCEPT_MOVIES_ACCEPTANCE.md`。
- **前批已上線**：R-3-1／R-3-2／D-3-1／S-3-4 概念影片、`R32_Final.mp4`、`D31_Final.mp4`；24/24 盤點表見 `reports/20261123_G3_VIDEO_INVENTORY.md`（16 單元掛載，如實揭露）。

## 🚦 目前狀態
- commit `fe33be6` 已 push；Pre-Push Hook 已完成 Cloudflare Pages 實體部署（`f54e809b.math-108.pages.dev`，正式網址 https://math-108.pages.dev）。
- 工作能力正常，可直接接續下一批；本框已用 60+ 步，建議開新框。

## ➡️ 下一步（接續建議）
1. 依相同模板規劃 **第 2/3 批概念影片**（任務書尚待指定單元），先讀 `data/units/G3/` 對應 JSON 與 `r32_patterns.py`／`d31_tables.py`。
2. 或處理先前待確認的 `R-3-1／R-3-2／D-3-1` 教具 P0～P3 微調（報告 `reports/20261123_008_R31_R32_D31_AUDIT.md`）。
3. 新片渲染管線注意：tts_pipeline 與 render_video **雙重 loudnorm** 會讓新片落在約 −13 LUFS，須再跑一次 two-pass `loudnorm` + `-c:v copy` 才可達 −14 LUFS。

## ⚠️ 注意事項
- 破音字 SSOT 為 `app/js/audio_manager.js`；`tts_pipeline.py` 直接解析其 `POLYPHONE_FIXES`，新增規則兩邊需同步。
- 字幕中心 y=960（距底 ≥76px）、教具 ≤420px、全屏 ≤740px 規範不變；嚴禁 SVG 自繪角色，只用 `app/assets/mimi_poses/` 現成 PNG。
- 首輪抽幀抓到 3 類缺陷：文字重疊、verdict 間距不足、四位數乘積直式僅 3 欄；已修後重渲染，後續新片沿用 4 欄結果排版與 badge y=205。
- `_scratch/` 已 gitignore，維持隔離；嚴禁碰 `017\` 或「子由」。

## 🕐 最後更新
- **時間**：2026-11-23（UTC+8）
- **更新者**：OpenCode CLI @ DESKTOP-6ELKIRH
- **Git Push 狀態**：✅ 已推（功能 `fe33be6`；本筆收工同步連同 handoff／AGENTS 一併推送）
