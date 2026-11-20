# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **N34 米米概念小教室（當前主線）— 全部三階段完成**：
  - 第一步：6 段曉臻女聲 WAV 共 101.64 秒、去背 PNG、`timeline.json`、`stage1_report.json`（皆 Exit 0）。稽核 `visual_model_called=False`／`comfyui_redraw_called=False`／`bottom_gradient=False`。
  - 第二步（對嘴預覽）：`mimi_talking_loop.mp4`（1024²/25fps/78幀/3.12s）＋ `preview_lipsync.mp4`（1024²/30fps/3049幀/101.63s + AAC，2.43 MB）Exit 0；六場景 5 姿勢、`seamlessClone(NORMAL_CLONE)` 嘴部融合、口腔 inpaint、領口零閃動、新版 S02 手指清晰——皆目視驗收。
  - 第三步（最終三層合成）：`app/assets/classroom_videos/N34_Final.mp4`（1920×1080/30fps/3049幀/101.633s/H.264+AAC/約 19.5 MB < 25 MiB）Exit 0。Layer 1 教室底圖＋Layer 2 黑板教具卡（場景淡入）＋Layer 3 去背對嘴米米（場景彈性動態、實心雙腳）。
  - **S05 直式 Rev2 修正**：位值標籤移到商上方、完整 5 層直式（百位減法 4＋橫線／落下 15／個位減法 12＋橫線／個位橘框餘數 3）、餘數框與藍色檢驗橫幅保留 30px 淨空；已重新壓片，S05 截圖 `_scratch/mimi_n34/final_check_s05.png` 目視正確。
- **G3-N-3-9（既有已上線）**：黏土定格全片 84.72 秒 / 18.72 MB，`tools/release.py` 四階段全綠，https://math-108.pages.dev 生效。

---

## 🚦 目前狀態與客觀事實
- 🟢 **N34 最終成片已完成並本地 commit，待使用者確認 S05 畫面後才 push**。
- 🟢 **本站線上穩定**：G3-N-3-9 全片與小教室雙端裝配完成，既有功能正常。
- 🧱 **關鍵路徑**：
  - 台詞/圖層/黑板設定：`docs/mimi_classroom/N34_script.json`
  - 最終成片：`app/assets/classroom_videos/N34_Final.mp4`
  - 驗證截圖：`_scratch/mimi_n34/final_check_s04.png`、`final_check_s05.png`
  - 施工腳本（均在 `_scratch/mimi_n34/`，gitignored）：`20261120_015_build_blackboard_cards.py`（Layer 2，Rev2）、`20261120_016_build_matte_and_test.py`（白鍵去背＋實心雙腳）、`20261120_017_final_composite.py`（三層合成壓片）
  - 來源素材：`tools/mimi_classroom/mimi_assets/`；旁白/去背/時間軸：`_scratch/mimi_n34/{narration_all.wav,nobg/,timeline.json}`
- ⚠️ **環境副作用（未還原，依使用者指示維持）**：系統 Python 裝 mediapipe 0.10.21，numpy 2.4.6→1.26.4、protobuf→4.25.9、另裝 pyyaml。本流程已不依賴 mediapipe。
- 📝 **L3 筆記**：無 Obsidian MCP 工具，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. 使用者確認 `_scratch/mimi_n34/final_check_s05.png` 直式算式無誤。
2. 確認後才 `git push`（pre-push hook 會自動部署 Cloudflare Pages）；**目前僅本地 commit，嚴禁已 push**。
3. 依既有流程跑 `tools/release.py` 更新版號與 `sw.js`（本輪未執行，因使用者未要求）。

---

## ⚠️ 規則提醒與避坑指南
- **只重繪 Layer 2 即可**：音軌與米米對嘴已驗收，S05 修正只動黑板圖卡＋重新合成，勿重跑 edge-tts／ComfyUI。
- **去背鐵律**：白鍵泛洪去背，底部實心雙腳（morph close 補洞，非整列強制不透明 → 會產生白橫條）；禁呼叫視覺模型或 ComfyUI 重畫兔子。
- **直式排版基準（Rev2）**：位值標籤在商上方；行距約 45–50px；餘數框底 570、藍色橫幅頂 600，淨空 30px；所有橫線與數字完整不截斷。
- **Cloudflare Pages 單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`（實測約 19.5 MB）。
- **本次未動的使用者工作**：`docs/108課綱...md` 修改與 `reports/retros/RETRO_S39_COMPOSITE_VIDEO.md` 保持原樣、未 commit。

---

## 🕐 最後更新
- **時間**：2026-11-20
- **更新者**：OpenCode @ DESKTOP-6ELKIRH
- **Git 狀態**：✅ 僅本地 commit（`3344c7d` 初版 + S05 Rev2 新 commit）；**未 push**

---

## 📚 本輪新增：APP_PROJECT_INDEX.md（教材設計 AI 總覽）
- 已重建根目錄 `APP_PROJECT_INDEX.md`（187 行 / 25,720 bytes，5 區塊驗證 Exit 0）。
- 資料來源：本專案 + `D:\ANTIGRAVITY\034_anatomy_interactive_svg`（4 個正式 Web Component + 3 原型 + CLI 參數）+ `D:\ANTIGRAVITY\036_local_painter`（1~6 年級 IP 矩陣：皮皮/波波/米米/多米/凱爾/歐爾；G2 波波與 G3 米米完整，其餘僅藍圖）。
- 誠實落差已寫入 §5.3：G4~G6 72 條題庫尚未建立；G3 宣告 240 題實際 205 題；S-3-1 id 誤用；034 無分數圓餅/位值盒/數線。
- 使用者既有 uncommitted 變更（`docs/108課綱…md`、`reports/retros/RETRO_S39_COMPOSITE_VIDEO.md`）**未動、未 stage**。
- 下一步：開新對話框再繼續；`git push` 仍待使用者確認 S05 畫面後執行。
