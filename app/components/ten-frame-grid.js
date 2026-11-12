/* ten-frame-grid.js — T-01 十格陣與滿十閉鎖 (N-1-3 湊十法)；TCK-02/04/05。IIFE。 */
(function () {
  'use strict';

  var CELLS = 10;
  var FUSION_MS = 300;
  var RESET_MS = 120;
  var TAKEAWAY_MS = 800;

  var CSS = `:host{display:inline-block;
--tfg-cell:30px;--tfg-pitch:33px;--tfg-dot:24px;
--tfg-fill:#DC2626;--tfg-hi:#F87171;--tfg-full:#FACC15;--tfg-border:#CBD5E1;
--tfg-bg:#F8FAFC;--tfg-shadow:rgba(250,204,21,.8);
font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif;}
.frame{position:relative;display:inline-block;padding:4px;
border:2px solid var(--tfg-border);border-radius:8px;background:var(--tfg-bg);
transition:border-color 160ms ease-out,box-shadow 160ms ease-out;}
.frame.is-locked{border-color:var(--tfg-full);border-width:2.5px;
box-shadow:0 0 12px var(--tfg-shadow);}
.grid{display:grid;grid-template-columns:repeat(5,var(--tfg-pitch));
grid-template-rows:repeat(2,var(--tfg-pitch));gap:0;}
.cell{width:var(--tfg-pitch);height:var(--tfg-pitch);padding:0;border:0;background:none;
display:flex;align-items:center;justify-content:center;cursor:pointer;
touch-action:manipulation;-webkit-tap-highlight-color:transparent;}
.cell:focus-visible{outline:2px solid #2563EB;outline-offset:-2px;border-radius:6px;}
.cell[disabled]{cursor:default;}
.slot{width:var(--tfg-cell);height:var(--tfg-cell);border:1px dashed var(--tfg-border);
border-radius:4px;display:flex;align-items:center;justify-content:center;
box-sizing:border-box;transition:border-color 160ms ease-out;}
.dot{width:var(--tfg-dot);height:var(--tfg-dot);border-radius:50%;
background:radial-gradient(circle at 30% 30%,var(--tfg-hi),var(--tfg-fill));
box-shadow:inset 0 -2px 3px rgba(0,0,0,.18);animation:tfg-pop 160ms ease-out both;}
.dot.is-fusing{animation:tfg-shake 300ms ease-in-out both;}
.dot.is-leaving{animation:tfg-fade 120ms ease-in both;}
.dot.is-takeaway{animation:tfg-takeaway 800ms ease-in-out both;}
@keyframes tfg-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes tfg-takeaway{0%{opacity:1;transform:scale(1)}45%{opacity:.55;transform:scale(.82)}
100%{opacity:0;transform:scale(.25)}}
@keyframes tfg-shake{
0%,100%{transform:translateX(0);box-shadow:0 0 0 0 rgba(245,158,11,0)}
25%{transform:translateX(-2px);box-shadow:0 0 10px 3px rgba(245,158,11,.9)}
75%{transform:translateX(2px);box-shadow:0 0 10px 3px rgba(245,158,11,.9)}}
@keyframes tfg-fade{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.4)}}
@media (prefers-reduced-motion:reduce){
.dot,.dot.is-fusing,.dot.is-leaving,.dot.is-takeaway{animation:none!important;}
.frame,.slot{transition:none!important;}}`;

  function num(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw === null || raw === '') return fallback;
    var v = Number(raw);
    return Number.isFinite(v) ? v : fallback;
  }

  /* 白混 35% 高光（TCK-05c） */
  function lighten(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function mix(c) { return Math.round(c + (255 - c) * 0.35); }
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

  class TenFrameGrid extends HTMLElement {
    static get observedAttributes() {
      return ['value', 'fill-color', 'interactive', 'locked', 'label'];
    }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._cells = [];
      this._value = 0;
      this._state = 'EMPTY_OR_PARTIAL';
      this._fusionTimer = 0;
      this._resetTimer = 0;
      this._quiet = false;
      this._built = false;
    }

    connectedCallback() {
      /* TCK-04：_cells 遺失時必須重建，否則重連後點擊必 TypeError */
      if (!this._built || this._cells.length !== CELLS) this._build();
      this._applyValue(true);
    }

    disconnectedCallback() {
      clearTimeout(this._fusionTimer);
      clearTimeout(this._resetTimer);
      this._fusionTimer = 0;
      this._resetTimer = 0;
      this._state = 'EMPTY_OR_PARTIAL';
      /* 刻意不清 _cells：DOM 未銷毀，清空會讓重連後取不到格子 */
    }

    attributeChangedCallback(name) {
      if (!this._built) return;
      if (name === 'value') {
        if (this._quiet) return;
        this._applyValue(false);
      } else {
        this._syncTheme();
      }
    }

    get value() { return this._value; }
    set value(v) { this.setAttribute('value', String(v)); }
    get state() { return this._state; }

    reset() {
      this._quiet = true;
      this.setAttribute('value', '0');
      this._quiet = false;
      this._applyValue(false);
    }

    /* RK-02：公開填格 API，必須與點擊同一條 _syncTheme() 同步路徑 */
    setCount(v) { this.value = v; }

    /* RK-05：拆十割捨 800ms → 扣除並派事件 */
    takeAway(count, callback) {
      var self = this, prev = this._value, n = Math.round(Number(count));
      if (count == null || !Number.isFinite(n) || n <= 0 || n > prev) {
        this._emit('ten-frame:takeaway', { ok: false, value: prev, requested: count,
          reason: n > prev ? 'exceed' : 'invalid' });
        return false;
      }
      clearTimeout(this._fusionTimer); this._fusionTimer = 0;
      clearTimeout(this._resetTimer);
      var drop = [].slice.call(this._root.querySelectorAll('.dot'), -n);
      drop.forEach(function (d) { d.classList.remove('is-fusing'); d.classList.add('is-takeaway'); });
      this._state = 'TAKEAWAY';
      this._syncTheme();
      this._resetTimer = setTimeout(function () {
        var next = prev - n;
        drop.forEach(function (d) { d.remove(); });
        self._quiet = true;
        self.setAttribute('value', String(next));
        self._quiet = false;
        self._value = next;
        self._state = next === CELLS ? 'FULL_LOCKED' : 'EMPTY_OR_PARTIAL';
        self._syncTheme();
        self._emit('ten-frame:takeaway', { ok: true, value: next, previous: prev, count: n });
        if (typeof callback === 'function') callback(next, n);
      }, TAKEAWAY_MS);
      return true;
    }

    _build() {
      this._root.replaceChildren();
      this._cells = [];
      var style = document.createElement('style');
      style.textContent = CSS;

      var frame = document.createElement('div');
      frame.className = 'frame';
      frame.setAttribute('part', 'frame');
      var grid = document.createElement('div');
      grid.className = 'grid';
      grid.setAttribute('role', 'grid');

      for (var i = 0; i < CELLS; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.index = String(i);
        btn.setAttribute('role', 'gridcell');
        var slot = document.createElement('span');
        slot.className = 'slot';
        btn.appendChild(slot);
        btn.addEventListener('click', this._onClick.bind(this, i));
        grid.appendChild(btn);
        this._cells.push(btn);
      }

      frame.appendChild(grid);
      this._root.appendChild(style);
      this._root.appendChild(frame);
      this._frame = frame;
      this._built = true;
      this._syncTheme();
    }

    _onClick(index) {
      var interactive = this.getAttribute('interactive');
      var locked = this.hasAttribute('locked');
      var cur = this._value;
      /* TCK-08(4)：融合 300ms 內的點擊必須派 blocked，不可靜默 return */
      if (this._state === 'FUSION_TRIGGER') {
        this._emit('ten-frame:blocked', { value: cur, reason: 'fusion' });
        return;
      }
      if (locked || interactive === 'false') {
        this._emit('ten-frame:blocked', { value: cur, reason: locked ? 'locked' : 'readonly' });
        return;
      }
      if (cur >= CELLS) {
        this._emit('ten-frame:overflow', { value: CELLS, attempted: CELLS + 1 });
        return;
      }
      this._quiet = true;
      this.setAttribute('value', String(cur + 1));
      this._quiet = false;
      this._applyValue(false);
    }

    _applyValue(silent) {
      var target = Math.round(num(this, 'value', 0));
      var clamped = Math.min(CELLS, Math.max(0, target));

      if (clamped !== target) {
        this._quiet = true;
        this.setAttribute('value', String(clamped));
        this._quiet = false;
        if (!silent) this._emit('ten-frame:overflow', { value: clamped, attempted: target });
      }

      var prev = this._value;
      if (clamped === prev) {
        this._syncTheme();
        return;
      }
      if (clamped > prev) this._fillTo(clamped, prev);
      else this._resetTo(clamped, prev);
    }

    _fillTo(to, prev) {
      clearTimeout(this._resetTimer);
      for (var i = prev; i < to; i++) {
        var slot = this._cells[i].querySelector('.slot');
        if (!slot.querySelector('.dot')) {
          var dot = document.createElement('span');
          dot.className = 'dot';
          slot.appendChild(dot);
        }
      }
      this._value = to;
      this._state = to === CELLS ? 'FUSION_TRIGGER' : 'EMPTY_OR_PARTIAL';
      /* RK-02：填格後立刻同步 host aria-label、cell disabled/aria-pressed */
      this._syncTheme();
      this._emit('ten-frame:fill', { value: to, previous: prev, index: to - 1 });
      if (to === CELLS) this._startFusion();
    }

    _startFusion() {
      var dots = this._root.querySelectorAll('.dot');
      for (var i = 0; i < dots.length; i++) dots[i].classList.add('is-fusing');
      clearTimeout(this._fusionTimer);
      this._fusionTimer = setTimeout(this._lock.bind(this), FUSION_MS);
    }

    _lock() {
      this._fusionTimer = 0;
      var dots = this._root.querySelectorAll('.dot');
      for (var i = 0; i < dots.length; i++) dots[i].classList.remove('is-fusing');
      this._state = 'FULL_LOCKED';
      if (this._frame) this._frame.classList.add('is-locked');
      this._emit('ten-frame:full', { value: CELLS });
    }

    _resetTo(to, prev) {
      clearTimeout(this._fusionTimer);
      clearTimeout(this._resetTimer);
      this._fusionTimer = 0;
      var self = this;
      var dots = this._root.querySelectorAll('.dot');
      var drop = [];
      for (var i = to; i < dots.length; i++) {
        dots[i].classList.add('is-leaving');
        drop.push(dots[i]);
      }
      this._state = 'RESET';
      if (this._frame) this._frame.classList.remove('is-locked');
      this._value = to;
      this._syncTheme();
      this._emit('ten-frame:reset', { previous: prev });
      this._resetTimer = setTimeout(function () {
        self._resetTimer = 0;
        for (var j = 0; j < drop.length; j++) {
          if (drop[j].parentNode) drop[j].parentNode.removeChild(drop[j]);
        }
        self._state = to === CELLS ? 'FULL_LOCKED' : 'EMPTY_OR_PARTIAL';
        self._syncTheme();
      }, RESET_MS);
    }

    _syncTheme() {
      if (!this._frame) return;
      var fill = this.getAttribute('fill-color');
      var color = fill && fill.trim() ? fill.trim() : '#DC2626';
      this.style.setProperty('--tfg-fill', color);
      var hi = lighten(color);
      this.style.setProperty('--tfg-hi', hi || color);
      var locked = this.hasAttribute('locked') || this._state === 'FULL_LOCKED';
      this._frame.classList.toggle('is-locked', locked);
      var label = this.getAttribute('label') || '十格陣';
      var status = label + '，已填 ' + this._value + ' 格';
      /* RK-02：host 與 grid 的 aria-label 必須跟隨 _value，不可停在初始 0 格 */
      this.setAttribute('aria-label', status);
      this._root.querySelector('.grid').setAttribute('aria-label', status);
      for (var i = 0; i < this._cells.length; i++) {
        var filled = i < this._value;
        this._cells[i].setAttribute('aria-label',
          label + ' 第 ' + (i + 1) + ' 格，' + (filled ? '已填' : '空格'));
        this._cells[i].setAttribute('aria-pressed', filled ? 'true' : 'false');
        this._cells[i].disabled = filled || this._value >= CELLS;
      }
    }

    _emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true, composed: true }));
    }
  }

  if (!customElements.get('ten-frame-grid')) {
    customElements.define('ten-frame-grid', TenFrameGrid);
  }
})();
