"""
tools/classroom_engine/render_video.py
Headless Chromium (Playwright) deterministic 30fps frame renderer + FFmpeg muxer
+ automated keyframe extractor & AV sync verifier.
"""
from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

from tools.classroom_engine.tts_pipeline import (
    LOUDNORM_FILTER,
    build_narration_and_timeline,
    probe_duration,
)

FPS = 30
MAX_SIZE_MIB = 24.5  # Cloudflare Pages single-file limit is 25 MiB


def inject_stage_html(
    template_path: Path,
    timeline: dict[str, Any],
    plugin_js: str,
    out_html: Path,
) -> None:
    """Inject timeline JSON and unit plugin JS into stage_template.html."""
    html = template_path.read_text(encoding="utf-8")
    # Escape closing script tags safely
    timeline_json = json.dumps(timeline, ensure_ascii=False).replace("</", "<\\/")
    safe_plugin_js = plugin_js.replace("</script>", "<\\/script>")
    html = html.replace(
        '<script id="timeline-data" type="application/json">{}</script>',
        f'<script id="timeline-data" type="application/json">{timeline_json}</script>',
    )
    html = html.replace(
        '<script id="unit-plugin-script"></script>',
        f'<script id="unit-plugin-script">\n{safe_plugin_js}\n</script>',
    )
    out_html.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".tmp_", suffix=".html", dir=str(out_html.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(html)
        os.replace(tmp_name, out_html)
    except Exception:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)
        raise


