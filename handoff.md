# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必更新**。本檔只交接當前最新實體進度與下一步。

---

## ⏯️ 目前做到哪
- **G3-N-3-9 阿德曼實體黏土定格教學全片大滿貫落地發布 (Exit Code 0)**：
  - **歷史痛點徹底消滅**：徹底揚棄前任工兵 4 張靜態截圖循環 84 秒假成功事故、Wan 2.2 崩壞與 48:52 硬切線。
  - **全流程五大工單 100% 閉環完工**：
    1. **Gate 0 (底圖延伸)**：`sample_mimi_seed30105.png` 向右自然延伸 16:9（1366×768），全身白色毛絨黏土偶米米，黑板與桌面連貫（特採合格）。
    2. **Gate 1 (定格微動)**：12fps 音量包絡口型對嘴 + 面部真皮無縫眨眼 + 10s 抬手卡點 + 黏土 boil 微粒（PASS）。
    3. **Gate 2 (黑板算理)**：`blackboard_visuals.py` 繪製 Act 1~4 日系溫潤粉筆手繪教具（12 格巧克力平分、1/12 條特寫、分母金色地基框「分母不動」、分數小達人獎章），幾何安全區零遮擋（PASS）。
    4. **Gate Total (全片壓製)**：以 1800kbps 標準教育片碼率直接自 2,034 幀無損原圖壓合，精準控制在 **84.72 秒 / 18.72 MB (17.85 MiB)**，完全低於 Cloudflare Pages 25 MiB 限制（PASS）。
    5. **聲調外科手術精修**：精準定位第 5.78 秒「超好吃」被微軟 Edge-TTS 誤唸為四聲「超號吃」之問題，透過同音音素對齊修正（`超郝吃`），FFT 基頻（消除 276Hz 陡降轉為 160~180Hz 平穩）與 Groq Whisper Large-v3 雙重檢核 100% 呈現標準三聲（ㄏㄠˇ）。
  - **APP 前端雙向導流與播放器全面裝配**：
    1. 在 `app/shell.js` 中正式登記 `"N-3-9": "assets/video/g3_n39_concept_final.mp4"`，題庫舞台頂部工具列正式亮起橘色「🎬 觀念微電影」按鈕。
    2. 在 `app/components/fraction_concept_lab.html` 頂部導航新增第一頁籤「🎬 動畫課堂」，預設內嵌 HTML5 原生 16:9 播放器（`#clayVideo`），學生一進小教室即可一鍵播放全片，切換具象操作自動暫停。
  - **Cloudflare Pages 全自動發布上線**：
    - 執行 `tools/release.py` 自動化管線：S0 快取破除（注入版號 `20261119_120548`）$\to$ S1 20 項確定性守門員全綠 $\to$ S2/S3 部署上傳 $\to$ S4 遠端探測全綠驗真！

---

## 🚦 目前狀態與客觀事實
- 🟢 **當前狀態**：G3-N-3-9 影音教學全片與小教室雙端裝配 100% 完工，Cloudflare Pages 正式線上生效，工作區乾淨。
- 🧱 **關鍵代碼與資產位置**：
  - 劇院全片 MP4：`app/scenes/g3_n39_theater/video/g3_n39_full_theater.mp4` (18.72 MB)
  - 概念小教室 MP4：`app/assets/video/g3_n39_concept_final.mp4` (18.72 MB)
  - 修正版曉臻語音：`app/scenes/g3_n39_theater/audio/g3_n39_hsiaochen.mp3` & `act1.mp3`
  - 概念小教室組件：`app/components/fraction_concept_lab.html` (含 `#clayVideo` 與活動零)
  - 外框主控腳本：`app/shell.js` (含 `UNIT_CONCEPT_MOVIES["N-3-9"]`)
  - 正式線上網址：https://math-108.pages.dev
- 📝 **L3 筆記狀態**：本次在無 Obsidian MCP 工具的環境收工，L3 筆記未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. **下一個年級單元規劃或微教具擴展**：
   - 延續 108 課綱進度，針對三年級尚未落地之新單元或微教具進行評估與落地（或依使用者指示開展全新單元）。
2. **實機使用者反饋覆核**：
   - 在手機端與平板端實際操作 https://math-108.pages.dev 之 G3-N-3-9 概念探索小教室，確認流暢度與聲音表現。

---

## ⚠️ 規則提醒與避坑指南
- **Cloudflare Pages 單檔上限 25 MiB**：本專案已完全將全片控制在 18.72 MB，未來壓片一律鎖定 `-b:v 1800k -maxrate 2200k`。
- **PWA 快取破除規範**：任何重大靜態資源或頁面更新，必須跑 `tools/release.py` 執行版號更新與 `sw.js` 破除，防止瀏覽器快取舊代碼。

---

## 🕐 最後更新
- **時間**：2026-11-19 12:25
- **更新者**：Antigravity (AGY 監工) @ DESKTOP-6ELKIRH
- **Git 狀態**：✅ 已推 (origin/main)


---

## N34 米米概念小教室 — 步驟 4 斷點（2026-11-20）
- **已完成**：四個目錄、7 張圖片複製與雜湊比對、`docs/mimi_classroom/N34_script.json`（S01 PNG 修正）、
  `tools/mimi_classroom/20261120_001_stage1_build.py`（Exit 0）、6 段 WAV（101.64 秒）、
  `timeline.json`、7 張去背 PNG、`stage1_report.json`。
  - 稽核：`visual_model_called=False`、`comfyui_redraw_called=False`、`bottom_gradient=False`、
    `foot_guard_ratio=0.06`、`tts_sources={"local_edge_tts":6}`。
- **步驟 4 狀態**：已查證 LivePortraitKJ 全部節點 schema、驅動影片、ComfyUI 輸入目錄位置，
  並確認原始碼中「`relative_motion_mode != off` + retargeting = 鎖頭鎖眼只動嘴唇」。
  **但 `mimi_talking_loop.mp4` 與 `preview_lipsync.mp4` 尚未產出**（步數上限中斷）。
- **交接文件**：`docs/mimi_classroom/N34_STEP4_HANDOFF.md` 內含完整 12 節點 API workflow、
  參數值、Audio-Driven Gate（RMS + 0.15s 滞回）實作步驟，下個對話框直接照做即可。
- **下一步**：開新對話框 → 讀上開交接文件 → 複製 `mimi_apose_closed.png` 進 ComfyUI input →
  跑 workflow → 產出兩支 MP4 → 請使用者驗收 → 才進入第二階段 OpenCV 黑板合成。
- **Git**：僅提交我新增的 `docs/mimi_classroom/`、`tools/mimi_classroom/` 與本 handoff；
  `docs/108課綱...md` 修改與 `reports/retros/RETRO_S39_COMPOSITE_VIDEO.md` 為既有使用者工作，未動。
