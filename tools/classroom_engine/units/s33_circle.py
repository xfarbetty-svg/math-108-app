"""
tools/classroom_engine/units/s33_circle.py
G3 S-3-3 圓（圓心、圓周、半徑、直徑、圓規與易錯陷阱）
4-act infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.s33_circle
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "S-3-3",
    "title": "圓",
    "short_title": "圓｜概念小教室",
    "grade": 3,
}

CUES = [
    # === Scene 0: 1/4 情境導入 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "subtitle": "哈囉大家好！我是米米兔，今天帶大家一起認識「圓」的秘密喔！",
        "focusTarget": None,
        "bubble": None,
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "subtitle": "你看，香噴噴的披薩、牆上的時鐘、還有腳踏車輪胎，都是圓形的！",
        "focusSequence": [
            {"target": "#z0-pizza", "until": 0.35},
            {"target": "#z0-clock", "until": 0.68},
            {"target": "#z0-wheel", "until": 1.0},
        ],
        "bubble": None,
        "state": "intro_objects",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "subtitle": "為什麼輪胎做成圓形就能滾得很順？原來圓裡面藏著超厲害的規律！",
        "focusTarget": "#z0-wheel",
        "bubble": "question",
        "state": "intro_question",
    },
    # === Scene 1: 2/4 核心概念拆解 (camera.x = 1440) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1440, "y": 0, "zoom": 1.0},
        "subtitle": "先認識圓的兩大位置：正中間的點叫「圓心」，最外圍的一圈叫「圓周」。",
        "focusTarget": "#z1-center",
        "bubble": None,
        "state": "concept_center_circum",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1440, "y": 0, "zoom": 1.0},
        "subtitle": "從圓心連到圓周上任何一點的線段，叫做「半徑」，每條半徑都一樣長！",
        "focusTarget": "#z1-radius",
        "bubble": None,
        "state": "concept_radius",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1440, "y": 0, "zoom": 1.0},
        "subtitle": "通過圓心、連接圓周兩端的線段是「直徑」，直徑是圓內最長的直線！",
        "focusTarget": "#z1-diameter",
        "bubble": "idea",
        "state": "concept_diameter",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1440, "y": 0, "zoom": 1.0},
        "subtitle": "記好黃金公式：同一個圓裡，直徑是半徑的 2 倍，半徑是直徑的一半！",
        "focusTarget": "#z1-formula",
        "bubble": "idea",
        "state": "concept_formula",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1440, "y": 0, "zoom": 1.0},
        "subtitle": "用圓規畫圓時，針尖放圓心，兩腳打開的距離就是圓的「半徑」喔！",
        "focusTarget": "#z1-compass",
        "bubble": None,
        "state": "concept_compass",
    },
    # === Scene 2: 3/4 易錯陷阱提醒 (camera.x = 2880) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱提醒",
        "camera": {"x": 2880, "y": 0, "zoom": 1.0},
        "subtitle": "小心陷阱一！拿 10 公分繩子繞圓心畫圓，繩長是半徑，直徑要 10 × 2 ＝ 20 公分！",
        "focusTarget": "#z2-trap1",
        "bubble": "alert",
        "state": "trap_rope",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱提醒",
        "camera": {"x": 2880, "y": 0, "zoom": 1.0},
        "subtitle": "小心陷阱二！要畫直徑 12 公分的圓，圓規只能打開一半，12 ÷ 2 ＝ 6 公分！",
        "focusTarget": "#z2-trap2",
        "bubble": "question",
        "state": "trap_compass",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱提醒",
        "camera": {"x": 2880, "y": 0, "zoom": 1.0},
        "subtitle": "陷阱三：半徑 6 公分和直徑 10 公分比大小，先把半徑變直徑 12 公分，12 ＞ 10！",
        "focusTarget": "#z2-trap3",
        "bubble": "alert",
        "state": "trap_compare",
    },
    # === Scene 3: 4/4 總結口訣 (camera.x = 4320, subtle Zoom Out) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣",
        "camera": {"x": 4320, "y": 0, "zoom": 0.94},
        "subtitle": "最後複習四大口訣：圓心在中間、半徑到圓周、直徑過圓心最長、直徑是半徑 2 倍！",
        "focusSequence": [
            {"target": "#z3-card-0", "until": 0.25},
            {"target": "#z3-card-1", "until": 0.50},
            {"target": "#z3-card-2", "until": 0.75},
            {"target": "#z3-card-3", "until": 1.0},
        ],
        "bubble": "idea",
        "state": "summary_all",
    },
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣",
        "camera": {"x": 4320, "y": 0, "zoom": 0.94},
        "subtitle": "比大小前先統一成直徑或半徑，現在就去挑戰圓的真題測驗吧！",
        "focusTarget": "#z3-cta",
        "bubble": "idea",
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

  let refs = {};

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 (x: 0..1440) — 1/4 情境導入：生活中的圓
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    textEl("生活裡的「圓」都在哪裡？", {
      x: 720, y: 158, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#1E293B"
    }, z0);
    el("line", { x1: 420, y1: 180, x2: 1020, y2: 180, stroke: "#E15B48", "stroke-width": 6, "stroke-linecap": "round" }, z0);

    // Card 1: Pizza (x: 80..470)
    const cPizza = el("g", { id: "z0-pizza", transform: "translate(275, 480)" }, z0);
    el("rect", { x: -185, y: -230, width: 370, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cPizza);
    el("circle", { cx: 0, cy: -30, r: 128, fill: "#F59E0B", stroke: "#1E293B", "stroke-width": 4 }, cPizza);
    el("circle", { cx: 0, cy: -30, r: 108, fill: "#FDE68A", stroke: "#B45309", "stroke-width": 3 }, cPizza);
    // Pizza slices
    for (let a = 0; a < 180; a += 45) {
      const rad = a * Math.PI / 180;
      el("line", {
        x1: (-Math.cos(rad) * 108).toFixed(1), y1: (-30 - Math.sin(rad) * 108).toFixed(1),
        x2: (Math.cos(rad) * 108).toFixed(1), y2: (-30 + Math.sin(rad) * 108).toFixed(1),
        stroke: "#D97706", "stroke-width": 2.5
      }, cPizza);
    }
    // Pepperoni dots
    [[-46, -68], [48, -62], [-56, 8], [46, 18], [0, -92], [4, 34]].forEach(([px, py]) => {
      el("circle", { cx: px, cy: py, r: 14, fill: "#E15B48", stroke: "#991B1B", "stroke-width": 2 }, cPizza);
    });
    textEl("圓形披薩", { x: 0, y: 175, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#1E293B" }, cPizza);

    // Card 2: Clock (x: 535..905)
    const cClock = el("g", { id: "z0-clock", transform: "translate(720, 480)" }, z0);
    el("rect", { x: -185, y: -230, width: 370, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cClock);
    el("circle", { cx: 0, cy: -30, r: 128, fill: "#3B82F6", stroke: "#1E293B", "stroke-width": 4 }, cClock);
    el("circle", { cx: 0, cy: -30, r: 108, fill: "#FFFFFF", stroke: "#1E293B", "stroke-width": 3 }, cClock);
    for (let h = 0; h < 12; h++) {
      const rad = (h * 30 - 90) * Math.PI / 180;
      el("line", {
        x1: (Math.cos(rad) * 86).toFixed(1), y1: (-30 + Math.sin(rad) * 86).toFixed(1),
        x2: (Math.cos(rad) * 100).toFixed(1), y2: (-30 + Math.sin(rad) * 100).toFixed(1),
        stroke: "#1E293B", "stroke-width": h % 3 === 0 ? 5 : 2.5, "stroke-linecap": "round"
      }, cClock);
    }
    el("line", { x1: 0, y1: -30, x2: 0, y2: -94, stroke: "#1E293B", "stroke-width": 6, "stroke-linecap": "round" }, cClock);
    el("line", { x1: 0, y1: -30, x2: 52, y2: -12, stroke: "#E15B48", "stroke-width": 5, "stroke-linecap": "round" }, cClock);
    el("circle", { cx: 0, cy: -30, r: 8, fill: "#1E293B" }, cClock);
    textEl("圓形時鐘", { x: 0, y: 175, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#1E293B" }, cClock);

    // Card 3: Bicycle Wheel (x: 980..1350)
    const cWheel = el("g", { id: "z0-wheel", transform: "translate(1165, 480)" }, z0);
    el("rect", { x: -185, y: -230, width: 370, height: 470, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, cWheel);
    const wheelSpin = el("g", { id: "z0-wheel-spin", transform: "translate(0, -30)" }, cWheel);
    el("circle", { cx: 0, cy: 0, r: 126, fill: "none", stroke: "#1E293B", "stroke-width": 16 }, wheelSpin);
    el("circle", { cx: 0, cy: 0, r: 112, fill: "none", stroke: "#94A3B8", "stroke-width": 5 }, wheelSpin);
    for (let s = 0; s < 12; s++) {
      const rad = s * 30 * Math.PI / 180;
      el("line", {
        x1: 0, y1: 0,
        x2: (Math.cos(rad) * 110).toFixed(1), y2: (Math.sin(rad) * 110).toFixed(1),
        stroke: "#64748B", "stroke-width": 3
      }, wheelSpin);
    }
    el("circle", { cx: 0, cy: 0, r: 16, fill: "#E15B48", stroke: "#1E293B", "stroke-width": 3.5 }, wheelSpin);
    textEl("腳踏車輪胎", { x: 0, y: 175, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#1E293B" }, cWheel);

    // Bottom prompt pill in Zone 0
    const z0Banner = el("g", { id: "z0-banner", opacity: 0 }, z0);
    el("rect", { x: 240, y: 775, width: 960, height: 84, rx: 22, fill: "#FEF3C7", stroke: "#D97706", "stroke-width": 4 }, z0Banner);
    textEl("為什麼圓形輪胎滾起來又平又穩？往右探索去 →", {
      x: 720, y: 830, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#92400E"
    }, z0Banner);

    // =========================================================
    // ZONE 1 (x: 1440..2880) — 2/4 核心概念拆解
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1440, 0)" }, root);
    textEl("認識圓的四個好朋友", {
      x: 720, y: 150, "text-anchor": "middle", "font-size": 46, "font-weight": 900, fill: "#1E293B"
    }, z1);

    // Left big diagram card (local x: 55..705, y: 195..870)
    el("rect", { x: 55, y: 195, width: 650, height: 675, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, z1);
    const cx1 = 380, cy1 = 525, R1 = 225;
    // Main circle (circumference)
    const mainCircle = el("circle", {
      cx: cx1, cy: cy1, r: R1, fill: "#FEF9EC", stroke: "#1E293B", "stroke-width": 7,
      "stroke-dasharray": (2 * Math.PI * R1).toFixed(1), "stroke-dashoffset": "0"
    }, z1);
    // Circumference label
    const lblCircum = el("g", { id: "z1-lbl-circum" }, z1);
    el("rect", { x: 485, y: 235, width: 175, height: 54, rx: 14, fill: "#1E293B" }, lblCircum);
    textEl("圓周（外圈）", { x: 572, y: 271, "text-anchor": "middle", "font-size": 24, "font-weight": 800, fill: "#FFFFFF" }, lblCircum);
    el("line", { x1: 520, y1: 289, x2: 492, y2: 330, stroke: "#1E293B", "stroke-width": 3.5 }, lblCircum);

    // Diameter line (horizontal blue)
    const gDiam = el("g", { id: "z1-diameter", opacity: 0 }, z1);
    el("line", { x1: cx1 - R1, y1: cy1, x2: cx1 + R1, y2: cy1, stroke: "#2563EB", "stroke-width": 9, "stroke-linecap": "round" }, gDiam);
    el("circle", { cx: cx1 - R1, cy: cy1, r: 9, fill: "#2563EB" }, gDiam);
    el("circle", { cx: cx1 + R1, cy: cy1, r: 9, fill: "#2563EB" }, gDiam);
    el("rect", { x: cx1 - 125, y: cy1 + 24, width: 250, height: 54, rx: 14, fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, gDiam);
    textEl("直徑（圓內最長）", { x: cx1, y: cy1 + 60, "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: "#1D4ED8" }, gDiam);

    // Radius line (angled coral-orange)
    const gRad = el("g", { id: "z1-radius", opacity: 0 }, z1);
    const rx2 = cx1 + Math.cos(-0.62) * R1;
    const ry2 = cy1 + Math.sin(-0.62) * R1;
    el("line", { x1: cx1, y1: cy1, x2: rx2.toFixed(1), y2: ry2.toFixed(1), stroke: "#E15B48", "stroke-width": 9, "stroke-linecap": "round" }, gRad);
    el("circle", { cx: rx2.toFixed(1), cy: ry2.toFixed(1), r: 9, fill: "#E15B48" }, gRad);
    el("rect", { x: cx1 + 42, y: cy1 - 115, width: 120, height: 50, rx: 14, fill: "#FEE2E2", stroke: "#E15B48", "stroke-width": 3 }, gRad);
    textEl("半徑", { x: cx1 + 102, y: cy1 - 80, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#B91C1C" }, gRad);

    // Center dot (always on top of lines)
    const gCenter = el("g", { id: "z1-center" }, z1);
    el("circle", { cx: cx1, cy: cy1, r: 13, fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4 }, gCenter);
    el("rect", { x: cx1 - 120, y: cy1 - 76, width: 96, height: 46, rx: 12, fill: "#FEF3C7", stroke: "#D97706", "stroke-width": 3 }, gCenter);
    textEl("圓心", { x: cx1 - 72, y: cy1 - 44, "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: "#92400E" }, gCenter);

    // Right side top card: Golden Formula (local x: 745..1385, y: 195..520)
    const gFormula = el("g", { id: "z1-formula", opacity: 0 }, z1);
    el("rect", { x: 745, y: 195, width: 640, height: 325, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, gFormula);
    el("rect", { x: 745, y: 195, width: 640, height: 68, rx: 24, fill: "#2563EB" }, gFormula);
    textEl("黃金關係公式（同一個圓）", { x: 1065, y: 240, "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#FFFFFF" }, gFormula);
    el("rect", { x: 785, y: 290, width: 560, height: 90, rx: 18, fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3.5 }, gFormula);
    textEl("直徑 ＝ 半徑 × 2", { x: 1065, y: 350, "text-anchor": "middle", "font-size": 44, "font-weight": 900, fill: "#1D4ED8" }, gFormula);
    el("rect", { x: 785, y: 402, width: 560, height: 90, rx: 18, fill: "#FEF2F2", stroke: "#E15B48", "stroke-width": 3.5 }, gFormula);
    textEl("半徑 ＝ 直徑 ÷ 2", { x: 1065, y: 462, "text-anchor": "middle", "font-size": 44, "font-weight": 900, fill: "#B91C1C" }, gFormula);

    // Right side bottom card: Compass Rule (local x: 745..1385, y: 550..870)
    const gCompass = el("g", { id: "z1-compass", opacity: 0 }, z1);
    el("rect", { x: 745, y: 550, width: 640, height: 320, rx: 28, fill: "#FFFDF8", stroke: "#1E293B", "stroke-width": 4, filter: "url(#cardShadow)" }, gCompass);
    el("rect", { x: 745, y: 550, width: 640, height: 64, rx: 24, fill: "#059669" }, gCompass);
    textEl("圓規畫圓秘訣", { x: 1065, y: 593, "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#FFFFFF" }, gCompass);
    // Simple vector compass drawing
    const comp = el("g", { transform: "translate(895, 725)" }, gCompass);
    el("circle", { cx: 0, cy: -68, r: 14, fill: "#94A3B8", stroke: "#1E293B", "stroke-width": 3.5 }, comp);
    el("line", { x1: 0, y1: -56, x2: -60, y2: 72, stroke: "#475569", "stroke-width": 8, "stroke-linecap": "round" }, comp);
    el("line", { x1: 0, y1: -56, x2: 60, y2: 72, stroke: "#475569", "stroke-width": 8, "stroke-linecap": "round" }, comp);
    el("line", { x1: -60, y1: 72, x2: -60, y2: 92, stroke: "#1E293B", "stroke-width": 4 }, comp);
    el("circle", { cx: -60, cy: 96, r: 6, fill: "#E15B48" }, comp);
    el("line", { x1: 60, y1: 72, x2: 66, y2: 94, stroke: "#2563EB", "stroke-width": 6, "stroke-linecap": "round" }, comp);
    // Double arrow between legs = 半徑
    el("line", { x1: -54, y1: 102, x2: 62, y2: 102, stroke: "#E15B48", "stroke-width": 5 }, comp);
    textEl("針尖＝圓心", { x: -60, y: 130, "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: "#1E293B" }, comp);
    textEl("兩腳距離＝半徑", { x: 205, y: -6, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#047857" }, comp);
    textEl("不是直徑喔！", { x: 205, y: 48, "text-anchor": "middle", "font-size": 30, "font-weight": 800, fill: "#E15B48" }, comp);

    // =========================================================
    // ZONE 2 (x: 2880..4320) — 3/4 易錯陷阱提醒
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(2880, 0)" }, root);
    textEl("段考三大易錯陷阱！小心別踩雷", {
      x: 720, y: 148, "text-anchor": "middle", "font-size": 46, "font-weight": 900, fill: "#B91C1C"
    }, z2);

    // Trap 1 card (top-left: x 55..695, y 185..535)
    const t1 = el("g", { id: "z2-trap1", opacity: 0 }, z2);
    el("rect", { x: 55, y: 185, width: 640, height: 345, rx: 26, fill: "#FFFDF8", stroke: "#E15B48", "stroke-width": 4.5, filter: "url(#cardShadow)" }, t1);
    el("rect", { x: 55, y: 185, width: 640, height: 60, rx: 22, fill: "#E15B48" }, t1);
    textEl("陷阱一：繩子繞圓心畫圓", { x: 375, y: 226, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#FFFFFF" }, t1);
    // Mini circle + 10cm rope
    el("circle", { cx: 195, cy: 382, r: 96, fill: "#FEF9EC", stroke: "#1E293B", "stroke-width": 4, "stroke-dasharray": "10 6" }, t1);
    el("line", { x1: 195, y1: 382, x2: 291, y2: 382, stroke: "#E15B48", "stroke-width": 7 }, t1);
    el("circle", { cx: 195, cy: 382, r: 8, fill: "#1E293B" }, t1);
    textEl("繩長 10cm", { x: 243, y: 365, "text-anchor": "middle", "font-size": 22, "font-weight": 900, fill: "#B91C1C" }, t1);
    textEl("繩長 ＝ 半徑 10cm", { x: 490, y: 325, "text-anchor": "middle", "font-size": 28, "font-weight": 800, fill: "#1E293B" }, t1);
    textEl("✗ 誤答直徑 10cm", { x: 490, y: 382, "text-anchor": "middle", "font-size": 26, "font-weight": 800, fill: "#94A3B8" }, t1);
    el("rect", { x: 332, y: 412, width: 326, height: 76, rx: 16, fill: "#DCFCE7", stroke: "#059669", "stroke-width": 3 }, t1);
    textEl("✓ 直徑＝10×2＝20cm", { x: 495, y: 461, "text-anchor": "middle", "font-size": 29, "font-weight": 900, fill: "#047857" }, t1);

    // Trap 2 card (top-right: x 735..1385, y 185..535)
    const t2 = el("g", { id: "z2-trap2", opacity: 0 }, z2);
    el("rect", { x: 735, y: 185, width: 650, height: 345, rx: 26, fill: "#FFFDF8", stroke: "#D97706", "stroke-width": 4.5, filter: "url(#cardShadow)" }, t2);
    el("rect", { x: 735, y: 185, width: 650, height: 60, rx: 22, fill: "#D97706" }, t2);
    textEl("陷阱二：給直徑，問圓規開幾公分", { x: 1060, y: 226, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#FFFFFF" }, t2);
    textEl("題目：畫一個「直徑 12 公分」的圓", { x: 1060, y: 306, "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#1E293B" }, t2);
    textEl("✗ 圓規打開 12 公分（會畫成直徑 24cm！）", { x: 1060, y: 368, "text-anchor": "middle", "font-size": 25, "font-weight": 800, fill: "#94A3B8" }, t2);
    el("rect", { x: 800, y: 408, width: 520, height: 82, rx: 16, fill: "#DCFCE7", stroke: "#059669", "stroke-width": 3 }, t2);
    textEl("✓ 圓規開度＝半徑＝12 ÷ 2＝6 公分", { x: 1060, y: 460, "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#047857" }, t2);

    // Trap 3 card (bottom full-width: x 55..1385, y 560..890)
    const t3 = el("g", { id: "z2-trap3", opacity: 0 }, z2);
    el("rect", { x: 55, y: 560, width: 1330, height: 325, rx: 26, fill: "#FFFDF8", stroke: "#2563EB", "stroke-width": 4.5, filter: "url(#cardShadow)" }, t3);
    el("rect", { x: 55, y: 560, width: 1330, height: 58, rx: 22, fill: "#2563EB" }, t3);
    textEl("陷阱三：半徑 vs 直徑比大小 — 一定要先統一標準！", { x: 720, y: 600, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#FFFFFF" }, t3);
    // Mom pizza (r=6 -> d=12)
    el("circle", { cx: 260, cy: 748, r: 96, fill: "#FDE68A", stroke: "#D97706", "stroke-width": 5 }, t3);
    el("line", { x1: 260, y1: 748, x2: 356, y2: 748, stroke: "#E15B48", "stroke-width": 6 }, t3);
    textEl("媽媽", { x: 260, y: 698, "text-anchor": "middle", "font-size": 22, "font-weight": 900, fill: "#92400E" }, t3);
    textEl("半徑 6cm", { x: 260, y: 728, "text-anchor": "middle", "font-size": 22, "font-weight": 900, fill: "#92400E" }, t3);
    textEl("直徑＝12cm", { x: 260, y: 800, "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: "#B91C1C" }, t3);

    // Comparison center
    el("rect", { x: 455, y: 668, width: 530, height: 162, rx: 20, fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3.5 }, t3);
    textEl("不要只看 10 ＞ 6 就選哥哥！", { x: 720, y: 722, "text-anchor": "middle", "font-size": 28, "font-weight": 800, fill: "#64748B" }, t3);
    textEl("統一比直徑：12 cm ＞ 10 cm", { x: 720, y: 775, "text-anchor": "middle", "font-size": 34, "font-weight": 900, fill: "#1D4ED8" }, t3);
    textEl("✓ 媽媽的披薩比較大！", { x: 720, y: 816, "text-anchor": "middle", "font-size": 28, "font-weight": 900, fill: "#047857" }, t3);

    // Brother pizza (d=10)
    el("circle", { cx: 1180, cy: 748, r: 80, fill: "#FDE68A", stroke: "#D97706", "stroke-width": 5 }, t3);
    el("line", { x1: 1100, y1: 748, x2: 1260, y2: 748, stroke: "#2563EB", "stroke-width": 6 }, t3);
    textEl("哥哥：直徑 10cm", { x: 1180, y: 724, "text-anchor": "middle", "font-size": 22, "font-weight": 900, fill: "#1D4ED8" }, t3);

    // =========================================================
    // ZONE 3 (x: 4320..5760) — 4/4 總結口訣 (Zoom Out Overview)
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(4320, 0)" }, root);
    textEl("米米兔的「圓」四大黃金口訣", {
      x: 720, y: 150, "text-anchor": "middle", "font-size": 48, "font-weight": 900, fill: "#047857"
    }, z3);

    const rules = [
      { n: "1", title: "圓心在正中間", desc: "固定點叫圓心，最外圈叫圓周", color: "#E15B48", bg: "#FEF2F2", x: 90, y: 205 },
      { n: "2", title: "半徑到圓周", desc: "圓心連圓周＝半徑，圓規開度＝半徑", color: "#D97706", bg: "#FFFBEB", x: 745, y: 205 },
      { n: "3", title: "直徑過圓心最長", desc: "通過圓心連兩端，圓內最長的直線", color: "#2563EB", bg: "#EFF6FF", x: 90, y: 500 },
      { n: "4", title: "直徑＝半徑 × 2", desc: "比大小先統一標準（同換直徑或半徑）", color: "#059669", bg: "#ECFDF5", x: 745, y: 500 }
    ];
    rules.forEach((r, idx) => {
      const g = el("g", { id: `z3-card-${idx}` }, z3);
      el("rect", { x: r.x, y: r.y, width: 605, height: 245, rx: 28, fill: "#FFFDF8", stroke: r.color, "stroke-width": 5, filter: "url(#cardShadow)" }, g);
      el("circle", { cx: r.x + 68, cy: r.y + 72, r: 36, fill: r.color }, g);
      textEl(r.n, { x: r.x + 68, y: r.y + 86, "text-anchor": "middle", "font-size": 40, "font-weight": 900, fill: "#FFFFFF" }, g);
      textEl(r.title, { x: r.x + 124, y: r.y + 84, "font-size": 38, "font-weight": 900, fill: "#1E293B" }, g);
      el("rect", { x: r.x + 32, y: r.y + 132, width: 541, height: 82, rx: 16, fill: r.bg }, g);
      textEl(r.desc, { x: r.x + 302, y: r.y + 183, "text-anchor": "middle", "font-size": 27, "font-weight": 800, fill: "#1E293B" }, g);
    });

    const gCta = el("g", { id: "z3-cta" }, z3);
    el("rect", { x: 260, y: 785, width: 920, height: 86, rx: 24, fill: "#059669", filter: "url(#cardShadow)" }, gCta);
    textEl("你已經掌握圓的秘密！準備好挑戰 S-3-3 真題測驗囉！", {
      x: 720, y: 840, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#FFFFFF"
    }, gCta);

    refs = {
      z0Banner, wheelSpin,
      mainCircle, gCenter, gRad, gDiam, gFormula, gCompass,
      t1, t2, t3
    };
  }

  function smoothStep(v) {
    v = Math.max(0, Math.min(1, v));
    return v * v * (3 - 2 * v);
  }

  function updateWorld(t, cue, cueProgress) {
    if (!cue) return;
    const id = cue.id;

    // Zone 0 gentle wheel rotation
    refs.wheelSpin.setAttribute("transform", `translate(0, -30) rotate(${(t * 28).toFixed(1)})`);
    refs.z0Banner.setAttribute("opacity", id >= 2 ? smoothStep(id > 2 ? 1 : cueProgress * 2.5).toFixed(3) : "0");

    // Zone 1 progressive reveals
    const circLen = 2 * Math.PI * 225;
    if (id < 3) {
      refs.mainCircle.setAttribute("stroke-dashoffset", circLen.toFixed(1));
    } else if (id === 3) {
      const p = smoothStep(cueProgress * 1.8);
      refs.mainCircle.setAttribute("stroke-dashoffset", (circLen * (1 - p)).toFixed(1));
    } else {
      refs.mainCircle.setAttribute("stroke-dashoffset", "0");
    }

    refs.gRad.setAttribute("opacity", id >= 4 ? smoothStep(id > 4 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
    refs.gDiam.setAttribute("opacity", id >= 5 ? smoothStep(id > 5 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
    refs.gFormula.setAttribute("opacity", id >= 6 ? smoothStep(id > 6 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
    refs.gCompass.setAttribute("opacity", id >= 7 ? smoothStep(id > 7 ? 1 : cueProgress * 2.5).toFixed(3) : "0");

    // Zone 2 progressive trap reveals
    refs.t1.setAttribute("opacity", id >= 8 ? smoothStep(id > 8 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
    refs.t2.setAttribute("opacity", id >= 9 ? smoothStep(id > 9 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
    refs.t3.setAttribute("opacity", id >= 10 ? smoothStep(id > 10 ? 1 : cueProgress * 2.5).toFixed(3) : "0");
  }

  return { buildWorld, updateWorld };
})();
"""


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "S33_Final.mp4"
    keyframe_specs = [
        ("01_s0_pizza", "cue:1:0.15"),
        ("02_s0_clock", "cue:1:0.50"),
        ("03_s0_wheel", "cue:1:0.85"),
        ("04_s0_wheel_question", "cue:2:0.55"),
        ("05_s1_center", "cue:3:0.60"),
        ("06_s1_radius", "cue:4:0.60"),
        ("07_s1_formula", "cue:6:0.60"),
        ("08_s2_trap3", "cue:10:0.55"),
        ("09_s3_cards", "cue:11:0.65"),
        ("10_s3_cta", "cue:12:0.65"),
    ]
    result = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=keyframe_specs,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
