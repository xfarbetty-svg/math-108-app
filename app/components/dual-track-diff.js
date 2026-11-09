/* dual-track-diff.js — T-02 雙軌差值探照燈 (N-1-2 比較型減法)
 * TCK-06 單一幾何：STEP=(W-2PAD)/(MAX-1)，r=clamp(STEP/2-2,10,16)。IIFE。
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var MAX = 10, PAD = 28, W = 320, TOP_Y = 60, BOTTOM_Y = 110;
  var STEP = (W - PAD * 2) / (MAX - 1);
  var R = Math.min(16, Math.max(10, STEP / 2 - 2));

  var CSS = [
    ':host{display:block;--dtd-top:#EF4444;--dtd-bottom:#3B82F6;--dtd-link:#4ADE80;',
    '--dtd-gold:#FACC15;--dtd-ink:#F8FAFC;',
    'font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif}',
    'svg{display:block;width:100%;max-width:420px;margin:0 auto;overflow:visible}',
    '.link{stroke:var(--dtd-link);stroke-width:2;stroke-dasharray:3,3;opacity:.85}',
    '.coin{stroke:rgba(15,23,42,.25);stroke-width:1}',
    '.coin.top{fill:var(--dtd-top)}.coin.bottom{fill:var(--dtd-bottom)}',
    '.diff-box{fill:rgba(250,204,21,.10);stroke:var(--dtd-gold);stroke-width:2.5;',
    'stroke-dasharray:6,4;stroke-dashoffset:0}',
    '.diff-box.flow{animation:dtd-flow 1s linear infinite}',
    '@keyframes dtd-flow{to{stroke-dashoffset:-20}}',
    '.diff-label{fill:var(--dtd-gold);font-size:12px;font-weight:700;text-anchor:middle}',
    '.same-label{fill:var(--dtd-link);font-size:12px;font-weight:700;text-anchor:middle}',
    '.formula{fill:var(--dtd-ink);font-size:16px;font-weight:700;text-anchor:middle}',
    '@media (prefers-reduced-motion:reduce){.diff-box.flow{animation:none}}'
  ].join('');

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function clampInt(host, name, fb) {
    var raw = host.getAttribute(name);
    if (raw === null || raw === '') return { value: fb, clamped: false };
    var n = Number(raw);
    if (!Number.isFinite(n)) return { value: fb, clamped: true, raw: raw };
    var v = Math.round(n);
    var c = Math.min(MAX, Math.max(0, v));
    return { value: c, clamped: c !== v, raw: raw };
  }
  function xAt(i) { return PAD + i * STEP; }
  function coin(track, i) {
    return el('circle', {
      class: 'coin ' + track, cx: xAt(i),
      cy: track === 'top' ? TOP_Y : BOTTOM_Y, r: R
    });
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
      /* RK-01：_built 為真但容器遺失時必須重建 */
      if (!this._built || !this._links || !this._svg) this._build();
      this._render();
    }
    disconnectedCallback() { /* RK-01：保留容器參照，重連不疊層 */ }
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
    /* RK-03：批量設定，重連後呼叫必須 no-throw */
    setCount(top, bottom) {
      if (top !== undefined) this.setAttribute('top-count', String(top));
      if (bottom !== undefined) this.setAttribute('bottom-count', String(bottom));
    }
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
      this._root.replaceChildren(); /* 重連前清空 */
      var style = document.createElement('style');
      style.textContent = CSS;
      var svg = el('svg', { viewBox: '0 0 320 200', role: 'img', 'aria-label': '雙軌差值比較圖' });
      this._links = el('g', { class: 'links' });
      this._top = el('g', { class: 'track-top' });
      this._bottom = el('g', { class: 'track-bottom' });
      this._diff = el('g', { class: 'diff' });
      this._label = el('text', { class: 'diff-label', x: W / 2, y: 20 });
      this._formula = el('text', { class: 'formula', x: W / 2, y: 170 });
      [this._links, this._top, this._bottom, this._diff, this._label, this._formula]
        .forEach(function (n) { svg.appendChild(n); });
      this._root.appendChild(style);
      this._root.appendChild(svg);
      this._svg = svg;
      this._built = true;
    }

    _render() {
      var topInfo = clampInt(this, 'top-count', 8);
      var bottomInfo = clampInt(this, 'bottom-count', 5);
      var top = topInfo.value, bottom = bottomInfo.value;
      var diff = Math.abs(top - bottom);
      var pair = Math.min(top, bottom);
      var longer = top >= bottom ? 'top' : 'bottom';
      var showFormula = this.getAttribute('show-formula') !== 'false';
      var animate = this.getAttribute('animate') !== 'false';
      this._topValue = top;
      this._bottomValue = bottom;
      this.style.setProperty('--dtd-top', this.getAttribute('top-color') || '#EF4444');
      this.style.setProperty('--dtd-bottom', this.getAttribute('bottom-color') || '#3B82F6');

      [this._links, this._top, this._bottom, this._diff].forEach(function (g) { g.replaceChildren(); });

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
        formula = top + ' ＝ ' + bottom;
      } else {
        this._label.setAttribute('class', 'diff-label');
        this._label.textContent = '多出 ' + diff + ' 顆';
        var cy = longer === 'top' ? TOP_Y : BOTTOM_Y;
        this._diff.appendChild(el('rect', {
          class: 'diff-box' + (animate ? ' flow' : ''),
          x: (xAt(pair) - R - 4).toFixed(2),
          y: (cy - R - 4).toFixed(2),
          width: (diff * STEP).toFixed(2),
          height: (2 * R + 8).toFixed(2),
          rx: 6
        }));
        formula = (longer === 'top' ? top + ' － ' + bottom : bottom + ' － ' + top) + ' ＝ ' + diff;
      }
      this._label.setAttribute('y', '20');
      this._formula.textContent = showFormula ? formula : '';
      this._formula.style.display = showFormula ? '' : 'none';
      this._svg.setAttribute('aria-label',
        '上軌 ' + top + ' 顆，下軌 ' + bottom + ' 顆，' + (diff === 0 ? '一樣多' : '相差 ' + diff + ' 顆'));
      this._emit('diff:change', { top: top, bottom: bottom, diff: diff, formula: formula });
    }

    _emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true, composed: true }));
    }
  }

  if (!customElements.get('dual-track-diff')) {
    customElements.define('dual-track-diff', DualTrackDiff);
  }
})();
