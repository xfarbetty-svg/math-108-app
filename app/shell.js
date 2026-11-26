/* ============================================================
 * shell.js — 微核心 Shell（一到六年級主入口邏輯）
 * 架構：微核心 Shell + 單元動態資料
 * SSOT：data/curriculum.json（108 課綱官方 131 條目骨架）+ data/units/G1/N-1-1.json（單元題庫）
 * 禁止在 JS 中內嵌題目副本（鐵律二：零冗餘、單一真相來源）
 * 零外部網路依賴；fetch 本地 JSON 需以本機伺服器開啟 app/
 * ============================================================ */
"use strict";

const state = {
  curriculum: null,   // data/curriculum.json 全量
  unit: null,         // 當前單元 JSON（如 data/units/G1/N-1-1.json）
  grade: 1,
  qIndex: 0,
  visited: new Set(),  // 已實機操作過教具的題目 id
  selectedChoice: null, // 外殼統一選項列：目前選中的 option index
  answerShown: false    // 是否已按「檢查答案」展開回饋
};

const $ = (id) => document.getElementById(id);
const views = ["gradeView", "stageView", "resultView"];

/* ---------- 記住最後位置（解決重頭找單元問題） ---------- */
function saveLastPosition(grade, unitCode = null, qIndex = 0) {
  try {
    const pos = { grade, unitCode, qIndex, time: Date.now() };
    localStorage.setItem("math108_last_pos", JSON.stringify(pos));
  } catch (e) {}
}

function getLastPosition() {
  try {
    const saved = localStorage.getItem("math108_last_pos");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

/* ---------- 學習進度帳本 math108_progress（localStorage 持久化） ---------- */
const PROGRESS_KEY = "math108_progress";
function loadProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (p && typeof p === "object" && p.units && typeof p.units === "object") return p;
  } catch (e) {}
  return { units: {}, last_active_unit: null };
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
}
function unitTotal(code) {
  const g = state.curriculum && state.curriculum.grades.find((x) => x.grade === state.grade);
  const u = g && g.units.find((x) => x.code === code);
  return u ? (u.question_count || 0) : 0;
}
function markActiveUnit(code) {
  const p = loadProgress();
  p.last_active_unit = code;
  if (!p.units[code]) {
    p.units[code] = { done: 0, total: unitTotal(code), passed: false, checked: [] };
  } else {
    p.units[code].total = unitTotal(code) || p.units[code].total;
  }
  saveProgress(p);
}
function markQuestionChecked() {
  const u = state.unit;
  const code = u && (u.code || u.unit_code || u.unit_id);
  const q = u && u.questions && u.questions[state.qIndex];
  if (!code || !q) return;
  const p = loadProgress();
  const rec = p.units[code] || { done: 0, total: unitTotal(code), passed: false, checked: [] };
  if (!Array.isArray(rec.checked)) rec.checked = [];
  const key = String(q.id != null ? q.id : state.qIndex);
  if (rec.checked.indexOf(key) === -1) rec.checked.push(key);
  rec.total = (u.question_count || u.questions.length || rec.total);
  rec.done = rec.checked.length;
  if (rec.done >= rec.total) rec.passed = true;
  p.units[code] = rec;
  p.last_active_unit = code;
  saveProgress(p);
}
function markUnitSubmitted() {
  const u = state.unit;
  const code = u && (u.code || u.unit_code || u.unit_id);
  if (!code) return;
  const p = loadProgress();
  const rec = p.units[code] || { done: 0, total: unitTotal(code), passed: false, checked: [] };
  rec.total = (u.question_count || u.questions.length || rec.total);
  if ((rec.checked || []).length >= rec.total) rec.passed = true;
  p.units[code] = rec;
  p.last_active_unit = code;
  saveProgress(p);
}
function gradeReadyCodes(g) {
  return (g && g.units ? g.units : []).filter((u) => u.status === "ready").map((u) => u.code);
}
function resolveContinueTarget(p) {
  const grades = state.curriculum ? state.curriculum.grades : [];
  const allReady = grades.reduce((acc, g) => acc.concat(gradeReadyCodes(g)), []);
  if (!allReady.length) return null;
  const last = p && p.last_active_unit;
  if (last && allReady.indexOf(last) !== -1) {
    const rec = p.units[last];
    if (!(rec && rec.passed)) return last;
    // 同年级下一个未完成单元 → 再跨年级往下找
    const gi = grades.findIndex((g) => gradeReadyCodes(g).indexOf(last) !== -1);
    const same = gi >= 0 ? gradeReadyCodes(grades[gi]) : [];
    const idx = same.indexOf(last);
    for (let i = idx + 1; i < same.length; i++) {
      const rec2 = p.units[same[i]];
      if (!(rec2 && rec2.passed)) return same[i];
    }
    for (let g = gi + 1; g < grades.length; g++) {
      for (const code of gradeReadyCodes(grades[g])) {
        const rec3 = p.units[code];
        if (!(rec3 && rec3.passed)) return code;
      }
    }
    return last; // 全數完成 → 回最後單元複習
  }
  // 全新訪客：先認 N-1-1，其次 N-3-1
  if (allReady.indexOf("N-1-1") !== -1) return "N-1-1";
  if (allReady.indexOf("N-3-1") !== -1) return "N-3-1";
  return allReady[0];
}
function renderContinueBanner() {
  const p = loadProgress();
  const isFresh = !p.last_active_unit;
  // 首次訪客：入口改為「目前所選年級的第一個開放單元」，不再寫死 N-1-1 / N-3-1
  const currentGrade = state.curriculum.grades.find((x) => x.grade === state.grade);
  const firstOfGrade = currentGrade ? gradeReadyCodes(currentGrade)[0] : null;
  const code = (isFresh && firstOfGrade) ? firstOfGrade : resolveContinueTarget(p);
  if (!code) return "";
  const g = state.curriculum.grades.find((x) => gradeReadyCodes(x).indexOf(code) !== -1);
  const meta = g && g.units.find((u) => u.code === code);
  const rec = p.units[code];
  const doneUnits = gradeReadyCodes(g).filter((c) => p.units[c] && p.units[c].passed).length;
  const totalUnits = gradeReadyCodes(g).length;
  const title = isFresh
    ? `從第一單元開始挑戰：${code} ${meta ? meta.title : ""}`
    : `繼續上次進度：${code} ${meta ? meta.title : ""}（已完成 ${doneUnits}/${totalUnits} 單元）`;
  const sub = isFresh
    ? "點一下直接進入，往後可從進度徽章接續"
    : (rec && rec.done > 0 ? `本單元已作答 ${rec.done}/${rec.total} 題` : "尚未作答，點一下立即開始");
  return `<button class="continue-banner" id="btnContinue" data-code="${code}">
    <span class="cb-icon">▶</span>
    <span class="cb-text">${title}<span class="cb-sub">${sub}</span></span>
  </button>`;
}

