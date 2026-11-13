/* ============================================================
 * 小數學冒險 · 微核心 Shell（純原生 JS，零外部依賴）
 * 職責：
 *   1. 載入 data/curriculum.json（G1~G6 課綱 SSOT）
 *   2. 年級導航 + 單元卡片清單渲染
 *   3. G1-N-1-1 做題舞台（iframe 具象教具 + 真題導航）
 *   4. 交卷結算（真題清單 + 出處 + 算理破招解析）
 *   5. iframe 高度自動適應（650~900px，避免多重滾動條）
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 狀態（單一全域 state，無散落變數） ---------- */
  var state = {
    curriculum: null,      // curriculum.json 全量
    currentGrade: 1,       // 預設一年級
    unit: null,            // 當前單元資料（units/G1/N-1-1.json）
    questions: [],
    qIndex: 0
  };

  /* ---------- DOM 快取 ---------- */
  var el = {};
  function $(id) { return document.getElementById(id); }

  /* ---------- 小工具 ---------- */
  // unit_data 欄位以專案根為基準（"data/units/..."），index.html 在 app/ 下，需補 ../
  function resolveProjectPath(p) {
    if (!p) return '';
    return p.indexOf('data/') === 0 ? '../' + p : p;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fail(parent, msg) {
    // 禁止靜默吞錯：載入失敗必須浮出可見訊息
    parent.innerHTML =
      '<div class="blueprint"><div class="plan-badge">⚠️ 載入失敗</div>' +
      '<h2>資料讀取錯誤</h2><p class="desc">' + esc(msg) + '</p>' +
      '<p class="pending-note">請確認以本機 HTTP 伺服器開啟（例如：<code>python -m http.server</code>），' +
      '直接 file:// 開啟會被瀏覽器擋下 fetch。</p></div>';
  }

  /* ============================================================
   * 1. 啟動：載入課綱
   * ============================================================ */
  function init() {
    el.gradeNav = $('gradeNav');
    el.gradeView = $('gradeView');
    el.stageView = $('stageView');
    el.resultView = $('resultView');
    el.progressNum = $('progressNum');
    el.progressSource = $('progressSource');
    el.dots = $('dots');
    el.stageTitle = $('stageTitle');
    el.frame = $('stageFrame');
    el.btnPrev = $('btnPrev');
    el.btnNext = $('btnNext');
    el.btnFinish = $('btnFinish');
    el.btnBack = $('btnBack');
    el.offlineNote = $('offlineNote');

    bindStageControls();
    injectFinishGlowStyle();
    el.frame.addEventListener('load', fitFrameHeight);
    window.addEventListener('resize', fitFrameHeight);

    fetch('../data/curriculum.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + '：curriculum.json');
        return r.json();
      })
      .then(function (data) {
        state.curriculum = data;
        renderGradeNav();
        selectGrade(1); // 預設一年級
      })
      .catch(function (e) {
        fail(el.gradeView, e && e.message ? e.message : 'curriculum.json 讀取失敗');
      });
  }

  /* ============================================================
   * 2. 年級導航 (#gradeNav)
   * ============================================================ */
  function renderGradeNav() {
    el.gradeNav.innerHTML = '';
    state.curriculum.grades.forEach(function (g) {
      var btn = document.createElement('button');
      btn.className = 'grade-btn';
      btn.type = 'button';
      btn.textContent = 'G' + g.grade;
      btn.title = g.label;
      btn.setAttribute('aria-label', g.label);
      btn.dataset.grade = String(g.grade);
      btn.addEventListener('click', function () { selectGrade(g.grade); });
      el.gradeNav.appendChild(btn);
    });
  }

  function selectGrade(grade) {
    state.currentGrade = grade;
    // 導航鈕 active 樣式
    Array.prototype.forEach.call(el.gradeNav.children, function (b) {
      b.classList.toggle('active', Number(b.dataset.grade) === grade);
    });
    // 結算 / 舞台退場，回年級視圖
    el.resultView.style.display = 'none';
    el.stageView.style.display = 'none';
    el.gradeView.style.display = '';
    renderGradeView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ============================================================
   * 3. 單元卡片清單 (#gradeView)
   *    - 一年級：ready → 可進入做題；upcoming → 「即將開放」
   *    - 二~六年級：全部「籌備中」
   * ============================================================ */
  function renderGradeView() {
    var grade = getGrade(state.currentGrade);
    if (!grade) { fail(el.gradeView, '找不到年級資料：G' + state.currentGrade); return; }

    var html = '';
    html += '<div class="grade-hero"><div class="hero-card">';
    html += '<span class="stage-tag">108 課綱 · ' + esc(grade.label) + '</span>';
    html += '<h2>' + esc(grade.label) + '學習地圖</h2>';
    html += '<p>' + grade.units.length + ' 個官方條目 · ' +
      (state.currentGrade === 1 ? 'N-1-1 已驗真開放做題' : '規劃藍圖已定，教具施工中') + '</p>';
    html += '</div></div>';
    html += '<div class="unit-list">';

    grade.units.forEach(function (u) {
      var ready = u.status === 'ready';
      var badgeText = ready ? '開始做題 ▶' : (state.currentGrade === 1 ? '即將開放' : '籌備中');
      html += '<button type="button" class="unit-card ' + (ready ? 'ready' : 'locked') + '"' +
        (ready ? ' data-unit="' + esc(u.code) + '"' : ' disabled') + '>';
      html += '<span class="code">' + esc(u.code) + '</span>';
      html += '<h3>' + esc(u.name) + '</h3>';
      html += '<div class="hint">' + esc(u.official_core || '') + '</div>';
      if (!ready && u.common_trap) {
        html += '<span class="badge-plan">陷阱：' + esc(u.common_trap) + '</span>';
      }
      html += '<span class="' + (ready ? 'badge-ready' : 'badge-upcoming') + '">' + esc(badgeText) + '</span>';
      if (ready) html += '<span class="start-arrow">▶</span>';
      html += '</button>';
    });

    html += '</div>';
    el.gradeView.innerHTML = html;

    // ready 卡片 → 進入做題舞台
    Array.prototype.forEach.call(el.gradeView.querySelectorAll('.unit-card.ready'), function (card) {
      card.addEventListener('click', function () {
        var u = grade.units.filter(function (x) { return x.code === card.dataset.unit; })[0];
        if (u) openUnit(u);
      });
    });
  }

  function getGrade(grade) {
    if (!state.curriculum) return null;
    return state.curriculum.grades.filter(function (g) { return g.grade === grade; })[0] || null;
  }

  /* ============================================================
   * 4. 單元做題舞台 (#stageView)
   * ============================================================ */
  function openUnit(unitMeta) {
    var url = resolveProjectPath(unitMeta.unit_data);
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + '：' + url);
        return r.json();
      })
      .then(function (unit) {
        if (!unit.questions || !unit.questions.length) {
          throw new Error('單元題庫為空：' + unit.unit_id);
        }
        state.unit = unit;
        state.questions = unit.questions;
        state.qIndex = 0;
        el.gradeView.style.display = 'none';
        el.resultView.style.display = 'none';
        el.stageView.style.display = 'block';
        buildDots();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (e) {
        fail(el.gradeView, e && e.message ? e.message : '單元題庫載入失敗');
      });
  }

  function buildDots() {
    el.dots.innerHTML = '';
    state.questions.forEach(function () {
      var d = document.createElement('span');
      d.className = 'dot';
      el.dots.appendChild(d);
    });
  }

  function renderQuestion() {
    var q = state.questions[state.qIndex];
    var total = state.questions.length;

    // 頂部進度 + 真題出處
    el.progressNum.textContent = '第 ' + (state.qIndex + 1) + ' / ' + total + ' 題';
    el.progressSource.textContent = q.exam_source + ' · ' + q.section;

    // 進度小圓點：已過 → done（綠）、當前 → on（橘）
    Array.prototype.forEach.call(el.dots.children, function (d, i) {
      d.className = 'dot' + (i < state.qIndex ? ' done' : i === state.qIndex ? ' on' : '');
    });

    // 標題 + iframe 教具
    el.stageTitle.textContent = q.title;
    el.frame.style.height = '650px'; // 先歸位，載入後依內容自適應
    el.frame.src = q.component_path;

    // 導航控制：第 1 題禁用上一題；最後一題隱藏下一題並高亮交卷
    el.btnPrev.disabled = state.qIndex === 0;
    el.btnNext.style.display = state.qIndex === total - 1 ? 'none' : '';
    el.btnFinish.classList.toggle('hl', state.qIndex === total - 1);
  }

  function bindStageControls() {
    el.btnPrev.addEventListener('click', function () {
      if (state.qIndex > 0) { state.qIndex--; renderQuestion(); }
    });
    el.btnNext.addEventListener('click', function () {
      if (state.qIndex < state.questions.length - 1) { state.qIndex++; renderQuestion(); }
    });
    el.btnFinish.addEventListener('click', showResult);
    el.btnBack.addEventListener('click', function () {
      el.stageView.style.display = 'none';
      el.frame.src = 'about:blank'; // 停掉教具運算
      selectGrade(state.currentGrade);
    });
  }

  /* ---------- iframe 高度自動適應（650~900px） ---------- */
  function fitFrameHeight() {
    var frame = el.frame;
    var target = 750; // 同源讀不到時的折衷值
    try {
      var doc = frame.contentDocument;
      if (doc && doc.body) {
        var h = Math.max(
          doc.documentElement.scrollHeight || 0,
          doc.body.scrollHeight || 0
        );
        if (h > 0) target = h;
      }
    } catch (e) {
      /* 跨源（file:// 限制）時保持折衷值，不中斷 */
    }
    frame.style.height = Math.min(900, Math.max(650, Math.ceil(target))) + 'px';
  }

  /* ============================================================
   * 5. 交卷結算 (#resultView)
   * ============================================================ */
  function showResult() {
    var unit = state.unit;
    var html = '';
    html += '<div class="result-card">';
    html += '<h2>🎉 交卷結算 · ' + esc(unit.unit_name) + '</h2>';
    html += '<p class="rsub">' + esc(unit.source_paper) + ' · ' + esc(unit.curriculum_code) +
      ' · ' + state.questions.length + ' 題真題全覽</p>';

    state.questions.forEach(function (q, i) {
      html += '<div class="result-item">';
      html += '<div class="rtitle"><span>Q' + (i + 1) + ' ' + esc(q.title) + '</span>' +
        '<span class="rsrc">' + esc(q.exam_source) + ' · ' + esc(q.section) + ' 第 ' + esc(q.question_num) + ' 題</span></div>';
      html += '<div class="rexp">' + esc(q.stem).replace(/\n/g, '<br>') + '</div>';
      html += '<div class="rlabel">✅ 正解：' + esc(q.answer_raw) + '</div>';
      html += '<div class="rlabel">🧠 算理破招</div>';
      html += '<div class="rexp">' + esc(q.explanation.concept) + '</div>';
      html += '<div class="rexp">' + q.explanation.steps.map(esc).join('<br>') + '</div>';
      html += '<div class="rdemo">⚠️ 陷阱破招：' + esc(q.explanation.trap) + '</div>';
      html += '<div class="rdemo">🎨 教具重玩：' + esc(q.component) + '.html</div>';
      html += '</div>';
    });

    html += '</div>';
    html += '<div class="result-actions">';
    html += '<button type="button" class="btn-next" id="btnRetry">🔄 再做一次</button>';
    html += '<button type="button" class="btn-prev" id="btnResultBack">← 回單元列表</button>';
    html += '</div>';

    el.resultView.innerHTML = html;
    el.stageView.style.display = 'none';
    el.frame.src = 'about:blank';
    el.resultView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    $('btnRetry').addEventListener('click', function () {
      state.qIndex = 0;
      el.resultView.style.display = 'none';
      el.stageView.style.display = 'block';
      buildDots();
      renderQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('btnResultBack').addEventListener('click', function () {
      el.resultView.style.display = 'none';
      selectGrade(state.currentGrade);
    });
  }

  /* ---------- 交卷按鈕高亮（最後一題時呼吸光暈） ---------- */
  function injectFinishGlowStyle() {
    var s = document.createElement('style');
    s.textContent =
      '.btn-finish.hl{animation:finishGlow 1.2s ease-in-out infinite alternate;}' +
      '@keyframes finishGlow{from{transform:scale(1);box-shadow:0 8px 18px rgba(79,168,142,.3);}' +
      'to{transform:scale(1.04);box-shadow:0 12px 26px rgba(79,168,142,.55);}}';
    document.head.appendChild(s);
  }

  /* ---------- 離線提示（可选：fetch 失敗時一併顯示） ---------- */
  function showOfflineNote(msg) {
    if (!el.offlineNote) return;
    el.offlineNote.textContent = msg;
    el.offlineNote.style.display = 'block';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
