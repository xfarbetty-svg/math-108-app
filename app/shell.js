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
  visited: new Set()  // 已實機操作過教具的題目 id
};

const $ = (id) => document.getElementById(id);
const views = ["gradeView", "stageView", "resultView"];

/* ---------- 視圖切換 ---------- */
function showView(name) {
  views.forEach((v) => { $(v).style.display = (v === name) ? "block" : "none"; });
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
    return `
      <button class="unit-card ${ready ? "ready" : "locked"}" ${ready ? "" : "disabled"} data-code="${u.code}">
        <span class="code">${u.code}</span>
        <h3>${u.title}</h3>
        <p class="desc">${u.full_text}</p>
        <span class="hint">${ready ? (u.question_count + " 題真題 · 具象教具互動 · 已驗真") : UPCOMING_HINT}</span>
        ${ready ? `<span class="badge-ready">開始挑戰 ▶</span><span class="start-arrow">→</span>` : `<span class="badge-upcoming">即將開放</span>`}
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
    <div class="unit-list">${cards}</div>`;

  view.querySelectorAll(".unit-card.ready").forEach((card) => {
    card.addEventListener("click", () => openUnit(card.dataset.code));
  });
}

/* ---------- 載入單元資料（SSOT：不內嵌題目副本） ---------- */
async function openUnit(code) {
  const g = state.curriculum.grades.find((x) => x.grade === state.grade);
  const unitMeta = g.units.find((u) => u.code === code);
  if (!unitMeta || unitMeta.status !== "ready") return;
  const url = "../data/units/G" + g.grade + "/" + code + ".json";
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    state.unit = await res.json();
  } catch (err) {
    showDegraded("<!-- DEGRADED:單元題庫載入失敗（" + url + "）→ " + err.message + "。請以本機伺服器開啟：python -m http.server 8000 -->");
    return;
  }
  state.qIndex = 0;
  state.visited.clear();
  renderStage();
}

/* ---------- 測驗舞台 ---------- */
let heightTimer = null;

function renderStage() {
  showView("stageView");
  renderQuestion();
}

function renderQuestion() {
  const q = state.unit.questions[state.qIndex];
  state.visited.add(q.id);

  // 頂部進度與真實試卷來源
  $("progressNum").textContent = "第 " + (state.qIndex + 1) + " / " + (state.unit.question_count || state.unit.questions.length) + " 題";
  $("progressSource").textContent = q.exam_source + " · " + q.section + " · 第 " + q.question_num + " 題";
  $("stageTitle").textContent = q.title;

  // 進度圓點
  $("dots").innerHTML = state.unit.questions.map((_, i) =>
    `<span class="dot ${i === state.qIndex ? "on" : state.visited.has(state.unit.questions[i].id) ? "done" : ""}"></span>`).join("");

  // 導航按鈕狀態
  $("btnPrev").disabled = state.qIndex === 0;
  $("btnNext").disabled = state.qIndex === state.unit.questions.length - 1;

  // 嵌入具象教具（無邊框 iframe，三端自適應高度）
  // 手機 390px：fallback 只落 360px（One-Screen），桌面維持 900px，之後由 fitFrame 自適應矯正
  const frame = $("stageFrame");
  clearInterval(heightTimer);
  const isNarrow = window.innerWidth < 700;
  frame.style.height = (q.fallback_height || (isNarrow ? 360 : 900)) + "px"; // 先落 fallback 高度防跳動
  frame.src = q.component_path || q.component;
  frame.onload = () => fitFrame(frame, q);
  // 同源可讀時持續自適應高度；file:// 跨檔受限時保持 fallback 高度
  heightTimer = setInterval(() => fitFrame(frame, q), 600);
}

function fitFrame(frame, q) {
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.documentElement) return;
    const h = Math.max(doc.documentElement.scrollHeight, doc.body ? doc.body.scrollHeight : 0);
    if (h > 100) frame.style.height = h + "px";
  } catch (_e) {
    /* file:// 同源限制 → 保持 fallback_height（降級已於資料檔標註） */
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
  renderNav();
  renderGrade();

  $("btnBack").addEventListener("click", () => { clearInterval(heightTimer); renderGrade(); });
  $("btnPrev").addEventListener("click", () => {
    if (state.qIndex > 0) { state.qIndex--; renderQuestion(); }
  });
  $("btnNext").addEventListener("click", () => {
    if (state.qIndex < state.unit.questions.length - 1) { state.qIndex++; renderQuestion(); }
  });
  $("btnFinish").addEventListener("click", renderResult);
}

init();