/* ---------- 視圖切換 ---------- */
function showView(name) {
  views.forEach((v) => { $(v).style.display = (v === name) ? "block" : "none"; });
  const draftBtn = $("btnOpenScratchpad");
  if (draftBtn) draftBtn.style.display = (name === "stageView") ? "inline-flex" : "none";
  const nav = $("gradeNav");
  if (nav) nav.style.display = (name === "gradeView") ? "flex" : "none";
  window.scrollTo({ top: 0 });
}

/* ---------- 頂部年級導航 ---------- */
function renderNav() {
  const nav = $("gradeNav");
  nav.innerHTML = "";
  state.curriculum.grades.forEach((g) => {
    const b = document.createElement("button");
    b.className = "grade-btn" + (g.grade === state.grade ? " active" : "");
    b.textContent = g.name;
    b.setAttribute("aria-label", g.label);
    b.addEventListener("click", () => {
      state.grade = g.grade;
      saveLastPosition(state.grade, null, 0);
      renderNav();
      renderGrade();
    });
    nav.appendChild(b);
  });
}

/* ---------- 年級視圖（一到六年級統一：官方 131 條目單元卡片流） ---------- */
const UPCOMING_HINT = "教具與真題建置中 — 將以「教具先行 + 嚴格真題 + 人類盲審驗真」流程開放，敬請期待。";

function renderGrade() {
  showView("gradeView");
  const g = state.curriculum.grades.find((x) => x.grade === state.grade);
  const readyCount = g.units.filter((u) => u.status === "ready").length;
  const view = $("gradeView");

  const cards = g.units.map((u) => {
    const ready = u.status === "ready";
    let codeLabel = u.code;
    if (g.grade === 3 && (u.code === "N-3-13" || u.code === "S-3-1")) {
      codeLabel = `${u.code} · 同義整合`;
    }
    const p = loadProgress();
    const rec = ready ? p.units[u.code] : null;
    let badge = `<span class="badge-ready">開始挑戰 ▶</span>`;
    if (rec && rec.passed) {
      badge = `<span class="badge-progress done">✅ 已完成</span>`;
    } else if (rec && rec.done > 0) {
      badge = `<span class="badge-progress doing">🔥 進行中 (${rec.done}/${rec.total})</span>`;
    }
    return `
      <button class="unit-card ${ready ? "ready" : "locked"}" ${ready ? "" : "disabled"} data-code="${u.code}">
        <span class="code">${codeLabel}</span>
        <h3>${u.title}</h3>
        <p class="desc">${u.full_text}</p>
        <span class="hint">${ready ? (u.question_count + " 題真題 · 具象教具互動 · 已驗真") : UPCOMING_HINT}</span>
        ${ready ? `${badge}<span class="start-arrow">→</span>` : `<span class="badge-upcoming">即將開放</span>`}
      </button>`;
  }).join("");

  view.innerHTML = `
    <div class="grade-hero">
      <div class="hero-card">
        <span class="stage-tag">108 課綱官方條目</span>
        <h2>${g.name} · 共 ${g.units.length} 大條目</h2>
        <p>已開放 ${readyCount}/${g.units.length} · 真題全部來自實體段考試卷，人類三端盲審通過才開放</p>
      </div>
    </div>
    ${renderContinueBanner()}
    <div class="unit-list">${cards}</div>`;

  view.querySelectorAll(".unit-card.ready").forEach((card) => {
    card.addEventListener("click", () => openUnit(card.dataset.code));
  });
  const btnContinue = $("btnContinue");
  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      const code = btnContinue.dataset.code;
      if (!code) return;
      const g2 = state.curriculum.grades.find((x) => gradeReadyCodes(x).indexOf(code) !== -1);
      if (!g2 || g2.grade !== state.grade) {
        state.grade = g2 ? g2.grade : state.grade;
        renderNav();
      }
      const pos = getLastPosition();
      const q = pos && pos.unitCode === code ? (pos.qIndex || 0) : 0;
      openUnit(code, q);
    });
  }
}

