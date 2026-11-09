/* <thousand-value-box> — N-2-1 百位位值教具 (vanilla, no deps) */
(() => {
  "use strict";

  class ThousandValueBox extends HTMLElement {
    static get observedAttributes() { return ["hundreds", "tens", "ones"]; }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._expanded = false;
    }

    attributeChangedCallback() { if (this.shadowRoot.childNodes.length) this._render(); }
    connectedCallback() { this._render(); }

    get _h() { return Math.min(9, Math.max(0, parseInt(this.getAttribute("hundreds") || "0", 10) || 0)); }
    get _t() { return Math.min(9, Math.max(0, parseInt(this.getAttribute("tens") || "0", 10) || 0)); }
    get _o() { return Math.min(9, Math.max(0, parseInt(this.getAttribute("ones") || "0", 10) || 0)); }

    _num() { return this._h * 100 + this._t * 10 + this._o; }

    _blocks(v, w, h, fill, gap) {
      let s = "";
      for (let i = 0; i < v; i++) {
        const x = (i % 5) * (w + gap), y = Math.floor(i / 5) * (h + gap);
        if (w >= 30) { /* flat: show 10x10 grid */
          let lines = "";
          for (let g = 1; g < 10; g++) {
            lines += `<line x1="${(g * w / 10).toFixed(1)}" y1="0" x2="${(g * w / 10).toFixed(1)}" y2="${h}" stroke="rgba(0,100,90,.35)" stroke-width="1"/>`;
            lines += `<line x1="0" y1="${(g * h / 10).toFixed(1)}" x2="${w}" y2="${(g * h / 10).toFixed(1)}" stroke="rgba(0,100,90,.25)" stroke-width="1"/>`;
          }
          s += `<g transform="translate(${x},${y})"><rect width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#0b7a6e" stroke-width="1.5"/>${lines}</g>`;
        } else if (h >= 30) { /* rod: show 10 segments */
          let lines = "";
          for (let g = 1; g < 10; g++)
            lines += `<line x1="0" y1="${(g * h / 10).toFixed(1)}" x2="${w}" y2="${(g * h / 10).toFixed(1)}" stroke="rgba(150,70,0,.4)" stroke-width="1"/>`;
          s += `<g transform="translate(${x},${y})"><rect width="${w}" height="${h}" rx="2.5" fill="${fill}" stroke="#c26a00" stroke-width="1.5"/>${lines}</g>`;
        } else {
          s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="#a3852a" stroke-width="1.2"/>`;
        }
      }
      return s;
    }

    _render() {
      const h = this._h, t = this._t, o = this._o;
      const expanded = this._expanded;
      const parts = [];
      if (expanded) {
        if (h) parts.push(`${h} × 100`);
        parts.push(`${t} × 10`);
        parts.push(`${o} × 1`);
      }
      const valueLine = expanded
        ? (parts.length ? parts.join(" + ") : "0")
        : String(this._num());
      const btnLabel = expanded ? "收合為標準數" : "展開各位值";

      this.shadowRoot.innerHTML = `
<style>
:host{display:block;max-width:390px;margin:0 auto;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans TC",sans-serif;--green:#26a69a;--orange:#ff9800;--yellow:#ffe082}
.wrap{background:#f7fbfc;border:2px solid #d3e6ea;border-radius:14px;padding:10px 10px 8px;box-shadow:0 2px 8px rgba(23,90,100,.08)}
.header{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:8px}
.title{font-weight:700;font-size:14px;color:#17646e}
.card{background:#fff;border:1.5px solid #bfe0e6;border-radius:10px;padding:8px 10px;text-align:center;min-height:56px;display:flex;flex-direction:column;justify-content:center}
.value-line{font-size:24px;font-weight:800;color:#0d4d55;letter-spacing:1px;line-height:1.25}
.expand-line{font-size:15px;font-weight:600;color:#4a7c85;letter-spacing:.5px}
.card.exp .value-line{font-size:16px;color:#17646e}
.bins{display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px}
@media(min-width:560px){.bins{grid-template-columns:repeat(3,1fr)}.bin svg{height:120px}}
.bin{background:#fff;border:1.5px solid #dde;border-radius:10px;padding:6px}
.bin-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;margin-bottom:4px}
.bin-h{color:#0b7a6e}.bin-t{color:#c26a00}.bin-o{color:#8a6d1a}
.bin-val{color:#888;font-weight:500}
.bin svg{width:100%;height:120px;display:block}
.empty-bin{border-color:#e53935;background:#fff5f5}
.pulse{animation:pp 1.1s ease-in-out infinite}
@keyframes pp{0%,100%{opacity:.25}50%{opacity:1}}
.zwarn{font-size:13px;font-weight:800;fill:#e53935}
.hint{font-size:11px;color:#608a92;text-align:right;margin-top:2px}
</style>
<div class="wrap">
  <div class="header"><span class="title">🧮 位值箱 · ${this._num()}</span>
    <button class="btn" type="button">${btnLabel}</button></div>
  <div class="card ${expanded ? "exp" : ""}">
    <div class="${expanded ? "expand-line" : "value-line"}">${valueLine}</div>
  </div>
  ${this._binHTML("百位", h, "--green", this._blocks(h, 34, 34, "#7fd8cf", 4), false)}
  ${this._binHTML("十位", t, "--orange", this._blocks(t, 14, 70, "#ffc06b", 6), t === 0)}
  ${this._binHTML("個位", o, "--yellow", this._blocks(o, 13, 13, "#fff3c4", 4), false)}
  <div class="hint">${expanded ? `合起來 = ${this._num()}` : `各位值：${h}百 ${t}十 ${o}一`}</div>
</div>`;
      const btn = this.shadowRoot.querySelector("button");
      btn.addEventListener("click", () => { this._expanded = !this._expanded; this._render(); });
    }

    /* bin renderer kept inline for size */
    _binHTML(label, sv, colorVar, blocksSvg, empty) {
      const cls = { "--green": "bin-h", "--orange": "bin-t", "--yellow": "bin-o" }[colorVar];
      const cap = { 百位: "100", 十位: "10", 個位: "1" }[label];
      let inner;
      if (sv > 0) {
        inner = `<g transform="translate(14,8)">${blocksSvg}</g>`;
      } else {
        inner = `<rect class="pulse" x="5" y="5" width="88" height="112" rx="8" fill="none" stroke="#e53935" stroke-width="2.5" stroke-dasharray="7 5"/>
        <text x="50%" y="70" text-anchor="middle" class="zwarn">0 佔位不可漏！</text>`;
      }
      return `<div class="bin${empty ? " empty-bin" : ""}">
        <div class="bin-head"><span class="${cls}">${label}</span><span class="bin-val">${sv} × ${cap}</span></div>
        <svg viewBox="0 0 98 120" aria-hidden="true">${inner}</svg>
      </div>`;
    }

  }

  customElements.define("thousand-value-box", ThousandValueBox);
})();
