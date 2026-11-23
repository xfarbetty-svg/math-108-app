# -*- coding: utf-8 -*-
"""
tools/20261123_001_upload_g3_youtube_compilation.py
一鍵上傳 G3 全冊 24 單元總合集至 YouTube（unlisted）。

沿用本機既有上傳邏輯與憑證：
  - Token: D:\\ANTIGRAVITY\\034_anatomy_interactive_svg\\token.json
  - Scope: https://www.googleapis.com/auth/youtube.upload
  - 參考: 034_anatomy_interactive_svg/bridge/make_math_shorts.py::upload_to_youtube

Run: python tools/20261123_001_upload_g3_youtube_compilation.py
Output: reports/20261123_002_G3_YOUTUBE_UPLOAD_RESULT.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

GLOBAL_SITE = r"C:\Users\PXP\AppData\Local\Programs\Python\Python311\Lib\site-packages"
if GLOBAL_SITE not in sys.path:
    sys.path.append(GLOBAL_SITE)

REPO_ROOT = Path(__file__).resolve().parents[1]
TOKEN_FILE = Path(r"D:\ANTIGRAVITY\034_anatomy_interactive_svg\token.json")
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
VIDEO_FILE = REPO_ROOT / "_scratch" / "G3_Math_All24_YouTube_Compilation.mp4"
CHAPTERS_TXT = REPO_ROOT / "reports" / "20261123_G3_YOUTUBE_CHAPTERS.txt"
RESULT_JSON = REPO_ROOT / "reports" / "20261123_002_G3_YOUTUBE_UPLOAD_RESULT.json"

TITLE = "【國小三年級數學】108課綱全冊24單元概念總複習｜米米兔概念小教室（41分鐘完整合集＋章節索引）"
TAGS = ["國小數學", "三年級數學", "108課綱", "米米兔", "段考複習", "數學概念", "概念小教室", "G3MATH"]
CATEGORY_ID = "27"  # Education

PREAMBLE = (
    "國小三年級數學（上、下學期）108課綱全冊 24 個核心單元重點精華一次看！\n"
    "由米米兔帶領孩子用生活情境、圖像拆解與段考易錯陷阱題，快速建立三年級數學觀念。\n\n"
    "👉 免費互動練習與線上真題測驗：[https://math-108.pages.dev/app/](https://math-108.pages.dev/app/)\n\n"
    "📌 單元章節快速跳轉：\n"
)
FOOTER = "#國小數學 #三年級數學 #108課綱 #段考複習 #數學概念 #米米兔"


def build_description() -> str:
    raw = CHAPTERS_TXT.read_text(encoding="utf-8").splitlines()
    chapters = [ln.strip() for ln in raw if re.match(r"^\d{2}:\d{2}\s", ln)]
    if len(chapters) != 23:
        raise RuntimeError(f"章節數異常：預期 23，實際 {len(chapters)}")

    fixed: list[str] = []
    for ln in chapters:
        # 外科手術式精修 1：首行重複代碼 → 正確單元名
        if ln.startswith("00:00 N-3-1 "):
            ln = "00:00 N-3-1 一萬以內的數"
        # 外科手術式精修 2：N-3-7 補齊右括號
        if ln.startswith("10:05 N-3-7 "):
            ln = "10:05 N-3-7 解題（兩步驟應用問題（加減與除、連乘））"
        fixed.append(ln)

    desc = PREAMBLE + "\n".join(fixed) + "\n\n" + FOOTER
    if len(desc) > 5000:
        raise RuntimeError(f"說明欄超過 5000 字元：{len(desc)}")
    return desc


def get_creds():
    import googleapiclient.discovery  # noqa: F401
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    if not TOKEN_FILE.exists():
        raise FileNotFoundError(f"找不到既有 YouTube Token：{TOKEN_FILE}")
    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("[AUTH] Token 過期， refresing ...")
            creds.refresh(Request())
            TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
            print("[AUTH] Token 刷新成功")
        else:
            raise PermissionError("YouTube Token 無效且無法刷新；需重新瀏覽器授權（請提示使用者）")
    print(f"[AUTH] Token 有效：{TOKEN_FILE}")
    return creds


def main() -> None:
    if not VIDEO_FILE.exists():
        raise FileNotFoundError(f"找不到影片：{VIDEO_FILE}")
    size_mb = VIDEO_FILE.stat().st_size / (1024 * 1024)
    description = build_description()
    print(f"[VIDEO] {VIDEO_FILE.name} {size_mb:.1f} MiB")
    print(f"[TITLE] {TITLE}")
    print(f"[DESC] {len(description)} chars / 23 chapters")

    creds = get_creds()
    import googleapiclient.discovery
    from googleapiclient.http import MediaFileUpload

    youtube = googleapiclient.discovery.build("youtube", "v3", credentials=creds)
    body = {
        "snippet": {
            "title": TITLE,
            "description": description,
            "tags": TAGS,
            "categoryId": CATEGORY_ID,
        },
        "status": {
            "privacyStatus": "unlisted",
            "selfDeclaredMadeForKids": True,
        },
    }
    media = MediaFileUpload(str(VIDEO_FILE), chunksize=8 * 1024 * 1024,
                            resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    last_pct = -1
    while response is None:
        status, response = request.next_chunk(num_retries=6)
        if status:
            pct = int(status.progress() * 100)
            if pct != last_pct and (pct % 5 == 0 or pct == 100):
                print(f"[UPLOAD] {pct}%", flush=True)
                last_pct = pct

    video_id = response["id"]
    video_url = f"https://youtu.be/{video_id}"
    result = {
        "ok": True,
        "video_id": video_id,
        "video_url": video_url,
        "title": TITLE,
        "privacyStatus": "unlisted",
        "file": str(VIDEO_FILE),
        "size_mb": round(size_mb, 1),
        "description": description,
    }
    RESULT_JSON.parent.mkdir(parents=True, exist_ok=True)
    RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("=== UPLOAD SUCCESS ===")
    print(f"VIDEO_ID={video_id}")
    print(f"YOUTUBE_URL={video_url}")
    print(f"RESULT_JSON={RESULT_JSON}")


if __name__ == "__main__":
    main()