/* ---------- 概念探索小教室獨立直達通道 ---------- */
function openConceptLab(code) {
  const comp = CONCEPT_COMPONENTS[code];
  if (!comp) return;
  const g = state.curriculum.grades.find((x) => x.grade === state.grade) || { grade: 2 };
  const unitMeta = g.units ? g.units.find((u) => u.code === code) : null;
  state.unitCode = code;
  state.unit = {
    code: code,
    title: unitMeta ? unitMeta.title : code,
    grade: g.grade,
    question_count: 0,
    verified_source: "概念探索小教室先行版",
    questions: []
  };
  showView("stageView");
  $("progressNum").textContent = "🌱 概念探索";
  $("progressSource").textContent = unitMeta ? `${unitMeta.code} · ${unitMeta.title}` : code;
  const tabs = $("unitModeTabs");
  if (tabs) tabs.style.display = "none";
  const conceptWrap = $("unitConceptWrap");
  const examWrap = $("unitExamWrap");
  if (conceptWrap) conceptWrap.style.display = "block";
  if (examWrap) examWrap.style.display = "none";
  const frame = $("conceptFrame");
  if (frame) frame.src = comp;
  const btnMovie = $("btnConceptMovie");
  if (btnMovie) {
    const movieUrl = UNIT_CONCEPT_MOVIES[code];
    if (movieUrl) {
      btnMovie.href = movieUrl;
      btnMovie.title = UNIT_CONCEPT_MOVIE_TITLES[code] || "概念小教室微電影";
      btnMovie.style.display = "inline-flex";
    } else {
      btnMovie.style.display = "none";
    }
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 載入單元資料（SSOT：不內嵌題目副本） ---------- */
async function openUnit(code, initialQIndex = 0) {
  const g = state.curriculum.grades.find((x) => x.grade === state.grade);
  const unitMeta = g.units.find((u) => u.code === code);
  if (!unitMeta || unitMeta.status !== "ready") return;
  const url = "../data/units/G" + g.grade + "/" + code + ".json";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.unit = await res.json();
    if (!state.unit.code) state.unit.code = code;
  } catch (err) {
    showDegraded("<!-- DEGRADED:單元題庫載入失敗（" + url + "）→ " + err.message + "。請以本機伺服器開啟：python -m http.server 8000 -->");
    return;
  }
  const maxIdx = state.unit.questions ? state.unit.questions.length - 1 : 0;
  state.qIndex = (initialQIndex >= 0 && initialQIndex <= maxIdx) ? initialQIndex : 0;
  state.visited.clear();
  saveLastPosition(state.grade, code, state.qIndex);
  markActiveUnit(code);
  renderStage();
}

/* ---------- 單元內建模式切換（概念小教室 vs 真題測驗） ---------- */
const UNIT_CONCEPT_MOVIES = {
  "N-2-1": "assets/video/g2_n21_concept_final.mp4",
  "N-2-2": "assets/video/g2_n22_concept_final.mp4",
  "N-3-1": "assets/classroom_videos/N31_Final.mp4",
  "N-3-2": "assets/classroom_videos/N32_Final.mp4",
  "N-3-3": "assets/classroom_videos/N33_Final.mp4",
  "N-3-4": "assets/classroom_videos/N34_Final.mp4",
  "N-3-5": "assets/classroom_videos/N35_Final.mp4",
  "N-3-6": "assets/classroom_videos/N36_Final.mp4",
  "N-3-7": "assets/classroom_videos/N37_Final.mp4",
  "N-3-8": "assets/classroom_videos/N38_Final.mp4",
  "N-3-9": "assets/video/g3_n39_concept_final.mp4",
  "N-3-10": "assets/classroom_videos/N310_Final.mp4",
  "N-3-11": "assets/classroom_videos/N311_Final.mp4",
  "N-3-12": "assets/classroom_videos/N312_Final.mp4",
  "N-3-13": "assets/classroom_videos/N313_Final.mp4",
  "N-3-14": "assets/classroom_videos/N314_Final.mp4",
  "N-3-15": "assets/classroom_videos/N315_Final.mp4",
  "N-3-16": "assets/classroom_videos/N316_Final.mp4",
  "N-3-17": "assets/classroom_videos/N317_Final.mp4",
  "S-3-1": "assets/classroom_videos/N313_Final.mp4",
  "S-3-2": "assets/classroom_videos/S32_Final.mp4",
  "S-3-3": "assets/classroom_videos/S33_Final.mp4",
  "S-3-4": "assets/classroom_videos/S34_Final.mp4",
  "R-3-1": "assets/classroom_videos/R31_Final.mp4",
  "R-3-2": "assets/classroom_videos/R32_Final.mp4",
  "D-3-1": "assets/classroom_videos/D31_Final.mp4"
};

const UNIT_CONCEPT_MOVIE_TITLES = {
  "N-3-1": "概念小教室：一萬以內的數",
  "N-3-2": "概念小教室：加減直式計算",
  "N-3-3": "概念小教室：乘以一位數",
  "N-3-6": "概念小教室：乘除應用解題",
  "N-3-7": "概念小教室：兩步驟應用問題",
  "N-3-8": "概念小教室：四則估算",
  "N-3-10": "概念小教室：一位小數加減與對齊",
  "N-3-11": "概念小教室：整數數線",
  "N-3-12": "概念小教室：長度（毫米）",
  "N-3-13": "概念小教室：角的認識",
  "N-3-14": "概念小教室：面積（平方公分）",
  "N-3-15": "概念小教室：容量（公升、毫升）",
  "N-3-16": "概念小教室：重量（公斤、公克）",
  "N-3-17": "概念小教室：時間（日、時、分、秒）",
  "S-3-1": "概念小教室：角的認識",
  "S-3-2": "概念小教室：正方形和長方形",
  "S-3-3": "概念小教室：圓（圓心、半徑與直徑）",
  "S-3-4": "概念小教室：幾何形體之操作",
  "R-3-1": "概念小教室：乘法與除法的關係",
  "R-3-2": "概念小教室：數量模式與推理（I）",
  "D-3-1": "概念小教室：一維表格與二維表格"
};

const CONCEPT_COMPONENTS = {



















  "N-2-1": "components/g2_place_value_1000_lab.html",
  "N-2-2": "components/g2_vertical_addition_subtraction_lab.html",
  "N-2-3": "components/g2_addition_subtraction_word_lab.html",
  "N-2-4": "components/g2_estimation_lab.html",
  "N-2-5": "components/g2_money_change_lab.html",
  "N-2-6": "components/g2_multiplication_intro_lab.html",
  "N-2-7": "components/g2_multiplication_table_lab.html",
  "N-2-8": "components/g2_two_step_math_lab.html",
  "N-2-9": "components/g2_division_intro_lab.html",
  "N-2-10": "components/g2_fraction_unit_lab.html",
  "N-2-11": "components/g2_meter_length_lab.html",
  "N-2-12": "components/g2_measure_compare_lab.html",
  "N-2-13": "components/g2_clock_time_lab.html",
  "N-2-14": "components/g2_calendar_lab.html",
  "S-2-1": "components/g2_solid_features_lab.html",
  "S-2-2": "components/g2_shapes_lab.html",
  "S-2-3": "components/g2_ruler_drawing_lab.html",
  "S-2-4": "components/g2_perimeter_lab.html",
  "S-2-5": "components/g2_area_square_lab.html",
  "R-2-1": "components/g2_transitive_law_lab.html",
  "R-2-2": "components/g2_addition_commutative_lab.html",
  "R-2-3": "components/g2_multiplication_commutative_lab.html",
  "R-2-4": "components/g2_addition_subtraction_relation_lab.html",
  "D-2-1": "components/g2_data_classify_lab.html",
  "N-3-1": "components/number_10000_concept_lab.html",
  "N-3-2": "components/vertical_calc_concept_lab.html",
  "N-3-3": "components/multiplication_concept_lab.html",
  "N-3-4": "components/division_concept_lab.html",
  "N-3-5": "components/division_vertical_concept_lab.html",
  "N-3-6": "components/mult_div_relation_concept_lab.html",
  "N-3-7": "components/two_step_concept_lab.html",
  "N-3-8": "components/estimation_concept_lab.html",
  "N-3-9": "components/fraction_concept_lab.html",
  "N-3-10": "components/decimal_concept_lab.html",
  "N-3-11": "components/number_line_concept_lab.html",
  "N-3-12": "components/millimeter_concept_lab.html",
  "N-3-13": "components/angle_concept_lab.html",
  "S-3-1": "components/angle_concept_lab.html",
  "N-3-14": "components/area_concept_lab.html",
  "N-3-15": "components/capacity_concept_lab.html",
  "S-3-3": "components/circle_concept_lab.html",
  "N-3-16": "components/weight_concept_lab.html",
  "N-3-17": "components/time_concept_lab.html",
  "N-4-3": "components/two_step_expr_g4_lab.html?mode=concept",
  "N-4-4": "components/two_step_adv_g4_lab.html?mode=concept",
  "N-4-5": "components/fraction_mixed_g4_lab.html?mode=concept",
  "N-4-6": "components/equiv_fraction_g4_lab.html?mode=concept",
  "S-3-2": "components/square_rectangle_lab.html",
  "S-3-4": "components/solid_geometry_lab.html",
  "R-3-1": "components/multiplication_division_lab.html",
  "R-3-2": "components/pattern_reasoning_lab.html",
  "D-3-1": "components/table_cross_lab.html",
  "N-4-2": "components/mul_div_g4_lab.html",
  "N-4-10": "components/protractor_angle_g4_lab.html?mode=concept",
  "N-4-9": "components/length_km_g4_lab.html?mode=concept",
  "S-4-5": "components/perp_parallel_g4_lab.html?mode=concept",
  "R-4-2": "components/calc_laws_g4_lab.html?mode=concept",
  "N-4-12": "components/volume_cubes_g4_lab.html?mode=concept",
  "R-4-4": "components/pattern_logic_g4_lab.html?mode=concept",
  "N-4-11": "components/area_perimeter_g4_lab.html?mode=concept",
  "S-4-6": "components/congruent_shapes_g4_lab.html?mode=concept",
  "D-4-1": "components/charts_g4_lab.html?mode=concept",
  "N-4-13": "components/time_calc_g4_lab.html?mode=concept",
  "S-4-2": "components/rotation_angle_g4_lab.html?mode=concept",
  "S-4-7": "components/triangle_class_g4_lab.html?mode=concept",
  "N-4-7": "components/decimal_hundredth_g4_lab.html?mode=concept",
  "S-4-8": "components/quadrilateral_g4_lab.html?mode=concept",
  "N-4-8": "components/number_line_g4_lab.html?mode=concept",
  "S-4-3": "components/rect_area_perimeter_g4_lab.html?mode=concept",
  "S-4-1": "components/angle_degree_g4_lab.html?mode=concept",
  "R-4-3": "components/formula_g4_lab.html?mode=concept",
  "S-4-4": "components/volume_s44_g4_lab.html?mode=concept",
  "R-4-1": "components/two_step_combine_g4_lab.html?mode=concept"
};

let currentUnitMode = "exam"; // "concept" | "exam"

function setUnitMode(mode) {
  currentUnitMode = mode;
  const tabs = $("unitModeTabs");
  const conceptWrap = $("unitConceptWrap");
  const examWrap = $("unitExamWrap");
  const btnConcept = $("btnModeConcept");
  const btnExam = $("btnModeExam");

  if (mode === "concept") {
    if (btnConcept) btnConcept.classList.add("active");
    if (btnExam) btnExam.classList.remove("active");
    if (conceptWrap) conceptWrap.style.display = "block";
    if (examWrap) examWrap.style.display = "none";
    stopSpeech();
    const btnSpeak = $("btnSpeak");
    if (btnSpeak) btnSpeak.style.display = "";
    const frame = $("conceptFrame");
    const code = state.unit ? (state.unit.code || state.unit.curriculum_code) : null;
    if (frame && code && CONCEPT_COMPONENTS[code]) {
      if (!frame.src || !frame.src.includes(CONCEPT_COMPONENTS[code])) {
        frame.src = CONCEPT_COMPONENTS[code];
      }
    }
    $("progressNum").textContent = "";
    $("progressSource").textContent = "";
    $("dots").style.display = "none";
    $("stageTitle").style.display = "none";
    $("shellQuestion").style.display = "none";
    $("shellFeedback").hidden = true;
  } else {
    if (btnExam) btnExam.classList.add("active");
    if (btnConcept) btnConcept.classList.remove("active");
    if (conceptWrap) conceptWrap.style.display = "none";
    if (examWrap) examWrap.style.display = "block";
    const btnSpeak = $("btnSpeak");
    if (btnSpeak) btnSpeak.style.display = "";
    $("dots").style.display = "flex";
    $("stageTitle").style.display = "block";
    renderQuestion();
  }
}

window.switchToExamMode = () => setUnitMode("exam");

/* ---------- 測驗舞台 ---------- */
let heightTimer = null;

function renderStage() {
  showView("stageView");
  const code = state.unit ? (state.unit.code || state.unit.curriculum_code) : null;
  const tabs = $("unitModeTabs");
  const btnConcept = $("btnModeConcept");
  const btnExam = $("btnModeExam");

  if (code && CONCEPT_COMPONENTS[code]) {
    tabs.style.display = "flex";
    btnConcept.onclick = () => setUnitMode("concept");
    btnExam.onclick = () => setUnitMode("exam");
    // N-4-2、N-4-10 預設進入「🌱 概念探索」，其餘單元維持既有預設
    const DEFAULT_CONCEPT_CODES = new Set(["N-4-2", "N-4-10", "N-4-9", "S-4-5", "N-4-5", "R-4-2", "N-4-12", "R-4-4", "N-4-11", "S-4-6", "D-4-1", "N-4-13", "N-4-6", "S-4-2", "S-4-7", "N-4-7", "S-4-8", "N-4-8", "S-4-3", "S-4-1", "R-4-3", "S-4-4", "R-4-1"]);
    setUnitMode(DEFAULT_CONCEPT_CODES.has(code) ? "concept" : "exam");
  } else {
    tabs.style.display = "none";
    $("unitConceptWrap").style.display = "none";
    $("unitExamWrap").style.display = "block";
    $("dots").style.display = "flex";
    $("stageTitle").style.display = "block";
    renderQuestion();
  }
}

function renderQuestion() {
  const q = state.unit.questions[state.qIndex];
  state.visited.add(q.id);
  renderShellQuestion(q);

  // 頂部進度與真實試卷來源
  $("progressNum").textContent = "第 " + (state.qIndex + 1) + " / " + (state.unit.question_count || state.unit.questions.length) + " 題";
  $("progressSource").textContent = q.exam_source + " · " + q.section + " · 第 " + q.question_num + " 題";
  $("stageTitle").textContent = q.title;

  // 微電影導流
  const btnMovie = $("btnConceptMovie");
  if (btnMovie) {
    const curCode = state.unit ? (state.unit.code || state.unit.curriculum_code) : null;
    const movieUrl = UNIT_CONCEPT_MOVIES[curCode];
    if (movieUrl) {
      btnMovie.href = movieUrl;
      btnMovie.title = UNIT_CONCEPT_MOVIE_TITLES[curCode] || "概念小教室微電影";
      btnMovie.style.display = "inline-flex";
    } else {
      btnMovie.style.display = "none";
    }
  }

  // Shorts 影片解題導流
  const btnVideo = $("btnShortsVideo");
  if (btnVideo) {
    if (q.video_url) {
      btnVideo.href = q.video_url;
      btnVideo.style.display = "inline-flex";
    } else {
      btnVideo.style.display = "none";
    }
  }

  // 進度圓點
  $("dots").innerHTML = state.unit.questions.map((_, i) =>
    `<span class="dot ${i === state.qIndex ? "on" : state.visited.has(state.unit.questions[i].id) ? "done" : ""}"></span>`).join("");

  // 導航按鈕狀態
  $("btnPrev").disabled = state.qIndex === 0;
  $("btnNext").disabled = state.qIndex === state.unit.questions.length - 1;

  // 嵌入具象教具（無邊框 iframe，三端緊湊自適應高度）
  const frame = $("stageFrame");
  clearInterval(heightTimer);
  const isNarrow = window.innerWidth < 700;
  frame.style.height = (q.fallback_height || (isNarrow ? 440 : 480)) + "px"; // 緊湊 fallback 防跳動與虛空空白
  // N-3-17 時鐘教具需知道目前題號，才能撥到對應時刻／演出對應經過時間（其餘 130 單元不受影響）
  const rawSrc = q.component_path || q.component || '';
  const isClockLab = rawSrc.indexOf('time_concept_lab.html') !== -1;
  frame.src = isClockLab
    ? (rawSrc + (rawSrc.indexOf('?') === -1 ? '?' : '&') + 'q=' + (state.qIndex + 1))
    : rawSrc;
  frame.onload = () => { fitFrame(frame, q); hideIframeChoiceRows(frame); };
  // 同源可讀時持續自適應高度；file:// 跨檔受限時保持緊湊高度
  // 約 2.5 秒（6 次）穩定高度後自動停止輪詢，消滅無窮重排抖動
  let fitTicks = 0;
  heightTimer = setInterval(() => {
    fitFrame(frame, q);
    fitTicks += 1;
    if (fitTicks >= 6) clearInterval(heightTimer);
  }, 600);
}

function fitFrame(frame, q) {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const container = doc.querySelector('#app') || doc.querySelector('.container') || doc.body;
    if (!container) return;
    const h = Math.ceil(container.getBoundingClientRect().height || container.scrollHeight);
    if (h > 100) {
      const curH = parseInt(frame.style.height, 10) || 0;
      if (Math.abs(curH - h) > 4) frame.style.height = (h + 8) + "px";
    }
  } catch (_e) {
    /* file:// 同源限制 → 保持 fallback */
  }
}

