"""
tools/classroom_engine/units/n32_add_sub.py
G3 N-3-2 加減直式計算：購物找零、進位退位、連續退位、加減互逆驗算
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n32_add_sub
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-2",
    "title": "加減直式計算",
    "short_title": "加減直式｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 購物湊整與找零 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！買東西找零要用到加減直式，一起來算清楚！",
        "focusTarget": "#n32-shop",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "帶 1000 元買 568 元的書包，先湊整數：568 加 32 等於 600。",
        "focusTarget": "#n32-shop",
        "bubble": None,
        "state": "intro_round",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "1000 減 600 等於 400，再把 32 加回來，找到 432 元！",
        "focusTarget": "#n32-change",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_change",
    },

    # === Scene 1: 2/4 核心概念拆解 — 進位與退位 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "直式計算要對齊位子，個位對個位，從最右邊的個位算起。",
        "focusTarget": "#n32-add",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_align",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "5319 加 806：9 加 6 等 15 寫 5 進 1，百位再進 1，答案是 6125。",
        "focusTarget": "#n32-add",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_carry",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "2015 減 207：個位不夠向十位借，百位不夠向千位借，答案是 1808。",
        "focusTarget": "#n32-sub",
        "bubble": "idea",
        "state": "concept_borrow",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：3002 減 1458，個位 2 不夠減 8，十位卻是 0，該怎麼辦？",
        "focusTarget": "#n32-cont-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "0 不能直接借！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_continuous_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "向千位借 1 當 10，一路借到個位變成 12，答案 1544，綠勾才是對的！",
        "focusTarget": "#n32-cont-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "1544 ✓ 連續退位成功", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_continuous_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：算完就交卷？減法一定要用加法驗算，才不會白白丟分！",
        "focusTarget": "#n32-inverse-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "算完別忘了驗算！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_inverse_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "1544 加 1458 等於 3002，和原來的被減數一樣，答案正確！",
        "focusTarget": "#n32-inverse-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "3002 ✓ 驗算通過", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_inverse_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：位子要對齊、滿十就進一、不夠減就借！",
        "focusSequence": [
            {"target": "#n32-tip-1", "until": 0.34},
            {"target": "#n32-tip-2", "until": 0.67},
            {"target": "#n32-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會加減直式，快去挑戰 N-3-2 段考真題吧！",
        "focusTarget": "#n32-cta",
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
  // 直式：top/bottom/result 為四個位值數字陣列（空字串代表空白位）
  function vertical(parent, xs, top, bottom, result, marks) {
    const yTop = -54, yBottom = 12, yLine = 38, yResult = 92;
    for (let i = 0; i < 4; i++) {
      if (top[i] !== "") textEl(top[i], { x: xs[i], y: yTop,
        "text-anchor": "middle", "font-size": 46, "font-weight": 900,
        fill: "#1E293B" }, parent);
      if (bottom[i] !== "") textEl(bottom[i], { x: xs[i], y: yBottom,
        "text-anchor": "middle", "font-size": 46, "font-weight": 900,
        fill: "#1E293B" }, parent);
      textEl(result[i], { x: xs[i], y: yResult,
        "text-anchor": "middle", "font-size": 46, "font-weight": 900,
        fill: "#065F46" }, parent);
    }
    el("line", { x1: xs[0] - 52, y1: yLine, x2: xs[3] + 52, y2: yLine,
      stroke: "#1E293B", "stroke-width": 4, "stroke-linecap": "round" }, parent);
    (marks || []).forEach((m) => {
      textEl(m.t, { x: xs[m.i], y: m.y, "text-anchor": "middle",
        "font-size": m.fs || 22, "font-weight": 900, fill: m.c || "#DC2626" }, parent);
    });
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 購物湊整與找零
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "購物湊整與找零", "#E15B48");

    const shop = card(z0, "n32-shop", 900, 450, 720, 380, "#E15B48");
    textEl("書包價格 568 元，付 1000 元", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#B45309" }, shop);
    el("rect", { x: -260, y: -108, width: 520, height: 110, rx: 22,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 4 }, shop);
    textEl("568 ＋ 32 ＝ 600", { x: 0, y: -34, "text-anchor": "middle",
      "font-size": 50, "font-weight": 900, fill: "#C2410C" }, shop);
    textEl("先把 568 湊成整數 600，比較好算！", { x: 0, y: 44,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#9A3412" }, shop);
    el("rect", { x: -300, y: 78, width: 600, height: 70, rx: 16,
      fill: "#FEF3C7", stroke: "#F59E0B", "stroke-width": 3 }, shop);
    textEl("多加了 32，最後要記得加回來", { x: 0, y: 122,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#92400E" }, shop);

    const change = card(z0, "n32-change", 1650, 450, 500, 380, "#2563EB");
    textEl("找零怎麼算？", { x: 0, y: -146, "text-anchor": "middle",
      "font-size": 28, "font-weight": 900, fill: "#1D4ED8" }, change);
    textEl("1000 − 600 ＝ 400", { x: 0, y: -72, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#1E293B" }, change);
    textEl("400 ＋ 32 ＝ 432", { x: 0, y: -8, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#1E293B" }, change);
    el("rect", { x: -190, y: 42, width: 380, height: 100, rx: 20,
      fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 4 }, change);
    textEl("找零 432 元", { x: 0, y: 106, "text-anchor": "middle",
      "font-size": 38, "font-weight": 900, fill: "#1D4ED8" }, change);

    eqBox(z0, "n32-intro-note", 1220, 800, 880,
      "加減直式：對齊位子、從個位算起",
      "湊整可以幫你算得又快又準", "#FEF3C7", "#92400E", 32);

    // =========================================================
    // ZONE 1 — 加法進位 / 減法退位
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "直式加法進位 × 直式減法退位", "#2563EB");

    const add = card(z1, "n32-add", 960, 480, 740, 460, "#2563EB");
    textEl("加法進位：5319 ＋ 806", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, add);
    vertical(add, [-210, -70, 70, 210],
      ["5", "3", "1", "9"], ["", "8", "0", "6"], ["6", "1", "2", "5"], [
        { i: 3, y: -112, t: "進1", c: "#DC2626", fs: 20 },
        { i: 1, y: -112, t: "進1", c: "#DC2626", fs: 20 },
        { i: 3, y: 112, t: "5＋1(進位)＝6", c: "#1D4ED8", fs: 19 },
      ]);
    textEl("紅色小 1 就是進位，千位別忘了加！", { x: 0, y: 180,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#DC2626" }, add);

    const sub = card(z1, "n32-sub", 1650, 480, 500, 460, "#7C3AED");
    textEl("減法退位：2015 − 207", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 25, "font-weight": 900,
      fill: "#6D28D9" }, sub);
    vertical(sub, [-150, -50, 50, 150],
      ["2", "0", "1", "5"], ["", "2", "0", "7"], ["1", "8", "0", "8"], [
        { i: 3, y: -112, t: "15", c: "#DC2626", fs: 20 },
        { i: 1, y: -112, t: "10", c: "#DC2626", fs: 20 },
      ]);
    textEl("個位：15 − 7 ＝ 8", { x: 0, y: 132, "text-anchor": "middle",
      "font-size": 20, "font-weight": 900, fill: "#6D28D9" }, sub);
    textEl("百位：10 − 2 ＝ 8", { x: 0, y: 166, "text-anchor": "middle",
      "font-size": 20, "font-weight": 900, fill: "#6D28D9" }, sub);

    // =========================================================
    // ZONE 2 — 段考陷阱：連續退位 / 加減互逆驗算
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：連續退位與驗算", "#D97706");

    const cont = card(z2, "n32-cont", 980, 490, 760, 600, "#DC2626");
    textEl("陷阱一：3002 − 1458（跨過兩個 0）", { x: 0, y: -174,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, cont);
    vertical(cont, [-225, -75, 75, 225],
      ["3", "0", "0", "2"], ["1", "4", "5", "8"], ["1", "5", "4", "4"], [
        { i: 0, y: -112, t: "2", c: "#DC2626", fs: 20 },
        { i: 1, y: -112, t: "9", c: "#DC2626", fs: 20 },
        { i: 2, y: -112, t: "9", c: "#DC2626", fs: 20 },
        { i: 3, y: -112, t: "12", c: "#DC2626", fs: 20 },
      ]);
    textEl("紅字是借位後的樣子：3→2、0→9、0→9、2→12", { x: 0, y: 126,
      "text-anchor": "middle", "font-size": 19, "font-weight": 800,
      fill: "#B91C1C" }, cont);
    verdict(cont, "n32-cont-wrong", 178, "✗ 0 直接減 8，或漏借一位就錯了", "trap", 21);
    verdict(cont, "n32-cont-correct", 256, "✓ 一路借到個位 12，答案 1544", "correct", 22);

    const inv = card(z2, "n32-inverse", 1650, 480, 500, 470, "#7C3AED");
    textEl("陷阱二：加減互逆驗算", { x: 0, y: -174,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, inv);
    el("rect", { x: -210, y: -128, width: 420, height: 96, rx: 18,
      fill: "#F5F3FF", stroke: "#A78BFA", "stroke-width": 3 }, inv);
    textEl("1544 ＋ 1458", { x: 0, y: -92, "text-anchor": "middle",
      "font-size": 30, "font-weight": 900, fill: "#5B21B6" }, inv);
    textEl("＝ 3002", { x: 0, y: -52, "text-anchor": "middle",
      "font-size": 34, "font-weight": 900, fill: "#065F46" }, inv);
    const iw = el("g", { id: "n32-inverse-wrong", transform: "translate(0, -6)" }, inv);
    el("rect", { x: -210, y: -34, width: 420, height: 70, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, iw);
    textEl("✗ 算完不驗算", { x: 0, y: 12, "text-anchor": "middle",
      "font-size": 24, "font-weight": 900, fill: "#B91C1C" }, iw);
    const ic = el("g", { id: "n32-inverse-correct", transform: "translate(0, 66)" }, inv);
    el("rect", { x: -210, y: -34, width: 420, height: 70, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, ic);
    textEl("✓ 等於被減數，正確！", { x: 0, y: 12, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#065F46" }, ic);
    textEl("差 ＋ 減數 ＝ 被減數", { x: 0, y: 174, "text-anchor": "middle",
      "font-size": 20, "font-weight": 800, fill: "#5B21B6" }, inv);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "加減直式三大口訣", "#059669");
    const tips = [
      { id: "n32-tip-1", x: 760, title: "① 位子對齊", col: "#2563EB",
        lines: ["個位對個位", "十位對十位", "從個位算起"] },
      { id: "n32-tip-2", x: 1220, title: "② 滿十進一", col: "#D97706",
        lines: ["加法滿十", "寫零進一", "小 1 別漏加"] },
      { id: "n32-tip-3", x: 1680, title: "③ 不夠就借", col: "#059669",
        lines: ["退位借 1 當 10", "跨 0 要連續借", "減完用加法驗算"] },
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
    const cta = el("g", { id: "n32-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 直式小達人挑戰開始！快去寫 N-3-2 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N32_Final.mp4"

    print("=== Rendering G3-N-3-2 Addition/Subtraction Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_rounding", "cue:1:0.55"),
            ("02_act1_change", "cue:2:0.55"),
            ("03_act2_carry", "cue:4:0.55"),
            ("04_act2_borrow", "cue:5:0.55"),
            ("05_act3_continuous", "cue:7:0.55"),
            ("06_act3_inverse", "cue:9:0.55"),
            ("07_act4_summary", "cue:11:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-2 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
