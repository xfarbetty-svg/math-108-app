"""
tools/classroom_engine/units/r32_patterns.py
G3 R-3-2 數量模式與推理（I）：週期規律、差值規律、餘數 0 陷阱、累加推理
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.r32_patterns
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "R-3-2",
    "title": "數量模式與推理（I）",
    "short_title": "數量模式｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活規律 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！生活裡到處都有規律，一起來找找看！",
        "focusTarget": "#r32-beads",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "看串珠：紅、藍、黃，紅、藍、黃，三顆一個循環，一直重複。",
        "focusTarget": "#r32-beads",
        "bubble": None,
        "state": "intro_beads",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "日曆也一樣：星期一到星期日，到了星期一又重新開始，這就是規律！",
        "focusTarget": "#r32-calendar",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_calendar",
    },

    # === Scene 1: 2/4 核心概念拆解 — 週期與差值 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "第一招看週期：紅、藍、黃三顆一循環，請問第 14 顆是什麼顏色？",
        "focusTarget": "#r32-cycle",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_cycle_question",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "用 14 ÷ 3 ＝ 4 餘 2，餘數 2 就是循環裡第 2 個，答案是藍色！",
        "focusTarget": "#r32-cycle-answer",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_cycle_answer",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "第二招看差值：5、10、15、空、25，每次加 5，空格填 20。",
        "focusTarget": "#r32-inc",
        "bubble": None,
        "state": "concept_increase",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "48、42、36、空、24，每次減 6，空格填 30。差值箭頭就是線索！",
        "focusTarget": "#r32-dec",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_decrease",
    },

    # === Scene 2: 3/4 段考陷阱與推理 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與推理",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：4 個一循環求第 12 個。12 ÷ 4 ＝ 3 餘 0，該選哪一個呢？",
        "focusTarget": "#r32-trap1-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "餘數 0 別選第 1 個！", "x": 1240, "y": 235},
        "sfx": "trap",
        "state": "trap_remainder_zero",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與推理",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "沒有餘數，就是循環的最後一個！答案是第 4 個，不是第 1 個喔。",
        "focusTarget": "#r32-trap1-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "沒有餘數 → 看最後一個 ✓", "x": 1240, "y": 235},
        "sfx": "correct",
        "state": "trap_remainder_zero_answer",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與推理",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：階梯積木每次多 3 塊。5、8、11、14，第 5 個就是 17 塊！",
        "focusSequence": [
            {"target": "#r32-stair-4", "until": 0.45},
            {"target": "#r32-stair-5", "until": 1.0},
        ],
        "bubble": "question",
        "sfx": "correct",
        "state": "trap_stair_accumulate",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "記住三大口訣：找循環看餘數、沒餘數看末位、看差值再推理！",
        "focusSequence": [
            {"target": "#r32-tip-1", "until": 0.34},
            {"target": "#r32-tip-2", "until": 0.67},
            {"target": "#r32-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會數量模式與推理，快去挑戰 R-3-2 段考真題吧！",
        "focusTarget": "#r32-cta",
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
  const BEAD_COLORS = ["#EF4444", "#3B82F6", "#FACC15"];
  const BEAD_NAMES = ["紅", "藍", "黃"];
  function bead(g, cx, cy, idx, r) {
    const color = BEAD_COLORS[idx % 3];
    el("circle", { cx: cx, cy: cy, r: r, fill: color,
      stroke: "#1E293B", "stroke-width": 3 }, g);
    el("circle", { cx: cx - r * 0.32, cy: cy - r * 0.32, r: r * 0.20,
      fill: "#FFFFFF", opacity: 0.75 }, g);
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活規律：串珠 3 色循環 + 星期 7 天循環
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的規律：串珠和日曆都在重複", "#E15B48");

    const beads = card(z0, "r32-beads", 830, 450, 700, 350, "#E15B48");
    textEl("串珠：紅、藍、黃，三顆一個循環", { x: 0, y: -132,
      "text-anchor": "middle", "font-size": 30, "font-weight": 900,
      fill: "#B45309" }, beads);
    for (let i = 0; i < 6; i++) {
      const bx = -250 + i * 100;
      bead(beads, bx, -10, i, 40);
      textEl(BEAD_NAMES[i % 3], { x: bx, y: 58, "text-anchor": "middle",
        "font-size": 22, "font-weight": 800, fill: "#475569" }, beads);
      if (i === 2) {
        el("line", { x1: bx + 50, y1: -62, x2: bx + 50, y2: 68,
          stroke: "#F59E0B", "stroke-width": 4, "stroke-dasharray": "9 7" }, beads);
      }
    }
    textEl("| 第 1 輪", { x: -150, y: 108, "text-anchor": "middle",
      "font-size": 20, "font-weight": 800, fill: "#92400E" }, beads);
    textEl("| 第 2 輪", { x: 150, y: 108, "text-anchor": "middle",
      "font-size": 20, "font-weight": 800, fill: "#92400E" }, beads);

    const cal = card(z0, "r32-calendar", 1570, 450, 560, 350, "#2563EB");
    textEl("日曆：星期一到星期日，再回到一", { x: 0, y: -132,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, cal);
    const days = ["一", "二", "三", "四", "五", "六", "日"];
    days.forEach((d, i) => {
      const dx = -224 + i * 74;
      el("rect", { x: dx - 32, y: -52, width: 64, height: 76, rx: 12,
        fill: i === 6 ? "#DBEAFE" : "#EFF6FF",
        stroke: i === 0 ? "#E15B48" : "#2563EB", "stroke-width": 3 }, cal);
      textEl(d, { x: dx, y: 0, "text-anchor": "middle",
        "font-size": 32, "font-weight": 900,
        fill: i === 6 ? "#1D4ED8" : "#1E293B" }, cal);
    });
    textEl("日 → 一，又重新開始！", { x: 0, y: 92, "text-anchor": "middle",
      "font-size": 22, "font-weight": 900, fill: "#475569" }, cal);

    eqBox(z0, "r32-rule-note", 1200, 780, 900,
      "相同的一直重複出現，就叫做「規律」",
      "找出重複的單位，就能預測接下來是什麼", "#FEF3C7", "#92400E", 34);

    // =========================================================
    // ZONE 1 — 兩大招：看週期（餘數）、看差值
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "兩大招：看週期、看差值", "#2563EB");

    const cycle = card(z1, "r32-cycle", 880, 470, 620, 440, "#2563EB");
    textEl("紅 → 藍 → 黃（3 顆一循環）", { x: 0, y: -172,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, cycle);
    for (let i = 0; i < 14; i++) {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const bx = -240 + col * 80;
      const by = -76 + row * 96;
      bead(cycle, bx, by, i, 27);
      textEl(String(i + 1), { x: bx, y: by + 46, "text-anchor": "middle",
        "font-size": 15, "font-weight": 800, fill: "#64748B" }, cycle);
    }
    el("rect", { x: -252, y: 86, width: 504, height: 62, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, cycle);
    textEl("第 14 顆 → 藍色 ✓", { x: 0, y: 126, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#065F46" }, cycle);

    eqBox(z1, "r32-cycle-answer", 1520, 340, 700,
      "14 ÷ 3 ＝ 4 … 2", "餘數 2 → 循環第 2 個（藍色）",
      "#DBEAFE", "#1D4ED8", 42);

    function diffCard(id, x, y, nums, diff, answer, fill, ink) {
      const g = card(z1, id, x, y, 700, 170, ink);
      const xs = [-260, -130, 0, 130, 260];
      nums.forEach((n, i) => {
        el("rect", { x: xs[i] - 52, y: -46, width: 104, height: 72, rx: 16,
          fill: i === 3 ? fill : "#FFFDF8",
          stroke: i === 3 ? ink : "#CBD5E1", "stroke-width": i === 3 ? 4 : 3 }, g);
        textEl(n, { x: xs[i], y: 2, "text-anchor": "middle",
          "font-size": 30, "font-weight": 900,
          fill: i === 3 ? ink : "#1E293B" }, g);
        if (i < 4) {
          textEl(diff, { x: xs[i] + 65, y: -4, "text-anchor": "middle",
            "font-size": 18, "font-weight": 900, fill: ink }, g);
          el("path", { d: `M ${xs[i] + 42},8 L ${xs[i] + 88},8`,
            stroke: ink, "stroke-width": 2.5, "marker-end": "none" }, g);
          el("path", { d: `M ${xs[i] + 82},2 L ${xs[i] + 90},8 L ${xs[i] + 82},14`,
            fill: "none", stroke: ink, "stroke-width": 2.5 }, g);
        }
      });
      textEl(answer, { x: 0, y: 56, "text-anchor": "middle",
        "font-size": 21, "font-weight": 900, fill: ink }, g);
      return g;
    }
    diffCard("r32-inc", 1520, 590, ["5", "10", "15", "(20)", "25"],
      "＋5", "每次加 5 → 空格填 20", "#FEF3C7", "#B45309");
    diffCard("r32-dec", 1520, 800, ["48", "42", "36", "(30)", "24"],
      "−6", "每次減 6 → 空格填 30", "#DCFCE7", "#15803D");

    // =========================================================
    // ZONE 2 — 段考陷阱：餘數 0 / 階梯累加
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：餘數 0 與階梯累加", "#D97706");

    const t1 = card(z2, "r32-trap1", 870, 520, 680, 440, "#DC2626");
    textEl("陷阱一：4 個一循環，求第 12 個", { x: 0, y: -172,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#B91C1C" }, t1);
    for (let i = 0; i < 4; i++) {
      const bx = -210 + i * 140;
      el("rect", { x: bx - 52, y: -128, width: 104, height: 104, rx: 18,
        fill: ["#FEE2E2", "#DBEAFE", "#FEF3C7", "#DCFCE7"][i],
        stroke: "#1E293B", "stroke-width": 3 }, t1);
      textEl(String(i + 1), { x: bx, y: -60, "text-anchor": "middle",
        "font-size": 32, "font-weight": 900, fill: "#1E293B" }, t1);
    }
    const wrong = el("g", { id: "r32-trap1-wrong", transform: "translate(0, 8)" }, t1);
    el("rect", { x: -300, y: -38, width: 600, height: 76, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, wrong);
    textEl("12 ÷ 4 ＝ 3 … 0 → 選第 1 個 ✗", { x: 0, y: 10,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, wrong);
    const correct = el("g", { id: "r32-trap1-correct", transform: "translate(0, 112)" }, t1);
    el("rect", { x: -300, y: -38, width: 600, height: 76, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, correct);
    textEl("沒餘數 → 循環最後 1 個（第 4 個）✓", { x: 0, y: 10,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#065F46" }, correct);

    const t2 = card(z2, "r32-trap2", 1540, 520, 620, 440, "#7C3AED");
    textEl("陷阱二：階梯積木，每次多 3 塊", { x: 0, y: -172,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, t2);
    const heights = [50, 74, 98, 122, 146];
    const counts = ["5", "8", "11", "14", "17"];
    heights.forEach((h, i) => {
      const bx = -230 + i * 115;
      const id = `r32-stair-${i + 1}`;
      const bar = el("g", { id: id }, t2);
      el("rect", { x: bx - 38, y: 70 - h, width: 76, height: h, rx: 10,
        fill: i === 4 ? "#DDD6FE" : "#F5F3FF",
        stroke: i === 4 ? "#7C3AED" : "#A78BFA", "stroke-width": i === 4 ? 4 : 3 }, bar);
      textEl(counts[i], { x: bx, y: 42 - h, "text-anchor": "middle",
        "font-size": 25, "font-weight": 900,
        fill: i === 4 ? "#5B21B6" : "#4C1D95" }, bar);
      if (i < 4) {
        textEl("＋3", { x: bx + 58, y: -22, "text-anchor": "middle",
          "font-size": 17, "font-weight": 900, fill: "#7C3AED" }, t2);
      }
    });
    el("rect", { x: -270, y: 100, width: 540, height: 62, rx: 16,
      fill: "#F5F3FF", stroke: "#8B5CF6", "stroke-width": 3 }, t2);
    textEl("第 5 個 ＝ 14 ＋ 3 ＝ 17 塊 ✓", { x: 0, y: 140,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#5B21B6" }, t2);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "數量模式三大黃金口訣", "#059669");
    const tips = [
      { id: "r32-tip-1", x: 760, title: "① 找循環看餘數", col: "#2563EB",
        lines: ["先找出重複單位", "總數 ÷ 每輪個數", "看餘數定位置"] },
      { id: "r32-tip-2", x: 1220, title: "② 無餘數看末位", col: "#059669",
        lines: ["餘數 0 別慌張", "不是第 1 個", "是循環最後 1 個"] },
      { id: "r32-tip-3", x: 1680, title: "③ 看差值再推理", col: "#7C3AED",
        lines: ["相鄰兩數相減", "遞增或遞減", "累加次數要算對"] },
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
    const cta = el("g", { id: "r32-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 數量模式小達人挑戰開始！快去寫 R-3-2 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "R32_Final.mp4"

    print("=== Rendering G3-R-3-2 Pattern/Reasoning Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_beads", "cue:1:0.55"),
            ("02_act1_calendar", "cue:2:0.55"),
            ("03_act2_cycle", "cue:4:0.55"),
            ("04_act2_diff", "cue:6:0.55"),
            ("05_act3_trap_zero", "cue:8:0.55"),
            ("06_act3_stair", "cue:9:0.55"),
            ("07_act4_summary", "cue:10:0.55"),
        ],
    )
    print("\n=== SUCCESS: R-3-2 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