/* ---------- 外殼統一選項列：題幹、A/B/C/D、作答回饋（SSOT 直接讀題庫） ---------- */
function renderShellQuestion(q) {
  const stemEl = $("shellStem");
  const optEl = $("shellOptions");
  const fbEl = $("shellFeedback");
  const wrapEl = $("shellQuestion");
  const choices = Array.isArray(q.choices) ? q.choices : [];

  state.selectedChoice = null;
  state.answerShown = false;
  fbEl.hidden = true;
  fbEl.textContent = "";
  optEl.classList.remove("answered");
  optEl.textContent = "";
  stemEl.textContent = q.stem || q.title || "";
  wrapEl.style.display = choices.length ? "block" : "none";

  choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shell-opt";
    btn.dataset.index = String(i);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    const key = document.createElement("span");
    key.className = "k";
    key.textContent = String.fromCharCode(65 + i);
    const label = document.createElement("span");
    label.className = "t";
    label.textContent = String(text);
    btn.append(key, label);
    optEl.appendChild(btn);
  });
}

function selectShellChoice(index) {
  const optEl = $("shellOptions");
  const buttons = Array.prototype.slice.call(optEl.querySelectorAll(".shell-opt"));
  if (!buttons[index]) return;
  state.selectedChoice = index;
  buttons.forEach((b, i) => {
    const on = i === index;
    b.classList.toggle("selected", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
}

function checkShellAnswer() {
  const q = state.unit && state.unit.questions && state.unit.questions[state.qIndex];
  if (!q) return;
  const fbEl = $("shellFeedback");
  const optEl = $("shellOptions");
  const buttons = Array.prototype.slice.call(optEl.querySelectorAll(".shell-opt"));

  if (state.selectedChoice === null) {
    fbEl.hidden = false;
    fbEl.textContent = "👆 請先選擇一個選項，再按「✔ 檢查答案」。";
    return;
  }

  state.answerShown = true;
  const ai = q.answer_index;
  const hasKey = Number.isInteger(ai) && ai >= 0 && ai < buttons.length;
  const isCorrect = hasKey && state.selectedChoice === ai;
  buttons.forEach((b) => b.classList.remove("selected", "correct", "wrong"));
  buttons.forEach((b) => b.setAttribute("aria-checked", "false"));
  if (hasKey) buttons[ai].classList.add("correct");
  if ((!hasKey || !isCorrect) && buttons[state.selectedChoice]) buttons[state.selectedChoice].classList.add("wrong");
  optEl.classList.add("answered");

  fbEl.textContent = "";
  const head = document.createElement("div");
  head.className = "sf-head " + (hasKey ? (isCorrect ? "ok" : "bad") : "bad");
  head.textContent = !hasKey
    ? "⚠️ 本題題庫未提供正解索引，已略過判定"
    : (isCorrect ? "✅ 答對了！" : "❌ 答錯了，正確答案是 " + String.fromCharCode(65 + ai));
  fbEl.appendChild(head);

  const addText = (label, text) => {
    const l = document.createElement("div");
    l.className = "sf-label";
    l.textContent = label;
    fbEl.appendChild(l);
    const v = document.createElement("div");
    v.className = "sf-trap";
    v.textContent = (text === undefined || text === null || String(text).trim() === "") ? "（本題題庫未提供）" : String(text);
    fbEl.appendChild(v);
  };
  const ex = q.explanation;
  if (typeof ex === "string") {
    addText("🧠 核心概念", ex);
  } else if (ex && typeof ex === "object") {
    addText("🧠 核心概念", ex.concept);
    if (Array.isArray(ex.steps) && ex.steps.length) {
      const l = document.createElement("div");
      l.className = "sf-label";
      l.textContent = "📝 解題步驟";
      fbEl.appendChild(l);
      const ol = document.createElement("ol");
      ex.steps.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = String(s);
        ol.appendChild(li);
      });
      fbEl.appendChild(ol);
    }
    addText("⚠️ 常見陷阱", ex.trap);
  } else {
    addText("🧠 詳解", "（本題題庫未提供詳解）");
  }
  fbEl.hidden = false;
}

/* 教具 iframe 內若另有舊選項列（G3 共 18 檔），考試模式統一由外殼渲染，避免兩組選項 */
function hideIframeChoiceRows(frame) {
  if (state.grade !== 3) return; // G1/G2 教具的選項屬操作活動，維持原樣（外科手術）
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.head || doc.getElementById("shell-hide-choice-rows")) return;
    const style = doc.createElement("style");
    style.id = "shell-hide-choice-rows";
    style.textContent = ".options-grid,.opt-grid,#quest-options,.options,.option-btn,.opt-btn,.choice-btn{display:none!important}";
    doc.head.appendChild(style);
  } catch (_e) {
    /* file:// 跨檔同源限制 → 維持教具原件，不影響外殼選項 */
  }
}

