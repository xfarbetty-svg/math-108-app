"""
tools/classroom_engine/units/n38_estimation.py
G3 N-3-8 解題（四則估算）：大賣場帶錢夠不夠情境、數線靠近整百整十概念圖、
帶錢往大估 vs 滿額門檻往小估陷阱。
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n38_estimation
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-8",
    "title": "解題（四則估算）",
    "short_title": "四則估算｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 大賣場購物估算 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！逛大賣場不用按計算機，用估算就能秒判斷帶夠錢了沒！",
        "focusTarget": "#n38-shop",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "帶 1000 元買 298 元的書包和 412 元的鞋子，大約要付多少錢呢？",
        "focusTarget": "#n38-shop",
        "bubble": None,
        "sfx": "correct",
        "state": "intro_shop",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "298 靠近 300，412 靠近 400，300 加 400 等於 700，1000 元當然夠！",
        "focusTarget": "#n38-budget",
        "bubble": "idea",
        "state": "intro_round",
    },

    # === Scene 1: 2/4 核心概念拆解 — 數線靠近整百整十 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "數線上看：298 離 300 只差 2，所以 298 靠近 300，先記成整百數！",
        "focusTarget": "#n38-line",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_298",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "412 離 400 只差 12，比離 500 近多了，所以 412 靠近 400。",
        "focusTarget": "#n38-line2",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_412",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "想快速心算：估大一點就是往上湊整數，估小一點就是往下湊整數，看題目選方向！",
        "focusTarget": "#n38-strategy",
        "bubble": None,
        "state": "concept_direction",
    },

    # === Scene 2: 3/4 段考陷阱：估算方向 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：帶 700 元買 298 元和 412 元的東西，到底夠不夠買呢？",
        "focusTarget": "#n38-trap",
        "bubble": "question",
        "badge": {"type": "trap", "text": "帶錢要往大估！", "x": 1240, "y": 70},
        "sfx": "trap",
        "state": "trap_money",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✗ 亂估小：290 加 410 等於 700，以為剛好夠，結果真的付錢時就差一點！",
        "focusTarget": "#n38-trap-wrong",
        "bubble": None,
        "badge": {"type": "trap", "text": "✗ 估小帶不夠錢", "x": 1240, "y": 70},
        "state": "trap_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✓ 帶錢往大估：300 加 420 等於 720，720 大於 700，才知道 700 元不夠！",
        "focusTarget": "#n38-trap-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "720 ＞ 700 ✓", "x": 1240, "y": 70},
        "sfx": "correct",
        "state": "trap_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：滿 500 免運，購物 498 元。✗ 估成 500 以為免運；✓ 往小估 490，才發現還差 2 元！",
        "focusTarget": "#n38-threshold",
        "bubble": "question",
        "state": "trap_threshold",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：找最近整數、帶錢往大估、門檻往小估！估算超好用！",
        "focusSequence": [
            {"target": "#n38-tip-1", "until": 0.34},
            {"target": "#n38-tip-2", "until": 0.67},
            {"target": "#n38-tip-3", "until": 1.0},
        ],
        "bubble": "idea",
        "sfx": "pop",
        "state": "summary_tips",
    },
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 1.0},
        "mimi": {"x": 360, "y": 880, "pose": "cheer", "flip": False, "scale": 1.05},
        "subtitle": "你已經學會四則估算，快去挑戰 N-3-8 段考真題吧！",
        "focusTarget": "#n38-cta",
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
  // 數線：刻度 + 目標值高光框 + 靠近的整數標記
  function numberLine(parent, x, y, marks, nearMark, valueText, cap) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const left = -320, right = 320;
    el("line", { x1: left, y1: 0, x2: right, y2: 0,
      stroke: "#1E293B", "stroke-width": 5, "stroke-linecap": "round" }, g);
    el("path", { d: `M${right},0 l-16,-10 l0,20 Z`, fill: "#1E293B" }, g);
    marks.forEach((m) => {
      const px = left + (m.v - marks[0].v) * (right - left) / (marks[marks.length - 1].v - marks[0].v);
      const isNear = m.v === nearMark;
      el("line", { x1: px, y1: isNear ? -22 : -12, x2: px, y2: isNear ? 22 : 12,
        stroke: isNear ? "#DC2626" : "#64748B", "stroke-width": isNear ? 6 : 3 }, g);
      textEl(String(m.v), { x: px, y: 48, "text-anchor": "middle",
        "font-size": isNear ? 25 : 20, "font-weight": 900,
        fill: isNear ? "#B91C1C" : "#475569" }, g);
    });
    const nearX = left + (nearMark - marks[0].v) * (right - left) / (marks[marks.length - 1].v - marks[0].v);
    el("rect", { x: nearX - 60, y: -96, width: 120, height: 52, rx: 14,
      fill: "#FEF3C7", stroke: "#F59E0B", "stroke-width": 3.5 }, g);
    textEl(valueText, { x: nearX, y: -60, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#92400E" }, g);
    textEl(cap, { x: 0, y: 84, "text-anchor": "middle",
      "font-size": 21, "font-weight": 800, fill: "#475569" }, g);
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 大賣場購物估算情境
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "大賣場：帶 1000 元夠不夠？", "#E15B48");

    const shop = card(z0, "n38-shop", 1050, 470, 760, 460, "#E15B48");
    textEl("購物籃裡有什麼？", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#B45309" }, shop);
    el("rect", { x: -340, y: -130, width: 680, height: 102, rx: 18,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 3 }, shop);
    textEl("書包 298 元　＋　鞋子 412 元", { x: 0, y: -92,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#C2410C" }, shop);
    textEl("298 靠近 300　｜　412 靠近 400", { x: 0, y: -6,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#1D4ED8" }, shop);
    textEl("約 300 ＋ 400 ＝ 700 元", { x: 0, y: 60,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#065F46" }, shop);
    textEl("不用按計算機，估算就能判斷！", { x: 0, y: 142,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, shop);

    const budget = card(z0, "n38-budget", 1680, 470, 440, 460, "#7C3AED");
    textEl("帶錢判斷", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#6D28D9" }, budget);
    el("rect", { x: -200, y: -120, width: 400, height: 110, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, budget);
    textEl("1000 元", { x: 0, y: -80,
      "text-anchor": "middle", "font-size": 38, "font-weight": 900,
      fill: "#5B21B6" }, budget);
    textEl("大於 700 元", { x: 0, y: -34,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#5B21B6" }, budget);
    textEl("✓ 帶 1000 元夠買", { x: 0, y: 62,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#065F46" }, budget);
    textEl("先估大一點更保險", { x: 0, y: 134,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, budget);

    eqBox(z0, "n38-intro-note", 1280, 810, 940,
      "估算不是亂猜：先找離它最近的整十或整百",
      "四則估算都能用這招", "#FEF3C7", "#92400E", 29);

    // =========================================================
    // ZONE 1 — 數線靠近整百／整十概念圖
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "數線看靠近：整百與整十", "#2563EB");

    const line1 = card(z1, "n38-line", 1000, 440, 720, 390, "#2563EB");
    textEl("298 靠近 300", { x: 0, y: -140,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, line1);
    numberLine(line1, 0, 8,
      [{ v: 280 }, { v: 290 }, { v: 300 }, { v: 310 }, { v: 320 }],
      300, "298 → 300", "離 300 只差 2，超級近！");

    const line2 = card(z1, "n38-line2", 1000, 800, 720, 130, "#7C3AED");
    textEl("412 靠近 400　｜　離 500 還差 88", { x: 0, y: 8,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#5B21B6" }, line2);
    textEl("298 → 300，412 → 400，加起來大約 700", { x: 0, y: 46,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, line2);

    const strat = card(z1, "n38-strategy", 1660, 480, 440, 500, "#D97706");
    textEl("估算方向怎麼選？", { x: 0, y: -194,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#92400E" }, strat);
    el("rect", { x: -200, y: -142, width: 400, height: 108, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, strat);
    textEl("估大一點", { x: 0, y: -108,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#065F46" }, strat);
    textEl("往上湊整數，錢才帶得夠", { x: 0, y: -66,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, strat);
    el("rect", { x: -200, y: 4, width: 400, height: 108, rx: 18,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, strat);
    textEl("估小一點", { x: 0, y: 38,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#1D4ED8" }, strat);
    textEl("往下湊整數，門檻不誤判", { x: 0, y: 80,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, strat);
    textEl("看題目在問什麼，再決定方向！", { x: 0, y: 166,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#92400E" }, strat);

    // =========================================================
    // ZONE 2 — 段考陷阱：估算方向
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：估大還是估小？", "#D97706");

    const trap = card(z2, "n38-trap", 1050, 470, 800, 560, "#DC2626");
    textEl("帶 700 元買 298 元和 412 元", { x: 0, y: -218,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#B91C1C" }, trap);
    el("rect", { x: -360, y: -168, width: 720, height: 78, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, trap);
    textEl("題目問「帶錢夠不夠」➜ 要往大估", { x: 0, y: -132,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#B91C1C" }, trap);
    const tw = el("g", { id: "n38-trap-wrong", transform: "translate(0, -8)" }, trap);
    el("rect", { x: -360, y: -40, width: 720, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, tw);
    textEl("✗ 估小：290 ＋ 410 ＝ 700，以為剛好夠", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#B91C1C" }, tw);
    const tc = el("g", { id: "n38-trap-correct", transform: "translate(0, 94)" }, trap);
    el("rect", { x: -360, y: -40, width: 720, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, tc);
    textEl("✓ 估大：300 ＋ 420 ＝ 720 ＞ 700，不夠！", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#065F46" }, tc);
    textEl("往大估才不會少了帶錢的風險", { x: 0, y: 214,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#B45309" }, trap);

    const thresh = card(z2, "n38-threshold", 1680, 470, 440, 560, "#7C3AED");
    textEl("滿 500 免運門檻", { x: 0, y: -218,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#6D28D9" }, thresh);
    textEl("購物車 498 元", { x: 0, y: -160,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#5B21B6" }, thresh);
    el("rect", { x: -200, y: -108, width: 400, height: 112, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, thresh);
    textEl("✗ 估成 500", { x: 0, y: -72,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#B91C1C" }, thresh);
    textEl("以為已經免運了", { x: 0, y: -28,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, thresh);
    el("rect", { x: -200, y: 26, width: 400, height: 112, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, thresh);
    textEl("✓ 往小估 490", { x: 0, y: 62,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#065F46" }, thresh);
    textEl("發現還差 2 元，補一件！", { x: 0, y: 106,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, thresh);
    textEl("門檻往小估，才不會差一點", { x: 0, y: 208,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#6D28D9" }, thresh);

    // =========================================================
    // ZONE 3 — 三大口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "四則估算三大口訣", "#059669");
    const tips = [
      { id: "n38-tip-1", x: 780, title: "① 找最近", col: "#2563EB",
        lines: ["先看整十或整百", "數線比距離", "298 靠近 300"] },
      { id: "n38-tip-2", x: 1240, title: "② 帶錢估大", col: "#D97706",
        lines: ["往上湊整數", "錢才帶得夠", "700 估成 720"] },
      { id: "n38-tip-3", x: 1700, title: "③ 門檻估小", col: "#059669",
        lines: ["往下湊整數", "免運不誤判", "498 看成 490"] },
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
    const cta = el("g", { id: "n38-cta", transform: "translate(1240, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 估算達人挑戰開始！快去寫 N-3-8 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N38_Final.mp4"

    print("=== Rendering G3-N-3-8 Four-Operations Estimation Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_shop", "cue:1:0.55"),
            ("02_act1_budget", "cue:2:0.55"),
            ("03_act2_numberline", "cue:3:0.55"),
            ("04_act2_strategy", "cue:5:0.55"),
            ("05_act3_trap", "cue:7:0.55"),
            ("06_act3_threshold", "cue:9:0.55"),
            ("07_act4_summary", "cue:10:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-8 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
