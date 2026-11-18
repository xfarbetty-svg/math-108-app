#!/usr/bin/env python3
"""
Theater video composite script for G3-N-3-9.
Reads g3_n39_timeline.json, composites four act images with audio using ffmpeg,
produces a single MP4 video of 84.74 seconds.
"""

import json
import os
import shutil
import subprocess
import sys

# ── Paths ──────────────────────────────────────────────────────────────
BASE = r"D:\ANTIGRAVITY\028-1_國小數學APP"

TIMELINE_PATH = os.path.join(
    BASE, "app", "scenes", "g3_n39_theater", "audio", "g3_n39_timeline.json"
)

IMG_DIR = os.path.join(BASE, "reports", "screenshots")
ACT_IMAGES = [
    os.path.join(IMG_DIR, "theater_act1.png"),
    os.path.join(IMG_DIR, "theater_act2.png"),
    os.path.join(IMG_DIR, "theater_act3.png"),
    os.path.join(IMG_DIR, "theater_act4.png"),
]

AUDIO_PATH = os.path.join(
    BASE, "app", "scenes", "g3_n39_theater", "audio", "g3_n39_hsiaochen.mp3"
)

# Output paths
VIDEO_OUTPUT_DIR = os.path.join(
    BASE, "app", "scenes", "g3_n39_theater", "video"
)
VIDEO_OUTPUT = os.path.join(VIDEO_OUTPUT_DIR, "g3_n39_full_theater.mp4")

CONCEPT_OUTPUT_DIR = os.path.join(BASE, "app", "assets", "video")
CONCEPT_OUTPUT = os.path.join(CONCEPT_OUTPUT_DIR, "g3_n39_concept_final.mp4")


# ── Helpers ────────────────────────────────────────────────────────────
def run(cmd, label=""):
    """Run a command; exit with error if non-zero."""
    print(f"[CMD] {label}: { ' '.join(cmd) }")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ {label} failed:\nstdout: {result.stdout}\nstderr: {result.stderr}")
        sys.exit(result.returncode)
    return result


def ffprobe_duration(path):
    """Use ffprobe to extract the duration of a media file."""
    result = run(
        [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_entries", "format=duration",
            path,
        ],
        label="ffprobe-duration",
    )
    import json as _json
    data = _json.loads(result.stdout)
    return float(data["format"]["duration"])


# ── Main ───────────────────────────────────────────────────────────────
def main():
    # Read timeline
    with open(TIMELINE_PATH, "r", encoding="utf-8") as f:
        timeline = json.load(f)

    acts = timeline["acts"]
    total_duration = timeline["acts"][-1]["end"]  # 84.74

    print(f"📋 Timeline loaded: {len(acts)} acts, total {total_duration}s")

    # Ensure output directories exist
    os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)
    os.makedirs(CONCEPT_OUTPUT_DIR, exist_ok=True)

    # ── Step 1: Generate per-act video clips (scaled image, 25fps CFR) ────────
    # Each clip: 25 fps constant frame rate lasting exactly the act duration, scaled to 1280x720
    act_video_paths = []
    for i, act in enumerate(acts):
        act_num = act["act"]
        dur = act["duration"]
        img = ACT_IMAGES[i]  # act 1 -> index 0

        out_clip = os.path.join(VIDEO_OUTPUT_DIR, f"act{act_num}_clip.mp4")

        # -loop 1 -framerate 25 ensures standard CFR video for the full act duration
        run(
            [
                "ffmpeg", "-y",
                "-loop", "1",
                "-framerate", "25",
                "-i", img,
                "-vf", "scale=1280:720",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-crf", "20",
                "-t", f"{dur}",
                out_clip,
            ],
            label=f"ffmpeg generate act{act_num} video clip",
        )
        act_video_paths.append(out_clip)
        clip_dur = ffprobe_duration(out_clip)
        print(f"🖼️  Generated act {act_num} video clip: {out_clip} ({clip_dur:.3f}s)")

    # ── Step 2: Concatenate video clips + mux full audio directly ───────
    concat_list_path = os.path.join(VIDEO_OUTPUT_DIR, "concat_list.txt")
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for p in act_video_paths:
            f.write(f"file '{p}'\n")

    run(
        [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list_path,
            "-i", AUDIO_PATH,
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            VIDEO_OUTPUT,
        ],
        label="ffmpeg concat video + mux audio into final MP4",
    )
    print(f"🎬  Final video written: {VIDEO_OUTPUT}")

    # ── Step 5: Copy to concept index ────────────────────────────────
    shutil.copy2(VIDEO_OUTPUT, CONCEPT_OUTPUT)
    print(f"📦  Copied to concept index: {CONCEPT_OUTPUT}")

    # ── Step 6: Verify with ffprobe ──────────────────────────────────
    duration = ffprobe_duration(VIDEO_OUTPUT)
    print(f"\n🔍  ffprobe duration: {duration:.3f}s (expected ~84.74s)")
    if 84.0 <= duration <= 85.5:
        print("✅  Duration verification PASSED: within [84.0, 85.5]")
    else:
        print(f"❌  Duration verification FAILED: {duration} not in [84.0, 85.5]")
        sys.exit(1)

    # Verify video and audio streams exist
    result = run(
        [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_streams", VIDEO_OUTPUT,
        ],
        label="ffprobe-streams",
    )
    import json as _json
    streams = _json.loads(result.stdout)["streams"]
    video_stream = [s for s in streams if s["codec_type"] == "video"]
    audio_stream = [s for s in streams if s["codec_type"] == "audio"]
    if not video_stream:
        print("❌  No video stream found!")
        sys.exit(1)
    if not audio_stream:
        print("❌  No audio stream found!")
        sys.exit(1)
    print("✅  Both video and audio streams confirmed present.")

    print("\n🏁  All done!")


if __name__ == "__main__":
    main()