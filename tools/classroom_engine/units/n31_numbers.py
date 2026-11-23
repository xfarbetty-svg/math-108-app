"""
tools/classroom_engine/units/n31_numbers.py
G3 N-3-1 一萬以內的數：生活大數、位值表讀寫、零的陷阱、高位比大小與合成
4-act full-stage infinite-canvas unit plugin for the Mimi Rabbit 2D Classroom Engine.
Run: python -m tools.classroom_engine.units.n31_numbers
"""
from __future__ import annotations

import json
from pathlib import Path

from tools.classroom_engine.render_video import render_unit_video

UNIT_META = {
    "code": "N-3-1",
    "title": "一萬以內的數",
    "short_title": "一萬以內的數｜概念小教室",
    "grade": 3,
    "layout": "full_stage",
}

CUES = [
    # === Scene 0: 1/4 情境導入 — 生活中的大數 (camera.x = 0) ===
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 260, "y": 880, "pose": "wave", "flip": False},
        "subtitle": "哈囉！我是米米兔！生活裡到處都藏著大數，一起來認識一萬以內的數！",
        "focusTarget": "#n31-price",
        "bubble": "idea",
        "sfx": "pop",
        "state": "intro_welcome",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "看價格標籤：一台顯微鏡 8060 元，讀作八千零六十，中間的 0 只讀一個零。",
        "focusTarget": "#n31-price",
        "bubble": None,
        "state": "intro_price",
    },
    {
        "scene": 0,
        "chapter_label": "1/4 情境導入",
        "camera": {"x": 0, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "里程看板寫著 3240 公尺，讀作三千二百四十，末尾的 0 不用讀喔！",
        "focusTarget": "#n31-mile",
        "bubble": "idea",
        "sfx": "correct",
        "state": "intro_mile",
    },

    # === Scene 1: 2/4 核心概念拆解 — 位值表與讀寫法 (camera.x = 1920) ===
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 280, "y": 880, "pose": "point", "flip": False},
        "subtitle": "四位數有四個位子：千位、百位、十位、個位，從左邊讀到右邊。",
        "focusTarget": "#n31-place",
        "bubble": None,
        "sfx": "pop",
        "state": "concept_places",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 300, "y": 880, "pose": "point", "flip": False},
        "subtitle": "5030：千位 5、百位 0、十位 3、個位 0，讀作五千零三十。",
        "focusTarget": "#n31-place-5030",
        "bubble": "idea",
        "sfx": "correct",
        "state": "concept_5030",
    },
    {
        "scene": 1,
        "chapter_label": "2/4 核心概念拆解",
        "camera": {"x": 1920, "y": 0, "zoom": 1.0},
        "mimi": {"x": 320, "y": 880, "pose": "point", "flip": False},
        "subtitle": "5003 讀作五千零三，5300 讀作五千三百：中間的零只讀一個，末尾的零不讀！",
        "focusTarget": "#n31-read-rule",
        "bubble": "idea",
        "state": "concept_zero_rule",
    },

    # === Scene 2: 3/4 段考陷阱 (camera.x = 3840) ===
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 400, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱一：5980 和 6012 哪個大？有人看到 9 比 0 大就選 5980，錯了！",
        "focusTarget": "#n31-cmp-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "別只看第二位！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_compare_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "比大小要從最高位比起：5 小於 6，所以 6012 比較大！",
        "focusTarget": "#n31-cmp-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "最高位先比 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_compare_correct",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "think", "flip": False, "scale": 0.86},
        "subtitle": "陷阱二：3 個千和 15 個百合起來是多少？有人直接寫 3015，又錯了！",
        "focusTarget": "#n31-compose-wrong",
        "bubble": "question",
        "badge": {"type": "trap", "text": "15 個百不是 15！", "x": 1240, "y": 205},
        "sfx": "trap",
        "state": "trap_compose_wrong",
    },
    {
        "scene": 2,
        "chapter_label": "3/4 易錯陷阱",
        "camera": {"x": 3840, "y": 0, "zoom": 1.0},
        "mimi": {"x": 420, "y": 880, "pose": "point", "flip": False, "scale": 0.86},
        "subtitle": "15 個百就是 1500，3000 加 1500 等於 4500，千位記得進位喔！",
        "focusTarget": "#n31-compose-correct",
        "bubble": None,
        "badge": {"type": "correct", "text": "3000＋1500＝4500 ✓", "x": 1240, "y": 205},
        "sfx": "correct",
        "state": "trap_compose_correct",
    },

    # === Scene 3: 4/4 總結口訣 (camera.x = 5760) ===
    {
        "scene": 3,
        "chapter_label": "4/4 總結口訣與挑戰",
        "camera": {"x": 5760, "y": 0, "zoom": 0.95},
        "mimi": {"x": 280, "y": 880, "pose": "cheer", "flip": False},
        "subtitle": "三大口訣：先認位值、零要占位、比大小從最高位比起！",
        "focusSequence": [
            {"target": "#n31-tip-1", "until": 0.34},
            {"target": "#n31-tip-2", "until": 0.67},
            {"target": "#n31-tip-3", "until": 1.0},
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
        "subtitle": "你已經學會一萬以內的數，快去挑戰 N-3-1 段考真題吧！",
        "focusTarget": "#n31-cta",
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
    el("rect", { x: -300, y: -42, width: 600, height: 84, rx: 18,
      fill: isTrap ? "#FEF2F2" : "#ECFDF5",
      stroke: isTrap ? "#EF4444" : "#10B981", "stroke-width": 3 }, g);
    textEl(txt, { x: 0, y: 12, "text-anchor": "middle",
      "font-size": fontSize || 25, "font-weight": 900,
      fill: isTrap ? "#B91C1C" : "#065F46" }, g);
    return g;
  }

  function buildWorld(root) {
    // =========================================================
    // ZONE 0 — 生活大數：價格標籤 + 里程看板
    // =========================================================
    const z0 = el("g", { id: "zone-0", transform: "translate(0, 0)" }, root);
    header(z0, "生活裡的大數：價格與里程", "#E15B48");

    const price = card(z0, "n31-price", 900, 450, 720, 380, "#E15B48");
    textEl("價格標籤：顯微鏡一台", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#B45309" }, price);
    el("rect", { x: -250, y: -104, width: 500, height: 120, rx: 22,
      fill: "#FFF7ED", stroke: "#E15B48", "stroke-width": 4 }, price);
    textEl("8,060 元", { x: 0, y: -24, "text-anchor": "middle",
      "font-size": 62, "font-weight": 900, fill: "#C2410C" }, price);
    textEl("讀作：八千零六十", { x: 0, y: 58, "text-anchor": "middle",
      "font-size": 28, "font-weight": 900, fill: "#9A3412" }, price);
    el("rect", { x: -300, y: 78, width: 600, height: 70, rx: 16,
      fill: "#FEF3C7", stroke: "#F59E0B", "stroke-width": 3 }, price);
    textEl("中間的 0 只讀一個零，百位空著要占位", { x: 0, y: 122,
      "text-anchor": "middle", "font-size": 23, "font-weight": 900,
      fill: "#92400E" }, price);

    const mile = card(z0, "n31-mile", 1650, 450, 500, 380, "#2563EB");
    textEl("里程看板：今日跑了", { x: 0, y: -146,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#1D4ED8" }, mile);
    el("rect", { x: -200, y: -102, width: 400, height: 112, rx: 20,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 4 }, mile);
    textEl("3,240 m", { x: 0, y: -24, "text-anchor": "middle",
      "font-size": 52, "font-weight": 900, fill: "#1D4ED8" }, mile);
    textEl("讀作：三千二百四十", { x: 0, y: 52, "text-anchor": "middle",
      "font-size": 25, "font-weight": 900, fill: "#1E3A8A" }, mile);
    textEl("末尾的 0 不用讀", { x: 0, y: 116, "text-anchor": "middle",
      "font-size": 22, "font-weight": 900, fill: "#475569" }, mile);

    eqBox(z0, "n31-intro-note", 1220, 800, 880,
      "一萬以內的數最大是 9999",
      "認清每個位子，才知道數字代表多少", "#FEF3C7", "#92400E", 34);

    // =========================================================
    // ZONE 1 — 位值表與讀寫法
    // =========================================================
    const z1 = el("g", { id: "zone-1", transform: "translate(1920, 0)" }, root);
    header(z1, "四位數位值表：千、百、十、個", "#2563EB");

    const place = card(z1, "n31-place", 960, 470, 760, 460, "#2563EB");
    textEl("每一個位子都有一個家", { x: 0, y: -176,
      "text-anchor": "middle", "font-size": 28, "font-weight": 900,
      fill: "#1D4ED8" }, place);
    const names = ["千位", "百位", "十位", "個位"];
    const xs = [-255, -85, 85, 255];
    names.forEach((nm, i) => {
      el("rect", { x: xs[i] - 78, y: -132, width: 156, height: 54, rx: 14,
        fill: "#DBEAFE", stroke: "#2563EB", "stroke-width": 3 }, place);
      textEl(nm, { x: xs[i], y: -96, "text-anchor": "middle",
        "font-size": 25, "font-weight": 900, fill: "#1D4ED8" }, place);
    });
    const digits = el("g", { id: "n31-place-5030" }, place);
    ["5", "0", "3", "0"].forEach((d, i) => {
      el("rect", { x: xs[i] - 78, y: -62, width: 156, height: 100, rx: 18,
        fill: (i === 1) ? "#FEF3C7" : "#FFFFFF",
        stroke: (i === 1) ? "#F59E0B" : "#93C5FD", "stroke-width": (i === 1) ? 4 : 3 }, digits);
      textEl(d, { x: xs[i], y: 10, "text-anchor": "middle",
        "font-size": 56, "font-weight": 900,
        fill: (i === 1) ? "#B45309" : "#1E293B" }, digits);
    });
    el("rect", { x: -300, y: 66, width: 600, height: 60, rx: 16,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, place);
    textEl("5030 → 五千零三十（百位 0 占位）", { x: 0, y: 105,
      "text-anchor": "middle", "font-size": 24, "font-weight": 900,
      fill: "#1D4ED8" }, place);
    textEl("從最高位（千位）開始，往右一位一位讀", { x: 0, y: 170,
      "text-anchor": "middle", "font-size": 21, "font-weight": 800,
      fill: "#475569" }, place);

    const rule = card(z1, "n31-read-rule", 1650, 470, 500, 460, "#7C3AED");
    textEl("讀寫法兩大規則", { x: 0, y: -178,
      "text-anchor": "middle", "font-size": 27, "font-weight": 900,
      fill: "#6D28D9" }, rule);
    const lines = [
      { t: "5003 → 五千零三", c: "#6D28D9" },
      { t: "中間兩個 0", c: "#475569" },
      { t: "只讀一個「零」", c: "#B45309" },
      { t: "5300 → 五千三百", c: "#6D28D9" },
      { t: "末尾的 0", c: "#475569" },
      { t: "完全不用讀", c: "#065F46" },
    ];
    lines.forEach((ln, i) => {
      textEl(ln.t, { x: 0, y: -118 + i * 52, "text-anchor": "middle",
        "font-size": i % 3 === 0 ? 23 : 21, "font-weight": 900, fill: ln.c }, rule);
    });

    // =========================================================
    // ZONE 2 — 段考陷阱：高位比大小 / 合成進位
    // =========================================================
    const z2 = el("g", { id: "zone-2", transform: "translate(3840, 0)" }, root);
    header(z2, "段考陷阱：比大小與合成", "#D97706");

    const cmp = card(z2, "n31-cmp", 1000, 480, 720, 460, "#DC2626");
    textEl("陷阱一：5980 和 6012 哪個大？", { x: 0, y: -178,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#B91C1C" }, cmp);
    el("rect", { x: -300, y: -138, width: 290, height: 82, rx: 16,
      fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": 3 }, cmp);
    textEl("5 9 8 0", { x: -155, y: -84, "text-anchor": "middle",
      "font-size": 38, "font-weight": 900, fill: "#1D4ED8" }, cmp);
    el("rect", { x: 10, y: -138, width: 290, height: 82, rx: 16,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, cmp);
    textEl("6 0 1 2", { x: 155, y: -84, "text-anchor": "middle",
      "font-size": 38, "font-weight": 900, fill: "#065F46" }, cmp);
    verdict(cmp, "n31-cmp-wrong", 10, "只看第二位 9＞0 → 5980 大 ✗", "trap", 24);
    verdict(cmp, "n31-cmp-correct", 116, "最高位 5＜6 → 6012 大 ✓", "correct", 25);
    textEl("口訣：從最高位開始比，第一位分出勝負就停止", { x: 0, y: 196,
      "text-anchor": "middle", "font-size": 20, "font-weight": 800,
      fill: "#1E293B" }, cmp);

    const comp = card(z2, "n31-compose", 1650, 480, 500, 460, "#7C3AED");
    textEl("陷阱二：3 個千 15 個百", { x: 0, y: -178,
      "text-anchor": "middle", "font-size": 26, "font-weight": 900,
      fill: "#6D28D9" }, comp);
    textEl("15 個百 ＝ 1500", { x: 0, y: -124, "text-anchor": "middle",
      "font-size": 26, "font-weight": 900, fill: "#5B21B6" }, comp);
    el("rect", { x: -210, y: -100, width: 420, height: 92, rx: 16,
      fill: "#FEF2F2", stroke: "#EF4444", "stroke-width": 3 }, comp);
    const cw = el("g", { id: "n31-compose-wrong", transform: "translate(0, -68)" }, comp);
    textEl("3000 ＋ 15 ＝ 3015 ✗", { x: 0, y: 0, "text-anchor": "middle",
      "font-size": 24, "font-weight": 900, fill: "#B91C1C" }, cw);
    textEl("✗ 把 15 個百當成 15 了", { x: 0, y: 38, "text-anchor": "middle",
      "font-size": 20, "font-weight": 900, fill: "#B91C1C" }, cw);
    const cc = el("g", { id: "n31-compose-correct", transform: "translate(0, 66)" }, comp);
    el("rect", { x: -210, y: -42, width: 420, height: 84, rx: 18,
      fill: "#ECFDF5", stroke: "#10B981", "stroke-width": 3 }, cc);
    textEl("3000 ＋ 1500 ＝ 4500 ✓", { x: 0, y: -6, "text-anchor": "middle",
      "font-size": 24, "font-weight": 900, fill: "#065F46" }, cc);
    textEl("滿十要向千位進位", { x: 0, y: 26, "text-anchor": "middle",
      "font-size": 20, "font-weight": 900, fill: "#065F46" }, cc);
    textEl("先換算成「個」,再相加", { x: 0, y: 172, "text-anchor": "middle",
      "font-size": 20, "font-weight": 800, fill: "#5B21B6" }, comp);

    // =========================================================
    // ZONE 3 — 三大黃金口訣（垂直分欄）
    // =========================================================
    const z3 = el("g", { id: "zone-3", transform: "translate(5760, 0)" }, root);
    header(z3, "一萬以內的數三大口訣", "#059669");
    const tips = [
      { id: "n31-tip-1", x: 760, title: "① 先認位值", col: "#2563EB",
        lines: ["千、百、十、個", "從高位讀起", "每一位都要看"] },
      { id: "n31-tip-2", x: 1220, title: "② 零要占位", col: "#D97706",
        lines: ["中間 0 只讀一個", "末尾 0 不用讀", "空位一定要寫 0"] },
      { id: "n31-tip-3", x: 1680, title: "③ 高位先比", col: "#059669",
        lines: ["從最高位比起", "合成注意進位", "別被 0 迷惑"] },
    ];
    tips.forEach((tip) => {
      const c = card(z3, tip.id, tip.x, 480, 420, 440, tip.col);
      el("rect", { x: -190, y: -186, width: 380, height: 58, rx: 16,
        fill: tip.col }, c);
      textEl(tip.title, { x: 0, y: -146, "text-anchor": "middle",
        "font-size": 26, "font-weight": 900, fill: "#FFFFFF" }, c);
      tip.lines.forEach((ln, i) => {
        textEl(ln, { x: 0, y: -52 + i * 66, "text-anchor": "middle",
          "font-size": 22, "font-weight": 800, fill: "#1E293B" }, c);
      });
    });
    const cta = el("g", { id: "n31-cta", transform: "translate(1230, 790)" }, z3);
    el("rect", { x: -460, y: -45, width: 920, height: 90, rx: 45,
      fill: "#E15B48", stroke: "#1E293B", "stroke-width": 4,
      filter: "url(#cardShadow)" }, cta);
    textEl("⭐ 大數小達人挑戰開始！快去寫 N-3-1 段考真題！ ⭐", {
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
    out_mp4 = repo_root / "app" / "assets" / "classroom_videos" / "N31_Final.mp4"

    print("=== Rendering G3-N-3-1 Numbers Within 10000 Classroom Video ===")
    stats = render_unit_video(
        repo_root=repo_root,
        unit_meta=UNIT_META,
        cues=CUES,
        plugin_js=PLUGIN_JS,
        out_mp4=out_mp4,
        keyframe_specs=[
            ("01_act1_price", "cue:1:0.55"),
            ("02_act1_mile", "cue:2:0.55"),
            ("03_act2_place", "cue:4:0.55"),
            ("04_act2_zero_rule", "cue:5:0.55"),
            ("05_act3_compare", "cue:7:0.55"),
            ("06_act3_compose", "cue:9:0.55"),
            ("07_act4_summary", "cue:11:0.55"),
        ],
    )
    print("\n=== SUCCESS: N-3-1 Render Complete ===")
    print(json.dumps(stats, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
