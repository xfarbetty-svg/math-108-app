"""
tools/classroom_engine/units/s34_geometry.py
G3 S-3-4 幾何形體之操作（正方體、長方體、球體、圓柱、圓錐的面邊頂點、木棍圖案規律與圓規等距操作）
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.s34_geometry
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "S-3-4",
    "title": "幾何形體之操作",
    "short_title": "幾何形體｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 180, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉大家！我是米米兔，今天帶大家一起探索「幾何形體」的神奇世界喔！",
        "focusTarget": None,
        "bubble": None,
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 220, "y": 880, "pose": "point", "flip": False},
        "subtitle": "你看！生活中有正方體積木、長方體禮物盒、皮球、圓柱罐頭，還有圓錐派對帽！",
        "focusSequence": [
            {"target": "#z0-cube", "until": 0.22},
            {"target": "#z0-box", "until": 0.44},
            {"target": "#z0-ball", "until": 0.64},
            {"target": "#z0-cylinder", "until": 0.82},
            {"target": "#z0-cone", "until": 1.0},
        ],
        "bubble": None,
        "state": "intro_objects",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 220, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "它們有的可以平平堆疊，有的能順暢滾動，到底藏著什麼特徵呢？讓我們一起拆解！",
        "focusTarget": "#z0-cube",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_question",
    },

    # === Scene 1: 2/4 核心概念拆解 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 200, "y": 880, "pose": "point", "flip": False},
        "subtitle": "我們先來看正方體！正方體有 8 個頂點、12 條邊，還有 6 個一模一樣大的正方形面喔！",
        "focusTarget": "#z1-cube",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_cube",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 220, "y": 880, "pose": "point", "flip": False},
        "subtitle": "再看長方體！長方體也是 8 個頂點、12 條邊和 6 個面，相對的面大小形狀完全相同！",
        "focusTarget": "#z1-box",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_box",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 220, "y": 880, "pose": "point", "flip": False},
        "subtitle": "滾動好朋友：球體只有 1 個曲面；圓柱有 2 個平平的圓底面；圓錐有 1 個尖尖頂點與 1 個底面！",
        "focusSequence": [
            {"target": "#z1-ball", "until": 0.33},
            {"target": "#z1-cylinder", "until": 0.66},
            {"target": "#z1-cone", "until": 1.0},
        ],
        "bubble": "idea",
        "sfx": "pop",
        "state": "concept_rolling",
    },

    # === Scene 2: 3/4 易錯陷阱與真題操作 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與真題操作",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 180, "y": 880, "pose": "think", "flip": False},
        "subtitle": "小心段考陷阱一！用木棍排圖案，圖①有 3 根，圖②有 5 根，每多一個梯形就多 2 根！",
        "focusTarget": "#z2-sticks",
        "bubble": "alert",
        "badge": {"type": "correct", "text": "每多一個加 2 根！", "x": 620, "y": 250},
        "sfx": "correct",
        "state": "trap_sticks",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與真題操作",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 200, "y": 880, "pose": "point", "flip": False},
        "subtitle": "小心陷阱二！用圓規量折線，圓規量的是長度不是形狀，逐段量取搬到直線上，總長度完全一樣！",
        "focusTarget": "#z2-compass-line",
        "bubble": "idea",
        "badge": {"type": "correct", "text": "折線搬移總長度不變！", "x": 1360, "y": 220},
        "sfx": "correct",
        "state": "trap_compass",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與真題操作",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 200, "y": 880, "pose": "think", "flip": False},
        "subtitle": "特別注意：圓錐側面是光滑平順的「曲面」，千萬不要數成直線邊喔！",
        "focusTarget": "#z2-cone-trap",
        "bubble": "alert",
        "badge": {"type": "trap", "text": "曲面不是直線邊！", "x": 1360, "y": 570},
        "sfx": "trap",
        "state": "trap_cone_surface",
    },

    # === Scene 3: 4/4 總結口訣與真題挑戰 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與真題挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 180, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "最後複習四大口訣：正方長方都是 6 面 12 邊 8 頂點；圓柱 2 個平底面，圓錐 1 個頂點！",
        "focusSequence": [
            {"target": "#z3-card-0", "until": 0.25},
            {"target": "#z3-card-1", "until": 0.50},
            {"target": "#z3-card-2", "until": 0.75},
            {"target": "#z3-card-3", "until": 1.0},
        ],
        "bubble": "idea",
        "sfx": "pop",
        "state": "summary_features",
    },
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與真題挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 220, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "掌握形體特徵與操作規律，你就是幾何小達人！現在就來挑戰段考真題測驗吧！",
        "focusTarget": "#z3-cta",
        "bubble": "idea",
        "badge": {"type": "correct", "text": "恭喜通關！", "x": 1130, "y": 680},
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

  function drawCube(parent, x, y, size, colTop, colFront, colRight) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const s = size;
    const dx = s * 0.866;
    const dy = s * 0.5;
    // Top face
    const topD = `M 0,${-s} L ${dx},${-dy - s*0.5} L 0,0 L ${-dx},${-dy - s*0.5} Z`;
    el("path", { d: topD, fill: colTop, stroke: "#1E293B", "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
    // Left/Front face
    const leftD = `M ${-dx},${-dy - s*0.5} L 0,0 L 0,${s} L ${-dx},${s - dy*0.5} Z`;
    el("path", { d: leftD, fill: colFront, stroke: "#1E293B", "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
    // Right face
    const rightD = `M 0,0 L ${dx},${-dy - s*0.5} L ${dx},${s - dy*0.5} L 0,${s} Z`;
    el("path", { d: rightD, fill: colRight, stroke: "#1E293B", "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
    return g;
  }

  function drawCylinder(parent, x, y, r, h, colBody, colTop) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const ry = r * 0.32;
    // Body
    const bodyD = `M ${-r},${-h/2} L ${-r},${h/2} A ${r} ${ry} 0 0 0 ${r} ${h/2} L ${r},${-h/2} Z`;
    el("path", { d: bodyD, fill: colBody, stroke: "#1E293B", "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
    // Bottom dashed arc (hidden inside)
    el("path", { d: `M ${-r},${h/2} A ${r} ${ry} 0 0 1 ${r} ${h/2}`, fill: "none", stroke: "#94A3B8", "stroke-width": 2.5, "stroke-dasharray": "5,5" }, g);
    // Top face
    el("ellipse", { cx: 0, cy: -h/2, rx: r, ry: ry, fill: colTop, stroke: "#1E293B", "stroke-width": 3.5 }, g);
    return g;
  }

  function drawCone(parent, x, y, r, h, colBody, colBottom) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    const ry = r * 0.32;
    // Body triangle/curved base
    const bodyD = `M 0,${-h/2} L ${-r},${h/2} A ${r} ${ry} 0 0 0 ${r} ${h/2} Z`;
    el("path", { d: bodyD, fill: colBody, stroke: "#1E293B", "stroke-width": 3.5, "stroke-linejoin": "round" }, g);
    // Hidden back arc
    el("path", { d: `M ${-r},${h/2} A ${r} ${ry} 0 0 1 ${r} ${h/2}`, fill: "none", stroke: "#94A3B8", "stroke-width": 2.5, "stroke-dasharray": "5,5" }, g);
    // Apex dot
    el("circle", { cx: 0, cy: -h/2, r: 7, fill: "#EF4444", stroke: "#1E293B", "stroke-width": 2.5 }, g);
    return g;
  }

  function drawSphere(parent, x, y, r, colBody) {
    const g = el("g", { transform: `translate(${x}, ${y})` }, parent);
    el("circle", { cx: 0, cy: 0, r: r, fill: colBody, stroke: "#1E293B", "stroke-width": 3.5 }, g);
    // 3D contour lines
    el("ellipse", { cx: 0, cy: 0, rx: r * 0.95, ry: r * 0.28, fill: "none", stroke: "#94A3B8", "stroke-width": 2.5, "stroke-dasharray": "6,6" }, g);
    el("path", { d: `M ${-r*0.95},0 A ${r*0.95} ${r*0.28} 0 0 0 ${r*0.95} 0`, fill: "none", stroke: "#1E293B", "stroke-width": 2.5 }, g);
    // Soft glossy highlight
    el("circle", { cx: -r * 0.35, cy: -r * 0.35, r: r * 0.25, fill: "#FFFFFF", opacity: 0.5 }, g);
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 (x: 0..1920) — 1/4 情境導入：生活中的形體
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    textEl("生活裡的「幾何形體」都在哪裡？", {
      x: 960, y: 158, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#1E293B"
    }, z0);
    el("line", { x1: 620, y1: 180, x2: 1300, y2: 180, stroke: "#E15B48", "stroke-width": 6, "stroke-linecap": "round" }, z0);

    const items0 = [
      { id: "z0-cube", title: "正方體（積木）", x: 620, y: 520, fn: (g) => drawCube(g, 0, 10, 75, "#FDE68A", "#F59E0B", "#D97706") },
      { id: "z0-box", title: "長方體（禮物盒）", x: 900, y: 520, fn: (g) => drawCube(g, 0, 10, 85, "#BFDBFE", "#3B82F6", "#1D4ED8") },
      { id: "z0-ball", title: "球體（皮球）", x: 1180, y: 520, fn: (g) => drawSphere(g, 0, 10, 75, "#FED7AA") },
      { id: "z0-cylinder", title: "圓柱（罐頭）", x: 1450, y: 520, fn: (g) => drawCylinder(g, 0, 10, 65, 130, "#A7F3D0", "#34D399") },
      { id: "z0-cone", title: "圓錐（派對帽）", x: 1720, y: 520, fn: (g) => drawCone(g, 0, 10, 65, 140, "#DDD6FE", "#A78BFA") },
    ];

    items0.forEach((item) => {
      const card = el("g", { id: item.id, transform: `translate(${item.x}, ${item.y})` }, z0);
      el("rect", { x: -125, y: -210, width: 250, height: 420, rx: 24, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 3.5, filter: "url(#cardShadow)" }, card);
      item.fn(card);
      textEl(item.title, { x: 0, y: 165, "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: "#1E293B" }, card);
    });

    // =========================================================
    // ZONE 1 (x: 1920..3840) — 2/4 核心概念拆解：面、邊、頂點
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    textEl("幾何形體三大特徵：面、邊、頂點", {
      x: 960, y: 158, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#1E293B"
    }, z1);
    el("line", { x1: 620, y1: 180, x2: 1300, y2: 180, stroke: "#2563EB", "stroke-width": 6, "stroke-linecap": "round" }, z1);

    // Card A: 正方體特徵
    const cCube = el("g", { id: "z1-cube", transform: "translate(680, 520)" }, z1);
    el("rect", { x: -210, y: -230, width: 420, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cCube);
    textEl("正方體", { x: 0, y: -165, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#E15B48" }, cCube);
    drawCube(cCube, 0, -20, 95, "#FEF08A", "#FBBF24", "#F59E0B");
    // Vertex dots (8 points)
    const vPts = [[0, -115], [82, -67], [0, -20], [-82, -67], [-82, 75], [0, 122], [82, 75]];
    vPts.forEach(([vx, vy]) => {
      el("circle", { cx: vx, cy: vy, r: 8, fill: "#EF4444", stroke: "#FFFFFF", "stroke-width": 2 }, cCube);
    });
    // Labels pill
    const p1 = el("g", { transform: "translate(0, 150)" }, cCube);
    el("rect", { x: -185, y: -24, width: 370, height: 48, rx: 24, fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 2.5 }, p1);
    textEl("8 個頂點 ｜ 12 條邊 ｜ 6 個正方形面", { x: 0, y: 8, "text-anchor": "middle", "font-size": 19, "font-weight": 800, fill: "#991B1B" }, p1);

    // Card B: 長方體特徵
    const cBox = el("g", { id: "z1-box", transform: "translate(1160, 520)" }, z1);
    el("rect", { x: -210, y: -230, width: 420, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cBox);
    textEl("長方體", { x: 0, y: -165, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#2563EB" }, cBox);
    drawCube(cBox, 0, -20, 105, "#DBEAFE", "#60A5FA", "#2563EB");
    const p2 = el("g", { transform: "translate(0, 150)" }, cBox);
    el("rect", { x: -185, y: -24, width: 370, height: 48, rx: 24, fill: "#EFF6FF", stroke: "#3B82F6", "stroke-width": 2.5 }, p2);
    textEl("8 頂點 ｜ 12 條邊 ｜ 相對面大小相同", { x: 0, y: 8, "text-anchor": "middle", "font-size": 19, "font-weight": 800, fill: "#1E40AF" }, p2);

    // Card C: 滾動形體群 (球體、圓柱、圓錐)
    const cRoll = el("g", { id: "z1-rolling", transform: "translate(1640, 520)" }, z1);
    el("rect", { x: -220, y: -230, width: 440, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cRoll);
    textEl("滾動形體家族", { x: 0, y: -165, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#059669" }, cRoll);

    const bBall = el("g", { id: "z1-ball", transform: "translate(-120, -30)" }, cRoll);
    drawSphere(bBall, 0, 0, 55, "#FED7AA");
    textEl("球體：1曲面", { x: 0, y: 80, "text-anchor": "middle", "font-size": 18, "font-weight": 800, fill: "#1E293B" }, bBall);

    const bCyl = el("g", { id: "z1-cylinder", transform: "translate(0, -30)" }, cRoll);
    drawCylinder(bCyl, 0, 0, 48, 90, "#A7F3D0", "#34D399");
    textEl("圓柱：2底面1曲面", { x: 0, y: 80, "text-anchor": "middle", "font-size": 18, "font-weight": 800, fill: "#1E293B" }, bCyl);

    const bCone = el("g", { id: "z1-cone", transform: "translate(120, -30)" }, cRoll);
    drawCone(bCone, 0, 0, 48, 100, "#DDD6FE", "#A78BFA");
    textEl("圓錐：1頂點1底面", { x: 0, y: 80, "text-anchor": "middle", "font-size": 18, "font-weight": 800, fill: "#1E293B" }, bCone);

    const p3 = el("g", { transform: "translate(0, 150)" }, cRoll);
    el("rect", { x: -195, y: -24, width: 390, height: 48, rx: 24, fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 2.5 }, p3);
    textEl("平面能堆疊 ｜ 曲面能滾動", { x: 0, y: 8, "text-anchor": "middle", "font-size": 19, "font-weight": 800, fill: "#065F46" }, p3);

    // =========================================================
    // ZONE 2 (x: 3840..5760) — 3/4 易錯陷阱與真題操作
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    textEl("段考熱門真題與操作陷阱", {
      x: 960, y: 158, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#1E293B"
    }, z2);
    el("line", { x1: 620, y1: 180, x2: 1300, y2: 180, stroke: "#D97706", "stroke-width": 6, "stroke-linecap": "round" }, z2);

    // Trap 1: 木棍圖案規律 (真題 Q01)
    const cSticks = el("g", { id: "z2-sticks", transform: "translate(680, 520)" }, z2);
    el("rect", { x: -240, y: -230, width: 480, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cSticks);
    textEl("真題一：木棍排圖案規律", { x: 0, y: -165, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#B45309" }, cSticks);

    // Draw sticks pattern
    // Fig 1: Triangle 3 sticks
    const f1 = el("g", { transform: "translate(-140, -40)" }, cSticks);
    el("polygon", { points: "0,-45 40,30 -40,30", fill: "#FEF3C7", stroke: "#D97706", "stroke-width": 6, "stroke-linejoin": "round" }, f1);
    textEl("圖①: 3根", { x: 0, y: 65, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#1E293B" }, f1);

    // Fig 2: Trapezoid 5 sticks
    const f2 = el("g", { transform: "translate(0, -40)" }, cSticks);
    el("polygon", { points: "-25,-45 25,-45 50,30 -50,30", fill: "#FED7AA", stroke: "#EA580C", "stroke-width": 6, "stroke-linejoin": "round" }, f2);
    textEl("圖②: 5根", { x: 0, y: 65, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#1E293B" }, f2);

    // Fig 3: 7 sticks
    const f3 = el("g", { transform: "translate(140, -40)" }, cSticks);
    el("polygon", { points: "-50,-45 50,-45 75,30 -75,30", fill: "#FDE68A", stroke: "#CA8A04", "stroke-width": 6, "stroke-linejoin": "round" }, f3);
    textEl("圖③: 7根", { x: 0, y: 65, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#1E293B" }, f3);

    // Rule banner
    const rb = el("g", { transform: "translate(0, 150)" }, cSticks);
    el("rect", { x: -210, y: -24, width: 420, height: 48, rx: 24, fill: "#FEF3C7", stroke: "#D97706", "stroke-width": 2.5 }, rb);
    textEl("每多一個梯形 ＋2 根木棍！(圖⑤＝11根)", { x: 0, y: 8, "text-anchor": "middle", "font-size": 20, "font-weight": 900, fill: "#92400E" }, rb);

    // Trap 2: 圓規等距量取折線 (真題 Q02)
    const cComp = el("g", { id: "z2-compass-line", transform: "translate(1380, 430)" }, z2);
    el("rect", { x: -340, y: -160, width: 680, height: 320, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cComp);
    textEl("真題二：圓規複製折線長度", { x: 0, y: -105, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#2563EB" }, cComp);

    // Folded line A
    textEl("折線甲：", { x: -300, y: -40, "font-size": 22, "font-weight": 800, fill: "#1E293B" }, cComp);
    el("polyline", { points: "-210,-45 -130,-15 -50,-55 30,-20 110,-50", fill: "none", stroke: "#E15B48", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, cComp);
    [[-210,-45], [-130,-15], [-50,-55], [30,-20], [110,-50]].forEach(([px, py]) => {
      el("circle", { cx: px, cy: py, r: 6, fill: "#1E293B" }, cComp);
    });

    // Straight line on dashed guide
    textEl("拉直後：", { x: -300, y: 40, "font-size": 22, "font-weight": 800, fill: "#1E293B" }, cComp);
    el("line", { x1: -210, y1: 35, x2: 240, y2: 35, stroke: "#CBD5E1", "stroke-width": 4, "stroke-dasharray": "8,8" }, cComp);
    el("line", { x1: -210, y1: 35, x2: 170, y2: 35, stroke: "#2563EB", "stroke-width": 6, "stroke-linecap": "round" }, cComp);
    textEl("A 點起點", { x: -210, y: 70, "font-size": 18, "font-weight": 800, fill: "#1E293B" }, cComp);
    textEl("總長完全相同！", { x: 0, y: 115, "text-anchor": "middle", "font-size": 22, "font-weight": 900, fill: "#059669" }, cComp);

    // Trap 3: 圓錐側面是曲面
    const cConeTrap = el("g", { id: "z2-cone-trap", transform: "translate(1380, 680)" }, z2);
    el("rect", { x: -340, y: -70, width: 680, height: 140, rx: 24, fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, cConeTrap);
    textEl("⚠️ 易錯提醒：圓錐側面是「曲面」，不是直線邊！", { x: 0, y: -15, "text-anchor": "middle", "font-size": 24, "font-weight": 900, fill: "#B91C1C" }, cConeTrap);
    textEl("圓錐只有 1 個頂點與 1 個圓形底面，千萬不要數成有邊喔！", { x: 0, y: 30, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#7F1D1D" }, cConeTrap);

    // =========================================================
    // ZONE 3 (x: 5760..7680) — 4/4 總結口訣與真題挑戰
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    textEl("幾何形體特徵總複習口訣", {
      x: 960, y: 158, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#1E293B"
    }, z3);
    el("line", { x1: 620, y1: 180, x2: 1300, y2: 180, stroke: "#059669", "stroke-width": 6, "stroke-linecap": "round" }, z3);

    const summaries = [
      { id: "z3-card-0", title: "正方體", desc: "8頂點 ｜ 12邊\n6個全等正方形面", col: "#F59E0B", x: 620 },
      { id: "z3-card-1", title: "長方體", desc: "8頂點 ｜ 12邊\n6個面(相對面相同)", col: "#3B82F6", x: 960 },
      { id: "z3-card-2", title: "圓柱", desc: "0頂點 ｜ 0直邊\n2平底面 ＋ 1曲面", col: "#10B981", x: 1300 },
      { id: "z3-card-3", title: "圓錐", desc: "1頂點 ｜ 0直邊\n1圓底面 ＋ 1曲面", col: "#8B5CF6", x: 1640 },
    ];

    summaries.forEach((s) => {
      const c = el("g", { id: s.id, transform: `translate(${s.x}, 460)` }, z3);
      el("rect", { x: -140, y: -190, width: 280, height: 380, rx: 26, fill: "#FFFDF8", stroke: s.col, "stroke-width": 4, filter: "url(#cardShadow)" }, c);
      el("rect", { x: -125, y: -170, width: 250, height: 56, rx: 16, fill: s.col }, c);
      textEl(s.title, { x: 0, y: -132, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#FFFFFF" }, c);
      const lines = s.desc.split("\n");
      lines.forEach((l, li) => {
        textEl(l, { x: 0, y: -20 + li * 50, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#1E293B" }, c);
      });
    });

    // CTA Banner
    const cta = el("g", { id: "z3-cta", transform: "translate(1130, 780)" }, z3);
    el("rect", { x: -440, y: -50, width: 880, height: 100, rx: 50, fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 幾何大師挑戰開始！快去挑戰 S-3-4 段考真題！ ⭐", {
      x: 0, y: 15, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#FFFFFF"
    }, cta);
  }

  function updateWorld(t, cue, cueProgress, timeline) {
    // Dynamic animations if needed
  }

  return { buildWorld, updateWorld };
})();
"""


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "S34_Final.mp4"

    print("=== Rendering G3-S-3-4 Geometry Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
    )
    print("\n=== SUCCESS: S-3-4 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