/* ---------- 交卷結算 ---------- */
function renderResult() {
  clearInterval(heightTimer);
  showView("resultView");
  const u = state.unit;
  const items = u.questions.map((q) => `
    <div class="result-item">
      <div class="rtitle">${q.title}<span class="rsrc">${q.exam_source} · ${q.section} ${q.question_num}</span></div>
      <div class="rlabel">✅ 正解</div>
      <div class="rexp">${q.answer_raw}</div>
      <div class="rlabel">🧠 算理解析</div>
      <div class="rexp">${typeof q.explanation === "string" ? q.explanation : [q.explanation.concept].concat(q.explanation.steps).join("；")}</div>
      ${q.video_url ? `
        <div class="rvideo" style="margin: 10px 0 6px 0;">
          <a href="${q.video_url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg, #ef4444, #dc2626);color:#ffffff;text-decoration:none;padding:7px 15px;border-radius:8px;font-size:12.5px;font-weight:bold;box-shadow:0 2px 8px rgba(239,68,68,0.35);transition:transform 0.15s ease;">
            📺 觀看 Shorts 解題影片
          </a>
        </div>
      ` : ''}
      <div class="rdemo">${state.visited.has(q.id) ? "🖐 已實機操作教具：" : "— 未操作教具："}${q.component_path || q.component}</div>
    </div>`).join("");

  $("resultView").innerHTML = `
    <div class="result-card">
      <h2>🎉 交卷結算</h2>
      <div class="rsub">${u.unit_code || u.unit_id} ${u.unit_name} · ${u.exam_source_full || u.source_paper}</div>
      ${items}
      <p class="rdemo" style="margin-top:10px">※ 計分由各教具內部即時回饋（答對/再試一次），本結算頁僅列正解與算理，不虛造總分。</p>
    </div>
    <div class="result-actions">
      <button class="btn-prev" id="btnReview">回試卷重看</button>
      <button class="btn-next" id="btnHome">回單元列表</button>
    </div>`;

  $("btnReview").addEventListener("click", () => renderStage());
  $("btnHome").addEventListener("click", () => renderGrade());
}

