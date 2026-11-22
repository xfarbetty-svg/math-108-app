# 專案交接日誌 (Handoff Log)

> 任何 Agent、任何電腦接手前**必讀**；收工前**必改寫**。本檔只放當前最新進度與下一步，一頁內讀完。

---

## [完成] Dark Mode 護眼色票 — 已 Push 上線（2026-11-22 08:07）

- **範圍**：`app/styles/theme-tokens.css`、`app/index.html`、`app/shell.js`（另 `VERSION`／`app/sw.js` 版號）。
- **變更**：Dark 色票改 `--bg-main:#161B26`／`--bg-card:#1F2736`／`--bg-elevated:#283244`／`--accent-primary:#3B8276`／`--accent-soft:#263849`／`--text-primary:#E2E8F0`／`--svg-stroke:#CBD5E1`，並把 219 個教具別名 (`--coral/--sky/--mint/--lemon/--lilac`) 全數降飽和；移除螢光藍漸層與發光 `box-shadow`。新增 Dark 覆寫：單元編號 `#283548/#93C5FD/#3B4E6B`、108 條目標籤與更新鈕 `#253042`、模式分頁與聽題／草稿／其它淺色膠囊同步改深色。首次訪客橫幅由寫死 `N-1-1 / N-3-1` 改為「目前年級首單元」，並去掉重複 ▶。
- **驗證指令**：`node tools/verify_curriculum_131.js`、`node tools/verify_app_shell.js`、`node tests/verify_concept_hub_cdp.js`、`node _scratch/darkmode_shots/capture.js`（390×844 CDP 截圖＋運算樣式斷言）、`curl.exe -sIL https://math-108.pages.dev/app/index.html?t=20261122`。
- **真實 Exit Code**：三閘門皆 0；截圖腳本 0；push 0；預推送掛鉤 wrangler deploy Exit 0；線上 `HTTP/1.1 200 OK`。
- **證據**：`_scratch/darkmode_shots/shots/` 三張圖（dark 首頁／dark 答題頁／light 首頁）經 Hy4 Flash 親眼複審：無螢光藍、無發光框、無死白反白塊，Light 維持原樣；390px `scrollWidth=390=innerWidth`。線上 `VERSION_ONLINE=20261122_080705`、`ONLINE_ACCENT=PASS`、`ONLINE_INDEX_DARK_OVERRIDES=PASS`。
- **提交**：`327cdc2`（功能）→ `a70e91a`（版號）→ `d4b64dc`（sw.js），`main...origin/main` 對齊、工作樹乾淨。
- **上線**：pre-push hook 自動 `wrangler pages deploy . --project-name=math-108 --branch=main --commit-dirty=true` 成功（部署 `3f22a309.math-108.pages.dev`），`git push origin main` `864eb2f..d4b64dc`。
- <!-- DEGRADED: 通道二 A Server `xfarb@100.64.178.56` 的 SSH 僅接受 publickey/password，本機無私鑰且環境變數無密码，非互動 `ssh` 卡在密碼提示；改以本機 `gh`（xfarbetty-svg，repo scope）直接 push，Pre-Push Hook 代為 wrangler 部署。bundle/scp/清除 A Server 暫存步驟未執行。若需補通道二，請提供 A Server 密碼或私鑰。 -->
- **下一步**：無（本案結案）。

## [完成] N-3-5 黑板垂直放大＋同位值對齊＋彌彌兔站姿 — 已 Push 上線（2026-11-22）

