# 專案進展看板 (Progress Board)

> 更新時間：2026-11-16 17:08 (Session 53 收工存證)  
> 當前進展：完成通用 CDP 視覺審查工具鏈 (capture_preview.js) 落地，全域 pr / plan-pr 規範正式納入多模態實機視覺盲審標準！

## 🗺️ 課綱單元進度總覽 (131 條)
- **一年級 (G1)**: 11 / 11 條目 100% 落地 (50 題真題 · 32 套教具 · CDP 驗真)
- **二年級 (G2)**: 24 / 24 條目小教室 100% 解鎖上線！
  - [x] 24 套概念探索實驗室全量上線（純前端日系繪本、曉臻自然女聲語音、手機 390px 緊湊適配）
  - [x] 臺北市內湖國小 111~113 三學年度共 12 份真題 PDF 全數入庫（`EXAM REAL/G2/`）
  - [ ] 段考真題題庫封裝中（等待 PLAN+PR 流程啟動 N-2-1 打樣）
- **三年級 (G3)**: 24 / 24 條目大滿貫 (240 題真題 · 24 套概念小教室 100% 落地 · 實機全綠)
- **高年級**: 0 / 72 條目 (課綱結構骨架已就緒)

## 🛡️ 實機守門員
- `verify_concept_hub_cdp.js`: PASS (Exit 0, G2 24 套小教室導航實機驗真)
- `verify_g2_concept_labs.js`: PASS (Exit 0, 25 套 G2 概念實驗室驗真)
- `verify_app_shell.js`: PASS (Exit 0, 6 年級 131 條目驗真)
- `verify_audio_singleton.js`: PASS (Exit 0, Gate 4 微軟曉臻語音單例)
- `release.py`: PASS (Exit 0, Cloudflare Pages 實體部署版號 20261116_091421)
