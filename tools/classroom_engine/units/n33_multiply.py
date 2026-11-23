"""
tools/classroom_engine/units/n33_multiply.py
G3 N-3-3 乘以一位數：整百整十倍數、二三位數直式、被乘數含 0 的陷阱
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n33_multiply
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-3",
    "title": "乘以一位數",
    "short_title": "乘以一位數｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 整百整十倍數 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！整百整十的倍數超有規律，一起來乘以一位數！",
        "focusTarget": "#n33-hundred",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "9 乘以 7 等於 63，900 乘以 7 就把 63 後面補兩個 0，得到 6300。",
        "focusTarget": "#n33-hundred",
        "bubble": None,
        "state": "intro_hundred",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "30 乘以 4 等於 120：先算 3 乘以 4 等 12，再補一個 0 就好！",
        "focusTarget": "#n33-ten",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_ten",
    },

    # === Scene 1: 2/4 核心概念拆解 — 位值分解與直式 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "直式要對齊位子，從個位乘起；二位數可以拆成幾個十和幾個一。",
        "focusTarget": "#n33-two",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_align",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "34 乘以 2：4 乘以 2 等 8，30 乘以 2 等 60，合起來就是 68。",
        "focusTarget": "#n33-two",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_split",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "248 乘以 3：8 乘以 3 等 24，寫 4 進 2，繼續乘下去得到 744。",
        "focusTarget": "#n33-three",
        "bubble": "idea",
        "state": "concept_carry",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：305 乘以 4，在中間有 0。有人寫成 122，少了一位，錯了！",
        "focusTarget": "#n33-zero-mid-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "中間 0 也要乘！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_mid_zero_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "0 乘以 4 等於 0，這一位要寫 0 占位，正確答案是 1220！",
        "focusTarget": "#n33-zero-mid-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "305×4＝1220 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_mid_zero_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：250 乘以 4。有人算 25 乘以 4 就停，寫成 100，少寫一個 0！",
        "focusTarget": "#n33-zero-end-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "末尾 0 要補回來！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_end_zero_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "先算 25 乘以 4 等 100，再把末尾的 0 補回去，答案就是 1000！",
        "focusTarget": "#n33-zero-end-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "250×4＝1000 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_end_zero_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：對齊位子、逐位相乘、遇到 0 要占位補零！",
        "focusSequence": [
            {"target": "#n33-tip-1", "until": 0.34},
            {"target": "#n33-tip-2", "until": 0.67},
            {"target": "#n33-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會乘以一位數，快去挑戰 N-3-3 段考真題吧！",
        "focusTarget": "#n33-cta",
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
  // 乘法直式（三位被乘數 × 一位乘數），carry 為進位小字標記
  function mulVertical(parent, x, digits, multiplier, result, carries) {
    const xs = [x - 140, x, x + 140];
    ["百位", "十位", "個位"].forEach((nm, i) => {
      textEl(nm, { x: xs[i], y: -138, "text-anchor": "middle",
        "font-size": 19, "font-weight": 800, fill: "#64748B" }, parent);
    });
    digits.forEach((d, i) => {
      textEl(d, { x: xs[i], y: -72, "text-anchor": "middle",
        "font-size": 46, "font-weight": 900, fill: "#1E293B" }, parent);
    });
    textEl("×", { x: x - 206, y: 0, "text-anchor": "middle",
      "font-size": 40, "font-weight": 900, fill: "#1E293B" }, parent);
    textEl(multiplier, { x: x + 140, y: 0, "text-anchor": "middle",
      "font-size": 46, "font-weight": 900, fill: "#1E293B" }, parent);
    el("line", { x1: x - 248, y1: 26, x2: x + 248, y2: 26,
      stroke: "#1E293B", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    const outXs = result.length === 4
      ? [x - 210, x - 70, x + 70, x + 210]
      : [x - 140, x, x + 140];
    const outFs = result.length === 4 ? 40 : 46;
    result.split("").forEach((d, i) => {
      textEl(d, { x: outXs[i], y: 84, "text-anchor": "middle",
        "font-size": outFs, "font-weight": 900, fill: "#065F46" }, parent);
    });
    (carries || []).forEach((c) => {
      textEl(c.t, { x: xs[c.i], y: -104, "text-anchor": "middle",
        "font-size": 20, "font-weight": 900, fill: "#DC2626" }, parent);
    });
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 整百整十倍數的生活應用
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "整百整十倍數的生活應用", "#E15B48");

    const hundred = card(z0, "n33-hundred", 900, 450, 720, 380, "#E15B48");
    textEl("位值放大：被乘數多一個 0，積就多一個 0", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#B45309" }, hundred);
    const rows = [
      { t: "9 × 7 ＝ 63", fill: "#FFFFFF", ink: "#1E293B", fs: 36 },
      { t: "90 × 7 ＝ 630", fill: "#FFF7ED", ink: "#C2410C", fs: 36 },
      { t: "900 × 7 ＝ 6300", fill: "#FEF3C7", ink: "#C2410C", fs: 40 },
    ];
    rows.forEach((r, i) => {
      const ry = -92 + i * 72;
      el("rect", { x: -280, y: ry - 32, width: 560, height: 64, rx: 16,
        fill: r.fill, stroke: i === 2 ? "#F59E0B" : "#FED7AA",
        "stroke-width": i === 2 ? 4 : 3 }, hundred);
      textEl(r.t, { x: 0, y: ry + 12, "text-anchor": "middle",
        "font-size": r.fs, "font-weight": 900, fill: r.ink }, hundred);
    });
    textEl("補 2 個 0 → 6300 ✓", { x: 0, y: 146, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#9A3412" }, hundred);

    const ten = card(z0, "n33-ten", 1650, 450, 500, 380, "#2563EB");
    textEl("整十倍數：30 × 4", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, ten);
    textEl("3 × 4 ＝ 12", { x: 0, y: -72, "text-anchor": "middle",
      "font-size": 34, "font-weight": 900, fill: "#1E293B" }, ten);
    el("rect", { x: -190, y: -30, width: 380, height: 118, rx: 20,
      fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 4 }, ten);
    textEl("30 × 4 ＝ 120", { x: 0, y: 46, "text-anchor": "middle",
      "font-size": 36, "font-weight": 900, fill: "#1D4ED8" }, ten);
    textEl("12 後面補 1 個 0", { x: 0, y: 122, "text-anchor": "middle",
      "font-size": 22, "font-weight": 900, fill: "#475569" }, ten);

    eqBox(z0, "n33-intro-note", 1220, 800, 880,
      "先算不帶 0 的基本題，再把 0 補回去",
      "補幾個 0，答案就多幾個 0", "#FEF3C7", "#92400E", 31);

    // =========================================================
    // ZONE 1 — 位值分解 / 直式對齊與進位
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "二位數、三位數乘以一位數", "#2563EB");

    const two = card(z1, "n33-two", 960, 480, 700, 460, "#2563EB");
    textEl("位值分解：34 × 2", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, two);
    const parts = [
      { t: "4 × 2 ＝ 8", sub: "個位：4 個一", f: "#ECFDF5", s: "#10B981", i: "#065F46" },
      { t: "30 × 2 ＝ 60", sub: "十位：3 個十", f: "#DBEAFE", s: "#2563EB", i: "#1D4ED8" },
      { t: "60 ＋ 8 ＝ 68", sub: "合起來就是答案", f: "#FEF3C7", s: "#F59E0B", i: "#92400E" },
    ];
    parts.forEach((p, i) => {
      const py = -116 + i * 100;
      el("rect", { x: -290, y: py - 40, width: 580, height: 84, rx: 18,
        fill: p.f, stroke: p.s, "stroke-width": 3 }, two);
      textEl(p.t, { x: -20, y: py + 9, "text-anchor": "middle",
        "font-size": 30, "font-weight": 900, fill: p.i }, two);
      textEl(p.sub, { x: 222, y: py + 8, "text-anchor": "middle",
        "font-size": 18, "font-weight": 800, fill: "#475569" }, two);
    });
    textEl("直式對齊：個位對個位，從個位乘起", { x: 0, y: 194,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#1E293B" }, two);

    const three = card(z1, "n33-three", 1650, 480, 500, 460, "#7C3AED");
    textEl("三位數直式：248 × 3", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#6D28D9" }, three);
    mulVertical(three, 0, ["2", "4", "8"], "3", "744", [
      { i: 2, t: "進2", c: "#DC2626" },
      { i: 1, t: "進1", c: "#DC2626" },
    ]);
    textEl("8×3=24 進 2；4×3+2=14 進 1", { x: 0, y: 158,
      "text-anchor": "middle", "font-size": 18, "font-weight": 800,
      fill: "#6D28D9" }, three);
    textEl("2×3+1=7 → 744 ✓", { x: 0, y: 192, "text-anchor": "middle",
      "font-size": 19, "font-weight": 900, fill: "#065F46" }, three);

    // =========================================================
    // ZONE 2 — 段考陷阱：被乘數中間有 0 / 末尾有 0
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：被乘數有 0 別漏寫", "#D97706");

    const mid = card(z2, "n33-zero-mid", 1000, 490, 720, 600, "#DC2626");
    textEl("陷阱一：305 × 4（中間有 0）", { x: 0, y: -220,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, mid);
    mulVertical(mid, 0, ["3", "0", "5"], "4", "1220", [
      { i: 2, t: "進2", c: "#DC2626" },
    ]);
    textEl("十位：0 × 4 ＝ 0，一定要寫 0 占位", { x: 0, y: 126,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#B91C1C" }, mid);
    verdict(mid, "n33-zero-mid-wrong", 178, "✗ 漏掉 0 × 4 → 寫成 122", "trap", 22);
    verdict(mid, "n33-zero-mid-correct", 256, "✓ 0 占位 → 1220", "correct", 23);

    const end = card(z2, "n33-zero-end", 1650, 490, 500, 540, "#7C3AED");
    textEl("陷阱二：250 × 4（末尾有 0）", { x: 0, y: -220,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#6D28D9" }, end);
    el("rect", { x: -210, y: -174, width: 420, height: 90, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, end);
    textEl("25 × 4 ＝ 100", { x: 0, y: -138, "text-anchor": "middle",
      "font-size": 30, "font-weight": 900, fill: "#5B21B6" }, end);
    textEl("再把末尾 0 補回去", { x: 0, y: -102, "text-anchor": "middle",
      "font-size": 19, "font-weight": 800, fill: "#475569" }, end);
    const ew = el("g", { id: "n33-zero-end-wrong", transform: "translate(0, -18)" }, end);
    el("rect", { x: -210, y: -36, width: 420, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, ew);
    textEl("✗ 只寫 100，少一個 0", { x: 0, y: 12, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#B91C1C" }, ew);
    const ec = el("g", { id: "n33-zero-end-correct", transform: "translate(0, 78)" }, end);
    el("rect", { x: -210, y: -36, width: 420, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, ec);
    textEl("✓ 補 0 → 1000", { x: 0, y: 12, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#065F46" }, ec);
    textEl("口訣：先乘不帶 0，再數 0 補上去", { x: 0, y: 200,
      "text-anchor": "middle", "font-size": 19, "font-weight": 800,
      fill: "#5B21B6" }, end);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "乘以一位數三大口訣", "#059669");
    const tips = [
      { id: "n33-tip-1", x: 760, title: "① 對齊位子", col: "#2563EB",
        lines: ["個位對個位", "從個位乘起", "進位寫旁邊"] },
      { id: "n33-tip-2", x: 1220, title: "② 逐位相乘", col: "#D97706",
        lines: ["先拆位值", "再一一相乘", "滿十就進位"] },
      { id: "n33-tip-3", x: 1680, title: "③ 遇 0 補零", col: "#059669",
        lines: ["中間 0 要寫 0", "末尾 0 要補回", "別少寫一個位"] },
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
    const cta = el("g", { id: "n33-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 乘法小達人挑戰開始！快去寫 N-3-3 段考真題！ ⭐", {
      x: 0, y: 13, "text-anchor": "middle", "font-size": 27,
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N33_Final.mp4"

    print("=== Rendering G3-N-3-3 Multiply By One Digit Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_hundred", "cue:1:0.55"),
            ("02_act1_ten", "cue:2:0.55"),
            ("03_act2_split", "cue:4:0.55"),
            ("04_act2_carry", "cue:5:0.55"),
            ("05_act3_mid_zero", "cue:7:0.55"),
            ("06_act3_end_zero", "cue:9:0.55"),
            ("07_act4_summary", "cue:11:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-3 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