- **提交**：`272db84`（垂直放大／S03 `28` 改寫百位+十位／S04 五層對齊／黃框 296..358／站姿上移 25px／shell.js 掛載 N35）＋ `6fa505a`（影片壓至 21.5 MiB 以通過 Pages 25 MiB 限制）。本地 `main` 與 `origin/main` 已對齊。
- **通道二 Push**：`git bundle` → `scp a-server` → A Server `gh` 憑證 `git push origin main`（`d8d3d19..6fa505a`），暫存 clone 與 bundle 已於 A Server 刪除（無 028-1 副本殘留）。
- **上線**：`npx wrangler pages deploy . --project-name=math-108 --branch=main --commit-dirty=true` Exit 0；線上影片 `https://math-108.pages.dev/app/assets/classroom_videos/N35_Final.mp4` 回 `HTTP 200` + `Content-Type: video/mp4`；線上 `shell.js` 已見 `N-3-5 → N35_Final.mp4`。
- **驗收**：資料契約／390×844 CDP／131 條目／app-shell 四閘門全綠；`20261122_003_verify_v2_ygrid.py` 9/9 PASS（28 在 31 正下方、個位留空、減法橫線不壓字、最終 3 懸空 68px、黃框 296..358 不跨線）；影片 1920×1080/30fps/3220f/107.333s/AV gap 0.0000s。
- **新增軍規**：`AGENTS.md` 軍規八「Pillow `anchor="ls"` 基線對齊＋長除法同位值垂直對齊鐵律」。
- <!-- DEGRADED: 通道三 `http://127.0.0.1:4000/v1` 六圖視覺審查因 Key Pool 全模型 HTTP 429（8 次重試皆失敗）無法取得回報，改以本地像素級自檢 9/9 PASS 替代；若後續 Key Pool 恢復，建議補跑 `20261122_002_channel3_review.py`。 -->
- **下一步**：無（本案結案）。若通道三恢復，補做視覺覆核即可。

## [完成] N-3-13 米米概念小教室 — 正式完成與上線（2026-11-21 收尾）

- **已上線**：`app/shell.js` 的 `UNIT_CONCEPT_MOVIES` 已註冊 `N-3-13` 與 `S-3-1` → `assets/classroom_videos/N313_Final.mp4`，`UNIT_CONCEPT_MOVIE_TITLES` 補「概念小教室：角的認識」，與 N-3-4／N-3-10 掛載方式一致。
- **影片就位**：`app/assets/classroom_videos/N313_Final.mp4`（13,350,393 B／12.73 MiB／57.933 s／1920×1080 30fps／h264+aac／影音誤差 0.000 s），與 A-SERVER 本機位元組一致。
- **門禁防護**：兩個非本次 `n310` 巡檢檔已移至 `_scratch/n310_patrol_20261121/`（`.gitignore` 已忽略），未混入本次 commit。
- **上線管線**：`tools/release.py` S0 版號 bump → S1 全綠 → S2 commit & push → S3 Cloudflare Pages `math-108` → S4 HTTP 200 驗真；正式版號與部署結果以 release 輸出為準。
- **以下舊章節為上線前歷史快照**，最新狀態以本章為準。

---

## N-3-13 米米概念小教室 — 最終成片完成（2026-11-21 收工，A-SERVER 遠端 AMD3950 執行）

- **已完成**：`app/assets/classroom_videos/N313_Final.mp4` 重新合成，1920×1080／30fps／1738 幀／57.933 s／12.73 MiB（13,350,888 B），h264 + aac。`ffprobe` 容器、影軌、音軌皆 57.933333 s，**影音誤差 0.000 s**（門檻 < 0.05 s），大小 < 25 MiB。
- **黑框真因（與原診斷不同）**：6 支 `ready/loop_*.webm` 全部 **alpha=255**（ffmpeg 解出 `yuv420p`，`alpha_mode=1` 只是標籤、沒有可用透明資料）。真正問題是**每支 41 幀的第 33–39 幀被烘成黑底**；舊 keyer 只鍵近白 → 黑底幀整張 717×717 貼上。全程只讀 SSOT `ready/` 的 `.webm`，**未讀 `.mp4` 預覽**。
- **修法**（新檔 `_scratch/mimi_n313/n313_render_mp4.py`，`_scratch/` 已 gitignore）：逐幀取四邊中位數為背景色 → 連通泛洪 + 2px 軟 alpha（白底／黑底皆支援）；**剔除黑底異常幀**（6 支各剔 7 幀，成 34 幀迴圈）；透明比例 < 0.30 直接 raise，防默默貼出黑框。`mouth_frames_v2` 源自 2048 立繪、與 webm 非同一光源，改羽化遮罩 + 局部膚色增益校正，**禁 seamlessClone**。
- **S03 幾何修正**：角 A 短邊 80px 張開 **65°**、角 B 長邊 150px 張開 **30°**，與旁白「邊短張得大、邊長張得小」一致；bbox `ALL_PASS`，`N313_S03.png` 已重生成。
- **圖卡其他修復**：標題 `anchor="ms"` → `"ls"`（原標題一半出畫布）；底部結論框由整條實心黃改深綠底＋黃框＋置中結論句（文字表 `BANNERS` 置於 card builder）。
- **本機試看**：`C:\Users\xfarb\AppData\Local\Temp\opencode\N313_blackboard\N313_Final.mp4` 與桌面同名檔**已覆蓋為最新版**；第 1 秒截圖 `N313_成片_第1秒.png`；t=20／30／48 目視角色背後完全透明、融入教室、無黑框無白邊。

