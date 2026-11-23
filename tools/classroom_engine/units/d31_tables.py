"""
tools/classroom_engine/units/d31_tables.py
G3 D-3-1 一維表格與二維表格：正字記號統計、交叉查表、合計核對、行列陷阱
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.d31_tables
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "D-3-1",
    "title": "一維表格與二維表格",
    "short_title": "表格與查表｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 票選與時刻表 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！表格能把一堆資料整理得清清楚楚，一起來看看！",
        "focusTarget": "#d31-fruit",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "班級票選最愛水果，畫正字記號統計。一個「正」字就是 5 票喔！",
        "focusTarget": "#d31-fruit",
        "bubble": None,
        "state": "intro_tally",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "火車時刻表、公車票價表也都是表格，想查資料時超方便！",
        "focusTarget": "#d31-timetable",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_timetable",
    },

    # === Scene 1: 2/4 核心概念拆解 — 一維 vs 二維 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "一維表格只分類一種項目。把正字記號換人數統計，誰最多一眼就看得出來。",
        "focusTarget": "#d31-one-d",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_one_d",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "切記：一個「正」字等於 5 票，剩下幾畫就加幾票，千萬別漏算！",
        "focusTarget": "#d31-tally-note",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_tally_value",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "二維表格有橫列也有直行。起站乘以迄站的票價表，交叉點就是答案。",
        "focusTarget": "#d31-two-d",
        "bubble": None,
        "state": "concept_two_d",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "先找橫列台北，再對直行台中，交叉處寫著 700，票價就是 700 元！",
        "focusSequence": [
            {"target": "#d31-row-taipei", "until": 0.34},
            {"target": "#d31-col-taichung", "until": 0.67},
            {"target": "#d31-cell-700", "until": 1.0},
        ],
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_cross_read",
    },

    # === Scene 2: 3/4 段考陷阱與報讀技巧 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與報讀",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：正字加 3 畫是 8 票，有人看成 53 票，那就大錯特錯了！",
        "focusTarget": "#d31-trap1-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "「正」不是 50！", "x": 1240, "y": 235},
        "sfx": "trap",
        "state": "trap_tally_misread",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與報讀",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "對的算法：5 加 3 等於 8 票。横直合計還要互相核對，才不會漏加！",
        "focusTarget": "#d31-trap1-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "5 ＋ 3 ＝ 8 ✓ 合計要核對", "x": 1240, "y": 235},
        "sfx": "correct",
        "state": "trap_tally_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與報讀",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：二維表格看錯行列。用高光十字對準列與行，別被旁邊欄位干擾！",
        "focusSequence": [
            {"target": "#d31-cross-row", "until": 0.34},
            {"target": "#d31-cross-col", "until": 0.67},
            {"target": "#d31-cross-cell", "until": 1.0},
        ],
        "bubble": "question",
        "sfx": "correct",
        "state": "trap_crosshair",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大報讀口訣：一維看標題單位、二維先橫後直找交叉、合計要核對！",
        "focusSequence": [
            {"target": "#d31-tip-1", "until": 0.34},
            {"target": "#d31-tip-2", "until": 0.67},
            {"target": "#d31-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會讀表格，快去挑戰 D-3-1 段考真題吧！",
        "focusTarget": "#d31-cta",
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
  // 簡易表格：傳入表頭與資料列，回傳一個 g（座標以中心為原點）
  function grid(parent, id, x, y, headers, rows, opts) {
    const o = opts || {};
    const colW = o.colW || 120;
    const rowH = o.rowH || 62;
    const w = colW * headers.length;
    const h = rowH * (rows.length + 1);
    const g = el("g", { id: id, transform: `translate(${x}, ${y})` }, parent);
    for (let r = 0; r <= rows.length; r++) {
      for (let c = 0; c < headers.length; c++) {
        const isHead = r === 0;
        const isHi = o.hi && o.hi.r === r && o.hi.c === c;
        el("rect", {
          x: -w / 2 + c * colW, y: -h / 2 + r * rowH,
          width: colW, height: rowH,
          fill: isHi ? (o.hiFill || "#DCFCE7") : (isHead ? (o.headFill || "#FEF3C7") : "#FFFFFF"),
          stroke: isHi ? (o.hiStroke || "#10B981") : "#94A3B8",
          "stroke-width": isHi ? 4 : 2
        }, g);
        const val = isHead ? headers[c] : rows[r - 1][c];
        textEl(String(val), {
          x: -w / 2 + c * colW + colW / 2,
          y: -h / 2 + r * rowH + rowH / 2 + 9,
          "text-anchor": "middle",
          "font-size": isHead ? 25 : 27,
          "font-weight": 900,
          fill: isHi ? (o.hiInk || "#065F46") : (isHead ? "#92400E" : "#1E293B")
        }, g);
      }
    }
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活情境：水果票選正字統計 + 火車時刻票價表
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "表格好好用：統計與查表", "#E15B48");

    const fruit = card(z0, "d31-fruit", 830, 450, 700, 380, "#E15B48");
    textEl("投票畫正字記號：一個「正」＝ 5 票", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#B45309" }, fruit);
    const fruits = [
      ["蘋果", "正正", 10], ["香蕉", "正一一", 7], ["芒果", "正正一", 11]
    ];
    fruits.forEach((row, i) => {
      const ry = -78 + i * 76;
      el("rect", { x: -300, y: ry - 32, width: 600, height: 64, rx: 12,
        fill: i % 2 ? "#FFF7ED" : "#FFFDF8", stroke: "#FED7AA", "stroke-width": 2 }, fruit);
      textEl(row[0], { x: -236, y: ry + 10, "text-anchor": "middle",
        "font-size": 27, "font-weight": 900, fill: "#1E293B" }, fruit);
      textEl(row[1], { x: 20, y: ry + 11, "text-anchor": "middle",
        "font-size": 30, "font-weight": 900, fill: "#C2410C" }, fruit);
      textEl(row[2] + " 票", { x: 238, y: ry + 10, "text-anchor": "middle",
        "font-size": 27, "font-weight": 900, fill: "#9A3412" }, fruit);
    });

    const tt = card(z0, "d31-timetable", 1570, 450, 560, 380, "#2563EB");
    textEl("火車時刻票價表", { x: 0, y: -146, "text-anchor": "middle",
      "font-size": 28, "font-weight": 900, fill: "#1D4ED8" }, tt);
    grid(tt, "d31-tt-grid", 0, 10, ["車次", "開車", "票價"],
      [["1104", "08:09", "106"], ["3152", "08:25", "68"], ["3158", "08:53", "68"]],
      { colW: 150, rowH: 58, headFill: "#DBEAFE", headInk: "#1D4ED8" });

    eqBox(z0, "d31-intro-note", 1220, 790, 900,
      "表格 = 把資料排整齊，查得快又不容易錯",
      "先認清標題和單位，再開始找資料", "#FEF3C7", "#92400E", 32);

    // =========================================================
    // ZONE 1 — 一維表格 vs. 二維表格（交叉查表）
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "一維表格 vs. 二維表格", "#2563EB");

    const one = card(z1, "d31-one-d", 850, 480, 620, 450, "#2563EB");
    textEl("一維：只分類一種項目", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, one);
    textEl("正字記號統計  →  人數統計表", { x: 0, y: -132,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, one);
    grid(one, "d31-one-grid", 0, -10, ["水果", "正字", "人數"],
      [["蘋果", "正正", "10"], ["香蕉", "正一一", "7"], ["芒果", "正正一", "11"]],
      { colW: 174, rowH: 60, headFill: "#DBEAFE", headInk: "#1D4ED8" });
    const note = el("g", { id: "d31-tally-note", transform: "translate(0, 158)" }, one);
    el("rect", { x: -266, y: -30, width: 532, height: 60, rx: 16,
      fill: "#FEF3C7", stroke: "#F59E0B", "stroke-width": 3 }, note);
    textEl("一個「正」字 ＝ 5 票，不足 5 畫就加幾畫", { x: 0, y: 10,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#92400E" }, note);

    const two = card(z1, "d31-two-d", 1520, 480, 720, 450, "#7C3AED");
    textEl("二維：起站 × 迄站票價表", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#6D28D9" }, two);
    const colX = [-105, 45, 195];
    const rowY = [-38, 26, 90];
    // 表格底色
    const tbl = el("g", { transform: "translate(-20, 20)" }, two);
    el("rect", { x: -290, y: -140, width: 550, height: 254, rx: 12,
      fill: "#FFFFFF", stroke: "#A78BFA", "stroke-width": 3 }, tbl);
    // 表頭
    ["起站／迄站", "台北", "台中", "台南"].forEach((h, i) => {
      const hx = i === 0 ? -235 : colX[i - 1];
      el("rect", { x: hx - 55, y: -140, width: 110, height: 60,
        fill: "#EDE9FE", stroke: "#A78BFA", "stroke-width": 2 }, tbl);
      textEl(h, { x: hx, y: -100, "text-anchor": "middle",
        "font-size": i === 0 ? 17 : 25, "font-weight": 900,
        fill: "#5B21B6" }, tbl);
    });
    // 所有資料格
    const matrix = [["—", "700", "900"], ["700", "—", "400"], ["900", "400", "—"]];
    const rowNames = ["台北", "台中", "台南"];
    matrix.forEach((row, r) => {
      el("rect", { x: -290, y: -80 + r * 64, width: 110, height: 64,
        fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 2 }, tbl);
      textEl(rowNames[r], { x: -235, y: -36 + r * 64, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#5B21B6" }, tbl);
      row.forEach((v, c) => {
        el("rect", { x: -180 + c * 150, y: -80 + r * 64, width: 150, height: 64,
          fill: "#FFFFFF", stroke: "#DDD6FE", "stroke-width": 2 }, tbl);
        textEl(v, { x: -105 + c * 150, y: -36 + r * 64, "text-anchor": "middle",
          "font-size": 27, "font-weight": 900, fill: "#1E293B" }, tbl);
      });
    });
    // 高光：橫列（台北列）
    const rowHi = el("g", { id: "d31-row-taipei", transform: "translate(-20, 20)" }, two);
    el("rect", { x: -290, y: -80, width: 550, height: 64, rx: 10,
      fill: "#FDE68A", fillOpacity: 0.45, stroke: "#F59E0B", "stroke-width": 3 }, rowHi);
    // 高光：直行（台中行）
    const colHi = el("g", { id: "d31-col-taichung", transform: "translate(-20, 20)" }, two);
    el("rect", { x: -30, y: -140, width: 150, height: 254, rx: 10,
      fill: "#BFDBFE", fillOpacity: 0.45, stroke: "#2563EB", "stroke-width": 3 }, colHi);
    // 交叉答案格
    const cell = el("g", { id: "d31-cell-700", transform: "translate(-20, 20)" }, two);
    el("rect", { x: -30, y: -80, width: 150, height: 64, rx: 12,
      fill: "#DCFCE7", stroke: "#10B981", "stroke-width": 5 }, cell);
    textEl("700 ✓", { x: 45, y: -36, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#065F46" }, cell);
    textEl("先找橫列 → 再對直行 → 交叉點是答案", { x: 0, y: 170,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#5B21B6" }, two);

    // =========================================================
    // ZONE 2 — 段考陷阱：正字漏算 / 二維行列看錯
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱與報讀技巧", "#D97706");

    const t1 = card(z2, "d31-trap1", 870, 520, 680, 440, "#DC2626");
    textEl("陷阱一：正字記號別漏算、別看錯", { x: 0, y: -172,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#B91C1C" }, t1);
    const wrong = el("g", { id: "d31-trap1-wrong", transform: "translate(0, -84)" }, t1);
    el("rect", { x: -300, y: -50, width: 600, height: 104, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, wrong);
    textEl("「正」＋ 3 畫 ＝ 8 票", { x: 0, y: -12, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#B91C1C" }, wrong);
    textEl("看成 53 票 ✗（把「正」當成 50）", { x: 0, y: 30, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#B91C1C" }, wrong);
    const correct = el("g", { id: "d31-trap1-correct", transform: "translate(0, 48)" }, t1);
    el("rect", { x: -300, y: -50, width: 600, height: 104, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, correct);
    textEl("5 ＋ 3 ＝ 8 票 ✓", { x: 0, y: -12, "text-anchor": "middle",
      "font-size": 29, "font-weight": 900, fill: "#065F46" }, correct);
    textEl("橫向、直向合計互相核對，不漏加不重複", { x: 0, y: 30,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#065F46" }, correct);
    textEl("口訣：先算正字，再算散畫，最後核對合計", { x: 0, y: 176,
      "text-anchor": "middle", "font-size": 21, "font-weight": 900,
      fill: "#1E293B" }, t1);

    const t2 = card(z2, "d31-trap2", 1540, 520, 620, 440, "#7C3AED");
    textEl("陷阱二：二維表格看錯交叉點", { x: 0, y: -172,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, t2);
    // 迷你 3×3 表 + 十字高光
    const mini = el("g", { transform: "translate(0, 6)" }, t2);
    const miniX = [-110, 0, 110], miniY = [-70, 0, 70];
    ["", "台中", "台南"].forEach((h, i) => {
      if (i > 0) textEl(h, { x: miniX[i - 1], y: -104, "text-anchor": "middle",
        "font-size": 21, "font-weight": 900, fill: "#5B21B6" }, mini);
    });
    ["台北", "台中", "台南"].forEach((h, r) => {
      textEl(h, { x: -208, y: miniY[r] + 9, "text-anchor": "middle",
        "font-size": 21, "font-weight": 900, fill: "#5B21B6" }, mini);
      miniX.forEach((cx, c) => {
        el("rect", { x: cx - 52, y: miniY[r] - 32, width: 104, height: 64, rx: 8,
          fill: "#FFFFFF", stroke: "#DDD6FE", "stroke-width": 2.5 }, mini);
        textEl(["—", "700", "900"][r][c] || "—",
          { x: cx, y: miniY[r] + 9, "text-anchor": "middle",
            "font-size": 25, "font-weight": 900, fill: "#1E293B" }, mini);
      });
    });
    // 十字高光（目標：台北列 × 台中行 = 700）
    const crossRow = el("g", { id: "d31-cross-row", transform: "translate(0, 6)" }, t2);
    el("rect", { x: -162, y: miniY[0] - 32, width: 324, height: 64, rx: 10,
      fill: "#FDE68A", fillOpacity: 0.42, stroke: "#F59E0B", "stroke-width": 3 }, crossRow);
    const crossCol = el("g", { id: "d31-cross-col", transform: "translate(0, 6)" }, t2);
    el("rect", { x: miniX[0] - 52, y: -102, width: 104, height: 196, rx: 10,
      fill: "#BFDBFE", fillOpacity: 0.42, stroke: "#2563EB", "stroke-width": 3 }, crossCol);
    const crossCell = el("g", { id: "d31-cross-cell", transform: "translate(0, 6)" }, t2);
    el("rect", { x: miniX[0] - 52, y: miniY[0] - 32, width: 104, height: 64, rx: 12,
      fill: "#DCFCE7", stroke: "#10B981", "stroke-width": 5 }, crossCell);
    textEl("700 ✓", { x: miniX[0], y: miniY[0] + 9, "text-anchor": "middle",
      "font-size": 25, "font-weight": 900, fill: "#065F46" }, crossCell);
    textEl("十字對準，避開相鄰欄位干擾", { x: 0, y: 158, "text-anchor": "middle",
      "font-size": 21, "font-weight": 900, fill: "#5B21B6" }, t2);

    // =========================================================
    // ZONE 3 — 三大報讀口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "表格報讀三大黃金口訣", "#059669");
    const tips = [
      { id: "d31-tip-1", x: 760, title: "① 一維看單位", col: "#2563EB",
        lines: ["先讀標題", "認清單位", "正字 ＝ 5 票"] },
      { id: "d31-tip-2", x: 1220, title: "② 二維先橫後直", col: "#7C3AED",
        lines: ["先找橫列", "再對直行", "交叉點是答案"] },
      { id: "d31-tip-3", x: 1680, title: "③ 合計要核對", col: "#059669",
        lines: ["橫向加一遍", "直向再加一遍", "兩個總數要一樣"] },
    ];
    tips.forEach((tip) => {
      const c = card(z3, tip.id, tip.x, 480, 420, 440, tip.col);
      el("rect", { x: -190, y: -186, width: 380, height: 58, rx: 16,
        fill: tip.col }, c);
      textEl(tip.title, { x: 0, y: -146, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#FFFFFF" }, c);
      tip.lines.forEach((ln, i) => {
        textEl(ln, { x: 0, y: -52 + i * 66, "text-anchor": "middle",
          "font-size": 23, "font-weight": 800, fill: "#1E293B" }, c);
      });
    });
    const cta = el("g", { id: "d31-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 查表小達人挑戰開始！快去寫 D-3-1 段考真題！ ⭐", {
      x: 0, y: 13, "text-anchor": "middle", "font-size": 28,
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "D31_Final.mp4"

    print("=== Rendering G3-D-3-1 Tables Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_tally", "cue:1:0.55"),
            ("02_act1_timetable", "cue:2:0.55"),
            ("03_act2_one_d", "cue:4:0.55"),
            ("04_act2_two_d_cross", "cue:6:0.55"),
            ("05_act3_trap_tally", "cue:8:0.55"),
            ("06_act3_crosshair", "cue:9:0.55"),
            ("07_act4_summary", "cue:10:0.55"),
        ],
    )
    print("\n=== SUCCESS: D-3-1 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
