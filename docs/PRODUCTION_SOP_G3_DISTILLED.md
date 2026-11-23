# G3 經驗蒸餾與教具／真題生產規範（PRODUCTION SOP — G3 DISTILLED）

> 適用範圍：本規範為 G3 全冊 24/24 收官後蒸餾之強制標準。未來開發 **G1／G2／G4／G5／G6** 時自動繼承，與 `AGENTS.md` 七大軍規同時生效；如與舊慣例衝突，以本規範為準。
> 狀態：2026-11-23 正式生效｜依據：G3 24/24 全滿編上線、YouTube 總合集 `M4N_UNwBT5Y`、歷次 Session 32／35／36 覆盤。

---

## 鐵律一：真題與教具生動性（最重要核心）

### 1.1 100% 台灣國小真實段考題
- 題庫必須採集**台灣各縣市國小**（如台北市內湖國小等）**歷年真實期中／期末段考題**。
- 每題清楚標明**學校、學年度、出處**（見 `docs/G3_REAL_EXAM_MASTER_POOL.md` 做為 SSOT 範本）。
- **嚴禁 AI 憑空編造**脫離課綱的假題；嚴禁為「湊 10 題」把高階思維題閹割成找碴弱智題（Session 32 覆盤紅線）。
- 真題神聖不可侵犯：題目原文、數字、算式 100% 忠實對齊實體試卷。

### 1.2 互動教具與直式算理
- 互動單元必須包含**「一步一步看算理」動畫步驟拆解**與**可操作教具**（圓規、量角器、數線縮放等）。
- L2 物理操作題必須具備真實 `pointerdown/move/up` 事件監聽、旋轉軸心與磁吸貼齊；死圖假教具直接 Exit 1 退回。
- **強制雙向驗證深色模式（Dark Mode）與淺色模式的高對比度**：兩模式皆須抽幀目視，嚴禁暗灰字融進深色背景（G3 batch2 N-3-2 即為實修案例）。
- 單屏緊湊：教具高度 ≤ 420px、全屏總高 ≤ 740px、390px 視口零橫向溢出。

---

## 鐵律二：概念小教室影片製作

### 2.1 四幕暖米色無限畫布結構
固定四幕，順序不得省略：
1. **生活情境破題**
2. **圖像與動態高光拆解**
3. **段考易錯陷阱**：紅叉 `✗` vs. 綠勾 `✓` 對比
4. **三大口訣總結**

### 2.2 角色與排版安全底線
- **必須使用 `app/assets/mimi_poses/` 現成 3D PNG** 搭配 `full_stage` 全畫面走位與思考氣泡；**嚴禁任何 SVG 自繪角色**。
- 底部字幕黑框距視口底邊保留 **≥ 76px** 安全淨空（中心 `y ≤ 960`）。
- 每片渲染後**必須抽取 4 幕關鍵影格自檢**：「零疊字、零裁切、零前幕殘影滲入」三項全過才可掛載。
- 前幕殘影：每次轉幕須清乾淨上一幕元素，禁止跨幕元素滲色。

---

## 鐵律三：音訊、編碼與部署紅線

### 3.1 統一響度
- 全冊成片必須通過 FFmpeg `loudnorm` **雙階段校正**至 **`-14.0 LUFS`**（實測容差 -14.8 ～ -13.2；G3 實測 -14.02 ～ -14.03）。
- 音訊 AAC 48kHz／立體聲；影片 1920×1080／30fps／`yuv420p`／`+faststart`。

### 3.2 Windows 終端機編碼
- 執行印有 Emoji 或中文章節的 Python 腳本前，**必須設定 `PYTHONIOENCODING=utf-8`**（或先 `chcp 65001`），避免 `cp950` 拋 `UnicodeEncodeError` 崩潰。

### 3.3 Cloudflare Pages 大小隔離
- 單檔超過 **25 MiB** 的全冊總合集 MP4 **必須放在 `_scratch/`** 並列入 `.wranglerignore`。
- **嚴禁推入 Pages**；`.gitignore` 亦須含 `_scratch/`，確保不進 Git 提交。

---

## 鐵律四：YouTube 總合集與自動上傳 SOP

### 4.1 標準兩段式
1. `python tools/build_g3_youtube_compilation.py`：統一 1080p／30fps 串接，共用單元自動去重，並產出 `MM:SS` 章節時間軸。
2. `python tools/20261123_001_upload_g3_youtube_compilation.py`：讀章節檔、精修、刷新過期 Token、resumable 上傳、寫結果 JSON。

### 4.2 憑證與中繼資料
- 沿用 `d:\ANTIGRAVITY\034_anatomy_interactive_svg\token.json`（Scopes：`https://www.googleapis.com/auth/youtube.upload`），支援自動刷新過期 Token 並回寫。
- 國小教學頻道依規範設定 `selfDeclaredMadeForKids: true`、教育分類 `categoryId: "27"`、隱私預設 `unlisted`（確認無誤後再一鍵切公開）。
- 上傳完成必須回傳並存檔 `https://youtu.be/<VIDEO_ID>`，並以 oEmbed HTTP 200 驗真。

### 4.3 G3 全冊收官紀錄
- **24/24 單元全滿編上線**，概念小教室影片全數掛載 `app/shell.js`。
- **YouTube 總合集 ID**：`M4N_UNwBT5Y` → https://youtu.be/M4N_UNwBT5Y
- 結果 JSON：`reports/20261123_002_G3_YOUTUBE_UPLOAD_RESULT.json`
- 完整流程指南：`docs/YOUTUBE_UPLOAD_WORKFLOW_GUIDE.md`

---

## 交付前強制檢查清單（各年級通用的最後一道閘門）

- [ ] 每題可追溯到真實學校／學年度／出處，無 AI 杜撰題
- [ ] 教具具真實事件監聽，Dark／Light 雙模式高對比度皆目視通過
- [ ] 4 幕關鍵影格自檢：零疊字、零裁切、零前幕殘影
- [ ] 角色只用 `app/assets/mimi_poses/` 3D PNG，無 SVG 自繪
- [ ] 字幕黑框距底 ≥76px
- [ ] 全片 -14.0 LUFS 雙階段校正
- [ ] 大檔只放 `_scratch/`，`.gitignore` 與 `.wranglerignore` 皆已覆蓋
- [ ] `client_secret*.json`／`token*.json` 零納入 Git
- [ ] 上傳後 oEmbed 驗真並回報影片網址
- [ ] 未碰 `017\` 或「子由」
