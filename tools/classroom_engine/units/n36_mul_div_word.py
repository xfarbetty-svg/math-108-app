"""
tools/classroom_engine/units/n36_mul_div_word.py
G3 N-3-6 解題（乘除應用問題）：分裝倍數情境、線段圖分組圖、餘數進一法vs去尾法陷阱
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n36_mul_div_word
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-6",
    "title": "解題（乘除應用問題）",
    "short_title": "乘除應用解題｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 分裝與倍數購物 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！分裝東西、逛街買東西，都會用到乘除應用喔！",
        "focusTarget": "#n36-pack",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "每盒裝 8 顆蘋果，96 顆可以裝幾盒？平分給幾人，要用除法算！",
        "focusTarget": "#n36-pack",
        "bubble": None,
        "state": "intro_pack",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "每盒彩色筆 85 元，買 3 盒要多少錢？求總數就用乘法！",
        "focusTarget": "#n36-shop",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_shop",
    },

    # === Scene 1: 2/4 核心概念拆解 — 線段圖與分組圖 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "線段圖：16 包餅乾，每包 7 塊，求總數用 16 乘以 7 等於 112 塊！",
        "focusTarget": "#n36-line",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_multiply",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "分組圖：96 顆蘋果每 8 顆一盒，96 除以 8 等於 12 盒！",
        "focusTarget": "#n36-group",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_divide",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "抓關鍵字：「每」「共」「總數」用乘法；「平分」「每幾個一組」用除法！",
        "focusTarget": "#n36-keywords",
        "bubble": "idea",
        "state": "concept_keywords",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：26 人露營，每頂帳篷住 4 人，26 除以 4 等於 6 餘 2。",
        "focusTarget": "#n36-tent-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "餘下 2 人怎麼辦？", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_tent_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✗ 直接答 6 頂，剩下的 2 人就沒有地方住，錯了！",
        "focusTarget": "#n36-tent-wrong",
        "bubble": None,
        "badge": {"type": "trap", "text": "✗ 直接答 6 頂", "x": 1240, "y": 205},
        "state": "trap_tent_bad",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✓ 進一法：剩下的 2 人也要一頂，6 加 1 等於 7 頂才夠住！",
        "focusTarget": "#n36-tent-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "6 ＋ 1 ＝ 7 頂 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_tent_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：300 元買 85 元一盒，300÷85＝3 餘 45，最多買幾盒？",
        "focusTarget": "#n36-tail-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "錢不夠不能進位！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_tail_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "✓ 去尾法：餘下 45 元買不起一盒，所以最多買 3 盒，綠勾才對！",
        "focusTarget": "#n36-tail-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "最多 3 盒 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_tail_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：求總數用乘、平分分裝用除、有餘數看情境進一或去尾！",
        "focusSequence": [
            {"target": "#n36-tip-1", "until": 0.34},
            {"target": "#n36-tip-2", "until": 0.67},
            {"target": "#n36-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會乘除應用，快去挑戰 N-3-6 段考真題吧！",
        "focusTarget": "#n36-cta",
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
  // 分組圖：總數畫成 n 個小組，每組 s 格
  function groups(parent, x, y, n, s, label) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const bw = 92, gap = 12, totalW = n * bw + (n - 1) * gap;
    let startX = -totalW / 2;
    for (let i = 0; i < n; i++) {
      const bx = startX + i * (bw + gap);
      el("rect", { x: bx, y: -34, width: bw, height: 68, rx: 12,
        fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, g);
      textEl(String(s), { x: bx + bw / 2, y: 10, "text-anchor": "middle",
        "font-size": 28, "font-weight": 900, fill: "#1D4ED8" }, g);
    }
    if (label) textEl(label, { x: 0, y: 62, "text-anchor": "middle",
      "font-size": 20, "font-weight": 800, fill: "#475569" }, g);
    return g;
  }
  // 線段圖：等長分段
  function barModel(parent, x, y, n, segLabel, totalLabel) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const bw = 96, totalW = n * bw;
    let startX = -totalW / 2;
    for (let i = 0; i < n; i++) {
      el("rect", { x: startX + i * bw, y: -36, width: bw, height: 72,
        fill: (i % 2 === 0) ? "#FDE68A" : "#FEF3C7",
        stroke: "#D97706", "stroke-width": 3 }, g);
      textEl(segLabel, { x: startX + i * bw + bw / 2, y: 10,
        "text-anchor": "middle", "font-size": 24, "font-weight": 900,
        fill: "#92400E" }, g);
    }
    if (totalLabel) textEl(totalLabel, { x: 0, y: 68, "text-anchor": "middle",
      "font-size": 21, "font-weight": 900, fill: "#B45309" }, g);
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 分裝與倍數購物
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的乘除應用", "#E15B48");

    const pack = card(z0, "n36-pack", 900, 470, 720, 430, "#E15B48");
    textEl("分裝蘋果：每盒 8 顆", { x: 0, y: -166,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#B45309" }, pack);
    groups(pack, 0, -48, 4, 8, "96 顆 ÷ 8 ＝ 12 盒（先別急著算！）");
    el("rect", { x: -300, y: 76, width: 600, height: 70, rx: 16,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 3 }, pack);
    textEl("平分給幾人、每幾個裝一袋 ➜ 用除法", { x: 0, y: 120,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#C2410C" }, pack);

    const shop = card(z0, "n36-shop", 1620, 470, 520, 430, "#2563EB");
    textEl("倍數購物：每盒 85 元", { x: 0, y: -166,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#1D4ED8" }, shop);
    el("rect", { x: -210, y: -118, width: 420, height: 108, rx: 18,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, shop);
    textEl("3 盒 × 85 元", { x: 0, y: -80,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#1E3A8A" }, shop);
    textEl("＝ 255 元", { x: 0, y: -34,
      "text-anchor": "middle", "font-size": 32, "font-weight": 900,
      fill: "#065F46" }, shop);
    textEl("求總數 ➜ 用乘法", { x: 0, y: 40,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#1D4ED8" }, shop);
    textEl("幾個「每盒」就乘幾", { x: 0, y: 90,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, shop);
    textEl("先找出單位量！", { x: 0, y: 138,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, shop);

    eqBox(z0, "n36-intro-note", 1260, 810, 900,
      "求總數用乘法，平分分裝用除法",
      "先判斷題目在問什麼", "#FEF3C7", "#92400E", 31);

    // =========================================================
    // ZONE 1 — 線段圖與分組圖
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "畫圖解題：線段圖 × 分組圖", "#2563EB");

    const line = card(z1, "n36-line", 1000, 450, 760, 480, "#2563EB");
    textEl("線段圖：求總數（乘法）", { x: 0, y: -180,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, line);
    barModel(line, 0, -56, 7, "7 塊", "16 包 × 7 塊 ＝ 112 塊");
    el("rect", { x: -330, y: 88, width: 660, height: 64, rx: 16,
      fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, line);
    textEl("16 個 7 相加 ➜ 16 × 7 ＝ 112", { x: 0, y: 130,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#1D4ED8" }, line);
    textEl("每包塊數 × 包數 ＝ 總塊數", { x: 0, y: 196,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, line);

    const grp = card(z1, "n36-group", 1660, 450, 500, 480, "#7C3AED");
    textEl("分組圖：求組數（除法）", { x: 0, y: -180,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, grp);
    groups(grp, 0, -56, 4, 8, "每 8 顆一盒");
    el("rect", { x: -210, y: 82, width: 420, height: 64, rx: 16,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, grp);
    textEl("96 ÷ 8 ＝ 12 盒", { x: 0, y: 124,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#5B21B6" }, grp);
    textEl("總數 ÷ 每組數 ＝ 組數", { x: 0, y: 190,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, grp);

    const key = card(z1, "n36-keywords", 850, 800, 700, 92, "#D97706");
    textEl("關鍵字：每、共、總數 ➜ 乘　｜　平分、每幾個一組 ➜ 除", {
      x: 0, y: 10, "text-anchor": "middle", "font-size": 22,
      "font-weight": 900, fill: "#92400E" }, key);

    // =========================================================
    // ZONE 2 — 段考陷阱：餘數進一法 vs 去尾法
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：餘數怎麼辦？", "#D97706");

    const tent = card(z2, "n36-tent", 1030, 470, 780, 560, "#DC2626");
    textEl("陷阱一：26 人露營，每頂住 4 人", { x: 0, y: -216,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, tent);
    el("rect", { x: -300, y: -168, width: 600, height: 92, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, tent);
    textEl("26 ÷ 4 ＝ 6 餘 2", { x: 0, y: -132,
      "text-anchor": "middle", "font-size": 34, "font-weight": 900,
      fill: "#B91C1C" }, tent);
    textEl("6 頂住 24 人，剩下 2 人也要住", { x: 0, y: -94,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, tent);
    const tw = el("g", { id: "n36-tent-wrong", transform: "translate(0, 20)" }, tent);
    el("rect", { x: -330, y: -40, width: 660, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, tw);
    textEl("✗ 直接答 6 頂，剩下 2 人沒地方住", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 22, "font-weight": 900,
      fill: "#B91C1C" }, tw);
    const tc = el("g", { id: "n36-tent-correct", transform: "translate(0, 132)" }, tent);
    el("rect", { x: -330, y: -40, width: 660, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, tc);
    textEl("✓ 進一法：6 ＋ 1 ＝ 7 頂", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#065F46" }, tc);
    textEl("人要全住進去 ➜ 餘數進一", { x: 0, y: 236,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#B45309" }, tent);

    const tail = card(z2, "n36-tail", 1665, 470, 470, 560, "#7C3AED");
    textEl("陷阱二：300 元買 85 元一盒", { x: 0, y: -216,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#6D28D9" }, tail);
    el("rect", { x: -200, y: -166, width: 400, height: 92, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, tail);
    textEl("300 ÷ 85 ＝ 3 餘 45", { x: 0, y: -130,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#5B21B6" }, tail);
    textEl("餘 45 元買不起一盒", { x: 0, y: -92,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#475569" }, tail);
    const tw2 = el("g", { id: "n36-tail-wrong", transform: "translate(0, 20)" }, tail);
    el("rect", { x: -210, y: -40, width: 420, height: 76, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, tw2);
    textEl("✗ 進位成 4 盒要 340 元", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#B91C1C" }, tw2);
    const tc2 = el("g", { id: "n36-tail-correct", transform: "translate(0, 132)" }, tail);
    el("rect", { x: -210, y: -40, width: 420, height: 76, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, tc2);
    textEl("✓ 去尾法：最多買 3 盒", { x: 0, y: 11,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#065F46" }, tc2);
    textEl("錢不夠 ➜ 餘數直接去尾", { x: 0, y: 236,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#6D28D9" }, tail);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "乘除應用三大口訣", "#059669");
    const tips = [
      { id: "n36-tip-1", x: 760, title: "① 求總用乘", col: "#2563EB",
        lines: ["每 × 數 ＝ 總", "畫線段圖", "別漏單位"] },
      { id: "n36-tip-2", x: 1220, title: "② 平分用除", col: "#D97706",
        lines: ["總 ÷ 每組 ＝ 組", "畫分組圖", "看清問什麼"] },
      { id: "n36-tip-3", x: 1680, title: "③ 餘數看境", col: "#059669",
        lines: ["人要住 ➜ 進一", "錢不夠 ➜ 去尾", "别直接丟掉"] },
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
    const cta = el("g", { id: "n36-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 解題小達人挑戰開始！快去寫 N-3-6 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N36_Final.mp4"

    print("=== Rendering G3-N-3-6 Multiplication/Division Word Problems Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_pack", "cue:1:0.55"),
            ("02_act1_shop", "cue:2:0.55"),
            ("03_act2_line", "cue:3:0.55"),
            ("04_act2_group", "cue:4:0.55"),
            ("05_act3_tent", "cue:7:0.55"),
            ("06_act3_rounding", "cue:9:0.55"),
            ("07_act4_summary", "cue:11:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-6 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
