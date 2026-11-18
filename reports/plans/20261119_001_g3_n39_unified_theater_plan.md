# G3-N-3-9 一體化教室劇院重構計畫（待確認）

> 依 AGENTS 軍規四「>3 步先出計畫」，先陳述施工範圍與唯一待決議事項，經「繼續」後才動手。

## 一、現況探查結果（已查證，非推測）

| 項目 | 現況 | 證據 |
|---|---|---|
| 硬分割 | `.actor-zone{width:48%}` + `.blackboard-zone{width:52%}` 併排 flex | index.html L191-200, L336-345, L872-969 |
| 角色渲染 | 預設 `#mimiVideo`（832×480，純淺藍底全身兔）覆蓋 SVG | Video 影格經通道三辨識：角色居中、背景 solid light blue → 一體化教室會出現藍色方塊 |
| 台詞 | `PHASES` 為**舊版**短句 | index.html L1127-1144 |
| 時間軸 | HTML 硬編碼 83.94s（舊），JSON 為 108.61s（新） | index.html L1045-1053 vs JSON L5-46 |
| **音訊實長** | act1=22.44s, act2=20.30s, act3=25.27s, act4=17.06s，全集 84.74s | ffprobe 實測（git 顯示音訊與 JSON 剛被更新） |
| 開口驗收 | 既有 `tests/verify_g3_n39_theater_cdp.js` 只驗影片 src／高度／console，**未驗遮擋、未驗 48:52、未驗台詞** | L230-310 |
| 通道三 | `http://127.0.0.1:4000/v1` 在線，`gemini-2.5-flash` 可用 | `/v1/models` HTTP 200 |

## 二、施工範圍（只動必要檔案）

1. `app/scenes/g3_n39_theater/index.html` — 主重構
2. `tests/verify_g3_n39_theater_cdp.js` — 更新契約（改驗 SVG 角色 + 幾何零遮擋 + 4 幕截圖）
3. 新增通道三五閘門驗收腳本 + 報告（`.md`，含 5 欄交付貼）

## 三、設計方案

### 3.1 一體化教室（移除 48:52）
- 刪除 `.actor-zone` / `.blackboard-zone` 與所有 `48%`/`52%` 宣告，改單一 `.classroom-stage` 絕對座標佈局。
- 層級：木質教室底圖（含天花板暖光、護牆板）→ 掛牆黑板（木框＋粉筆槽）→ 講台 → 米米 → 字幕條。

### 3.2 零遮擋（幾何硬保證）
- 水平不重疊分帶：米米 `x∈[2%,27%]`／講台 `x∈[29%,42%]`／黑板 `x∈[44%,98%]`。
- z-index：底圖 0 < 黑板 2 < 講台 3 < 米米 5 < 字幕 8。
- CDP 機械斷言：`mimiRect.right <= podiumRect.left` 且 `mimiRect.right <= boardRect.left`，任一相交即 Exit 1。
- 米米改 **SVG 透明底全身像**為主體（影片的淺藍底會破壞一體化，故退場；檔案保留不刪）。

### 3.3 台詞與時間軸對齊
- 4 幕 `bubble`/`caption` 全數改用 JSON/task card 新版台詞。
- 黑板視覺：Act1 完整 12 等分＋虛線；Act2 十塊跳動＋`1/12` 卡；Act3 橫式 `3/12+7/12=10/12`＋分母金色「地基鎖定框」＋分子聚合；Act4 金色獎章＋「進入挑戰」。
- 時間軸改由 `audio/g3_n39_timeline.json` 載入（SSOT），保留離線 fallback。

## 四、唯一待決議：JSON 時間與音訊實長衝突

新版 JSON 標註總長 **108.61s**，但實際 mp3 只有 **84.74s**（各幕誤差 12%~43%）。
若直接照 JSON 數字播放，第 22.44s 音訊已進 Act2、畫面卻還停在 Act1，會產生音畫斷裂（違反 Gate Total）。

| 選項 | 做法 | 優點 | 代價 |
|---|---|---|---|
| **A（建議）** | 以 ffprobe 實測值修正 JSON 的 `start/duration/end`，index.html 再讀 JSON | 真正「對齊 JSON」且音畫同步；JSON 恢復為可信 SSOT | 需一併改 JSON（4 組數字） |
| B | 照 JSON 數字寫死，不改 JSON | 字面完全遵從 | 每幕音畫錯位 5~10s，Gate Total 必驗不過 |
| C | 只改 HTML，用實測值但 JSON 維持 108.61s | 音畫同步 | HTML 與 JSON 不一致，違背「對齊 JSON」 |

## 五、驗收（通道三五閘門）

- Gate A1~A4：四幕個別截圖 → Gemini 視覺判定「米米零遮擋／空間一體／教具正確／無抽搐」。
- Gate Total：四幕合成一張全片長軸圖 → 判定「無黑屏、無音畫斷裂、全片零遮擋」。
- 每閘門輸出 PASS/FAIL + 瑕疵清單；任一 FAIL → Exit 1，自癒一次後仍 FAIL 即停手。
- 交付報告貼 5 欄：範圍／變更／驗證指令／真實 Exit Code／證據。

---
**等待：請回「繼續（選 A/B/C）」或指定選項。**
