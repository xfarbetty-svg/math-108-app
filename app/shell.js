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
  const draftBtn = $("btnOpenScratchpad");
  if (draftBtn) draftBtn.style.display = (name === "stageView") ? "inline-flex" : "none";
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

/* ---------- 臺灣腔 TTS 語音朗讀系統（028 世代推進防假死） ---------- */
let speechEpoch = 0;
let isSpeaking = false;

function cleanTextForSpeech(text) {
  if (!text) return "";
  return text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
             .replace(/[🎨✏️🍓🕊️🕊🎉🍕🍪🐟🍉蓮霧杨桃檸檬⭐]/g, "")
             .replace(/[\(\)（）\-\_\~·]/g, " ")
             .trim();
}

function speakCurrentProblem() {
  if (!("speechSynthesis" in window)) {
    alert("您的瀏覽器暫不支援語音朗讀功能");
    return;
  }
  const q = state.unit ? state.unit.questions[state.qIndex] : null;
  if (!q) return;

  speechEpoch++;
  const thisEpoch = speechEpoch;
  window.speechSynthesis.cancel();

  if (isSpeaking) {
    isSpeaking = false;
    updateSpeakBtn(false);
    return;
  }

  const rawText = (q.stem || q.title || "") + "。" + (q.subtitle || "");
  const clean = cleanTextForSpeech(rawText);
  if (!clean) return;

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "zh-TW";
  utter.rate = 0.95;
  utter.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices() || [];
  const twVoice = voices.find(v => v.name && (v.name.includes("HsiaoChen") || v.name.includes("曉臻") || v.name.includes("Mei-Jia") || v.name.includes("Taiwan") || v.name.includes("臺灣"))) ||
                  voices.find(v => v.lang === "zh-TW" || v.lang === "zh_TW");
  if (twVoice) utter.voice = twVoice;

  utter.onstart = () => {
    if (speechEpoch === thisEpoch) {
      isSpeaking = true;
      updateSpeakBtn(true);
    }
  };
  utter.onend = utter.onerror = () => {
    if (speechEpoch === thisEpoch) {
      isSpeaking = false;
      updateSpeakBtn(false);
    }
  };

  window.speechSynthesis.speak(utter);
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
  speechEpoch++;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updateSpeakBtn(false);
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
  renderNav();
  renderGrade();

  $("btnBack").addEventListener("click", () => { clearInterval(heightTimer); stopSpeech(); renderGrade(); });
  $("btnPrev").addEventListener("click", () => {
    if (state.qIndex > 0) { state.qIndex--; stopSpeech(); renderQuestion(); }
  });
  $("btnNext").addEventListener("click", () => {
    if (state.qIndex < state.unit.questions.length - 1) { state.qIndex++; stopSpeech(); renderQuestion(); }
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
