# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## N313 黑板圖卡排版修正（2026-11-21 收工，A-SERVER 遠端 AMD3950 執行）

- **已完成**：6 張 1240×660 黑板圖卡 `N313_S01..S06.png` 全部重新生成於 AMD3950 `_scratch/mimi_n313/blackboard/`，Bounding Box 安全區＋防重疊檢查 `ALL_PASS`（Exit 0）。
- **新增腳本**：`_scratch/mimi_n313/20261120_019_build_n313_blackboard_cards.py`（遠端原本無 N313 畫圖腳本，僅有讀卡片的 `n313_composite.py`）。讀 `docs/mimi_classroom/N313_script.json`，每幕元件逐一登記 bbox：X∈[60,1180]、Y∈[110,509]，黃框頂部 Y≥510 不觸碰；任一越界或相交面積>2px² 即 raise 不產出。
- **各幕修復重點**：S01 三角板文字右移＋剪刀上移；S02 正例説明移至 (430,145)→bbox(235,122,624,149)，與兩條邊無重疊，反例文字/曲線置右上；S03 角 A/B 明確分欄（標籤水平間距 316px）、紅邊端點 y∈[252,386]、無穿黃框；S04 角 A/B 上移中央 y∈[303,396]、標籤分开；S05 三形中心 x=240/600/940、鈍角不再出界；S06 三句口訣行距均勻（第1/2/3句 y=164/224/295 起），無重疊。
- **同步副本**：6 張新圖已 scp 覆蓋 A-SERVER `C:\Users\xfarb\AppData\Local\Temp\opencode\N313_blackboard\`（size 15167/29676/26543/21685/20049/38561 與遠端一致）。
- **清理**：遠端暫存搜尋腳本 `find_n313_drawer*.py` 已刪除。
- **未做**：未執行 `n313_composite.py`、未渲染 MP4（依使用者指示待目視圖卡確認後再合成）。

---

## ⏯️ 目前做到哪
- **N313 概念小教室前置 — 資料＋音訊＋圖卡皆就緒**（本輪完成圖卡排版修正）：
  - `data/units/G3/S-3-1.json` ids 已修復為 `G3-S-3-1-Q01~Q10`；`node tools/verify_n313.js` Exit 0。
  - `_scratch/mimi_n313/` 產物：`docs/mimi_classroom/N313_script.json`（6 幕）、`timeline.json`（mouth 硬切換 `<0.24` 閉嘴／`[0.24,0.68)` 微張／`≥0.68` 大張；S01 15.12s…S06 4.91s）、`audio/S01..S06.wav`（曉臻 -5%）、`blackboard/N313_S01..S06.png`（本輪重繪，見上節）、`n313_composite.py`（尚未執行）。
- **N-3-10 米米概念小教室 — v2 成片本地完成、尚未部署**：`tools/mimi_classroom/20261120_002_n310_build.py` 重建 17.41MB/108s Exit 0；成片 `app/assets/classroom_videos/N310_Final.mp4`（18.12MB）；殘影已修（inpaint Clean Plate＋4px 羽化實心貼片、硬切換、禁 seamlessClone）；驗收圖 `no_ghost_check.png`；圖卡 `blackboard_montage.png` 已目視無遮擋。
- **N34 米米概念小教室 — 已上線**：`N34_Final.mp4`（19.5MB）掛載 `app/shell.js` 的 N-3-4／N-3-5；`tools/release.py` Build `20261120_171001` 全綠，https://math-108.pages.dev 驗證 HEAD 200。
- **S1 守門員時序強化**：`verify_audio_singleton.js`／`verify_app_shell.js`／`verify_concept_hub_cdp.js` 加重試，標準未降。

---

## 🚦 目前狀態與客觀事實
- 🟢 N313 六張圖卡 bbox 檢查全綠、已同步 A-SERVER 暫存；main 分支。
- ⚠️ 遠端 worktree 有 2 個**非本次**的未追蹤檔：`tools/20261121_001_online_patrol_n310.js`、`reports/20261121_002_online_patrol_n310_report.md`（先前 session 遺留，本次未 add／未動，留原 owner 處理）。
- ⚠️ `tools/release.py:160` commit message 寫死「G3 N-3-9…」，語意落差已知、未改（選配）。
- ⚠️ 環境副作用：系統 Python 曾裝 mediapipe 0.10.21、numpy 2.4.6→1.26.4 等；本流程已不依賴。
- 📝 L3 筆記：無 Obsidian MCP，未更新。

---

## ➡️ 下一步接續目標 (Next Steps)
1. **先目視驗收** A-SERVER `C:\Users\xfarb\AppData\Local\Temp\opencode\N313_blackboard\N313_S01..S06.png`（或遠端 `_scratch/mimi_n313/blackboard/`）；確認排版無誤後才執行 `_scratch/mimi_n313/n313_composite.py` 合成 N313_Final.mp4（本輪不做）。
2. 待目視驗收 N310 `blackboard_montage.png` 與 `N310_Final.mp4` 後，再決定是否掛載 `app/shell.js` 的 N-3-10 並走發布門禁。
3. 選配：修正 `tools/release.py:160` 寫死訊息；清理上述 2 個未追蹤檔。

---

## ⚠️ 規則提醒與避坑指南
- **純 CPU 前置護欄**：N313 僅 2D 圖卡／文字／JSON／音訊，未啟動 ComfyUI／GPU／MP4；AMD3950 另執行 Wan 2.2 動態母片，勿干擾。
- **只重繪 Layer 2**：修正只動黑板圖卡，勿重跑 edge-tts／ComfyUI。
- **CDP 時序是頑疾**：改 `sw.js` CACHE_NAME 觸發 `skipWaiting()`／`clients.claim()` 會造成 `Execution context was destroyed`；測試端已加重試，勿下修標準。
- **去背鐵律**：白鍵泛洪去背＋底部實心雙腳；禁呼叫視覺模型重畫兔子。
- **單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`。

---

## 🕐 最後更新
- **最後更新**：2026-11-21（N313 圖卡收工）
- **更新者**：OpenCode @ A_SERVER
- **Git 狀態**：待推（handoff 更新待 commit + push）
- **最新收工**：2026-11-21 A-SERVER 遠端修正 N313 六張黑板圖卡排版，bbox ALL_PASS，圖卡已同步本機暫存
