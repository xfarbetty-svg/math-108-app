"""
tools/classroom_engine/units/n312_millimeter.py
G3 N-3-12 長度（毫米）：生活極短長度、1 公分=10 毫米、複名數換算、未從 0 量起陷阱
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n312_millimeter
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-12",
    "title": "長度（毫米）",
    "short_title": "毫米｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活中的極短長度 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！像硬幣厚度、螞蟻身長，用毫米記錄最剛好！",
        "focusTarget": "#n312-coin",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "硬幣大約 2 毫米厚，螞蟻身長大約 5 毫米，都比 1 公分還短！",
        "focusTarget": "#n312-ant",
        "bubble": None,
        "state": "intro_short",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "自動鉛筆的筆芯只有 0.5 毫米，這麼短要用更小的單位「毫米」！",
        "focusTarget": "#n312-lead",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_lead",
    },

    # === Scene 1: 2/4 核心概念拆解 — 直尺刻度與換算 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "把 1 公分放大看：它被平均分成 10 小格，每一小格就是 1 毫米！",
        "focusTarget": "#n312-ruler",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_unit",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "所以 1 公分等於 10 毫米，寫成 1 cm ＝ 10 mm，記得cm和mm！",
        "focusTarget": "#n312-ruler",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_relation",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "複名數換單名數：3 公分 7 毫米，就是 30 加 7，等於 37 毫米！",
        "focusTarget": "#n312-convert",
        "bubble": "idea",
        "state": "concept_convert",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱：這把尺磨損了！物體左端對著 2 公分，右端在 5 公分 4 毫米。",
        "focusTarget": "#n312-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "不是從 0 開始！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_offset_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✗ 直接讀成 5 公分 4 毫米就錯了，那是終點刻度，不是長度！",
        "focusTarget": "#n312-wrong",
        "bubble": None,
        "badge": {"type": "trap", "text": "✗ 直接讀終點", "x": 1240, "y": 205},
        "state": "trap_read_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✓ 用終點減起點：5cm4mm 減 2cm 等於 3cm4mm，也就是 34 毫米！",
        "focusTarget": "#n312-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "54 － 20 ＝ 34 mm ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_offset_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：一公分十毫米、複名數先乘十再加、沒從零量就相減！",
        "focusSequence": [
            {"target": "#n312-tip-1", "until": 0.34},
            {"target": "#n312-tip-2", "until": 0.67},
            {"target": "#n312-tip-3", "until": 1.0},
        ],
        "bubble": "idea",
        "sfx": "pop",
        "state": "summary_tips",
    },
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 360, "y": 880, "pose": "cheer", "flip": False, "scale": 1.05},
        "subtitle": "你已經學會毫米，快去挑戰 N-3-12 段考真題吧！",
        "focusTarget": "#n312-cta",
        "bubble": "idea",
        "badge": {"type": "correct", "text": "恭喜通關！", "x": 1200, "y": 700},
        "sfx": "correct",
        "state": "summary_outro",
    },
]

PLUGIN_JS = r"""
window.UNIT_PLUGIN = (function () {
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, String(v));
    if (parent) parent.appendChild(node);
    return node;
  }
  function textEl(txt, attrs, parent) {
    const node = el("text", attrs, parent);
    node.textContent = txt;
    return node;
  }
  function card(parent, id, x, y, w, h, accent) {
    const g = el("g", { id: id, transform: `translate(${x}, ${y})` }, parent);
    el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26,
      fill: "#FFFDF8", stroke: accent || "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, g);
    return g;
  }
  function header(zone, title, color) {
    textEl(title, { x: 960, y: 158, "text-anchor": "middle",
      "font-size": 46, "font-weight": 900, fill: "#1E293B" }, zone);
    el("line", { x1: 610, y1: 180, x2: 1310, y2: 180,
      stroke: color, "stroke-width": 6, "stroke-linecap": "round" }, zone);
  }
  function eqBox(parent, id, x, y, w, txt, caption, fill, ink, fontSize) {
    const g = el("g", { id: id, transform: `translate(${x}, ${y})` }, parent);
    el("rect", { x: -w / 2, y: -46, width: w, height: 92, rx: 22,
      fill: fill, stroke: "#1E293B", "stroke-width": 3.5,
      filter: "url(#cardShadow)" }, g);
    textEl(txt, { x: 0, y: 12, "text-anchor": "middle", "font-size": fontSize || 36,
      "font-weight": 900, fill: ink }, g);
    if (caption) {
      textEl(caption, { x: 0, y: 74, "text-anchor": "middle", "font-size": 20,
        "font-weight": 800, fill: "#475569" }, g);
    }
    return g;
  }
  function verdict(parent, id, y, txt, kind, fontSize) {
    const g = el("g", { id: id, transform: `translate(0, ${y})` }, parent);
    const isTrap = kind === "trap";
    el("rect", { x: -320, y: -33, width: 640, height: 66, rx: 18,
      fill: isTrap ? "#FEF2F2" : "#ECFDF5",
      stroke: isTrap ? "#EF4444" : "#10B981", "stroke-width": 3 }, g);
    textEl(txt, { x: 0, y: 9, "text-anchor": "middle",
      "font-size": fontSize || 24, "font-weight": 900,
      fill: isTrap ? "#B91C1C" : "#065F46" }, g);
    return g;
  }
  // 直尺：cm 大刻度 + mm 小刻度；start/end 為物體左右端（以 mm 計，0 在左）
  function ruler(parent, x, y, w, maxMm, objStart, objEnd) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const left = -w / 2;
    el("rect", { x: left, y: -20, width: w, height: 76, rx: 12,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 4 }, g);
    for (let m = 0; m <= maxMm; m += 10) {
      const px = left + (w * m) / maxMm;
      el("line", { x1: px, y1: -20, x2: px, y2: 22,
        stroke: "#1D4ED8", "stroke-width": 4 }, g);
      textEl(String(m / 10), { x: px, y: 44, "text-anchor": "middle",
        "font-size": 22, "font-weight": 900, fill: "#1D4ED8" }, g);
      if (m < maxMm) {
        for (let k = 1; k <= 9; k++) {
          const sx = left + (w * (m + k)) / maxMm;
          el("line", { x1: sx, y1: -20, x2: sx, y2: -4,
            stroke: "#93C5FD", "stroke-width": 2 }, g);
        }
      }
    }
    if (objStart !== undefined) {
      const sx = left + (w * objStart) / maxMm;
      const ex = left + (w * objEnd) / maxMm;
      el("rect", { x: sx, y: -74, width: ex - sx, height: 44, rx: 10,
        fill: "#FDE68A", stroke: "#D97706", "stroke-width": 3 }, g);
      el("line", { x1: sx, y1: -80, x2: sx, y2: -28,
        stroke: "#DC2626", "stroke-width": 4 }, g);
      el("line", { x1: ex, y1: -80, x2: ex, y2: -28,
        stroke: "#059669", "stroke-width": 4 }, g);
    }
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活極短 length：硬幣 / 螞蟻 / 筆芯
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "比 1 公分還短：認識毫米", "#E15B48");

    const coin = card(z0, "n312-coin", 900, 470, 700, 420, "#E15B48");
    textEl("硬幣厚度：大約 2 毫米", { x: 0, y: -160,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#B45309" }, coin);
    el("ellipse", { cx: -160, cy: -44, rx: 118, ry: 40,
      fill: "#FDE68A", stroke: "#D97706", "stroke-width": 4 }, coin);
    el("rect", { x: -278, y: -44, width: 236, height: 24, rx: 8,
      fill: "#FBBF24", stroke: "#D97706", "stroke-width": 3 }, coin);
    el("line", { x1: -150, y1: -104, x2: -150, y2: -76,
      stroke: "#DC2626", "stroke-width": 4 }, coin);
    textEl("厚度約 2 mm", { x: -150, y: -118,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#B91C1C" }, coin);
    textEl("1 元硬幣", { x: -160, y: 34,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#92400E" }, coin);
    el("rect", { x: 30, y: -104, width: 260, height: 150, rx: 18,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 3 }, coin);
    textEl("毫米（mm）", { x: 160, y: -56,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#C2410C" }, coin);
    textEl("量很小的長度", { x: 160, y: -10,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, coin);
    textEl("比 1 公分更細膩", { x: 160, y: 26,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, coin);

    const small = card(z0, "n312-ant", 1620, 470, 520, 420, "#2563EB");
    textEl("生活裡的毫米", { x: 0, y: -160,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, small);
    const items = [
      "螞蟻身長 ≈ 5 mm",
      "鉛筆筆芯 = 0.5 mm",
      "課本厚度 ≈ 8 mm",
    ];
    items.forEach((s, i) => {
      const iy = -92 + i * 74;
      el("rect", { x: -210, y: iy - 28, width: 420, height: 60, rx: 14,
        fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, small);
      textEl(s, { x: 0, y: iy + 10, "text-anchor": "middle",
        "font-size": 23, "font-weight": 900, fill: "#1E3A8A" }, small);
    });
    textEl("這些都用「毫米」記錄", { x: 0, y: 166,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, small);

    eqBox(z0, "n312-lead", 1260, 810, 900,
      "自動鉛筆筆芯 0.5 mm，比半格還細！",
      "極短長度用毫米最剛好", "#FEF3C7", "#92400E", 29);

    // =========================================================
    // ZONE 1 — 放大直尺與單位換算
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "1 公分 ＝ 10 毫米", "#2563EB");

    const big = card(z1, "n312-ruler", 960, 450, 780, 480, "#2563EB");
    textEl("放大直尺：1 公分被分成 10 小格", { x: 0, y: -180,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#1D4ED8" }, big);
    ruler(big, 0, -70, 620, 40);
    el("rect", { x: -280, y: 92, width: 560, height: 64, rx: 16,
      fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, big);
    textEl("1 cm ＝ 10 mm　｜　每小格 = 1 mm", { x: 0, y: 134,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#1D4ED8" }, big);
    textEl("長的用 cm，更短的用 mm", { x: 0, y: 196,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, big);

    const conv = card(z1, "n312-convert", 1660, 450, 480, 480, "#7C3AED");
    textEl("複名數 ⇄ 單名數", { x: 0, y: -180,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, conv);
    el("rect", { x: -200, y: -132, width: 400, height: 100, rx: 16,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, conv);
    textEl("3 公分 7 毫米", { x: 0, y: -98,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#5B21B6" }, conv);
    textEl("＝ 30 ＋ 7 ＝ 37 毫米", { x: 0, y: -56,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#065F46" }, conv);
    el("rect", { x: -200, y: -8, width: 400, height: 100, rx: 16,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, conv);
    textEl("86 毫米", { x: 0, y: 26,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#5B21B6" }, conv);
    textEl("＝ 8 公分 6 毫米", { x: 0, y: 68,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#065F46" }, conv);
    textEl("先乘十再加上小格", { x: 0, y: 138,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#6D28D9" }, conv);
    textEl("除以十拆回複名數", { x: 0, y: 178,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#6D28D9" }, conv);

    // =========================================================
    // ZONE 2 — 段考陷阱：沒有從 0 開始量
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：起點不是 0", "#D97706");

    const trap = card(z2, "n312-trap", 1230, 470, 1060, 560, "#DC2626");
    textEl("橡皮擦左端對 2 cm，右端在 5 cm 4 mm", { x: 0, y: -222,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, trap);
    ruler(trap, 0, -110, 900, 60, 20, 54);
    textEl("起點 2 cm（20 mm）　終點 5 cm 4 mm（54 mm）", { x: 0, y: -14,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, trap);
    const wg = el("g", { id: "n312-wrong", transform: "translate(0, 64)" }, trap);
    el("rect", { x: -450, y: -42, width: 900, height: 80, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, wg);
    textEl("✗ 直接讀成 5 cm 4 mm（那是終點，不是長度）", { x: 0, y: 12,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#B91C1C" }, wg);
    const cg = el("g", { id: "n312-correct", transform: "translate(0, 174)" }, trap);
    el("rect", { x: -450, y: -42, width: 900, height: 80, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, cg);
    textEl("✓ 終點－起點：54－20＝34 mm＝3 cm 4 mm", { x: 0, y: 12,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#065F46" }, cg);
    textEl("口訣：沒從 0 開始，記得相減！", { x: 0, y: 248,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#B45309" }, trap);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "毫米三大口訣", "#059669");
    const tips = [
      { id: "n312-tip-1", x: 760, title: "① 十進關係", col: "#2563EB",
        lines: ["1 cm = 10 mm", "-mm 量較短", "小格就是 1 mm"] },
      { id: "n312-tip-2", x: 1220, title: "② 換算有法", col: "#D97706",
        lines: ["公分乘十加毫米", "毫米除十拆公分", "複名數單名數互換"] },
      { id: "n312-tip-3", x: 1680, title: "③ 起點注意", col: "#059669",
        lines: ["先看有沒有從 0", "不是 0 就相減", "終點減起點"] },
    ];
    tips.forEach((tip) => {
      const c = card(z3, tip.id, tip.x, 480, 420, 440, tip.col);
      el("rect", { x: -190, y: -186, width: 380, height: 58, rx: 16,
        fill: tip.col }, c);
      textEl(tip.title, { x: 0, y: -146, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#FFFFFF" }, c);
      tip.lines.forEach((ln, i) => {
        textEl(ln, { x: 0, y: -52 + i * 66, "text-anchor": "middle",
          "font-size": 20, "font-weight": 800, fill: "#1E293B" }, c);
      });
    });
    const cta = el("g", { id: "n312-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 毫米小達人挑戰開始！快去寫 N-3-12 段考真題！ ⭐", {
      x: 0, y: 13, "text-anchor": "middle", "font-size": 26,
      "font-weight": 900, fill: "#FFFFFF"
    }, cta);
  }

  function updateWorld(t, cue, cueProgress, timeline) {
    // 焦點高光由 stage_template 的 getBoundingClientRect 機制處理，插件保持無狀態。
  }

  return { buildWorld, updateWorld };
})();
"""


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N312_Final.mp4"

    print("=== Rendering G3-N-3-12 Millimeter Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_coin", "cue:1:0.55"),
            ("02_act1_lead", "cue:2:0.55"),
            ("03_act2_ruler", "cue:3:0.55"),
            ("04_act2_convert", "cue:5:0.55"),
            ("05_act3_trap", "cue:6:0.55"),
            ("06_act3_correct", "cue:8:0.55"),
            ("07_act4_summary", "cue:9:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-12 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
