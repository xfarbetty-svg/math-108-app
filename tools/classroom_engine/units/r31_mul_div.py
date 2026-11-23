"""
tools/classroom_engine/units/r31_mul_div.py
G3 R-3-1 乘法與除法的關係（乘除互逆、驗算、未知數逆推）
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.r31_mul_div
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "R-3-1",
    "title": "乘法與除法的關係",
    "short_title": "乘除關係｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活平分與分裝 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！今天用 12 顆蘋果，帶你認識乘法和除法的關係！",
        "focusTarget": None,
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "point", "flip": False},
        "subtitle": "把 12 顆蘋果，每 4 顆放一盤，剛好可以放滿 3 盤喔！",
        "focusSequence": [
            {"target": "#r31-plate-1", "until": 0.33},
            {"target": "#r31-plate-2", "until": 0.66},
            {"target": "#r31-plate-3", "until": 1.0},
        ],
        "bubble": None,
        "state": "intro_share",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "平分的方法就是除法：12 ÷ 4 ＝ 3。再把 3 盤乘起來，就回到 12 顆！",
        "focusTarget": "#r31-share-eq",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_equation",
    },

    # === Scene 1: 2/4 核心概念拆解 — 乘除互逆家族 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "先看整齊陣列：3 排，每排 4 顆，一共 12 顆，一顆也不差！",
        "focusTarget": "#r31-array",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_array",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "乘法是把一樣多的數加起來：4 × 3 ＝ 12，表示 3 個 4 相加。",
        "focusTarget": "#r31-mult-eq",
        "bubble": None,
        "state": "concept_multiply",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "同一個家族還能倒過來：12 ÷ 4 ＝ 3，把 12 每 4 顆分一份，可以分 3 份。",
        "focusTarget": "#r31-div1-eq",
        "bubble": None,
        "state": "concept_divide_1",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "也可以 12 ÷ 3 ＝ 4。乘法和除法互逆，三道算式是一家人！",
        "focusTarget": "#r31-div2-eq",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_divide_2",
    },

    # === Scene 2: 3/4 段考陷阱與驗算技巧 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與驗算",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：除法算完別急著交卷！用乘法驗算，商乘除數要等於被除數。",
        "focusTarget": "#r31-trap1-wrong",
        "bubble": "alert",
        "badge": {"type": "trap", "text": "算完要驗算！", "x": 880, "y": 250},
        "sfx": "trap",
        "state": "trap_verify_intro",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與驗算",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "像 24 ÷ 6 ＝ 4，驗算 6 × 4 ＝ 24 是對的；寫成 20 就錯了！",
        "focusTarget": "#r31-trap1-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "6 × 4 ＝ 24 ✓", "x": 880, "y": 250},
        "sfx": "correct",
        "state": "trap_verify_exact",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與驗算",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "有餘數也要驗算：23 ÷ 6 ＝ 3 餘 5，算 3 × 6 ＋ 5 ＝ 23，正確！",
        "focusTarget": "#r31-trap1-remainder",
        "bubble": None,
        "badge": {"type": "correct", "text": "商 × 除數 ＋ 餘數 ＝ 被除數", "x": 880, "y": 250},
        "sfx": "correct",
        "state": "trap_verify_remainder",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱與驗算",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：□ × 5 ＝ 35，用 35 ÷ 5 找回 7；36 ÷ □ ＝ 9，用 36 ÷ 9 找回 4！",
        "focusSequence": [
            {"target": "#r31-trap2-left", "until": 0.5},
            {"target": "#r31-trap2-right", "until": 1.0},
        ],
        "bubble": "question",
        "badge": {"type": "correct", "text": "用互逆運算倒著推！", "x": 1520, "y": 250},
        "sfx": "correct",
        "state": "trap_unknown",
    },

    # === Scene 3: 4/4 總結口訣與鼓勵 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "最後記住三大口訣：乘除一家親、驗算不漏氣、未知數倒著推！",
        "focusSequence": [
            {"target": "#r31-tip-1", "until": 0.34},
            {"target": "#r31-tip-2", "until": 0.67},
            {"target": "#r31-tip-3", "until": 1.0},
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
        "subtitle": "你已經搞懂 3 × 4 ＝ 12 的數字家族，現在就去挑戰段考真題吧！",
        "focusTarget": "#r31-cta",
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
  function apple(g, cx, cy) {
    el("line", { x1: cx, y1: cy - 24, x2: cx + 4, y2: cy - 36,
      stroke: "#7C2D12", "stroke-width": 4, "stroke-linecap": "round" }, g);
    el("path", { d: `M ${cx + 2},${cy - 32} q 14,-12 22,-2 q -14,8 -22,2`,
      fill: "#16A34A", stroke: "#14532D", "stroke-width": 2 }, g);
    el("circle", { cx: cx, cy: cy, r: 26, fill: "#EF4444",
      stroke: "#991B1B", "stroke-width": 3 }, g);
    el("circle", { cx: cx - 8, cy: cy - 8, r: 5, fill: "#FCA5A5" }, g);
  }
  function eqBox(parent, id, x, y, w, txt, caption, fill, ink, fontSize) {
    const g = el("g", { id: id, transform: `translate(${x}, ${y})` }, parent);
    el("rect", { x: -w / 2, y: -46, width: w, height: 92, rx: 22,
      fill: fill, stroke: "#1E293B", "stroke-width": 3.5,
      filter: "url(#cardShadow)" }, g);
    textEl(txt, { x: 0, y: 12, "text-anchor": "middle", "font-size": fontSize || 40,
      "font-weight": 900, fill: ink }, g);
    if (caption) {
      textEl(caption, { x: 0, y: 74, "text-anchor": "middle", "font-size": 20,
        "font-weight": 800, fill: "#475569" }, g);
    }
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活平分：12 顆蘋果，每盤 4 顆，共 3 盤
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的平分：12 顆蘋果，每盤 4 顆", "#E15B48");
    const plateXs = [800, 1200, 1600];
    plateXs.forEach((px, i) => {
      const c = card(z0, `r31-plate-${i + 1}`, px, 470, 360, 430, "#D97706");
      textEl(`第 ${i + 1} 盤`, { x: 0, y: -158, "text-anchor": "middle",
        "font-size": 30, "font-weight": 900, fill: "#B45309" }, c);
      el("ellipse", { cx: 0, cy: 92, rx: 122, ry: 34, fill: "#FFEDD5",
        stroke: "#EA580C", "stroke-width": 4 }, c);
      [[-62, -42], [62, -42], [-62, 28], [62, 28]].forEach(([ax, ay]) => apple(c, ax, ay));
      textEl("4 顆", { x: 0, y: 168, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#9A3412" }, c);
    });
    eqBox(z0, "r31-share-eq", 1200, 770, 760,
      "12 ÷ 4 ＝ 3　（3 盤 × 每盤 4 顆 ＝ 12 顆）",
      "平分用除法，合起來用乘法", "#FEF3C7", "#92400E", 34);

    // =========================================================
    // ZONE 1 — 3 × 4 整齊陣列與乘除互逆家族
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "3 排 × 每排 4 顆 ＝ 12 顆，一顆不差！", "#2563EB");
    const arr = card(z1, "r31-array", 800, 500, 620, 470, "#D97706");
    const cols = [-210, -70, 70, 210];
    const rows = [-100, 10, 120];
    let count = 0;
    rows.forEach((ry, ri) => {
      cols.forEach((cx) => {
        count += 1;
        el("circle", { cx: cx, cy: ry, r: 25, fill: "#FBBF24",
          stroke: "#92400E", "stroke-width": 3.5 }, arr);
        el("circle", { cx: cx - 7, cy: ry - 7, r: 5, fill: "#FEF3C7" }, arr);
      });
      // 刻意不繪製每排標籤：避免與陣列圓點重疊；排數由下方統計文字說明
    });
    textEl(`共 ${count} 顆（3 排 × 4 顆）`, { x: 0, y: 195, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#1E293B" }, arr);

    eqBox(z1, "r31-mult-eq", 1490, 330, 600, "4 × 3 ＝ 12",
      "因數 × 因數 ＝ 積", "#DBEAFE", "#1D4ED8", 46);
    eqBox(z1, "r31-div1-eq", 1490, 510, 600, "12 ÷ 4 ＝ 3",
      "積 ÷ 一因數 ＝ 另一因數", "#DCFCE7", "#15803D", 46);
    eqBox(z1, "r31-div2-eq", 1490, 690, 600, "12 ÷ 3 ＝ 4",
      "同一個數字家族，乘除互逆！", "#FCE7F3", "#BE185D", 46);

    // =========================================================
    // ZONE 2 — 段考陷阱：驗算與未知數逆推
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：乘除驗算與未知數逆推", "#D97706");

    const t1 = card(z2, "r31-trap1", 880, 500, 640, 470, "#DC2626");
    textEl("陷阱一：用乘法驗算除法", { x: 0, y: -178, "text-anchor": "middle",
      "font-size": 30, "font-weight": 900, fill: "#B91C1C" }, t1);
    const wrong = el("g", { id: "r31-trap1-wrong", transform: "translate(0, -92)" }, t1);
    el("rect", { x: -290, y: -36, width: 580, height: 74, rx: 18,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, wrong);
    textEl("24 ÷ 6 ＝ 4 → 6 × 4 ＝ 20 ✗", { x: 0, y: 10, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#B91C1C" }, wrong);
    const correct = el("g", { id: "r31-trap1-correct", transform: "translate(0, 6)" }, t1);
    el("rect", { x: -290, y: -36, width: 580, height: 74, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, correct);
    textEl("6 × 4 ＝ 24 ✓　商 × 除數 ＝ 被除數", { x: 0, y: 10, "text-anchor": "middle",
      "font-size": 25, "font-weight": 900, fill: "#065F46" }, correct);
    const rem = el("g", { id: "r31-trap1-remainder", transform: "translate(0, 116)" }, t1);
    el("rect", { x: -290, y: -36, width: 580, height: 74, rx: 18,
      fill: "#FFFBEB", stroke: "#F59E0B", "stroke-width": 3 }, rem);
    textEl("23 ÷ 6 ＝ 3 餘 5 → 3 × 6 ＋ 5 ＝ 23 ✓", { x: 0, y: 10, "text-anchor": "middle",
      "font-size": 23, "font-weight": 900, fill: "#92400E" }, rem);
    textEl("口訣：商 × 除數 ＋ 餘數 ＝ 被除數", { x: 0, y: 198, "text-anchor": "middle",
      "font-size": 21, "font-weight": 900, fill: "#1E293B" }, t1);

    const t2 = card(z2, "r31-trap2", 1520, 500, 620, 470, "#7C3AED");
    textEl("陷阱二：方框未知數倒著推", { x: 0, y: -178, "text-anchor": "middle",
      "font-size": 30, "font-weight": 900, fill: "#6D28D9" }, t2);
    const u1 = el("g", { id: "r31-trap2-left", transform: "translate(0, -82)" }, t2);
    el("rect", { x: -275, y: -52, width: 550, height: 116, rx: 20,
      fill: "#F5F3FF", stroke: "#8B5CF6", "stroke-width": 3 }, u1);
    textEl("□ × 5 ＝ 35", { x: 0, y: -12, "text-anchor": "middle",
      "font-size": 32, "font-weight": 900, fill: "#5B21B6" }, u1);
    textEl("□ ＝ 35 ÷ 5 ＝ 7 ✓", { x: 0, y: 36, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#047857" }, u1);
    const u2 = el("g", { id: "r31-trap2-right", transform: "translate(0, 92)" }, t2);
    el("rect", { x: -275, y: -52, width: 550, height: 116, rx: 20,
      fill: "#F5F3FF", stroke: "#8B5CF6", "stroke-width": 3 }, u2);
    textEl("36 ÷ □ ＝ 9", { x: 0, y: -12, "text-anchor": "middle",
      "font-size": 32, "font-weight": 900, fill: "#5B21B6" }, u2);
    textEl("□ ＝ 36 ÷ 9 ＝ 4 ✓", { x: 0, y: 36, "text-anchor": "middle",
      "font-size": 27, "font-weight": 900, fill: "#047857" }, u2);
    textEl("看到方框，就用互逆運算找回它！", { x: 0, y: 200, "text-anchor": "middle",
      "font-size": 21, "font-weight": 900, fill: "#1E293B" }, t2);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "乘除關係三大黃金口訣", "#059669");
    const tips = [
      { id: "r31-tip-1", x: 760, title: "① 乘除一家親", col: "#2563EB",
        lines: ["因數 × 因數 ＝ 積", "積 ÷ 一因數", "＝ 另一因數"] },
      { id: "r31-tip-2", x: 1220, title: "② 驗算不漏氣", col: "#059669",
        lines: ["商 × 除數 ＝ 被除數", "有餘數再 ＋ 餘數", "算完一定要驗算"] },
      { id: "r31-tip-3", x: 1680, title: "③ 未知數倒著推", col: "#7C3AED",
        lines: ["□ × 5 ＝ 35", "用 35 ÷ 5 ＝ 7", "36 ÷ □ ＝ 9 同理"] },
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
    const cta = el("g", { id: "r31-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 乘除小達人挑戰開始！快去寫 R-3-1 段考真題！ ⭐", {
      x: 0, y: 13, "text-anchor": "middle", "font-size": 30,
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "R31_Final.mp4"

    print("=== Rendering G3-R-3-1 Multiplication/Division Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_share", "cue:1:0.55"),
            ("02_act2_array", "cue:3:0.55"),
            ("03_act2_family", "cue:6:0.55"),
            ("04_act3_trap1", "cue:8:0.55"),
            ("05_act3_trap2", "cue:10:0.55"),
            ("06_act4_summary", "cue:11:0.55"),
        ],
    )
    print("\n=== SUCCESS: R-3-1 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