/* ---------- 降級提示（禁靜默吞錯） ---------- */
function showDegraded(markup) {
  const note = $("offlineNote");
  note.innerHTML = "⚠️ " + markup;
  note.style.display = "block";
  console.warn(markup);
}

/* ---------- 臺灣腔 TTS 語音朗讀（全站音訊單例 AudioManager 統一發聲） ---------- */
/* 監聽教具 iframe 的 postMessage：{ type: 'TTS_SPEAK', text } / { type: 'TTS_STOP' } */
window.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "TTS_SPEAK" && event.data.text) {
    if (window.AudioManager) {
      window.AudioManager.play(event.data.text);
    }
  } else if (event.data.type === "TTS_STOP") {
    if (window.AudioManager) {
      window.AudioManager.stop();
    }
  }
});

function stopCurrentSpeech() {
  if (window.AudioManager) {
    window.AudioManager.stop();
  }
  updateSpeakBtn(false);
}

function speakCurrentProblem() {
  // 正在朗讀中 → 點擊即停止（切換行為）
  if (window.AudioManager && window.AudioManager.isPlaying()) {
    stopCurrentSpeech();
    return;
  }

  let rawText = "";
  if (currentUnitMode === "concept") {
    const f = $("conceptFrame");
    let desc = "";
    try {
      const card = f && f.contentDocument && f.contentDocument.querySelector(".act-card:not([hidden])");
      if (card) {
        const t = card.querySelector(".card-title");
        const d = card.querySelector(".card-desc");
        desc = [t && t.textContent, d && d.textContent].filter(Boolean).join("。");
      }
    } catch (_) {}
    rawText = desc || (state.unit ? (state.unit.title + "，概念探索活動。") : "概念探索活動。");
  } else {
    const q = state.unit ? state.unit.questions[state.qIndex] : null;
    if (!q) return;
    rawText = (q.stem || q.title || "") + "。" + (q.subtitle || "");
  }
  if (window.AudioManager) {
    updateSpeakBtn(true);
    window.AudioManager.play(rawText, {
      onStart: () => updateSpeakBtn(true),
      onEnd: () => updateSpeakBtn(false),
      onError: () => updateSpeakBtn(false)
    });
  } else {
    console.warn("[DEGRADED] AudioManager 未載入，語音朗讀不可用");
    updateSpeakBtn(false);
  }
}