def probe_streams(mp4_path: Path) -> dict[str, Any]:
    """Return video & audio stream durations, resolution, fps, and file size."""
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe not found in PATH")
    cmd = [
        ffprobe,
        "-v", "error",
        "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,duration",
        "-show_entries", "format=duration,size",
        "-of", "json",
        str(mp4_path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(res.stdout)
    streams = {s["codec_type"]: s for s in data.get("streams", [])}
    fmt = data.get("format", {})
    v_dur = float(streams["video"]["duration"])
    a_dur = float(streams["audio"]["duration"])
    size_bytes = int(fmt["size"])
    return {
        "width": int(streams["video"]["width"]),
        "height": int(streams["video"]["height"]),
        "video_codec": streams["video"]["codec_name"],
        "audio_codec": streams["audio"]["codec_name"],
        "video_duration": round(v_dur, 3),
        "audio_duration": round(a_dur, 3),
        "av_diff": round(abs(v_dur - a_dur), 3),
        "format_duration": round(float(fmt["duration"]), 3),
        "size_bytes": size_bytes,
        "size_mib": round(size_bytes / (1024 * 1024), 2),
    }


def extract_keyframes(
    mp4_path: Path,
    keyframes_dir: Path,
    timestamps: list[tuple[str, float]],
) -> list[Path]:
    """Extract PNG keyframes from the final muxed MP4 for visual inspection."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found in PATH")
    keyframes_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for name, sec in timestamps:
        out_png = keyframes_dir / f"{name}.png"
        subprocess.run(
            [
                ffmpeg, "-y", "-v", "error",
                "-ss", f"{sec:.3f}",
                "-i", str(mp4_path),
                "-frames:v", "1",
                str(out_png),
            ],
            check=True,
        )
        if not out_png.exists() or out_png.stat().st_size < 1024:
            raise RuntimeError(f"Failed to extract keyframe {out_png} at {sec}s")
        outputs.append(out_png)
    return outputs


def render_unit_video(
    repo_root: Path,
    unit_meta: dict[str, Any],
    cues: list[dict[str, Any]],
    plugin_js: str,
    out_mp4: Path,
    keyframe_specs: list[tuple[str, str]] | None = None,
) -> dict[str, Any]:
    """
    Full pipeline:
      1) Edge-TTS narration + polyphone fixes + timeline.json
      2) Inject stage HTML
      3) Deterministic 30fps Playwright render piped to FFmpeg H.264/AAC mux
      4) Verify AV sync + file size < 25 MiB
      5) Extract inspection keyframes from final MP4
    """
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found in PATH")

    code_slug = unit_meta["code"].lower().replace("-", "")
    work_dir = repo_root / "_scratch" / f"classroom_{code_slug}"
    work_dir.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    print(f"[1/4] Synthesizing narration & timeline for {unit_meta['code']}...")
    narration_wav, timeline_path, timeline = build_narration_and_timeline(
        repo_root=repo_root,
        work_dir=work_dir,
        unit_meta=unit_meta,
        cues=cues,
    )
    total_duration = float(timeline["total_duration"])
    total_frames = int(round(total_duration * FPS))
    print(f"      Narration ready: {total_duration:.3f}s ({total_frames} frames @ {FPS}fps)")

    template_path = repo_root / "tools" / "classroom_engine" / "stage_template.html"
    stage_html = work_dir / "stage_rendered.html"
    inject_stage_html(template_path, timeline, plugin_js, stage_html)

    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    tmp_mp4 = work_dir / f"{out_mp4.stem}_tmp.mp4"

    print(f"[2/4] Rendering {total_frames} frames (1920x1080 @ {FPS}fps) via headless Chromium...")
    ffmpeg_cmd = [
        ffmpeg, "-y", "-v", "error",
        "-f", "image2pipe",
        "-vcodec", "mjpeg",
        "-framerate", str(FPS),
        "-i", "pipe:0",
        "-i", str(narration_wav),
        # 輸出階段再次以 -14 LUFS 響度標準化把關（對已正規化音軌為冪等，約 0dB）
        "-af", LOUDNORM_FILTER,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "21",
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-shortest",
        str(tmp_mp4),
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
            page.goto(stage_html.as_uri(), wait_until="load")
            page.wait_for_function("typeof window.renderAtTime === 'function'")

            for f_idx in range(total_frames):
                t_sec = f_idx / FPS
                page.evaluate("(t) => window.renderAtTime(t)", t_sec)
                jpg_bytes = page.screenshot(type="jpeg", quality=95)
                proc.stdin.write(jpg_bytes)
                if (f_idx + 1) % 300 == 0 or f_idx + 1 == total_frames:
                    pct = (f_idx + 1) * 100.0 / total_frames
                    print(f"      Progress: {f_idx + 1}/{total_frames} ({pct:.1f}%)")

            browser.close()
    finally:
        proc.stdin.close()

    stderr_out = proc.stderr.read().decode("utf-8", errors="replace") if proc.stderr else ""
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f"FFmpeg mux failed (exit {ret}): {stderr_out}")

    os.replace(tmp_mp4, out_mp4)

    print("[3/4] Verifying final MP4 streams & AV sync...")
    info = probe_streams(out_mp4)
    if info["width"] != 1920 or info["height"] != 1080:
        raise RuntimeError(f"Unexpected resolution: {info['width']}x{info['height']}")
    if info["size_mib"] > MAX_SIZE_MIB:
        raise RuntimeError(f"File too large: {info['size_mib']} MiB > {MAX_SIZE_MIB} MiB")
    if info["av_diff"] > 0.15:
        raise RuntimeError(f"AV sync drift too large: {info['av_diff']}s")

    print(
        f"      Verified: {info['width']}x{info['height']}, "
        f"V={info['video_duration']}s / A={info['audio_duration']}s "
        f"(diff={info['av_diff']}s), {info['size_mib']} MiB"
    )

    print("[4/4] Extracting inspection keyframes from final MP4...")
    cues_list = timeline["cues"]
    # Pick 5 meaningful timestamps automatically if not overridden
    kf_timestamps: list[tuple[str, float]] = []
    if keyframe_specs:
        for kf_name, mode in keyframe_specs:
            # mode can be "cue:N:ratio"
            parts = mode.split(":")
            c_idx = int(parts[1])
            ratio = float(parts[2])
            c_obj = cues_list[min(c_idx, len(cues_list) - 1)]
            sec = c_obj["start"] + (c_obj["end"] - c_obj["start"]) * ratio
            kf_timestamps.append((kf_name, round(sec, 2)))
    else:
        n = len(cues_list)
        kf_timestamps = [
            ("01_intro", round(cues_list[0]["start"] + 1.2, 2)),
            ("02_concept_pointer", round(cues_list[max(1, n // 3)]["start"] + 1.5, 2)),
            ("03_pan_transition", round(cues_list[max(2, n // 2)]["start"] - 0.15, 2)),
            ("04_trap_bubble", round(cues_list[max(3, (2 * n) // 3)]["start"] + 1.5, 2)),
            ("05_summary_outro", round(cues_list[-1]["start"] + 1.5, 2)),
        ]

    kf_dir = work_dir / "keyframes"
    kf_paths = extract_keyframes(out_mp4, kf_dir, kf_timestamps)
    elapsed = round(time.time() - t0, 1)
    print(f"Done in {elapsed}s! Output: {out_mp4}")
    return {
        "out_mp4": str(out_mp4),
        "timeline_json": str(timeline_path),
        "keyframes": [str(p) for p in kf_paths],
        "stream_info": info,
        "elapsed_sec": elapsed,
    }
