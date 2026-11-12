# Handoff - 028_1 國小數學APP

## ⏯️ 目前做到哪
- **【一年級 4 大單元教具 × 段考真題速驗展演台正式落地】**：
  - 產出檔案：[app/g1_exam_showcase.html](file:///D:/ANTIGRAVITY/028-1_國小數學APP/app/g1_exam_showcase.html)
  - 整合 4 大一年級代表性課綱教具：
    1. **N-1-3 湊十拆十**：`<ten-frame-grid>`（十格陣＋拋物線飛補＋三步分解樹動態演示）
    2. **N-1-2 雙軌差值**：`<dual-track-diff>`（雙軌一對一對齊＋金色殘差框揭曉）
    3. **R-1-1 算理天平**：`<balance-beam>`（真實力矩阻尼擺動回正＋右盤手動 +1g 砝碼）
    4. **N-1-4 數線反推**：`<glass-number-line>`（毛玻璃遮罩未知起點＋向左弧形倒退回溯＋破招算式揭曉）
  - **修復雙擊 `file://` CORS 阻擋問題**：實作「雙模題庫降級（Dual-Mode Fallback）」，在 HTML 內嵌 40 題段考真題備份，免起本機 HTTP 伺服器，直接雙擊即可 100% 秒開。
  - **施工與驗證全綠**：調用**通道一 OpenCode CLI 實體帶手腳工兵**施工與修復（$0 雲端消耗），瀏覽器探針驗證 390px 零溢出，G-9 機械化閘門 28/28 checks 全綠，Git Commit `5571d99`。

## 🚦 目前狀態
- **可運行**：本機隨時可雙擊開啟 [app/g1_exam_showcase.html](file:///D:/ANTIGRAVITY/028-1_國小數學APP/app/g1_exam_showcase.html) 或 [app/index.html](file:///D:/ANTIGRAVITY/028-1_國小數學APP/app/index.html)。
- **各單元累計**：一年級全量 9 大單元（90 題真題）、二年級 9 大核心單元（90 題真題）均為完整可用狀態。
- **工作區狀態**：Git working tree clean，無任何未追蹤或未提交之暫存檔。

## ➡️ 下一步
1. **實機手感把玩**：在手機或實機瀏覽器開啟 `app/g1_exam_showcase.html`，把玩 4 大教具在 360px~390px 視口下的觸控手感與算理破招動畫。
2. **二年級條目推進**：繼續依 AutoFlow 規劃二年級下一個官方課綱單元 **N-2-13 鐘面的認識**（時針分針齒輪聯動、幾點幾分與經過時間向量鐘面教具）。
3. **全域學習流整合**：首頁加入闖關進度持久化（純 LocalStorage 離線存儲）。

## ⚠️ 注意事項
- 嚴格遵守「AGY 只出規格藍圖，代碼施工調用 OpenCode CLI」鐵律，維持 $0 額度消耗。
- 專案所有單元題卡均保持純靜態離線秒開，零外部 CDN / 遠端伺服器依賴。

## 🕐 最後更新
- **時間**：2026-11-12 22:31:00 (UTC+8)
- **更新者**：Antigravity (AGY) @ DESKTOP-6ELKIRH
- **Git Commit**：`5571d99` (本地已 commit，本機無 remote 不需 push)
