# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## ⏯️ 目前做到哪
- **【斷點｜G3 真題普查未完成】**（2026-11-22）：22 份 `EXAM REAL/G3` 卷已全數唯讀擷取為文字＋頁面圖（64 頁，EXIT=0）；7 批逐題抽取完成 5 批（A1/A2/A3/A4/A6，共 484 題，皆覆核計數吻合），A5／A7 兩批未寫檔。基準雙檔與統計總表尚未產出。完整斷點見 [`reports/20261122_001_G3_REAL_EXAM_CENSUS_HANDOFF.md`](reports/20261122_001_G3_REAL_EXAM_CENSUS_HANDOFF.md)。**開新框先接這條**：確認 A5/A7 抽取檔 → 跑 `python _scratch/real_exam_pool/assemble_pool.py` → 貼 S-3-2／S-3-4 前 10 題預覽 → 暫停待選題。做好前禁改 `data/units/G3/*.json`。
- **G3 第二棒全線收官並上線（2026-11-22）**：N-3-1（Q01 補至 4 選項／Q02、Q05 `answer_raw` 對齊正解／fallback 統一 420）、N-3-3（Q09 補至 4 選項）修復完成。
- R-3-1／R-3-2／D-3-1 各補 Q06–Q10（共 15 題），前 5 題補 `trap`／`fallback_height:420`／`?q=1..5`，後 5 題 `?q=6..10`；三教具新增 q-badge/q-focus 十段模式、Light/Dark 色票，D-3-1 移除 `100vh`。
- 新增 `tools/verify_r31.js`、`verify_r32.js`、`verify_d31.js`、`verify_g3_contract_240.js`；功能 commit `a2efb4c` 已 push，pre-push hook 部署 `8c503201.math-108.pages.dev`。

## 🚦 目前狀態
- 🟢 8 道指令 Exit 0：三單元靜態驗證、240 題契約、CDP 雙模式 60 張截圖、curriculum131、app_shell、全 G3 體檢（240/240、shorts=[]、答案／選項異常 0）。
- 🟢 線上：https://math-108.pages.dev （Cloudflare Pages 自動部署成功）。
- ⚠️ 工作樹尚有 2 個既有未追蹤報告：`reports/20261122_N315_ACCEPTANCE.md`、`reports/20261122_N316_ACCEPTANCE.md`（非本次產出，勿動）。
- ⚠️ 全 G3 體檢剩 78 筆 WARN（68 fallback_height、10 詳解欄位），皆在範圍外既有單元，第二棒未擴大改寫。
- 📝 L3／031 記憶中樞已停用，無需更新。

## ➡️ 下一步
1. 若要把上述 78 筆 WARN 清零，另開第三棒並先取得授權（這是全局正規化，違反軍規三外科手術原則）。
2. 若要清理 N315／N316 untracked 報告，另案先問使用者。
3. 目前無功能待辦；新單元比照 `reports/20261122_G3_AUDIT_AND_BATCH2_COMPLETE.md` 的「修復→補題→教具→靜態→CDP→報告→push」管線。

## ⚠️ 注意事項與避坑
- **`answer_raw` 必須等於 `choices[answer_index]`**：全 G3 契約掃描會擋；只改字串不改正解索引（軍規二）。
- **教具 q-mode 慣例**：`#q-badge` 必為 `Q01..Q10`、`#q-focus` 不可空白、主容器≤420px、`theme-tokens.css`＋`THEME_CHANGE` 橋接缺一不可。
- **CDP 雙模式**：`Page.navigate` 後須 `postMessage(THEME_CHANGE)` 再量測；Light/Dark 底色相同即視為雙模式失效。
- **SSOT 母片**：角色只讀 `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g3_mimi\ready\` 的 `loop_*.webm`＋`mouth_frames_v2/`；禁讀 mp4 預覽、禁 Antigravity。
- <!-- DEGRADED: 通道二 A Server SSH 無私鑰／密碼，歷次皆改本機 gh + pre-push hook 部署；bundle/scp 步驟未執行。 -->

## 🕐 最後更新
- 2026-11-22 17:55 · Hy4 Flash @ DESKTOP-6ELKIRH（G3 真題普查斷點寫入）
- Git：功能 `a2efb4c` ✅ 已推；收工同步（AGENTS.md／handoff.md／普查斷點報告）待推。

## 20261122 S-3-2 / S-3-4 真題替換批次（本輪收尾）
- 已完成 S-3-2 全 10 題段考真題替換、S-3-4 清為 4 題真題（含 N-3-1 積木跨域 2 題）。
- 兩教具已重修：S-3-2 一題一圖且不劇透；S-3-4 移除超綱分頁與浮動題號徽章。
- 五道門禁 exit 0；CDP 28/28 雙模式截圖量測 exit 0。驗收報告：reports/20261122_S32_S34_REAL_EXAM_FIX.md。
- 下次接續：S-3-4 題組 Q02 為作圖題轉方法辨識，如需更貼近原卷可再覆核；111-1期末 三(2) 試算答案仍標【待覆核】。
- 既有未提交 AGENTS.md 記事與 N315/N316 報告非本輪改寫，未納入本 commit。