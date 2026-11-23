"""
tools/classroom_engine/tts_pipeline.py
Modular Edge-TTS narration generator with polyphone pronunciation fixes synced
from app/js/audio_manager.js, exact ffprobe timing measurement, and FFmpeg
master audio assembly.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import edge_tts

DEFAULT_VOICE = "zh-TW-HsiaoChenNeural"
DEFAULT_RATE = "-3%"
DEFAULT_PITCH = "+2Hz"

FALLBACK_POLYPHONE_FIXES = [
    ("奇數", "基數"),
    ("奇偶", "基偶"),
]


def load_polyphone_fixes(repo_root: Path) -> list[tuple[str, str]]:
    """Read POLYPHONE_FIXES directly from app/js/audio_manager.js (SSOT)."""
    audio_mgr = repo_root / "app" / "js" / "audio_manager.js"
    if not audio_mgr.exists():
        raise FileNotFoundError(f"Missing SSOT audio_manager.js: {audio_mgr}")
    text = audio_mgr.read_text(encoding="utf-8")
    m = re.search(r"const\s+POLYPHONE_FIXES\s*=\s*\[([\s\S]*?)\];", text)
    if not m:
        raise ValueError("Could not parse POLYPHONE_FIXES from app/js/audio_manager.js")
    pairs = re.findall(r'from\s*:\s*"([^"]+)"\s*,\s*to\s*:\s*"([^"]+)"', m.group(1))
    if not pairs:
        return list(FALLBACK_POLYPHONE_FIXES)
    return pairs


def apply_polyphone_and_speech_clean(text: str, fixes: list[tuple[str, str]]) -> str:
    """Apply polyphone rules + math symbol pronunciation for TTS input only.
    Never modifies the on-screen subtitle string."""
    s = str(text)
    for src, dst in fixes:
        s = s.replace(src, dst)
    # Clean math symbols for natural zh-TW speech
    s = (
        s.replace("×", "乘以")
        .replace("÷", "除以")
        .replace("＝", "等於")
        .replace("=", "等於")
        .replace("＋", "加")
        .replace("+", "加")
        .replace("－", "減")
        .replace("＞", "大於")
        .replace("＜", "小於")
        .replace("→", "，")
    )
    # Strip decorative brackets/emoji that shouldn't be spoken
    s = re.sub(r"[「」『』【】💡❓❗✓✗★☆]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def probe_duration(media_path: Path) -> float:
    """Measure exact audio/video duration in seconds using ffprobe."""
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        raise RuntimeError("ffprobe not found in PATH")
    cmd = [
        ffprobe,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(media_path),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    val = float(res.stdout.strip())
    if val <= 0:
        raise RuntimeError(f"Invalid duration {val} for {media_path}")
    return val


async def _synth_one(text: str, out_mp3: Path, voice: str, rate: str, pitch: str) -> None:
    comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    await comm.save(str(out_mp3))
    if not out_mp3.exists() or out_mp3.stat().st_size < 128:
        raise RuntimeError(f"Edge-TTS produced empty audio for: {text}")


def _write_json_atomic(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".tmp_", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_name, path)
    except Exception:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)
        raise


def build_narration_and_timeline(
    repo_root: Path,
    work_dir: Path,
    unit_meta: dict[str, Any],
    cues: list[dict[str, Any]],
    voice: str = DEFAULT_VOICE,
    rate: str = DEFAULT_RATE,
    pitch: str = DEFAULT_PITCH,
) -> tuple[Path, Path, dict[str, Any]]:
    """
    Synthesize all cues with Edge-TTS, assemble master narration.wav with exact
    silence padding, and produce timeline.json with exact timestamps.
    Returns (narration_wav_path, timeline_json_path, timeline_dict).
    """
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found in PATH")

    fixes = load_polyphone_fixes(repo_root)
    audio_dir = work_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    lead_in = 0.50  # 0.5s gentle intro settle before first voice
    tail_out = 1.20  # 1.2s gentle ending hold

    async def synth_all() -> None:
        for idx, cue in enumerate(cues):
            raw_speech = cue.get("speech") or cue["subtitle"]
            cleaned = apply_polyphone_and_speech_clean(raw_speech, fixes)
            cue["_tts_text"] = cleaned
            mp3_path = audio_dir / f"cue_{idx:02d}.mp3"
            await _synth_one(cleaned, mp3_path, voice, rate, pitch)

    asyncio.run(synth_all())

    # Convert each cue to 48kHz stereo WAV and build concat list with exact silence
    timeline_cues: list[dict[str, Any]] = []
    concat_parts: list[Path] = []

    def make_silence(name: str, dur_sec: float) -> Path:
        p = audio_dir / f"{name}.wav"
        subprocess.run(
            [
                ffmpeg, "-y", "-v", "error",
                "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
                "-t", f"{dur_sec:.3f}",
                "-c:a", "pcm_s16le", str(p),
            ],
            check=True,
        )
        return p

    cursor = 0.0
    concat_parts.append(make_silence("sil_lead", lead_in))
    cursor += lead_in

    for idx, cue in enumerate(cues):
        mp3_path = audio_dir / f"cue_{idx:02d}.mp3"
        wav_path = audio_dir / f"cue_{idx:02d}.wav"
        subprocess.run(
            [
                ffmpeg, "-y", "-v", "error",
                "-i", str(mp3_path),
                "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
                str(wav_path),
            ],
            check=True,
        )
        dur = probe_duration(wav_path)
        start_t = round(cursor, 3)
        end_t = round(cursor + dur, 3)
        concat_parts.append(wav_path)
        cursor += dur

        # Pause after cue (longer if next cue switches scene for smooth camera pan)
        next_scene = cues[idx + 1]["scene"] if idx + 1 < len(cues) else cue["scene"]
        if idx == len(cues) - 1:
            pause = 0.0
        elif next_scene != cue["scene"]:
            pause = float(cue.get("pause_after", 0.70))
        else:
            pause = float(cue.get("pause_after", 0.32))

        if pause > 0:
            concat_parts.append(make_silence(f"sil_{idx:02d}", pause))
            cursor += pause

        entry = {k: v for k, v in cue.items() if not k.startswith("_")}
        entry["id"] = idx
        entry["start"] = start_t
        entry["end"] = end_t
        entry["duration"] = round(dur, 3)
        entry["tts_text"] = cue["_tts_text"]
        entry["pause_after"] = pause
        timeline_cues.append(entry)

    concat_parts.append(make_silence("sil_tail", tail_out))
    cursor += tail_out

    concat_list = audio_dir / "concat.txt"
    concat_list.write_text(
        "\n".join(f"file '{p.as_posix()}'" for p in concat_parts),
        encoding="utf-8",
    )

    narration_wav = work_dir / "narration.wav"
    subprocess.run(
        [
            ffmpeg, "-y", "-v", "error",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c:a", "pcm_s16le",
            str(narration_wav),
        ],
        check=True,
    )
    actual_total = probe_duration(narration_wav)

    timeline = {
        "unit": unit_meta,
        "voice": voice,
        "polyphone_fixes_applied": [{"from": a, "to": b} for a, b in fixes],
        "total_duration": round(actual_total, 3),
        "cues": timeline_cues,
    }
    timeline_path = work_dir / "timeline.json"
    _write_json_atomic(timeline_path, timeline)
    return narration_wav, timeline_path, timeline
