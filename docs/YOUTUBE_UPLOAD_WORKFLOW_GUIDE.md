# 國小數學二年級影片 YouTube 自動化上傳流程指南

本流程整理自我們先前在 **`036_local_painter`** 成功將二年級教學影院（如 N-2-1 小熊木匠、N-2-2 小熊波波）上傳至 YouTube 的完整技術路徑與憑證配置。G3 全冊總合集的實戰紀錄見文末第 6 節。

---

## 📌 1. 核心檔案落點與資產拓撲

先前實作中，流程與憑證分布在兩個專案之間：

| 角色 | 實體路徑 | 說明 |
| :--- | :--- | :--- |
| **憑證金鑰中心** | `d:\ANTIGRAVITY\034_anatomy_interactive_svg\client_secret.json` | Google Cloud Console 下載之 OAuth 2.0 用戶端密鑰 |
| **授權 Token (SSOT)** | `d:\ANTIGRAVITY\034_anatomy_interactive_svg\token.json` | 包含 `refresh_token` 的授權權杖（腳本自動刷新回寫） |
| **上傳主力腳本** | `d:\ANTIGRAVITY\036_local_painter\_scratch\upload_g2_n22_youtube.py` | 具備自動斷點續傳、Token 自動續約之完整上傳腳本 |
| **前期示範腳本** | `d:\ANTIGRAVITY\036_local_painter\_scratch\upload_concept_video.py` | N-2-1《小熊木匠》上傳腳本 |
| **上傳結果紀錄** | `d:\ANTIGRAVITY\036_local_painter\output\youtube_g2_n22.json` | 儲存產出的 `video_id` 與播放 URL |
| **前端嵌入腳本** | `d:\ANTIGRAVITY\036_local_painter\_scratch\embed_youtube_in_unit_n22.py` | 將 YouTube 網址回填至 `028-1` 教具單元 HTML |

> ⚠️ **資安紅線**：`client_secret*.json` 與 `token*.json` 嚴禁納入任何 Git 提交；僅記錄路徑，不記錄內容。`_scratch/` 亦維持 gitignore 隔離。

---

## ⚙️ 2. 環境與相依套件

執行此流程需使用 Python 環境並安裝 Google API 用戶端庫：

```bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
```

> **備註**：先前執行時直接掛載了全域環境或使用 `036_local_painter\.venv`。
> **Windows 編碼**：印有 Emoji 或中文章節的 Python 腳本前，先設 `$env:PYTHONIOENCODING='utf-8'`（或 `chcp 65001`），避免 `cp950` 崩潰。

---

## 🚀 3. YouTube 上傳標準作業流程 (SOP)

### 步驟 A：取得初次授權（若已有 `token.json` 可跳過）
若 `token.json` 不存在或無效，可透過 `InstalledAppFlow` 本地伺服器完成一次性瀏覽器授權：

```python
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
flow = InstalledAppFlow.from_client_secrets_file(
    r"d:\ANTIGRAVITY\034_anatomy_interactive_svg\client_secret.json",
    SCOPES
)
creds = flow.run_local_server(port=0)
with open(r"d:\ANTIGRAVITY\034_anatomy_interactive_svg\token.json", "w", encoding="utf-8") as f:
    f.write(creds.to_json())
```

---

### 步驟 B：執行自動化上傳（以現行通用腳本為準）

現行腳本會自動讀取授權、在 token 過期時透過 `refresh_token` 自動換票並儲存，無須人工干預。

#### 通用上傳腳本核心邏輯：

```python
import sys
import json
from pathlib import Path
import googleapiclient.discovery
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaFileUpload

# 1. 憑證與檔案路徑配置
TOKEN_FILE = Path(r"d:\ANTIGRAVITY\034_anatomy_interactive_svg\token.json")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

VIDEO_FILE = Path(r"d:\ANTIGRAVITY\036_local_painter\output\concept_theater_g2_n22.mp4")

# 2. 中繼資料設定
TITLE = "【G2MATH】小熊波波的甜點數學教室：二位數直式加法（G2-N-2-2 觀念影院）"
DESCRIPTION = """🥞 小熊波波的甜點數學教室 · 二年級數學觀念影院
單元：G2-N-2-2 二位數直式加法與滿十進一（28 + 15 = 43）

【章節時間軸】
00:00 第 1 幕：鬆餅山難題
04:00 第 2 幕：魔法對齊黑板
08:00 第 3 幕：滿十進一魔法
12:00 第 4 幕：大獲全勝出爐
"""

def upload_video():
    if not VIDEO_FILE.exists():
        print(f"❌ 找不到影片檔案: {VIDEO_FILE}")
        sys.exit(1)

    # 3. 讀取並自動刷新憑證
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired token...")
            creds.refresh(Request())
            TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
            print("Token refreshed successfully!")
        else:
            raise PermissionError("YouTube Token 無法刷新，請確認授權。")

    youtube = googleapiclient.discovery.build("youtube", "v3", credentials=creds)

    # 4. 建構影片發布中繼資訊
    body = {
        "snippet": {
            "title": TITLE,
            "description": DESCRIPTION,
            "tags": ["G2MATH", "國小數學", "二年級數學", "108課綱", "N-2-2", "直式計算"],
            "categoryId": "27"  # Education (教育類)
        },
        "status": {
            "privacyStatus": "unlisted",       # 不公開模式（供教具與遠端驗收）
            "selfDeclaredMadeForKids": True   # 兒童專屬內容
        }
    }

    # 5. 斷點續傳分塊上傳
    media = MediaFileUpload(str(VIDEO_FILE), chunksize=-1, resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"  ⏳ 上傳進度: {int(status.progress() * 100)}%...")

    video_id = response["id"]
    video_url = f"https://youtu.be/{video_id}"
    print(f"🎉 上傳成功！影片 ID: {video_id}，網址: {video_url}")

    return video_url

if __name__ == "__main__":
    upload_video()
```

