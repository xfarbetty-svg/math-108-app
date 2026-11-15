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
    return `
      <button class="unit-card ${ready ? "ready" : "locked"}" ${ready ? "" : "disabled"} data-code="${u.code}">
        <span class="code">${codeLabel}</span>
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
async function openUnit(code, initialQIndex = 0) {
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
  const maxIdx = state.unit.questions ? state.unit.questions.length - 1 : 0;
  state.qIndex = (initialQIndex >= 0 && initialQIndex <= maxIdx) ? initialQIndex : 0;
  state.visited.clear();
  saveLastPosition(state.grade, code, state.qIndex);
  renderStage();
}

/* ---------- 單元內建模式切換（概念小教室 vs 真題測驗） ---------- */
const CONCEPT_COMPONENTS = {
  "N-2-1": "components/g2_place_value_1000_lab.html",
  "N-2-2": "components/g2_vertical_addition_subtraction_lab.html",
  "N-2-5": "components/g2_money_change_lab.html",
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
  "S-3-2": "components/square_rectangle_lab.html",
  "S-3-4": "components/solid_geometry_lab.html",
  "R-3-1": "components/multiplication_division_lab.html",
  "R-3-2": "components/pattern_reasoning_lab.html",
  "D-3-1": "components/table_cross_lab.html"
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
    if (btnSpeak) btnSpeak.style.display = "none";
    const frame = $("conceptFrame");
    const code = state.unit ? state.unit.code : null;
    if (frame && code && CONCEPT_COMPONENTS[code]) {
      if (!frame.src || !frame.src.includes(CONCEPT_COMPONENTS[code])) {
        frame.src = CONCEPT_COMPONENTS[code];
      }
    }
    $("progressNum").textContent = "";
    $("progressSource").textContent = "";
    $("dots").style.display = "none";
    $("stageTitle").style.display = "none";
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
  const code = state.unit ? state.unit.code : null;
  const tabs = $("unitModeTabs");
  const btnConcept = $("btnModeConcept");
  const btnExam = $("btnModeExam");

  if (code && CONCEPT_COMPONENTS[code]) {
    tabs.style.display = "flex";
    btnConcept.onclick = () => setUnitMode("concept");
    btnExam.onclick = () => setUnitMode("exam");
    // 預設進入真題測驗（也可切換至概念）
    setUnitMode("exam");
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

  // 嵌入具象教具（無邊框 iframe，三端緊湊自適應高度）
  const frame = $("stageFrame");
  clearInterval(heightTimer);
  const isNarrow = window.innerWidth < 700;
  frame.style.height = (q.fallback_height || (isNarrow ? 440 : 480)) + "px"; // 緊湊 fallback 防跳動與虛空空白
  frame.src = q.component_path || q.component;
  frame.onload = () => fitFrame(frame, q);
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
  const q = state.unit ? state.unit.questions[state.qIndex] : null;
  if (!q) return;

  // 正在朗讀中 → 點擊即停止（切換行為）
  if (window.AudioManager && window.AudioManager.isPlaying()) {
    stopCurrentSpeech();
    return;
  }

  const rawText = (q.stem || q.title || "") + "。" + (q.subtitle || "");
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

/* ---------- 點擊中央檢查答案按鈕（代理至 iframe 內部的 check()） ---------- */
function triggerCheckAnswer() {
  const frame = $("stageFrame");
  if (!frame || !frame.contentDocument) return;
  try {
    const doc = frame.contentDocument;
    // 優先點擊教具內部的 check-btn
    const btn = doc.querySelector(".check-btn, .btn-ok, #btnCheck, .btn.good, .btn.primary");
    if (btn) {
      btn.click();
    } else if (frame.contentWindow && typeof frame.contentWindow.check === "function") {
      frame.contentWindow.check();
    }
  } catch (err) {
    console.warn("無法代理觸發 iframe check:", err);
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
  if (targetUnit) {
    openUnit(targetUnit, targetQ);
  } else {
    renderGrade();
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
  $("btnCheckMain").addEventListener("click", triggerCheckAnswer);
  $("btnSpeak").addEventListener("click", speakCurrentProblem);
  $("btnFinish").addEventListener("click", () => { stopSpeech(); renderResult(); });

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