function updateSpeakBtn(active) {
  const btn = $("btnSpeak");
  if (!btn) return;
  if (active) {
    btn.classList.add("speaking");
    btn.innerHTML = "⏹ 停止朗讀";
  } else {
    btn.classList.remove("speaking");
    btn.innerHTML = "🔊 聽題目";
  }
}

function stopSpeech() {
  stopCurrentSpeech();
}

/* ---------- 手機手寫計算草稿板（028 Scratchpad Canvas 移植） ---------- */
let spCanvas = null;
let spCtx = null;
let spIsDrawing = false;
let spColor = "#fbbf24";
let spSize = 5;
let spTool = "pen";
let spLastX = 0;
let spLastY = 0;

function initScratchpad() {
  spCanvas = $("spCanvas");
  if (!spCanvas) return;
  spCtx = spCanvas.getContext("2d");

  const onDown = (e) => {
    spIsDrawing = true;
    const rect = spCanvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dpr = window.devicePixelRatio || 1;
    spLastX = (clientX - rect.left) * dpr;
    spLastY = (clientY - rect.top) * dpr;
  };

  const onMove = (e) => {
    if (!spIsDrawing || !spCtx) return;
    const rect = spCanvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const dpr = window.devicePixelRatio || 1;
    const curX = (clientX - rect.left) * dpr;
    const curY = (clientY - rect.top) * dpr;

    spCtx.beginPath();
    spCtx.moveTo(spLastX, spLastY);
    spCtx.lineTo(curX, curY);
    spCtx.strokeStyle = (spTool === "eraser") ? "#0b1120" : spColor;
    spCtx.lineWidth = ((spTool === "eraser") ? spSize * 4 : spSize) * dpr;
    spCtx.lineCap = "round";
    spCtx.lineJoin = "round";
    spCtx.stroke();

    spLastX = curX;
    spLastY = curY;
  };

  const onUp = () => { spIsDrawing = false; };

  if (window.PointerEvent) {
    spCanvas.addEventListener("pointerdown", (e) => { e.preventDefault(); onDown(e); }, { passive: false });
    spCanvas.addEventListener("pointermove", (e) => { e.preventDefault(); onMove(e); }, { passive: false });
    spCanvas.addEventListener("pointerup", onUp);
    spCanvas.addEventListener("pointercancel", onUp);
  } else {
    spCanvas.addEventListener("touchstart", (e) => { e.preventDefault(); onDown(e); }, { passive: false });
    spCanvas.addEventListener("touchmove", (e) => { e.preventDefault(); onMove(e); }, { passive: false });
    spCanvas.addEventListener("touchend", onUp);
  }

  // 工具列綁定
  $("btnOpenScratchpad").addEventListener("click", openScratchpad);
  $("btnCloseScratchpad").addEventListener("click", closeScratchpad);
  $("spToolPen").addEventListener("click", () => setSpColor("#fbbf24", "pen", $("spToolPen")));
  $("spToolPink").addEventListener("click", () => setSpColor("#f472b6", "pen", $("spToolPink")));
  $("spToolCyan").addEventListener("click", () => setSpColor("#38bdf8", "pen", $("spToolCyan")));
  $("spToolEraser").addEventListener("click", () => setSpColor(null, "eraser", $("spToolEraser")));
  $("spToolClear").addEventListener("click", clearScratchpad);
}

