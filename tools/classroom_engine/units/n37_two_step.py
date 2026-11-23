"""
tools/classroom_engine/units/n37_two_step.py
G3 N-3-7 解題（兩步驟應用問題：加減與除、連乘）：生活購物與分組情境、線段圖兩步驟拆解、
先加再除 vs 先減再除陷阱（三年級不使用混合算式括號）。
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n37_two_step
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-7",
    "title": "解題（兩步驟應用問題（加減與除、連乘）",
    "short_title": "兩步驟解題｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活購物與分組 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！兩步驟題目別急著算，先想清楚第一步做什麼！",
        "focusTarget": "#n37-shop",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "購物情境：一盒巧克力 24 顆，買 3 盒平分給 8 人，先算總數再平分。",
        "focusTarget": "#n37-shop",
        "bubble": None,
        "sfx": "correct",
        "state": "intro_shop",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "分組情境：繩子 123 公分，圍完桌面還剩 19 公分，要先扣掉再平分。",
        "focusTarget": "#n37-group",
        "bubble": "idea",
        "state": "intro_group",
    },

    # === Scene 1: 2/4 核心概念拆解 — 線段圖與兩步驟 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "線段圖：3 盒各有 24 顆，先算 24 乘以 3 等於 72 顆，這是第一步。",
        "focusTarget": "#n37-line",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_step1",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "第二步再把 72 顆平分給 8 人，72 除以 8 等於 9 顆，每人分到 9 顆。",
        "focusTarget": "#n37-steps",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_step2",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "先算剩下：123 減 19 等於 104，再除以 4 等於 26 公分。記得標示第一步、第二步！",
        "focusTarget": "#n37-note",
        "bubble": None,
        "state": "concept_remaining",
    },

    # === Scene 2: 3/4 段考陷阱：題意順序 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱：文具原價 85 元，折價 20 元後再平分給 5 人，順序看錯就全錯！",
        "focusTarget": "#n37-trap",
        "bubble": "question",
        "badge": {"type": "trap", "text": "先看清楚順序！", "x": 1240, "y": 70},
        "sfx": "trap",
        "state": "trap_order",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✗ 直接拿原價 85 除以 5 等於 17，沒有先扣折扣，紅叉是錯的！",
        "focusTarget": "#n37-trap-wrong",
        "bubble": None,
        "badge": {"type": "trap", "text": "✗ 拿原價直接除", "x": 1240, "y": 70},
        "state": "trap_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✓ 先扣折扣：85 減 20 等於 65，再平分 65 除以 5 等於 13 元，綠勾才對！",
        "focusTarget": "#n37-trap-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "65 ÷ 5 ＝ 13 ✓", "x": 1240, "y": 70},
        "sfx": "correct",
        "state": "trap_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "看到剩下、折價、用掉，第一步先減；看到平分、每幾個一組，第二步再除。",
        "focusTarget": "#n37-trap2",
        "bubble": "question",
        "state": "trap_keyword",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：讀兩次、寫兩步、倒回驗算！兩步驟題目一點都不難！",
        "focusSequence": [
            {"target": "#n37-tip-1", "until": 0.34},
            {"target": "#n37-tip-2", "until": 0.67},
            {"target": "#n37-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會兩步驟應用問題，快去挑戰 N-3-7 段考真題吧！",
        "focusTarget": "#n37-cta",
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
  // 線段圖：等長分段，明確標示每一步
  function barModel(parent, x, y, n, segLabel, totalLabel) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const bw = 112, totalW = n * bw;
    let startX = -totalW / 2;
    for (let i = 0; i < n; i++) {
      el("rect", { x: startX + i * bw, y: -42, width: bw, height: 84,
        fill: (i % 2 === 0) ? "#FDE68A" : "#FEF3C7",
        stroke: "#D97706", "stroke-width": 3 }, g);
      textEl(segLabel, { x: startX + i * bw + bw / 2, y: 12,
        "text-anchor": "middle", "font-size": 26, "font-weight": 900,
        fill: "#92400E" }, g);
    }
    if (totalLabel) textEl(totalLabel, { x: 0, y: 76, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#B45309" }, g);
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活購物與分組情境
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的兩步驟題目", "#E15B48");

    const shop = card(z0, "n37-shop", 1050, 470, 760, 460, "#E15B48");
    textEl("購物：巧克力每盒 24 顆", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#B45309" }, shop);
    el("rect", { x: -340, y: -130, width: 680, height: 104, rx: 18,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 3 }, shop);
    textEl("買 3 盒，平分給 8 個小朋友", { x: 0, y: -92,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#C2410C" }, shop);
    textEl("第一步：24 × 3 ＝ 72 顆（先算總數）", { x: 0, y: -8,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#1D4ED8" }, shop);
    textEl("第二步：72 ÷ 8 ＝ 9 顆（再平分）", { x: 0, y: 52,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#065F46" }, shop);
    textEl("每個人可以吃到 9 顆巧克力", { x: 0, y: 136,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, shop);

    const group = card(z0, "n37-group", 1680, 470, 440, 460, "#7C3AED");
    textEl("分組：繩子圍正方形", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#6D28D9" }, group);
    textEl("123 公分，剩 19 公分", { x: 0, y: -112,
      "text-anchor": "middle", "font-size": 22, "font-weight": 800,
      fill: "#475569" }, group);
    el("rect", { x: -200, y: -64, width: 400, height: 128, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, group);
    textEl("先用掉 123 － 19 ＝ 104", { x: 0, y: -26,
      "text-anchor": "middle", "font-size": 19, "font-weight": 900,
      fill: "#5B21B6" }, group);
    textEl("再平分 104 ÷ 4 ＝ 26", { x: 0, y: 28,
      "text-anchor": "middle", "font-size": 19, "font-weight": 900,
      fill: "#065F46" }, group);
    textEl("邊長 26 公分", { x: 0, y: 108,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#5B21B6" }, group);

    eqBox(z0, "n37-intro-note", 1280, 810, 940,
      "別只算一步：先算出隱藏的數，再回答題目",
      "兩步驟題目一定要寫出第一步和第二步", "#FEF3C7", "#92400E", 29);

    // =========================================================
    // ZONE 1 — 線段圖與兩步驟拆解
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "畫圖拆解：第一步 ➜ 第二步", "#2563EB");

    const line = card(z1, "n37-line", 1030, 450, 820, 500, "#2563EB");
    textEl("線段圖：先算總數，再平分", { x: 0, y: -192,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, line);
    barModel(line, 0, -78, 3, "24 顆", "第一步：24 × 3 ＝ 72 顆");
    el("rect", { x: -330, y: 92, width: 660, height: 66, rx: 16,
      fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, line);
    textEl("第二步：72 ÷ 8 ＝ 9 顆", { x: 0, y: 134,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#1D4ED8" }, line);
    textEl("線段圖讓「3 個 24」一眼看懂", { x: 0, y: 198,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, line);

    const steps = card(z1, "n37-steps", 1690, 450, 440, 500, "#7C3AED");
    textEl("兩步驟流程圖", { x: 0, y: -192,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, steps);
    el("rect", { x: -200, y: -138, width: 400, height: 92, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, steps);
    textEl("第一步 算總數或剩餘", { x: 0, y: -106,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#5B21B6" }, steps);
    textEl("↓", { x: 0, y: -12, "text-anchor": "middle",
      "font-size": 40, "font-weight": 900, fill: "#7C3AED" }, steps);
    el("rect", { x: -200, y: 18, width: 400, height: 92, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, steps);
    textEl("第二步 平分或連乘", { x: 0, y: 50,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#065F46" }, steps);
    textEl("三年級用兩行算，不寫混合括號", { x: 0, y: 158,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, steps);

    const note = card(z1, "n37-note", 1320, 830, 1040, 92, "#D97706");
    textEl("先算剩下：123 － 19 ＝ 104，再除以 4 ＝ 26 公分", {
      x: 0, y: 10, "text-anchor": "middle", "font-size": 23,
      "font-weight": 900, fill: "#92400E" }, note);

    // =========================================================
    // ZONE 2 — 段考陷阱：看錯題意順序
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：先看清楚順序！", "#D97706");

    const trap = card(z2, "n37-trap", 1050, 470, 800, 560, "#DC2626");
    textEl("原價 85 元，折價 20 元平分給 5 人", { x: 0, y: -218,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#B91C1C" }, trap);
    el("rect", { x: -360, y: -172, width: 720, height: 88, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, trap);
    textEl("順序一：先加再除，或拿原價直接除", { x: 0, y: -136,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#B91C1C" }, trap);
    const tw = el("g", { id: "n37-trap-wrong", transform: "translate(0, 4)" }, trap);
    el("rect", { x: -360, y: -40, width: 720, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, tw);
    textEl("✗ 直接 85 ÷ 5 ＝ 17，忘了扣折扣", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#B91C1C" }, tw);
    const tc = el("g", { id: "n37-trap-correct", transform: "translate(0, 110)" }, trap);
    el("rect", { x: -360, y: -40, width: 720, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, tc);
    textEl("✓ 先扣折扣 85 － 20 ＝ 65，再 65 ÷ 5 ＝ 13", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#065F46" }, tc);
    textEl("題意說「折價後再平分」，順序不能調換", { x: 0, y: 220,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#B45309" }, trap);

    const trap2 = card(z2, "n37-trap2", 1680, 470, 440, 560, "#7C3AED");
    textEl("先減再除的關鍵字", { x: 0, y: -218,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#6D28D9" }, trap2);
    textEl("剩下、折價、用掉", { x: 0, y: -152,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#5B21B6" }, trap2);
    textEl("第一步先減", { x: 0, y: -100,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B45309" }, trap2);
    textEl("平分、每幾個一組", { x: 0, y: -18,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#5B21B6" }, trap2);
    textEl("第二步再除", { x: 0, y: 34,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#065F46" }, trap2);
    el("rect", { x: -190, y: 104, width: 380, height: 72, rx: 16,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, trap2);
    textEl("連乘題：先算一層再算全部", { x: 0, y: 148,
      "text-anchor": "middle", "font-size": 20, "font-weight": 900,
      fill: "#5B21B6" }, trap2);

    // =========================================================
    // ZONE 3 — 三大口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "兩步驟解題三大口訣", "#059669");
    const tips = [
      { id: "n37-tip-1", x: 780, title: "① 讀兩次", col: "#2563EB",
        lines: ["先讀題目問什麼", "圈出關鍵字", "順序不能調"] },
      { id: "n37-tip-2", x: 1240, title: "② 寫兩步", col: "#D97706",
        lines: ["第一步算隱藏數", "第二步再回答", "分行不寫括號"] },
      { id: "n37-tip-3", x: 1700, title: "③ 倒回驗", col: "#059669",
        lines: ["用乘法驗平分", "用加法驗減法", "答案合理才寫"] },
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
    const cta = el("g", { id: "n37-cta", transform: "translate(1240, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 解題小達人挑戰開始！快去寫 N-3-7 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N37_Final.mp4"

    print("=== Rendering G3-N-3-7 Two-Step Word Problems Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_shop", "cue:1:0.55"),
            ("02_act1_group", "cue:2:0.55"),
            ("03_act2_line", "cue:3:0.55"),
            ("04_act2_steps", "cue:4:0.55"),
            ("05_act3_trap", "cue:7:0.55"),
            ("06_act3_correct", "cue:8:0.55"),
            ("07_act4_summary", "cue:10:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-7 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
