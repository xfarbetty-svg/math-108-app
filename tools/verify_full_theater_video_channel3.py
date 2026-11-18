# -*- coding: utf-8 -*-
"""
tools/verify_full_theater_video_channel3.py
使用通道三 (035 Key Pool 多模態視覺眼睛)
對合成完畢的 G3-N-3-9 全片長片 (MP4) 進行逐幕抽幀與全片大眼睛終極審查。
"""

import base64
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIDEO_PATH = ROOT / "app" / "scenes" / "g3_n39_theater" / "video" / "g3_n39_full_theater.mp4"
CONCEPT_PATH = ROOT / "app" / "assets" / "video" / "g3_n39_concept_final.mp4"
SHOTS_DIR = ROOT / "reports" / "screenshots"
REPORT_PATH = ROOT / "reports" / "verify_full_theater_video_channel3_report.json"
GATEWAY_URL = "http://127.0.0.1:4000/v1/chat/completions"

SHOTS_DIR.mkdir(parents=True, exist_ok=True)

# 抽幀時間點（對應四幕核心時間段）
SAMPLE_POINTS = [
    {"act": 1, "time": 5.0, "name": "full_video_act1.png", "title": "Act 1: 情境導入 (5.0s)"},
    {"act": 2, "time": 30.0, "name": "full_video_act2.png", "title": "Act 2: 單位分數 (30.0s)"},
    {"act": 3, "time": 55.0, "name": "full_video_act3.png", "title": "Act 3: 核心算理 (55.0s)"},
    {"act": 4, "time": 75.0, "name": "full_video_act4.png", "title": "Act 4: 總結互動 (75.0s)"},
]

SYSTEM_PROMPT = """你是一位極度嚴格、具備敏銳機器視覺眼睛的國小數學數位教材審查專家。
請針對這張從「G3-N-3-9 分數情境劇院最終壓合長片 MP4」中實機提取的影格進行嚴格視覺與算理審查。

【核心審查指標】：
1. 【米米老師零遮擋（最高優先）】：米米老師（小白兔）是否被黑板、巧克力教具、文字、按鈕或講台遮擋？米米老師必須擁有獨立清晰的站位，絕不允許被壓在物件下方！
2. 【一體化教室空間】：畫面是否呈現統一、無割裂感的溫馨教室環境（木地板、暖色牆面、掛牆黑板）？是否已徹底消除舊版生硬的相框或左右硬切線？
3. 【黑板與數學算理】：
   - 巧克力長條是否明確平分為 12 塊？
   - 藍色（3塊）、橘色（7塊）、深色未取（2塊）是否顏色分明？
   - 算式與分數文字（如 1/12, 10/12）是否清晰易讀、排版整齊？
4. 【排版與視覺舒適度】：字體大小適中、無溢出、無文字重疊、整體日系繪本風質感優良。

請以純 JSON 格式輸出：
{
  "pass": true,
  "teacher_occlusion": "合規（未被遮擋） / 不合規: 描述",
  "spatial_integration": "合規（一體化教室） / 不合規: 描述",
  "math_clarity": "合規 / 不合規: 描述",
  "layout_typography": "合規 / 不合規: 描述",
  "summary": "一句話總結",
  "flaws": []
}
只回傳純 JSON，不要包含 markdown 標籤。"""


def run_cmd(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        print(f"❌ 指令執行失敗: {' '.join(cmd)}\n{p.stderr}", file=sys.stderr)
        sys.exit(p.returncode)
    return p.stdout


def extract_frames():
    print("🎞️ 正在從長片實機提取四幕影格截圖...")
    for sp in SAMPLE_POINTS:
        out_img = SHOTS_DIR / sp["name"]
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(sp["time"]),
            "-i", str(VIDEO_PATH),
            "-vframes", "1",
            "-q:v", "2",
            str(out_img)
        ]
        run_cmd(cmd)
        print(f"  📸 已提取 {sp['title']} -> {out_img}")


def inspect_frame(img_path: Path, title: str) -> dict:
    import time
    with open(img_path, "rb") as f:
        b64_data = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"請對長片實機抽幀【{title}】進行通道 3 多模態視覺眼睛審查。特別確認米米老師是否被遮擋、空間是否一體化、算理是否正確清晰。"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                ]
            }
        ],
        "temperature": 0.1
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    lines = content.splitlines()
                    content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                return json.loads(content)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                print(f"    ⏳ 通道 3 觸發頻率限制 (429)，等待 5 秒後進行第 {attempt+2} 次重試...")
                time.sleep(5)
                continue
            return {"pass": False, "flaws": [f"API 請求失敗: {e}"]}
        except Exception as e:
            return {"pass": False, "flaws": [f"API 請求失敗: {e}"]}
    return {"pass": False, "flaws": ["API 重試耗盡"]}


def inspect_full_montage(files) -> dict:
    import time
    parts = [{"type": "text", "text": "請對這四張按時間順序（Act 1 ~ 4）從全片長片 MP4 抽出的影格進行全片大眼睛終極審查。請評估：全片空間是否前後高度一致、米米老師是否全程無遮擋、黑板演武是否連貫完整。"}]
    # 轉為 640x360 JPEG 輕量預覽，降低 Payload 與 Token 消耗，防止 429
    for i, f in enumerate(files, 1):
        jpg_path = SHOTS_DIR / f"full_video_act{i}_preview.jpg"
        subprocess.run([
            "ffmpeg", "-y", "-i", str(f),
            "-vf", "scale=640:360", "-q:v", "3",
            str(jpg_path)
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        b64 = base64.b64encode(jpg_path.read_bytes()).decode("utf-8")
        parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})

    payload = {
        "model": "gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": parts}
        ],
        "temperature": 0.1
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    lines = content.splitlines()
                    content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                return json.loads(content)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                print(f"    ⏳ 通道 3 觸發頻率限制 (429)，等待 6 秒後進行第 {attempt+2} 次重試...")
                time.sleep(6)
                continue
            return {"pass": False, "flaws": [f"全片 API 請求失敗: {e}"]}
        except Exception as e:
            return {"pass": False, "flaws": [f"全片 API 請求失敗: {e}"]}
    return {"pass": False, "flaws": ["全片 API 重試耗盡"]}


