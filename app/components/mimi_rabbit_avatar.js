/* mimi_rabbit_avatar.js — 咪咪小白兔 SVG 角色組件 (G3-N-3-9 概念小教室)
 * 四大狀態：normal(揮手打招呼) / confused(垂耳困惑) / eureka(燈泡頓悟) / happy(跳躍歡慶)
 * 用法：<mimi-rabbit state="normal"></mimi-rabbit>
 *      el.setState('eureka') / el.getState() / 事件 'state-change'
 * 純向量 SVG、零外部資源、離線可用。 */
(function () {
  'use strict';

  var STATES = ['normal', 'confused', 'eureka', 'happy'];

  var CSS = [
    ':host{display:block;width:100%;max-width:200px;margin:0 auto}',
    'svg{display:block;width:100%;height:auto;overflow:visible}',
    '.ear-l,.ear-r{transform-box:fill-box;transform-origin:50% 92%}',
    /* normal：雙耳直立微晃 + 右手揮手 */
    '[state="normal"] .ear-l{animation:mimi-ear-sway 2.6s ease-in-out infinite}',
    '[state="normal"] .ear-r{animation:mimi-ear-sway 2.6s ease-in-out infinite reverse}',
    '[state="normal"] .paw-wave{transform-box:fill-box;transform-origin:20% 90%;animation:mimi-wave .9s ease-in-out infinite}',
    /* confused：雙耳 45 度垂落 + 問號旋轉 */
    '[state="confused"] .ear-l{transform:rotate(46deg)}',
    '[state="confused"] .ear-r{transform:rotate(-46deg)}',
    '[state="confused"] .qmark{transform-box:fill-box;transform-origin:center;animation:mimi-spin 3.2s linear infinite}',
    /* eureka：雙耳豎起彈跳 + 燈泡星芒 */
    '[state="eureka"] .ear-l,[state="eureka"] .ear-r{animation:mimi-ear-pop .55s cubic-bezier(.34,1.56,.64,1) both}',
    '[state="eureka"] .bulb{transform-box:fill-box;transform-origin:center;animation:mimi-bulb 1.1s ease-in-out infinite}',
    '[state="eureka"] .rays{transform-box:fill-box;transform-origin:center;animation:mimi-spin 6s linear infinite}',
    /* happy：雙手高舉 + 跳躍 */
    '[state="happy"] .body{transform-box:fill-box;transform-origin:center;animation:mimi-hop .8s ease-in-out infinite}',
    '[state="happy"] .paw-l{transform:translate(-4px,-16px) rotate(-28deg)}',
    '[state="happy"] .paw-r{transform:translate(4px,-16px) rotate(28deg)}',
    '[state="happy"] .paw-l,[state="happy"] .paw-r{transform-box:fill-box;transform-origin:center;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}',
    '[state="happy"] .spark{transform-box:fill-box;transform-origin:center;animation:mimi-twinkle 1.2s ease-in-out infinite}',
    '[state="happy"] .spark.s2{animation-delay:.3s}[state="happy"] .spark.s3{animation-delay:.6s}',
    '@keyframes mimi-ear-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}',
    '@keyframes mimi-wave{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-26deg)}}',
    '@keyframes mimi-spin{to{transform:rotate(360deg)}}',
    '@keyframes mimi-ear-pop{0%{transform:scale(.9) rotate(10deg)}60%{transform:scale(1.12) rotate(-6deg)}100%{transform:scale(1)}}',
    '@keyframes mimi-bulb{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}',
    '@keyframes mimi-hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-9px)}}',
    '@keyframes mimi-twinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
  ].join('');

  function el(name, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  class MimiRabbit extends HTMLElement {
    constructor() {
      super();
      if (this.isConnected) this._build();
    }
    connectedCallback() {
      if (!this._svg) this._build();
    }
    _build() {
      var state = this.getAttribute('state');
      if (!state || STATES.indexOf(state) < 0) { state = 'normal'; this.setAttribute('state', state); }
    var root = this.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);

    var svg = el('svg', {
      viewBox: '0 0 200 210',
      role: 'img',
      'aria-label': '咪咪小白兔角色',
      state: this.getAttribute('state')
    });
    this._svg = svg;
    root.appendChild(svg);

    /* ---------- 頭頂配件層（畫在耳朵之後蓋上） ---------- */
    var acc = el('g', { class: 'accessories' }, svg);

    // confused：旋轉問號
    var q = el('g', { class: 'qmark' }, acc);
    el('text', {
      x: 158, y: 40, 'font-size': 34, 'font-weight': 900, fill: '#8a857b',
      'text-anchor': 'middle', 'font-family': 'system-ui,"Microsoft JhengHei",sans-serif'
    }, q).textContent = '?';

    // eureka：金黃燈泡 + 星芒光暈
    var bulb = el('g', { class: 'bulb' }, acc);
    var rays = el('g', { class: 'rays' }, bulb);
    for (var i = 0; i < 8; i++) {
      var a = (Math.PI * 2 / 8) * i;
      el('line', {
        x1: 150 + Math.cos(a) * 17, y1: 34 + Math.sin(a) * 17,
        x2: 150 + Math.cos(a) * 24, y2: 34 + Math.sin(a) * 24,
        stroke: '#ffd166', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .8
      }, rays);
    }
    el('circle', { cx: 150, cy: 34, r: 10, fill: '#ffe08a', stroke: '#d9910d', 'stroke-width': 2 }, bulb);
    el('rect', { x: 146, y: 43, width: 8, height: 5, rx: 1.5, fill: '#d9910d' }, bulb);

    // happy：星光點點
    [[22, 52, 's1'], [178, 88, 's2'], [40, 24, 's3']].forEach(function (p) {
      var sp = el('g', { class: 'spark ' + p[2] }, acc);
      el('path', {
        d: 'M' + p[0] + ' ' + (p[1] - 6) + ' L' + (p[0] + 2) + ' ' + (p[1] - 2) +
           ' L' + (p[0] + 6) + ' ' + p[1] + ' L' + (p[0] + 2) + ' ' + (p[1] + 2) +
           ' L' + p[0] + ' ' + (p[1] + 6) + ' L' + (p[0] - 2) + ' ' + (p[1] + 2) +
           ' L' + (p[0] - 6) + ' ' + p[1] + ' L' + (p[0] - 2) + ' ' + (p[1] - 2) + ' Z',
        fill: '#ffd166', opacity: .9
      }, sp);
    });

    /* ---------- 耳朵（外白內粉，垂耳/豎耳由 CSS 狀態驅動） ---------- */
    var earL = el('g', { class: 'ear-l' }, svg);
    el('ellipse', { cx: 74, cy: 58, rx: 13, ry: 40, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2.5 }, earL);
    el('ellipse', { cx: 74, cy: 62, rx: 6.5, ry: 28, fill: '#ffc7d4' }, earL);
    var earR = el('g', { class: 'ear-r' }, svg);
    el('ellipse', { cx: 126, cy: 58, rx: 13, ry: 40, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2.5 }, earR);
    el('ellipse', { cx: 126, cy: 62, rx: 6.5, ry: 28, fill: '#ffc7d4' }, earR);

    /* ---------- 身體 + 頭 ---------- */
    var body = el('g', { class: 'body' }, svg);
    el('ellipse', { cx: 100, cy: 172, rx: 34, ry: 26, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2.5 }, body);
    el('ellipse', { cx: 100, cy: 178, rx: 15, ry: 12, fill: '#fff2f5' }, body);
    el('circle', { cx: 100, cy: 120, r: 40, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2.5 }, body);

    /* ---------- 眼睛（依狀態切換：水汪汪 / 點點困惑 / 月牙笑眼） ---------- */
    var eyesNormal = el('g', { class: 'eyes eyes-normal' }, body);
    [84, 116].forEach(function (cx) {
      el('circle', { cx: cx, cy: 118, r: 8.5, fill: '#3d3a34' }, eyesNormal);
      el('circle', { cx: cx - 2.5, cy: 115, r: 3, fill: '#ffffff' }, eyesNormal);
      el('circle', { cx: cx + 3, cy: 121, r: 1.6, fill: '#ffffff', opacity: .85 }, eyesNormal);
    });

    var eyesConfused = el('g', { class: 'eyes eyes-confused' }, body);
    [84, 116].forEach(function (cx) {
      el('circle', { cx: cx, cy: 118, r: 4.5, fill: '#3d3a34' }, eyesConfused);
      el('circle', { cx: cx, cy: 118, r: 8, fill: 'none', stroke: '#3d3a34', 'stroke-width': 1.6, opacity: .35 }, eyesConfused);
    });

    var eyesHappyArc = el('g', { class: 'eyes eyes-arc' }, body);
    [84, 116].forEach(function (cx) {
      el('path', {
        d: 'M' + (cx - 8) + ' 121 Q' + cx + ' 109 ' + (cx + 8) + ' 121',
        fill: 'none', stroke: '#3d3a34', 'stroke-width': 3.6, 'stroke-linecap': 'round'
      }, eyesHappyArc);
    });

    /* ---------- 腮紅、鼻嘴 ---------- */
    el('ellipse', { cx: 72, cy: 132, rx: 6, ry: 4, fill: '#ffb7c5', opacity: .75 }, body);
    el('ellipse', { cx: 128, cy: 132, rx: 6, ry: 4, fill: '#ffb7c5', opacity: .75 }, body);
    el('path', { d: 'M96 130 L104 130 L100 135 Z', fill: '#ff9db2' }, body);
    var mouth = el('path', {
      d: 'M94 139 Q100 145 106 139', fill: 'none', stroke: '#3d3a34',
      'stroke-width': 2.2, 'stroke-linecap': 'round'
    }, body);

    /* ---------- 手掌（paw-wave 右手揮手；happy 雙手高舉） ---------- */
    var pawL = el('ellipse', { class: 'paw-l', cx: 62, cy: 162, rx: 9, ry: 12, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2 }, svg);
    var pawR = el('g', { class: 'paw-r' }, svg);
    var pawRInner = el('ellipse', { cx: 142, cy: 150, rx: 9, ry: 12, fill: '#ffffff', stroke: '#e3d9c8', 'stroke-width': 2 }, pawR);
    pawRInner.setAttribute('class', 'paw-wave');

    /* ---------- 依目前狀態做眼睛切換 ---------- */
    this._applyEyes(this.getAttribute('state'));
    this._mouth = mouth;
  }

    _applyEyes(state) {
      var svg = this._svg;
      if (!svg) return;
      // 眼睛映射：normal→水汪汪大眼、confused→圓點困惑眼、eureka/happy→月牙笑眼
      var show = {
        '.eyes-normal': state === 'normal',
        '.eyes-confused': state === 'confused',
        '.eyes-arc': state === 'eureka' || state === 'happy'
      };
      Object.keys(show).forEach(function (sel) {
        var g = svg.querySelector(sel);
        if (g) g.style.display = show[sel] ? '' : 'none';
      });
    }

    setState(state) {
      if (STATES.indexOf(state) < 0) throw new Error('[mimi-rabbit] 未知狀態: ' + state);
      if (this.getAttribute('state') === state) return state;
      this.setAttribute('state', state);
      if (this._svg) this._svg.setAttribute('state', state);
      this._applyEyes(state);
      this.dispatchEvent(new CustomEvent('state-change', {
        detail: { state: state }, bubbles: true, composed: true
      }));
      return state;
    }

    getState() {
      return this.getAttribute('state');
    }

    attributeChangedCallback(name, oldV, newV) {
      if (name !== 'state') return;
      if (STATES.indexOf(newV) < 0) throw new Error('[mimi-rabbit] 未知狀態: ' + newV);
      if (this._svg) { this._svg.setAttribute('state', newV); this._applyEyes(newV); }
    }
  }

  MimiRabbit.observedAttributes = ['state'];

  if (!customElements.get('mimi-rabbit')) {
    customElements.define('mimi-rabbit', MimiRabbit);
  }
  window.MimiRabbitStates = STATES.slice();
})();
