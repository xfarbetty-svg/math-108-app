/* dual-track-diff.js — T-02 雙軌差值探照燈 (N-1-2 比較型減法 / 一對一對應)
 * 契約正本：reports/20261105_2035_g1_visual_spec/R1_BP_EXECUTION_PLAN.md §T-02
 * 傳統 script 全域 IIFE，禁 ES Module（file:// 離線直開）
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var MAX = 10;
  var PAD = 28;
  var VBW = 320;
  var R = 12;
  var STEP = (VBW - PAD * 2) / (MAX - 1);
  var TOP_Y = 60;
  var BOTTOM_Y = 110;
  var BOX_PAD = 16;

  var CSS = [
    ':host{display:block;--dtd-top:#EF4444;--dtd-bottom:#3B82F6;--dtd-link:#4ADE80;',
    '--dtd-gold:#FACC15;--dtd-ink:#F8FAFC;',
    'font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif;}',
    'svg{display:block;width:100%;max-width:420px;margin:0 auto;overflow:visible;}',
    '.link{stroke:var(--dtd-link);stroke-width:2;stroke-dasharray:3,3;opacity:.85;}',
    '.coin{stroke:rgba(15,23,42,.25);stroke-width:1;}',
    '.coin.top{fill:var(--dtd-top);}',
    '.coin.bottom{fill:var(--dtd-bottom);}',
    '.diff-box{fill:rgba(250,204,21,.10);stroke:var(--dtd-gold);stroke-width:2.5;',
    'stroke-dasharray:6,4;stroke-dashoffset:0;}',
    '.diff-box.flow{animation:dtd-flow 1s linear infinite;}',
    '@keyframes dtd-flow{to{stroke-dashoffset:-20}}',
    '.diff-label{fill:var(--dtd-gold);font-size:12px;font-weight:700;text-anchor:middle;}',
    '.same-label{fill:var(--dtd-link);font-size:12px;font-weight:700;text-anchor:middle;}',
    '.formula{fill:var(--dtd-ink);font-size:16px;font-weight:700;text-anchor:middle;}',
    '@media (prefers-reduced-motion:reduce){.diff-box.flow{animation:none;}}'
  ].join('');

  function clampInt(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw === null || raw === '') return { value: fallback, raw: null, clamped: false };
    var n = Number(raw);
    if (!Number.isFinite(n)) return { value: fallback, raw: raw, clamped: true };
    var v = Math.round(n);
    var c = Math.min(MAX, Math.max(0, v));
    return { value: c, raw: raw, clamped: c !== v };
  }

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function xAt(i) {
    return PAD + i * STEP;
  }

  class DualTrackDiff extends HTMLElement {
    static get observedAttributes() {
      return ['top-count', 'bottom-count', 'top-color', 'bottom-color', 'show-formula', 'animate'];
    }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._built = false;
    }

    connectedCallback() {
      if (!this._built) this._build();
      this._render();
    }

    disconnectedCallback() {
      this._built = false;
      this._top = this._bottom = this._links = this._diff = this._formula = this._label = null;
    }

    attributeChangedCallback(name, oldV, newV) {
      if (!this._built || oldV === newV) return;
      if (name === 'top-count') this._guard('top-count');
      if (name === 'bottom-count') this._guard('bottom-count');
      this._render();
    }

    get top() { return this._topValue || 0; }
    get bottom() { return this._bottomValue || 0; }
    get diff() { return Math.abs((this._topValue || 0) - (this._bottomValue || 0)); }

    set top(v) { this.setAttribute('top-count', String(v)); }
    set bottom(v) { this.setAttribute('bottom-count', String(v)); }

    reset() {
      this.setAttribute('top-count', '8');
      this.setAttribute('bottom-count', '5');
    }

    _guard(attr) {
      var info = clampInt(this, attr, 0);
      if (info.clamped) {
        this._emit('diff:invalid', { attr: attr, attempted: Number(info.raw), max: MAX });
      }
    }

    _build() {
      var style = document.createElement('style');
      style.textContent = CSS;

      var svg = el('svg', { viewBox: '0 0 320 200', role: 'img', 'aria-label': '雙軌差值比較圖' });
      this._links = el('g', { class: 'links' });
      this._top = el('g', { class: 'track-top' });
      this._bottom = el('g', { class: 'track-bottom' });
      this._diff = el('g', { class: 'diff' });
      this._label = el('text', { class: 'diff-label', x: VBW / 2, y: 20 });
      this._formula = el('text', { class: 'formula', x: VBW / 2, y: 170 });

      svg.appendChild(this._links);
      svg.appendChild(this._top);
      svg.appendChild(this._bottom);
      svg.appendChild(this._diff);
      svg.appendChild(this._label);
      svg.appendChild(this._formula);

      this._root.appendChild(style);
      this._root.appendChild(svg);
      this._built = true;
    }

    _render() {
      var topInfo = clampInt(this, 'top-count', 8);
      var bottomInfo = clampInt(this, 'bottom-count', 5);
      var top = topInfo.value;
      var bottom = bottomInfo.value;
      var diff = Math.abs(top - bottom);
      var pair = Math.min(top, bottom);
      var longer = top >= bottom ? 'top' : 'bottom';
      var showFormula = this.getAttribute('show-formula') !== 'false';
      var animate = this.getAttribute('animate') !== 'false';

      this._topValue = top;
      this._bottomValue = bottom;

      var topColor = this.getAttribute('top-color') || '#EF4444';
      var bottomColor = this.getAttribute('bottom-color') || '#3B82F6';
      this.style.setProperty('--dtd-top', topColor);
      this.style.setProperty('--dtd-bottom', bottomColor);

      clear(this._links);
      clear(this._top);
      clear(this._bottom);
      clear(this._diff);

      var i;
      for (i = 0; i < pair; i++) {
        this._links.appendChild(el('line', {
          class: 'link', x1: xAt(i), y1: TOP_Y + R, x2: xAt(i), y2: BOTTOM_Y - R
        }));
      }
      for (i = 0; i < top; i++) this._top.appendChild(coin('top', i));
      for (i = 0; i < bottom; i++) this._bottom.appendChild(coin('bottom', i));

      var formula;
      if (diff === 0) {
        this._label.setAttribute('class', 'same-label');
        this._label.textContent = '一樣多';
        this._label.setAttribute('y', '20');
        formula = top + ' ＝ ' + bottom;
      } else {
        this._label.setAttribute('class', 'diff-label');
        this._label.textContent = '多出 ' + diff + ' 顆';
        this._label.setAttribute('y', '20');
        var box = el('rect', {
          class: 'diff-box' + (animate ? ' flow' : ''),
          x: xAt(pair) - BOX_PAD,
          y: longer === 'top' ? 30 : 80,
          width: diff * STEP,
          height: 40,
          rx: 6
        });
        this._diff.appendChild(box);
        formula = (longer === 'top' ? top + ' － ' + bottom : bottom + ' － ' + top) + ' ＝ ' + diff;
      }

      this._formula.textContent = showFormula ? formula : '';
      this._formula.style.display = showFormula ? '' : 'none';

      var svg = this._root.querySelector('svg');
      svg.setAttribute('aria-label',
        '上軌 ' + top + ' 顆，下軌 ' + bottom + ' 顆，' + (diff === 0 ? '一樣多' : '相差 ' + diff + ' 顆'));

      this._emit('diff:change', { top: top, bottom: bottom, diff: diff, formula: formula });
    }

    _emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true, composed: true }));
    }
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function coin(track, index) {
    return el('circle', {
      class: 'coin ' + track,
      cx: xAt(index),
      cy: track === 'top' ? TOP_Y : BOTTOM_Y,
      r: R
    });
  }

  if (!customElements.get('dual-track-diff')) {
    customElements.define('dual-track-diff', DualTrackDiff);
  }
})();