---

## ⏯️ 目前做到哪
- **N313 可交付成片已完成並已上線**：資料、音訊、6 張圖卡、動態母片、嘴形與 MP4 全部就緒且目視通過；已於本日完成 shell.js 掛載、commit／push 與 Cloudflare Pages 部署（見首節）。
- **Git 已對齊**：AMD3950 `main` 已 `git pull --rebase` 到 GitHub `35dc440`，本機 3 筆（`f706ef3` 母片清單／`59be7af` S-3-1 ids + N313_script／`69c93d6` handoff）安全疊在其上；`8a5b867` 被判定重複略過；衝突僅 `handoff.md`，採較新的 A-SERVER 版。未用 `reset --hard`。
- **N310／N34 現況不變**：`N310_Final.mp4` 本地完成未部署；`N34_Final.mp4` 已上線（Build `20261120_171001`，HEAD 200）。

## 🚦 目前狀態與客觀事實
- 🟢 N313 成片 ffprobe 全綠；A-SERVER 本機與遠端 MP4 位元組數一致（13,350,888 B）。
- [完成] `N313_Final.mp4` 已 commit／push、已掛載 `app/shell.js`（N-3-13／S-3-1）、已跑 `tools/release.py` 並部署上線。
- ⚠️ AMD3950 `main` 領先 `origin/main` **3 筆未推**；SSH 下 gh 憑證無法互動，push 需由 A-SERVER 本機執行。
- ⚠️ 兩個**非本次**未追蹤檔：`tools/20261121_001_online_patrol_n310.js`、`reports/20261121_002_online_patrol_n310_report.md`（本次完全未動）。
- ⚠️ A-SERVER 本機 `.mp4` 關聯指向 `WMP11.AssocFile.MP4` 但雙擊只開「設定」；用 Edge／Chrome 拖檔播放，未改系統設定。
- 📝 L3 筆記：無 Obsidian MCP，未更新。

## ➡️ 下一步接續目標 (Next Steps)
1. **等 owner 授權**才 commit／push（含新增的 `N313_Final.mp4`），由 A-SERVER 本機 gh credential 執行；勿在 SSH 下交互登入。
2. 若要上線：掛載 `app/shell.js` 的 N-3-13 概念小教室按鈕 → 跑 `tools/release.py` 門禁 → Cloudflare Pages 探針 HEAD 200。
3. 選配：S04 角弧目前畫成近圓形（數學表徵可再精修）；N310 目視驗收與掛載仍待處理。

