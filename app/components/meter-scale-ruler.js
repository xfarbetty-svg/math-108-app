/* <meter-scale-ruler> N-2-11 長度：公尺與公分 · 1公尺=100公分 · 斷尺測量
   Vanilla Web Component (no dependencies). Unit page: app/unit_n211.html */
(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const PX = 8; // 1cm -> 8 SVG units, 100cm -> 800
function s(n, attrs, txt) {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (txt != null) e.textContent = txt;
  return e;
}
class MeterScaleRuler extends HTMLElement {
  static get observedAttributes() { return ['start', 'end', 'target-name']; }
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    const r = this.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
:host{display:block;max-width:100%;font-family:"Noto Sans TC",system-ui,sans-serif}
.wrap{border:2px solid #4f86f7;border-radius:12px;background:#fff;padding:10px;box-sizing:border-box}
svg{width:100%;height:auto;display:block}
.bar{fill:#ffb84d;stroke:#e8871e;stroke-width:1.5;opacity:.92}
.barT{font-size:12px;font-weight:bold;fill:#8a4b00}
.ruler{fill:#fff3d6;stroke:#b8860b;stroke-width:2}
.tick{stroke:#6b4c11;stroke-width:1}
.mid{stroke:#6b4c11;stroke-width:1.5}
.maj{stroke:#a03018;stroke-width:2.5}
.num{font-size:11px;fill:#333;text-anchor:middle}
.m50{fill:#a03018;font-weight:bold}
.m100{fill:#a03018;font-weight:bold}
.unit{font-size:10px;fill:#a03018;font-weight:bold;text-anchor:end}
.read{margin-top:8px;font-size:16px;font-weight:bold;color:#1d4ed8;text-align:center}
.warn{margin-top:6px;display:none;font-size:13px;color:#b91c1c;background:#fee2e2;border-radius:8px;padding:6px 8px;text-align:center;line-height:1.5}
.warn.on{display:block}
.ftn{display:block;font-size:15px}
.btn{margin-top:8px;display:block;width:100%;border:none;border-radius:8px;background:#4f86f7;color:#fff;font-size:14px;padding:8px 0;cursor:pointer}
.btn:active{background:#2f66d7}
@media(min-width:700px){.read,.warn{font-size:15px}}
</style>
<div class="wrap">
<svg id="sv" viewBox="0 0 800 132" role="img" aria-label="公尺刻度尺"></svg>
<div id="read" class="read"></div>
<div id="warn" class="warn"></div>
<button id="tog" class="btn" type="button">單位轉換 (公尺/公分)</button>
</div>`;
    this._svg = r.getElementById('sv');
    this._read = r.getElementById('read');
    this._warn = r.getElementById('warn');
    this._m = false; // metric (公尺+公分) mode
    r.getElementById('tog').addEventListener('click', () => {
      this._m = !this._render();
    });
    this._render();
  }
  attributeChangedCallback() { if (this._built) this._render(); }
  get lengthCm() { const e = +this.getAttribute('end') || 0, s2 = +this.getAttribute('start') || 0; return Math.max(0, e - s2); }
  _render() {
    const start = +this.getAttribute('start') || 0;
    const end = +this.getAttribute('end') || 0;
    const name = this.getAttribute('target-name') || '物品';
    const L = Math.max(0, end - start);
    const g = this._svg; g.textContent = '';
    // measured object bar above the ruler
    if (end > start) {
      g.appendChild(s('rect', { class: 'bar', x: start * PX, y: 8, width: (end - start) * PX, height: 22, rx: 10 }));
      const lb = Math.min(Math.max(end - start, 4), 90);
      g.appendChild(s('text', { class: 'barT', x: (start + lb / 2) * PX, y: 23, 'text-anchor': 'middle' }, name));
    }
    // ruler body
    g.appendChild(s('rect', { class: 'ruler', x: 0, y: 34, width: 800, height: 62, rx: 4 }));
    for (let cm = 0; cm <= 100; cm++) {
      const x = cm * PX;
      if (cm % 10 === 0) {
        g.appendChild(s('line', { class: 'maj', x1: x, y1: 34, x2: x, y2: 60 }));
        if (cm === 100) {
          g.appendChild(s('text', { class: 'num m100', x: x, y: 78 }, '100'));
          g.appendChild(s('text', { class: 'unit', x: x, y: 92 }, '1公尺/1m'));
        } else {
          const t = s('text', { class: 'num' + (cm === 50 ? ' m50' : ''), x: x, y: 78 }, String(cm));
          g.appendChild(t);
          if (cm === 50) g.appendChild(s('text', { class: 'unit m50', x: x, y: 92 }, '50cm'));
        }
      } else if (cm % 5 === 0) {
        g.appendChild(s('line', { class: 'mid', x1: x, y1: 34, x2: x, y2: 55 }));
      } else {
        g.appendChild(s('line', { class: 'tick', x1: x, y1: 34, x2: x, y2: 50 }));
      }
    }
    g.appendChild(s('text', { class: 'num', x: 396, y: 90 }, '單位：公分'));
    // readout + broken-ruler pedagogy
    if (start > 0) {
      this._read.innerHTML = `實際長度：<span class="ftn">終點 ${end} − 起點 ${start} = ${L} 公分</span>`;
      this._warn.classList.add('on');
      this._warn.textContent = `⚠ 起點不是 0！刻度上的 ${end} 只是「終點位置」，長度要相減，不能只讀終點刻度！`;
    } else {
      this._read.textContent = `長度：${L} 公分`;
      this._warn.classList.remove('on');
    }
    if (this._m) {
      const m2 = Math.floor(L / 100), r2 = L % 100;
      this._read.textContent = `長度：${m2 > 0 ? m2 + ' 公尺 ' : ''}${r2} 公分（=${L} 公分）`;
    }
    return this._m;
  }
}
customElements.define('meter-scale-ruler', MeterScaleRuler);
})();
