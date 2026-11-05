/* balance-beam.js — T-03 等號天平 (R-1-1)。契約 R1 §T-03 + R1.1(TCK-07)：
 * 角度 deg；半隱式 Euler，scale=dt/16.667；收斂 |θ_target-θ|<0.1° 且 |θ'|<8°/s ×2 幀。IIFE。
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PX = 170, PY = 90, ARM = 100, DROP = 46;
  var MAX_TILT = 15, K_ARM = 1200, MAX_W = 10, STIFF = 0.012, DAMP = 0.18;

  var CSS = [
    ':host{display:block;--bb-left:#FB923C;--bb-right:#38BDF8;--bb-gold:#FACC15;',
    '--bb-ink:#0F172A;--bb-warn:#EF4444;',
    'font-family:system-ui,"Microsoft JhengHei","PingFang TC",sans-serif}',
    'svg{display:block;width:100%;max-width:460px;margin:0 auto;overflow:visible}',
    '.fulcrum{fill:#475569}.lever{fill:#94A3B8}',
    '.hanger{stroke:#64748B;stroke-width:1.5}.pan{fill:#CBD5E1}',
    '.arc,.tick{fill:none;stroke:#94A3B8;stroke-width:1.5}',
    '.needle{stroke:#334155;stroke-width:2;stroke-linecap:round}',
    '.symbol{font-size:34px;font-weight:900;text-anchor:middle;dominant-baseline:central;',
    'transform-box:fill-box;transform-origin:center}',
    '.symbol.unbalanced{fill:var(--bb-warn)}',
    '.symbol.balanced{fill:var(--bb-gold);animation:bb-pop 320ms ease-out both}',
    '@keyframes bb-pop{from{transform:scale(.6);opacity:.2}to{transform:scale(1);opacity:1}}',
    '.formula{fill:var(--bb-ink);font-size:13px;font-weight:700;text-anchor:middle}',
    '.formula.reverse{opacity:.75}',
    '@media (prefers-reduced-motion:reduce){.symbol.balanced{animation:none}}'
  ].join('');

  function el(n, a) {
    var e = document.createElementNS(NS, n);
    if (a) Object.keys(a).forEach(function (k) { e.setAttribute(k, a[k]); });
    return e;
  }
  function clampN(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function weightOf(host, name, fb) {
    var raw = host.getAttribute(name);
    if (raw === null || raw === '') return { value: fb, clamped: false };
    var n = Number(raw);
    if (!Number.isFinite(n)) return { value: fb, clamped: true, raw: raw };
    var v = clampN(Math.round(n), 0, MAX_W);
    return { value: v, clamped: v !== Math.round(n), raw: n };
  }
  function prettyExpr(raw) {
    return String(raw || '').replace(/\+/g, ' ＋ ').replace(/\s+/g, ' ').trim();
  }

  class BalanceBeam extends HTMLElement {
    static get observedAttributes() {
      return ['left-weight', 'right-weight', 'right-expression', 'damping', 'animate'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._theta = 0; this._vel = 0; this._target = 0; this._torque = 0;
      this._raf = 0; this._lastTs = 0; this._lastEmit = 0;
      this._balancedSent = false; this._state = 'UNBALANCED';
      this._quietFrames = 0; this._damping = DAMP;
      this._left = 5; this._right = 2; this._built = false;
    }
    connectedCallback() {
      if (!this._built) this._build();
      this._refresh(true);
    }
    disconnectedCallback() {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = 0; this._lastTs = 0;
      /* TCK-04：保留 _built=true，DOM 未銷毀；重連不得重建疊層 */
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._built || oldV === newV) return;
      this._refresh(false);
    }
    get theta() { return this._theta; }
    get velocity() { return this._vel; }
    get balanced() { return this._state === 'EQUALS_ACHIEVED'; }
    get left() { return this._left; }
    get right() { return this._right; }
    reset() {
      this.setAttribute('left-weight', '5');
      this.setAttribute('right-weight', '2');
      this.setAttribute('right-expression', '');
    }

    _build() {
      this._root.replaceChildren();   /* TCK-04：重連前先清空，禁疊層 */
      var style = document.createElement('style');
      style.textContent = CSS;
      var svg = el('svg', { viewBox: '0 0 340 200', role: 'img', 'aria-label': '等號天平' });
      var a = Math.PI / 12, r = 24;
      svg.appendChild(el('path', {
        class: 'arc',
        d: 'M ' + (PX - r * Math.sin(a)).toFixed(2) + ' ' + (PY - r * Math.cos(a)).toFixed(2) +
          ' A 24 24 0 0 1 ' + (PX + r * Math.sin(a)).toFixed(2) + ' ' +
          (PY - r * Math.cos(a)).toFixed(2)
      }));
      [-15, 0, 15].forEach(function (deg) {
        var rad = deg * Math.PI / 180;
        svg.appendChild(el('line', {
          class: 'tick',
          x1: (PX + 20 * Math.sin(rad)).toFixed(2), y1: (PY - 20 * Math.cos(rad)).toFixed(2),
          x2: (PX + 26 * Math.sin(rad)).toFixed(2), y2: (PY - 26 * Math.cos(rad)).toFixed(2)
        }));
      });
      this._needle = el('line', { class: 'needle', x1: PX, y1: PY, x2: PX, y2: PY - 24 });
      svg.appendChild(this._needle);
      svg.appendChild(el('polygon', { class: 'fulcrum', points: '170,90 150,160 190,160' }));
      this._lever = el('rect', { class: 'lever', x: 50, y: 86, width: 240, height: 8, rx: 3 });
      svg.appendChild(this._lever);
      this._pans = { left: this._pan('left'), right: this._pan('right') };
      svg.appendChild(this._pans.left);
      svg.appendChild(this._pans.right);
      this._symbol = el('text', { class: 'symbol unbalanced', x: PX, y: 44 });
      this._symbol.textContent = '≠';
      svg.appendChild(this._symbol);
      this._f1 = el('text', { class: 'formula', x: PX, y: 182 });
      this._f2 = el('text', { class: 'formula reverse', x: PX, y: 196 });
      svg.appendChild(this._f1);
      svg.appendChild(this._f2);
      this._root.appendChild(style);
      this._root.appendChild(svg);
      this._svg = svg;
      this._built = true;
    }
    _pan(side) {
      var g = el('g', { class: 'pan-group ' + side });
      g.appendChild(el('line', { class: 'hanger', x1: -20, y1: -DROP, x2: -20, y2: 0 }));
      g.appendChild(el('line', { class: 'hanger', x1: 20, y1: -DROP, x2: 20, y2: 0 }));
      g.appendChild(el('rect', { class: 'pan', x: -25, y: 0, width: 50, height: 6, rx: 2 }));
      var coins = el('g', { class: 'coins' });
      g.appendChild(coins);
      g._coins = coins;
      return g;
    }

    _refresh() {
      var lw = weightOf(this, 'left-weight', 5);
      var rw = weightOf(this, 'right-weight', 2);
      if (lw.clamped) this._emit('balance:clamped', { field: 'left-weight', requested: lw.raw, clamped: lw.value });
      if (rw.clamped) this._emit('balance:clamped', { field: 'right-weight', requested: rw.raw, clamped: rw.value });
      this._left = lw.value;
      this._right = rw.value;
      this._torque = (this._left - this._right) * ARM;
      var rawDeg = Math.atan2(this._torque, K_ARM) * 180 / Math.PI;   /* TCK-07：明訂 deg */
      if (Math.abs(rawDeg) > MAX_TILT) {
        this._emit('balance:clamped', {
          field: 'theta', requested: Math.round(rawDeg * 1000) / 1000, clamped: MAX_TILT
        });
      }
      this._target = -clampN(rawDeg, -MAX_TILT, MAX_TILT);
      this._quietFrames = 0;
      var rawDamp = this.getAttribute('damping');
      var damp = rawDamp === null || rawDamp === '' ? DAMP : Number(rawDamp);
      this._damping = Number.isFinite(damp) && damp >= 0 ? damp : DAMP;
      this._animate = this.getAttribute('animate') !== 'false';
      this._paintWeights();
      this._paintFormulas();
      if (this._torque === 0) this._balancedSent = false;
      if (!this._animate) {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;
        this._theta = this._target;
        this._vel = 0;
        this._render();
        this._settle();
        return;
      }
      this._lastTs = 0;
      if (!this._raf) this._raf = requestAnimationFrame(this._tick.bind(this));
    }

    _tick(ts) {
      this._raf = 0;
      if (!this.isConnected) return;
      var last = this._lastTs || ts;
      var dt = clampN(ts - last, 8, 34);
      this._lastTs = ts;
      var settled = this._advance(dt);
      this._render();
      if (ts - this._lastEmit >= 16) {
        this._lastEmit = ts;
        this._emit('balance:change', {
          left: this._left, right: this._right, theta: this._theta,
          torqueDelta: this._torque, balanced: settled
        });
      }
      if (!settled) this._raf = requestAnimationFrame(this._tick.bind(this));
    }

    /* 公開物理鉤子：與 rAF 共用同一積分器（無頭瀏覽器無 BeginFrame） */
    step(dtMs) {
      var dt = clampN(Number(dtMs) || 16.67, 8, 34);
      var settled = this._advance(dt);
      this._render();
      return settled;
    }

    _advance(dtMs) {
      var scale = dtMs / 16.6667;   /* TCK-07：以 60Hz 為基準歸一化 */
      var acc = STIFF * (this._target - this._theta) - this._damping * this._vel;
      this._vel += acc * scale;     /* 半隱式 Euler：先速度後位置 */
      this._theta += this._vel * scale;
      if (this._theta > MAX_TILT) { this._theta = MAX_TILT; this._vel = 0; }
      if (this._theta < -MAX_TILT) { this._theta = -MAX_TILT; this._vel = 0; }
      /* TCK-07：時間量綱；_vel 為 deg/60Hz-frame，×60 即 deg/s */
      var quiet = Math.abs(this._target - this._theta) < 0.1 && Math.abs(this._vel * 60) < 8;
      this._quietFrames = quiet ? this._quietFrames + 1 : 0;
      if (this._quietFrames >= 2) {
        this._theta = this._target;
        this._vel = 0;
        this._settle();
        return true;
      }
      this._state = 'BALANCING';
      this._markBalancedUi(false);
      return false;
    }

    _settle() {
      var ok = this._torque === 0;
      this._state = ok ? 'EQUALS_ACHIEVED' : 'UNBALANCED';
      this._markBalancedUi(ok);
      if (ok && !this._balancedSent) {
        this._balancedSent = true;
        this._emit('balance:balanced', {
          left: this._left, right: this._right,
          formula: this._formulaText(0), formulaReverse: this._formulaText(1)
        });
      } else if (!ok) {
        this._balancedSent = false;
      }
      this._emit('balance:change', {
        left: this._left, right: this._right, theta: this._theta,
        torqueDelta: this._torque, balanced: ok
      });
    }
    _markBalancedUi(on) {
      this._symbol.textContent = on ? '＝' : '≠';
      this._symbol.setAttribute('class', 'symbol ' + (on ? 'balanced' : 'unbalanced'));
    }
    _formulaText(rev) {
      var rhs = prettyExpr(this.getAttribute('right-expression')) || String(this._right);
      var lhs = String(this._left);
      return rev ? rhs + ' ＝ ' + lhs : lhs + ' ＝ ' + rhs;
    }
    _paintFormulas() {
      var ok = this._torque === 0;
      this._f1.textContent = ok ? this._formulaText(0) : this._left + ' ≠ ' + this._right;
      this._f2.textContent = ok ? this._formulaText(1) : '';
    }
    _paintWeights() {
      this._paintPan(this._pans.left, this._left, '#FB923C');
      this._paintPan(this._pans.right, this._right, '#38BDF8');
    }
    _paintPan(group, count, color) {
      group._coins.replaceChildren();
      for (var i = 0; i < count; i++) {
        group._coins.appendChild(el('circle', {
          class: 'weight', cx: -20 + (i % 5) * 10, cy: -7 - Math.floor(i / 5) * 14, r: 7,
          fill: color, stroke: 'rgba(15,23,42,.25)', 'stroke-width': 1
        }));
      }
    }
    _render() {
      var rad = this._theta * Math.PI / 180;
      var cos = Math.cos(rad), sin = Math.sin(rad);
      var lx = PX - ARM * cos, ly = PY - ARM * sin;
      var rx = PX + ARM * cos, ry = PY + ARM * sin;
      this._lever.setAttribute('transform',
        'rotate(' + this._theta.toFixed(3) + ' ' + PX + ' ' + PY + ')');
      this._pans.left.setAttribute('transform',
        'translate(' + lx.toFixed(2) + ',' + (ly + DROP).toFixed(2) + ')');
      this._pans.right.setAttribute('transform',
        'translate(' + rx.toFixed(2) + ',' + (ry + DROP).toFixed(2) + ')');
      this._needle.setAttribute('x2', (PX + 24 * sin).toFixed(2));
      this._needle.setAttribute('y2', (PY - 24 * cos).toFixed(2));
      this._svg.setAttribute('aria-label',
        '左盤 ' + this._left + '，右盤 ' + this._right + '，傾角 ' + this._theta.toFixed(1) + ' 度');
    }
    _emit(name, detail) {
      this.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true, composed: true }));
    }
  }

  if (!customElements.get('balance-beam')) {
    customElements.define('balance-beam', BalanceBeam);
  }
})();
