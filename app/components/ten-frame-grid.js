/* ten-frame-grid.js — T-01 十格陣與滿十閉鎖 (N-1-3 湊十法 / 拆十法)
 * 契約正本：reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md §T-01
 * 傳統 script 全域 IIFE，禁 ES Module（file:// 離線直開）
 */
(function () {
  'use strict';

  var CELLS = 10;
  var FUSION_MS = 300;
  var RESET_MS = 120;

  var CSS = [
    ':host{display:inline-block;',
    '--tfg-cell:36px;--tfg-gap:4px;--tfg-dot:24px;',
    '--tfg-fill:#DC2626;--tfg-full:#FACC15;--tfg-border:#CBD5E1;',
    '--tfg-bg:#F8FAFC;--tfg-shadow:rgba(250,204,21,.8);',
    'font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif;}',
    '.frame{position:relative;display:inline-block;padding:6px;',
    'border:2px solid var(--tfg-border);border-radius:8px;background:var(--tfg-bg);',
    'transition:border-color 160ms ease-out,box-shadow 160ms ease-out;}',
    '.frame.is-locked{border-color:var(--tfg-full);border-width:2.5px;',
    'box-shadow:0 0 12px var(--tfg-shadow);}',
    '.grid{display:grid;grid-template-columns:repeat(5,var(--tfg-cell));',
    'grid-template-rows:repeat(2,var(--tfg-cell));gap:var(--tfg-gap);}',
    '.cell{width:44px;height:44px;margin:-4px;padding:0;border:0;background:none;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;',
    'touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '.cell:focus-visible{outline:2px solid #2563EB;outline-offset:1px;border-radius:8px;}',
    '.cell[disabled]{cursor:default;}',
    '.slot{width:var(--tfg-cell);height:var(--tfg-cell);border:1px dashed var(--tfg-border);',
    'border-radius:4px;display:flex;align-items:center;justify-content:center;',
    'box-sizing:border-box;transition:border-color 160ms ease-out;}',
    '.dot{width:var(--tfg-dot);height:var(--tfg-dot);border-radius:50%;',
    'background:radial-gradient(circle at 30% 30%,#F87171,var(--tfg-fill));',
    'box-shadow:inset 0 -2px 3px rgba(0,0,0,.18);',
    'animation:tfg-pop 160ms ease-out both;}',
    '.dot.is-fusing{animation:tfg-shake 300ms ease-in-out both;}',
    '.dot.is-leaving{animation:tfg-fade 120ms ease-in both;}',
    '@keyframes tfg-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}',
    '@keyframes tfg-shake{',
    '0%,100%{transform:translateX(0);box-shadow:0 0 0 0 rgba(245,158,11,0)}',
    '25%{transform:translateX(-2px);box-shadow:0 0 10px 3px rgba(245,158,11,.9)}',
    '75%{transform:translateX(2px);box-shadow:0 0 10px 3px rgba(245,158,11,.9)}}',
    '@keyframes tfg-fade{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.4)}}',
    '.badge{position:absolute;top:-10px;right:-10px;min-width:22px;height:22px;',
    'padding:0 5px;box-sizing:border-box;border-radius:11px;background:var(--tfg-full);',
    'color:#78350F;font-size:12px;font-weight:800;line-height:22px;text-align:center;',
    'opacity:0;transform:scale(.6);transition:opacity 160ms,transform 160ms;}',
    '.frame.is-locked .badge{opacity:1;transform:scale(1);}',
    '@media (prefers-reduced-motion:reduce){',
    '.dot,.dot.is-fusing,.dot.is-leaving{animation:none!important;}',
    '.frame,.slot,.badge{transition:none!important;}}'
  ].join('');

  function num(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw === null || raw === '') return fallback;
    var v = Number(raw);
    return Number.isFinite(v) ? v : fallback;
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
      if (!this._built) this._build();
      this._applyValue(true);
    }

    disconnectedCallback() {
      clearTimeout(this._fusionTimer);
      clearTimeout(this._resetTimer);
      this._fusionTimer = 0;
      this._resetTimer = 0;
      this._cells = [];
      this._state = 'EMPTY_OR_PARTIAL';
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

    get value() {
      return this._value;
    }

    set value(v) {
      this.setAttribute('value', String(v));
    }

    reset() {
      this._quiet = true;
      this.setAttribute('value', '0');
      this._quiet = false;
      this._applyValue(false);
    }

    _build() {
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

      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(CELLS);
      badge.setAttribute('aria-hidden', 'true');

      frame.appendChild(grid);
      frame.appendChild(badge);
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
      if (cur >= CELLS) {
        this._emit('ten-frame:overflow', { value: CELLS, attempted: CELLS + 1 });
        return;
      }
      if (this._state === 'FUSION_TRIGGER') return;
      if (interactive === 'false' || locked) {
        this._emit('ten-frame:overflow', { value: cur, attempted: cur + 1 });
        return;
      }
      this._emit('ten-frame:tap', { index: index, value: cur });
      this._quiet = true;
      this.setAttribute('value', String(cur + 1));
      this._quiet = false;
      this._applyValue(false);
    }

    _applyValue(silent) {
      var raw = num(this, 'value', 0);
      var target = Math.round(raw);
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
        var dot = document.createElement('span');
        dot.className = 'dot';
        slot.appendChild(dot);
      }
      this._value = to;
      this._state = to === CELLS ? 'FUSION_TRIGGER' : 'EMPTY_OR_PARTIAL';
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
      this._frame.classList.add('is-locked');
      this._emit('ten-frame:full', { value: CELLS });
    }

    _resetTo(to, prev) {
      clearTimeout(this._fusionTimer);
      this._fusionTimer = 0;
      var self = this;
      var dots = this._root.querySelectorAll('.dot');
      var drop = [];
      for (var i = to; i < dots.length; i++) {
        dots[i].classList.add('is-leaving');
        drop.push(dots[i]);
      }
      this._state = 'RESET';
      this._frame.classList.remove('is-locked');
      this._value = to;
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
      this.style.setProperty('--tfg-fill', fill && fill.trim() ? fill.trim() : '#DC2626');
      var locked = this.hasAttribute('locked') || this._state === 'FULL_LOCKED';
      this._frame.classList.toggle('is-locked', locked);
      var label = this.getAttribute('label') || '十格陣';
      this._root.querySelector('.grid').setAttribute('aria-label', label + '，已填 ' + this._value + ' 格');
      for (var i = 0; i < this._cells.length; i++) {
        var filled = i < this._value;
        this._cells[i].setAttribute('aria-label', label + ' 第 ' + (i + 1) + ' 格，' + (filled ? '已填' : '空格'));
        this._cells[i].disabled = filled || this._state === 'FUSION_TRIGGER' || this._value >= CELLS;
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