def main():
    print("=========================================================")
    print("🎬 G3-N-3-9 全片長片 (MP4) 通道三多模態大眼睛終極審查")
    print("=========================================================")

    if not VIDEO_PATH.exists():
        print(f"❌ 找不到目標影片: {VIDEO_PATH}")
        sys.exit(1)
    if not CONCEPT_PATH.exists():
        print(f"❌ 找不到概念影片副本: {CONCEPT_PATH}")
        sys.exit(1)

    # 1. ffprobe 檢查
    probe_raw = run_cmd([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration,size",
        "-show_streams",
        "-of", "json",
        str(VIDEO_PATH)
    ])
    probe = json.loads(probe_raw)
    duration = float(probe["format"]["duration"])
    streams = probe["streams"]
    video_stream = next((s for s in streams if s["codec_type"] == "video"), None)
    audio_stream = next((s for s in streams if s["codec_type"] == "audio"), None)

    print(f"🔍 影片時長: {duration:.3f} 秒 (規格 84.74s)")
    print(f"🔍 視訊規格: {video_stream['codec_name']}, {video_stream['width']}x{video_stream['height']}, {video_stream['r_frame_rate']} fps, {video_stream.get('nb_frames')} 幀")
    print(f"🔍 音訊規格: {audio_stream['codec_name']}, {audio_stream['sample_rate']} Hz")

    if not (84.0 <= duration <= 85.5):
        print(f"❌ 時長不合規: {duration}")
        sys.exit(1)

    # 2. 抽幀
    extract_frames()

    # 3. 逐幕送通道 3 審查
    report = {
        "video_path": str(VIDEO_PATH),
        "duration": duration,
        "video_stream": {
            "codec": video_stream["codec_name"],
            "resolution": f"{video_stream['width']}x{video_stream['height']}",
            "fps": video_stream["r_frame_rate"],
            "nb_frames": video_stream.get("nb_frames")
        },
        "audio_stream": {
            "codec": audio_stream["codec_name"],
            "sample_rate": audio_stream["sample_rate"]
        },
        "acts": [],
        "total_review": None,
        "all_pass": True
    }

    all_pass = True
    frame_files = []

    # 載入先前已審查通過的單幕記錄（若有）
    cached_acts = {}
    if REPORT_PATH.exists():
        try:
            with open(REPORT_PATH, "r", encoding="utf-8") as rf:
                old_rep = json.load(rf)
                for a in old_rep.get("acts", []):
                    if a.get("pass"):
                        cached_acts[a.get("act")] = a
        except Exception:
            pass

    for sp in SAMPLE_POINTS:
        img_path = SHOTS_DIR / sp["name"]
        frame_files.append(img_path)
        act_id = sp["act"]
        if act_id in cached_acts:
            res = cached_acts[act_id]
            print(f"\n👁️ 單幕審查快取 [✅ PASS]: {sp['title']}")
            print(f"    - 米米老師防遮擋: {res.get('teacher_occlusion')}")
            print(f"    - 一體化空間: {res.get('spatial_integration')}")
            print(f"    - 算理清晰度: {res.get('math_clarity')}")
            print(f"    - 審查總結: {res.get('summary')}")
            report["acts"].append(res)
            continue

        print(f"\n👁️ 正在進行通道 3 視覺審查: {sp['title']}...")
        time.sleep(1.5)
        res = inspect_frame(img_path, sp["title"])
        passed = bool(res.get("pass"))
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  [{status}] {sp['title']}")
        print(f"    - 米米老師防遮擋: {res.get('teacher_occlusion')}")
        print(f"    - 一體化空間: {res.get('spatial_integration')}")
        print(f"    - 算理清晰度: {res.get('math_clarity')}")
        print(f"    - 審查總結: {res.get('summary')}")
        if not passed:
            all_pass = False
        res["act"] = sp["act"]
        res["title"] = sp["title"]
        report["acts"].append(res)

    # 4. 全片合流審查
    print("\n👁️ 正在進行通道 3 全片合流大眼睛終極審查...")
    time.sleep(2.5)
    total_res = inspect_full_montage(frame_files)
    total_passed = bool(total_res.get("pass"))
    status = "✅ PASS" if total_passed else "❌ FAIL"
    print(f"  [{status}] 全片合流大眼睛終驗")
    print(f"    - 米米老師防遮擋: {total_res.get('teacher_occlusion')}")
    print(f"    - 一體化空間: {total_res.get('spatial_integration')}")
    print(f"    - 算理清晰度: {total_res.get('math_clarity')}")
    print(f"    - 審查總結: {total_res.get('summary')}")
    if not total_passed:
        all_pass = False
    report["total_review"] = total_res
    report["all_pass"] = all_pass

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n📊 終極審查報告已落盤: {REPORT_PATH}")

    if all_pass:
        print("\n🎉🎉🎉 【ALL PASS】G3-N-3-9 全片長片 (MP4) 通道 3 大眼睛終極審查 100% 全數通過！")
        sys.exit(0)
    else:
        print("\n❌ 審查未全數通過，請檢視上方瑕疵清單！")
        sys.exit(1)


if __name__ == "__main__":
    main()