---

## 🔗 4. 前端導流閉環（寫入教具 APP）

影片上傳成功後，取得的 YouTube 網址（如 `https://youtu.be/tuTyh15-KKQ`）可透過批次或嵌入腳本（如 `embed_youtube_in_unit_n22.py`）掛載至教具 HTML 的 header 導流按鈕中，讓學生作答時可一鍵彈出微電影輔助理解。

---

## 💡 5. 重點注意事項

1. **Token 自動過期刷新**：`token.json` 具備長效 `refresh_token`，每次上傳時若過期，腳本會自動向 Google OAuth 伺服器申請新的 `access_token` 並更新儲存，平時不需要手動重新登入。
2. **影片隱私設定**：目前預設皆設為 `"privacyStatus": "unlisted"`（不公開），具備連結者才可點閱，適合作為 App 內嵌素材。
3. **兒童內容宣告**：國小題材需依照規範設定 `"selfDeclaredMadeForKids": True`。

---

## 🆕 6. G3 全冊總合集上傳實戰（2026-11-23）

### 6.1 標準兩段式流水線

```bash
# 段的 1：產生 41 分鐘總合集 + MM:SS 章節時間軸（共用單元自動去重）
python tools/build_g3_youtube_compilation.py
#   → _scratch/G3_Math_All24_YouTube_Compilation.mp4
#   → reports/20261123_G3_YOUTUBE_CHAPTERS.txt

# 段的 2：一鍵上傳（讀章節檔、精修、刷新 token、resumable 上傳、寫結果 JSON）
$env:PYTHONIOENCODING='utf-8'
python tools/20261123_001_upload_g3_youtube_compilation.py
#   → reports/20261123_002_G3_YOUTUBE_UPLOAD_RESULT.json
```

### 6.2 與 G2 腳本的差異要點

| 項目 | G2 既有腳本 | G3 總合集腳本 |
| :--- | :--- | :--- |
| 影片來源 | 單支 `concept_theater_*.mp4` | 23 支不重複成片串接（S-3-1 與 N-3-13 共用去重） |
| 說明欄 | 手寫固定文字 | 由 `20261123_G3_YOUTUBE_CHAPTERS.txt` 動態讀取 23 段 MM:SS |
| 上傳分塊 | `chunksize=-1` | `chunksize=8 MiB` + `next_chunk(num_retries=6)`（247 MiB 大檔更穩） |
| 結果落地 | `output/youtube_g2_n22.json` | `reports/20261123_002_G3_YOUTUBE_UPLOAD_RESULT.json` |
| 憑證／scope／隱私 | 相同：`034/token.json`／`youtube.upload`／`unlisted` | 相同 |

### 6.3 章節說明欄的兩處外科手術式精修

1. 首行重複代碼：`00:00 N-3-1 N-3-1` → `00:00 N-3-1 一萬以內的數`
2. `N-3-7` 補齊右括號：`…（加減與除、連乘）` → `…（加減與除、連乘））`

> YouTube 章節規則：首章須從 `00:00` 開始、至少 3 章、每章 `MM:SS` 或 `H:MM:SS`。本次 23 章、總長 41:00，符合規範。

### 6.4 收官紀錄

- **Video ID**：`M4N_UNwBT5Y`
- **播放網址**：https://youtu.be/M4N_UNwBT5Y
- **頻道**：Abby 阿比（`@Abby-vq7zl`）
- **驗證**：上傳腳本 Exit 0；`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=M4N_UNwBT5Y&format=json` HTTP 200 且標題吻合。
- **隔離**：247 MiB 總合集只放 `_scratch/`，已列於 `.gitignore` 與 `.wranglerignore`，不進 Git、不推 Cloudflare Pages。
