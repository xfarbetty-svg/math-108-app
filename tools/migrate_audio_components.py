#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/migrate_audio_components.py
將 23 套概念小教室與預覽頁面中的語音調用全面收攏至 AudioManager / postMessage。
消除所有裸調 window.speechSynthesis 的老舊機械音。
"""

import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPONENTS_DIR = os.path.join(ROOT, "app", "components")

# 7 套簡潔版檔案
SIMPLE_LABS = [
    "multiplication_division_lab.html",
    "pattern_reasoning_lab.html",
    "solid_geometry_lab.html",
    "square_rectangle_lab.html",
    "table_cross_lab.html",
    "time_concept_lab.html",
    "weight_concept_lab.html"
]

def migrate_simple_lab(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. 引入 audio_manager.js（若尚未引入）
    if 'audio_manager.js' not in content:
        content = content.replace("</head>", '    <script src="../js/audio_manager.js"></script>\n</head>')

    # 2. 替換 pattern_reasoning_lab 中的 synth 與 speak
    if "const synth = window.speechSynthesis;" in content:
        content = content.replace("const synth = window.speechSynthesis;", "// 全域語音由 AudioManager / postMessage 統一調度")

    # 3. 替換通用的 speak / speakHint / stopSpeech
    # 匹配 function speak(text) { ... }
    speak_regex = re.compile(
        r'function\s+speak\s*\((?:text|msg|utterance|t)\)\s*\{[\s\S]*?(?=\n\s*(?:function|const|let|var|<\/script>))',
        re.MULTILINE
    )
    new_speak = """function speak(text) {
        if (typeof isMuted !== 'undefined' && isMuted) return;
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'TTS_SPEAK', text: text }, '*');
        } else if (window.AudioManager) {
            window.AudioManager.play(text);
        }
    }\n"""

    if re.search(r'function\s+speak\s*\(', content):
        content = speak_regex.sub(new_speak, content, count=1)

    # 針對 weight_concept_lab 的 speakHint
    if "function speakHint()" in content:
        hint_regex = re.compile(
            r'function\s+speakHint\s*\(\)\s*\{[\s\S]*?(?=\n\s*(?:function|const|let|var|<\/script>))',
            re.MULTILINE
        )
        new_speak_hint = """function speakHint() {
        const text = document.getElementById('hint-text') ? document.getElementById('hint-text').innerText : '';
        if (text) speak(text);
    }\n"""
        content = hint_regex.sub(new_speak_hint, content, count=1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ 遷移完成: {os.path.basename(filepath)}")

def migrate_complex_lab(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. 引入 audio_manager.js
    if 'audio_manager.js' not in content:
        content = content.replace("</head>", '  <script src="../js/audio_manager.js"></script>\n</head>')

    # 2. 替換 stopSpeech
    stop_regex = re.compile(
        r'function\s+stopSpeech\s*\(\)\s*\{[\s\S]*?(?=\nfunction\s+playVoice|\nfunction\s+playVoiceText|\nfunction\s+updateVoiceButtons|\nfunction\s+cleanTextForSpeech)',
        re.MULTILINE
    )
    new_stop = """function stopSpeech() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "TTS_STOP" }, "*");
  } else if (window.AudioManager) {
    window.AudioManager.stop();
  }
  isSpeaking = false;
  if (typeof updateVoiceButtons === "function") updateVoiceButtons(false);
}"""
    if re.search(r'function\s+stopSpeech\s*\(', content):
        content = stop_regex.sub(new_stop, content, count=1)

    # 3. 替換 playVoiceText
    play_regex = re.compile(
        r'function\s+playVoiceText\s*\((?:rawText|text)\)\s*\{[\s\S]*?(?=\nfunction\s+updateVoiceButtons|\nfunction\s+switchAct|\nfunction\s+init|\nfunction\s+playVoice|\n\/\* ----------)',
        re.MULTILINE
    )
    new_play = """function playVoiceText(rawText) {
  if (isSpeaking) {
    stopSpeech();
    return;
  }
  isSpeaking = true;
  if (typeof updateVoiceButtons === "function") updateVoiceButtons(true);

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "TTS_SPEAK", text: rawText }, "*");
  } else if (window.AudioManager) {
    window.AudioManager.play(rawText, {
      onStart: () => { if (typeof updateVoiceButtons === "function") updateVoiceButtons(true); },
      onEnd: () => { isSpeaking = false; if (typeof updateVoiceButtons === "function") updateVoiceButtons(false); },
      onError: () => { isSpeaking = false; if (typeof updateVoiceButtons === "function") updateVoiceButtons(false); }
    });
  }
}"""
    if re.search(r'function\s+playVoiceText\s*\(', content):
        content = play_regex.sub(new_play, content, count=1)

    # 針對沒有獨立 playVoiceText，而是把播放寫在 playVoice(actNum) 內部的檔案
    if "function playVoice(" in content and "function playVoiceText(" not in content:
        # 在 playVoice 前插入 playVoiceText 定義
        content = content.replace("function playVoice(", new_play + "\n\nfunction playVoice(")
        # 將 playVoice 內部的播放邏輯替換為呼叫 playVoiceText(rawText)
        # 匹配 const rawText = ... 到該函式結束
        pv_match = re.search(r'(function\s+playVoice\s*\([^\)]*\)\s*\{[\s\S]*?const\s+rawText\s*=[^;]+;)([\s\S]*?\n\})', content)
        if pv_match:
            head = pv_match.group(1)
            replacement = head + "\n  playVoiceText(rawText);\n}"
            content = content[:pv_match.start()] + replacement + content[pv_match.end():]

    # 清理殘留的 WebSpeechFallback 與 SpeechSynthesis 呼叫
    content = re.sub(r'function\s+doWebSpeechFallback\s*\(\)\s*\{[\s\S]*?\n  \}', '', content)
    content = re.sub(r'if\s*\("speechSynthesis"\s*in\s*window\)\s*\{\s*window\.speechSynthesis\.cancel\(\);\s*\}', '', content)
    content = re.sub(r'if\s*\("speechSynthesis"\s*in\s*window\)\s*window\.speechSynthesis\.cancel\(\);', '', content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ 遷移完成: {os.path.basename(filepath)}")

def main():
    print("🚀 開始概念小教室語音收攏至 AudioManager...")
    for f in SIMPLE_LABS:
        path = os.path.join(COMPONENTS_DIR, f)
        if os.path.exists(path):
            migrate_simple_lab(path)

    all_labs = glob.glob(os.path.join(COMPONENTS_DIR, "*.html"))
    for p in all_labs:
        filename = os.path.basename(p)
        if filename not in SIMPLE_LABS:
            # 檢查是否有語音邏輯
            with open(p, "r", encoding="utf-8") as f:
                c = f.read()
            if "speechSynthesis" in c or "playVoice" in c or "stopSpeech" in c:
                migrate_complex_lab(p)

    # 遷移 app/concept_preview.html
    preview_path = os.path.join(ROOT, "app", "concept_preview.html")
    if os.path.exists(preview_path):
        with open(preview_path, "r", encoding="utf-8") as f:
            c = f.read()
        if 'audio_manager.js' not in c:
            c = c.replace("</head>", '  <script src="js/audio_manager.js"></script>\n</head>')
        # 替換 speakText
        c = re.sub(
            r'function\s+speakText\s*\([^\)]*\)\s*\{[\s\S]*?\n\}',
            '''function speakText(text) {
  if (window.AudioManager) {
    window.AudioManager.play(text);
  }
}''',
            c
        )
        c = re.sub(r'if\s*\("speechSynthesis"\s*in\s*window\)\s*window\.speechSynthesis\.cancel\(\);', '', c)
        with open(preview_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("✓ 遷移完成: concept_preview.html")

    print("\n🎉 批量遷移腳本執行完畢！")

if __name__ == "__main__":
    main()
