"""
tools/classroom_engine/units/n311_number_line.py
G3 N-3-11 整數數線：生活刻度、三要素、跳數讀法、兩點距離與「間隔÷格數」陷阱
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n311_number_line
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-11",
    "title": "整數數線",
    "short_title": "整數數線｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活的刻度與距離 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！生活裡到處都有刻度，一起來認識整數數線！",
        "focusTarget": "#n311-thermo",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "看溫度計：刻度從 0 往上，每一小格都一樣，數字越大就越熱。",
        "focusTarget": "#n311-thermo",
        "bubble": None,
        "state": "intro_thermo",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "直尺上的 0、1、2、3 公分，每一格都一樣長，這就是固定的單位長！",
        "focusTarget": "#n311-ruler",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_ruler",
    },

    # === Scene 1: 2/4 核心概念拆解 — 三要素與跳數 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "數線有三大要素：原點 0、向右的箭頭、還有固定長度的刻度。",
        "focusTarget": "#n311-parts",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_parts",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "刻度 0、5、10、15、20：相鄰兩大格差 5，一大格代表 5 個單位。",
        "focusTarget": "#n311-parts",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_step5",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "換個規模：每格 10、每格 100 都可以！記得越往右邊的數越大。",
        "focusTarget": "#n311-scale",
        "bubble": "idea",
        "state": "concept_scale",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：從 200 到 300 平分成 5 小格，有人直接說每格是 1，錯了！",
        "focusTarget": "#n311-gap-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "別直接當每格 1！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_gap_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "先算間隔：300 減 200 等於 100，再除以 5 格，每格其實是 20！",
        "focusTarget": "#n311-gap-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "100 ÷ 5 ＝ 20 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_gap_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：點 A 在 24，點 B 在 31，兩點之間相差幾個單位長？",
        "focusTarget": "#n311-dist-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "要算距離不是刻度！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_dist_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "用終點減起點：31 減 24 等於 7，所以相差 7 個單位長，綠勾才對！",
        "focusTarget": "#n311-dist-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "31 － 24 ＝ 7 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_dist_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：認清三要素、先算間隔再除格數、往右越大往左越小！",
        "focusSequence": [
            {"target": "#n311-tip-1", "until": 0.34},
            {"target": "#n311-tip-2", "until": 0.67},
            {"target": "#n311-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會整數數線，快去挑戰 N-3-11 段考真題吧！",
        "focusTarget": "#n311-cta",
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
  function numLine(parent, x, y, w, ticks, highlightIndex) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    el("line", { x1: -w / 2, y1: 0, x2: w / 2, y2: 0, stroke: "#1E293B",
      "stroke-width": 4, "stroke-linecap": "round" }, g);
    el("path", { d: `M${w / 2},0 l-24,-14 l0,28 z`, fill: "#1E293B" }, g);
    const n = ticks.length;
    ticks.forEach((t, i) => {
      const px = -w / 2 + (w * i) / (n - 1);
      const hot = (i === highlightIndex);
      el("line", { x1: px, y1: -17, x2: px, y2: 17,
        stroke: hot ? "#E15B48" : "#1E293B", "stroke-width": hot ? 6 : 4 }, g);
      textEl(String(t), { x: px, y: 48, "text-anchor": "middle",
        "font-size": 25, "font-weight": 900,
        fill: hot ? "#C2410C" : "#1E293B" }, g);
    });
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活刻度：溫度計 + 尺規
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的刻度：溫度計與尺規", "#E15B48");

    const thermo = card(z0, "n311-thermo", 920, 470, 700, 430, "#E15B48");
    textEl("溫度計：刻度越往上越大", { x: 0, y: -168,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#B45309" }, thermo);
    el("rect", { x: -150, y: -134, width: 44, height: 254, rx: 22,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 4 }, thermo);
    el("circle", { cx: -128, cy: 138, r: 30,
      fill: "#EF4444", stroke: "#B91C1C", "stroke-width": 3 }, thermo);
    el("rect", { x: -140, y: 30, width: 20, height: 110, rx: 10, fill: "#EF4444" }, thermo);
    for (let i = 0; i <= 5; i++) {
      const ty = 120 - i * 48;
      el("line", { x1: -100, y1: ty, x2: -66, y2: ty,
        stroke: "#E15B48", "stroke-width": 4, "stroke-linecap": "round" }, thermo);
      textEl(String(i * 10), { x: -52, y: ty + 8, "font-size": 21,
        "font-weight": 900, fill: "#9A3412" }, thermo);
    }
    textEl("0° 結冰 → 100° 煮沸", { x: 150, y: -56,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#C2410C" }, thermo);
    textEl("每一小格都一樣長", { x: 150, y: -4,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, thermo);
    textEl("所以刻度可以比大小！", { x: 150, y: 48,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, thermo);

    const ruler = card(z0, "n311-ruler", 1620, 470, 520, 430, "#2563EB");
    textEl("直尺：固定單位長", { x: 0, y: -168,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, ruler);
    el("rect", { x: -210, y: -100, width: 420, height: 110, rx: 16,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 4 }, ruler);
    for (let i = 0; i <= 5; i++) {
      const rx = -180 + i * 72;
      el("line", { x1: rx, y1: -100, x2: rx, y2: -58,
        stroke: "#2563EB", "stroke-width": 4 }, ruler);
      textEl(String(i), { x: rx, y: -32, "text-anchor": "middle",
        "font-size": 24, "font-weight": 900, fill: "#1D4ED8" }, ruler);
    }
    textEl("0、1、2、3…公分", { x: 0, y: 34,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#1E3A8A" }, ruler);
    textEl("每一格都是 1 公分", { x: 0, y: 78,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, ruler);
    textEl("把直尺拉長、加上箭頭", { x: 0, y: 128,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#1D4ED8" }, ruler);
    textEl("就變成數線囉！", { x: 0, y: 162,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#1D4ED8" }, ruler);

    eqBox(z0, "n311-intro-note", 1260, 810, 900,
      "刻度 ＋ 方向 ＋ 固定間隔 ＝ 數線",
      "三要素缺一不可", "#FEF3C7", "#92400E", 31);

    // =========================================================
    // ZONE 1 — 三要素與跳數讀法
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "數線三要素與跳數讀法", "#2563EB");

    const parts = card(z1, "n311-parts", 960, 450, 780, 480, "#2563EB");
    textEl("原點 0 ＋ 向右箭頭 ＋ 固定刻度", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, parts);
    numLine(parts, 0, 12, 620, ["0", "5", "10", "15", "20"], 2);
    el("rect", { x: -300, y: -142, width: 600, height: 60, rx: 16,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, parts);
    textEl("原點 0 在這裡 ➜ 箭頭代表向右無限延伸", { x: 0, y: -103,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#1D4ED8" }, parts);
    el("rect", { x: -300, y: 98, width: 600, height: 64, rx: 16,
      fill: "#FEF3C7", stroke: "#F59E0B", "stroke-width": 3 }, parts);
    textEl("相鄰兩大格差 5 ➜ 一大格代表 5 個單位", { x: 0, y: 140,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#92400E" }, parts);
    textEl("5、10、15、20… 就是每次跳 5！", { x: 0, y: 202,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, parts);

    const scale = card(z1, "n311-scale", 1660, 450, 480, 480, "#7C3AED");
    textEl("一格可以是幾？", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#6D28D9" }, scale);
    const rows = [
      { t: "0  5  10  15  20", s: "每格 5", c: "#1D4ED8" },
      { t: "0  10  20  30  40", s: "每格 10", c: "#6D28D9" },
      { t: "100 200 300 400", s: "每格 100", c: "#B45309" },
    ];
    rows.forEach((r, i) => {
      const ry = -110 + i * 100;
      el("rect", { x: -200, y: ry - 34, width: 400, height: 84, rx: 16,
        fill: "#F5F3FF", stroke: r.c, "stroke-width": 3 }, scale);
      textEl(r.t, { x: 0, y: ry - 2, "text-anchor": "middle",
        "font-size": 22, "font-weight": 900, fill: r.c }, scale);
      textEl(r.s, { x: 0, y: ry + 34, "text-anchor": "middle",
        "font-size": 20, "font-weight": 900, fill: "#475569" }, scale);
    });
    textEl("往右越變越大 ➜", { x: 0, y: 202,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#065F46" }, scale);

    // =========================================================
    // ZONE 2 — 段考陷阱：間隔÷格數 / 兩點距離
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：格數與距離", "#D97706");

    const gap = card(z2, "n311-gap", 990, 470, 800, 540, "#DC2626");
    textEl("陷阱一：200 到 300 平分 5 小格", { x: 0, y: -210,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, gap);
    numLine(gap, 0, -84, 600, ["200", "220", "240", "260", "280", "300"], 3);
    textEl("5 個小格，每格其實是 20", { x: 0, y: -10,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, gap);
    const gw = el("g", { id: "n311-gap-wrong", transform: "translate(0, 46)" }, gap);
    el("rect", { x: -340, y: -40, width: 680, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, gw);
    textEl("✗ 誤當每格 1：200、201、202…", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#B91C1C" }, gw);
    const gc = el("g", { id: "n311-gap-correct", transform: "translate(0, 148)" }, gap);
    el("rect", { x: -340, y: -40, width: 680, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, gc);
    textEl("✓ 先算間隔 100 ÷ 5 ＝ 20", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#065F46" }, gc);

    const dist = card(z2, "n311-dist", 1660, 470, 480, 540, "#7C3AED");
    textEl("陷阱二：兩點相差多少？", { x: 0, y: -210,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, dist);
    numLine(dist, 0, -78, 400, ["20", "24", "28", "31"], 3);
    textEl("A 在 24，B 在 31", { x: 0, y: -6,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, dist);
    const dw = el("g", { id: "n311-dist-wrong", transform: "translate(0, 44)" }, dist);
    el("rect", { x: -215, y: -38, width: 430, height: 72, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, dw);
    textEl("✗ 直接答 31", { x: 0, y: 10,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#B91C1C" }, dw);
    const dc = el("g", { id: "n311-dist-correct", transform: "translate(0, 146)" }, dist);
    el("rect", { x: -215, y: -38, width: 430, height: 72, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, dc);
    textEl("✓ 31 － 24 ＝ 7", { x: 0, y: 10,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#065F46" }, dc);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "整數數線三大口訣", "#059669");
    const tips = [
      { id: "n311-tip-1", x: 760, title: "① 認三要素", col: "#2563EB",
        lines: ["原點 0 開始", "箭頭向右", "刻度固定長"] },
      { id: "n311-tip-2", x: 1220, title: "② 先算間隔", col: "#D97706",
        lines: ["終點減起點", "間隔除格數", "再讀每一格"] },
      { id: "n311-tip-3", x: 1680, title: "③ 右大左小", col: "#059669",
        lines: ["往右數字變大", "往左數字變小", "距離要相減"] },
    ];
    tips.forEach((tip) => {
      const c = card(z3, tip.id, tip.x, 480, 420, 440, tip.col);
      el("rect", { x: -190, y: -186, width: 380, height: 58, rx: 16,
        fill: tip.col }, c);
      textEl(tip.title, { x: 0, y: -146, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#FFFFFF" }, c);
      tip.lines.forEach((ln, i) => {
        textEl(ln, { x: 0, y: -52 + i * 66, "text-anchor": "middle",
          "font-size": 21, "font-weight": 800, fill: "#1E293B" }, c);
      });
    });
    const cta = el("g", { id: "n311-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 數線小達人挑戰開始！快去寫 N-3-11 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N311_Final.mp4"

    print("=== Rendering G3-N-3-11 Integer Number Line Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_thermo", "cue:1:0.55"),
            ("02_act1_ruler", "cue:2:0.55"),
            ("03_act2_parts", "cue:3:0.55"),
            ("04_act2_scale", "cue:5:0.55"),
            ("05_act3_gap", "cue:7:0.55"),
            ("06_act3_distance", "cue:9:0.55"),
            ("07_act4_summary", "cue:10:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-11 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