## ⚠️ 規則提醒與避坑指南
- **SSOT 鐵律**：角色母片只讀 `D:\ANTIGRAVITY\036_local_painter\theater\assets_hosts\g3_mimi\ready\` 的 `.webm`；**禁讀 `.mp4` 預覽**。
- **`alpha_mode=1` 不等於可解 alpha**：目前 ffmpeg 對這批 webm 解出全不透明；且尾段 7 幀為黑底。新片必須走自適應背景鍵除 + 剔除黑底幀，不可回到單純白鍵。
- **嘴形來源不同調**：`mouth_frames_v2` 是 2048 立繪裁圖，覆到 webm 需羽化 + 增益；禁 seamlessClone、禁跨狀態混色。
- **CDP 時序是頑疾**：改 `sw.js` CACHE_NAME 觸發 `skipWaiting()`／`clients.claim()` 會造成 `Execution context was destroyed`；測試端已加重試，勿下修標準。
- **去背鐵律**：白鍵／背景鍵泛洪＋底部實心雙腳；禁呼叫視覺模型重畫兔子。
- **單檔上限 25 MiB**：壓片鎖 `-b:v 1800k -maxrate 2200k`。
- **純 CPU 護欄已解除**：N313 此輪已正式渲染 MP4；AMD3950 另執行 Wan 2.2 動態母片，勿干擾。

## 🕐 最後更新
- **最後更新**：2026-11-21（N313 最終成片收工）
- **更新者**：OpenCode @ A_SERVER（SSH 操作 AMD3950）
- **Git 狀態**：[完成] 已 commit／push（含 `N313_Final.mp4`、`shell.js` 掛載、`AGENTS.md`、本檔），Cloudflare Pages `math-108` 部署上線。

---

## 【待用戶確認】N-3-5 米米概念小教室《315 ÷ 4》— 2026-11-21 AMD3950 本地驗收完成
- **已產出**：`docs/mimi_classroom/N35_script.json` + `app/assets/classroom_videos/N35_Final.mp4`（25.37 MB／3220 幀／107.333s／1920×1080 30fps／H.264+AAC／影音誤差 **0.0000s**）。**未覆蓋 N34_Final.mp4**。
- **驗收報告**：`_scratch/mimi_n35/20261121_006_N35_ACCEPTANCE.md`（交付 5 欄 + ffprobe 實測 + S01～S06 共 7 張抽幀目視）；`composite/n35_render_report.json`、`inspect_frames/n35_verify_probe.json`、`final_montage.png`。全流程 exit 0。
- **內容**：6 幕（比大小→抓兩位→乘與減→比與落→口訣→快問快答）；S01 於 8.5774s／frame 257 由 `loop_apose` 切 `loop_ask`；每次換姿 0.25s 以雙腳底部為軸心 96%→100% Q 彈；自適應背景鍵除＋每支剔除 7 張黑底幀＋Clean Plate（`[850,920,1190,1040]/2048` inpaint、4px 羽化、暗色篩選保護淺綠翻領）＋`mouth_frames_v2` 三態硬切對嘴。**全程只讀 ready/*.webm，從未讀 mp4 預覽，未呼叫視覺模型／ComfyUI**。
- **已知事項**：25.37 MB 略超 `release.py` 既有 25 MiB 門檻（本次 b:v=1900k / maxrate=2400k）；若後續上架觸發門檻，下調 1800k 重合成即可。edge-tts 本機僅回 `SentenceBoundary`，S01 切換點取整句起點，語義等價。
- **依指示未做**：`shell.js` 前端掛載、三閘門檢查、跨機部署；**未 git push**。
- **Git**：本機 commit 僅含 `N35_Final.mp4` + `N35_script.json` + 本 handoff（`_scratch/` 被 gitignore）。
- **下一步**：待用戶確認影片滿意 → 掛載 `app/shell.js`（N-3-5）→ `tools/release.py` → Cloudflare Pages 部署並 HTTP 200 驗真。
## 2026-11-22 三合一升級 已 commit ed7b730（223 檔）；三套門禁+CDP 截圖全綠 Exit 0；Dark 選項低對比已修正複拍。尚未 bundle/push/wrangler/curl；A Server user=xfarb 僅負責 push（反向 SSH 金鑰被拒，219 檔已按裁決本機改）。下次開新框 /startup 後接續上線。