function openScratchpad() {
  const modal = $("scratchpadModal");
  modal.classList.add("active");
  setTimeout(resizeScratchpad, 40);
}

function closeScratchpad() {
  $("scratchpadModal").classList.remove("active");
}

function setSpColor(color, tool, btn) {
  if (color) spColor = color;
  spTool = tool;
  document.querySelectorAll(".sp-tools .sp-btn").forEach(b => {
    if (b !== $("spToolClear") && b !== $("btnCloseScratchpad")) b.classList.remove("active");
  });
  if (btn) btn.classList.add("active");
}

function clearScratchpad() {
  if (!spCtx || !spCanvas) return;
  spCtx.clearRect(0, 0, spCanvas.width, spCanvas.height);
}

function resizeScratchpad() {
  if (!spCanvas || !spCtx) return;
  const rect = spCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);
  if (spCanvas.width === targetW && spCanvas.height === targetH) return;

  // 暫存已有手寫筆跡
  let temp = null;
  if (spCanvas.width > 0 && spCanvas.height > 0) {
    temp = document.createElement("canvas");
    temp.width = spCanvas.width;
    temp.height = spCanvas.height;
    temp.getContext("2d").drawImage(spCanvas, 0, 0);
  }

  spCanvas.width = targetW;
  spCanvas.height = targetH;
  if (temp) {
    spCtx.drawImage(temp, 0, 0, targetW, targetH);
  }
}

/* ---------- 初始化 ---------- */
async function init() {
  try {
    const res = await fetch("../data/curriculum.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.curriculum = await res.json();
  } catch (err) {
    showDegraded("<!-- DEGRADED:全域骨架 data/curriculum.json 載入失敗 → " + err.message + "。請以本機伺服器開啟（於專案根目錄執行：python -m http.server 8000，再連 http://127.0.0.1:8000/app/index.html）。 -->");
    return;
  }

  // 讀取最後離開位置（記住年級、單元與題目）
  const lastPos = getLastPosition();
  let targetUnit = null;
  let targetQ = 0;
  if (lastPos && lastPos.grade && state.curriculum.grades.some((g) => g.grade === lastPos.grade)) {
    state.grade = lastPos.grade;
    if (lastPos.unitCode) {
      const g = state.curriculum.grades.find((x) => x.grade === state.grade);
      const u = g && g.units.find((x) => x.code === lastPos.unitCode);
      if (u && u.status === "ready") {
        targetUnit = lastPos.unitCode;
        targetQ = typeof lastPos.qIndex === "number" ? lastPos.qIndex : 0;
      }
    }
  }

  renderNav();
  // 改為永遠回年級頁：讓「繼續上次進度」橫幅可見，不再自動跳進舊單元
  renderGrade();
  // 還原上次所在年級（若記錄有效）
  if (targetUnit && lastPos && lastPos.grade) {
    // 年級已由上方 lastPos 還原；targetUnit 留給橫幅點擊時接續
    void targetQ;
  }

  $("btnBack").addEventListener("click", () => {
    clearInterval(heightTimer);
    stopSpeech();
    saveLastPosition(state.grade, null, 0);
    renderGrade();
  });
  $("btnPrev").addEventListener("click", () => {
    if (state.qIndex > 0) {
      state.qIndex--;
      stopSpeech();
      saveLastPosition(state.grade, state.unit ? state.unit.unit_code : null, state.qIndex);
      renderQuestion();
    }
  });
  $("btnNext").addEventListener("click", () => {
    if (state.qIndex < state.unit.questions.length - 1) {
      state.qIndex++;
      stopSpeech();
      saveLastPosition(state.grade, state.unit ? state.unit.unit_code : null, state.qIndex);
      renderQuestion();
    }
  });
  $("btnCheckMain").addEventListener("click", () => { checkShellAnswer(); markQuestionChecked(); });
  $("shellOptions").addEventListener("click", (e) => {
    const btn = e.target.closest(".shell-opt");
    if (btn && !$("shellOptions").classList.contains("answered")) selectShellChoice(Number(btn.dataset.index));
  });
  $("btnSpeak").addEventListener("click", speakCurrentProblem);
  $("btnFinish").addEventListener("click", () => { stopSpeech(); markUnitSubmitted(); renderResult(); });

  /* ---------- Light / Dark 雙模式：外殼開關＋iframe 同步廣播 ---------- */
  function applyTheme(theme) {
    const t = (theme === "dark") ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("math108_theme", t); } catch (e) {}
    const btn = $("btnThemeToggle");
    if (btn) {
      btn.textContent = (t === "dark") ? "☀️" : "🌙";
      btn.title = (t === "dark") ? "切換 Light 模式" : "切換 Dark 模式";
    }
    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        if (frame.contentWindow) frame.contentWindow.postMessage({ type: "THEME_CHANGE", theme: t }, "*");
      } catch (e) {}
    });
  }
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem("math108_theme") || "light"; } catch (e) {}
  applyTheme(savedTheme);
  const btnTheme = $("btnThemeToggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  const btnUpdate = $("btnAppUpdate");
  if (btnUpdate) {
    btnUpdate.addEventListener("click", async () => {
      btnUpdate.classList.add("spinning");
      btnUpdate.textContent = "⏳ 更新中...";
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update();
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        const res = await fetch("../data/curriculum.json?_t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          btnUpdate.textContent = "✅ 已更新！";
          setTimeout(() => { window.location.reload(true); }, 500);
        } else {
          btnUpdate.textContent = "已是最新版";
          setTimeout(() => { btnUpdate.classList.remove("spinning"); btnUpdate.textContent = "🔄 更新"; }, 1500);
        }
      } catch (err) {
        btnUpdate.textContent = "已是最新版";
        setTimeout(() => { btnUpdate.classList.remove("spinning"); btnUpdate.textContent = "🔄 更新"; }, 1500);
      }
    });
  }

  initScratchpad();
}

init();
