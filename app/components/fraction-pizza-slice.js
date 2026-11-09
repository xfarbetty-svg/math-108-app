/* fraction-pizza-slice.js — N-2-3 分數之初步認識
 * Vanilla Web Component (no dependencies). <= 12KB.
 * Attributes:
 *   denominator   : 2 | 3 | 4 | 6 | 8   (slices count)
 *   selected-slices : number (default 1) — count of slices highlighted from slice 0
 *   fair          : "true" (equal) | "false" (unequal, pedagogy trap)
 */
(() => {
  "use strict";
  const CN = { 2: "二分之一", 3: "三分之一", 4: "四分之一", 6: "六分之一", 8: "八分之一" };
  const OK = [2, 3, 4, 6, 8];
  const CRUST = "#d97706", DOUGH = "#fbbf24", CHEESE = "#f59e0b", PEPPER = "#b45309";

  const TPL = document.createElement("template");
  TPL.innerHTML = `
<style>
:host{display:block;max-width:340px;margin:0 auto;font-family:"Microsoft JhengHei",system-ui,sans-serif}
.card{background:#fffbeb;border:2px solid #fcd34d;border-radius:16px;padding:10px 12px;text-align:center}
svg{width:100%;height:auto;display:block;touch-action:manipulation}
.slice{cursor:pointer;transition:fill .2s}
.slice.sel{fill:${CHEESE}}
.slice:not(.sel):hover{fill:#fde68a}
.badge{display:inline-block;margin-top:6px;padding:4px 12px;border-radius:999px;font-weight:700;font-size:15px;line-height:1.4}
.fair{background:#dcfce7;color:#166534;border:2px solid #86efac}
.trap{background:#fee2e2;color:#b91c1c;border:2px dashed #ef4444;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
.caption{margin-top:6px;font-size:14px;color:#78350f}
.fr{font-size:18px;font-weight:800;color:#92400e}
.fr .num{text-decoration:overline}
.outline{fill:none;stroke:#ef4444;stroke-width:4;stroke-dasharray:10 7;animation:dash 1s linear infinite}
@keyframes dash{to{stroke-dashoffset:-34}}
</style>
<div class="card" part="card">
  <svg viewBox="0 0 200 200" role="img" aria-label="披薩平分示意圖"></svg>
  <div class="badge"></div>
  <div class="caption"></div>
</div>`;

  class FractionPizzaSlice extends HTMLElement {
    static get observedAttributes() { return ["denominator", "selected-slices", "fair"]; }
    constructor() {
      super();
      this._sr = this.attachShadow({ mode: "open" });
      this._sr.appendChild(TPL.content.cloneNode(true));
      this._svg = this._sr.querySelector("svg");
      this._badge = this._sr.querySelector(".badge");
      this._cap = this._sr.querySelector(".caption");
      this._d = 4; this._sel = 1; this._fair = true;
    }
    attributeChangedCallback(n, ov, nv) {
      if (ov === nv) return;
      if (n === "denominator") { const v = parseInt(nv, 10); this._d = OK.includes(v) ? v : 4; }
      else if (n === "selected-slices") { const v = parseInt(nv, 10); this._sel = Number.isFinite(v) && v >= 0 ? Math.min(v, this._d) : 1; }
      else if (n === "fair") { this._fair = String(nv).trim().toLowerCase() !== "false"; }
      if (this.isConnected) this._render();
    }
    connectedCallback() { this._render(); }

    /* Unequal angles for the trap mode: deterministic uneven division summing to 360 */
    _unequalAngles(d) {
      const base = 360 / d, gaps = [];
      let used = 0;
      for (let i = 0; i < d; i++) {
        const jitter = ((i * 37) % 21) - 10; // -10..10 deterministic
        let a = base + jitter;
        if (i === d - 1) a = 360 - used;
        a = Math.max(12, a);
        gaps.push(a); used += a;
      }
      const k = 360 / used; // renormalize to exactly 360
      return gaps.map(g => g * k);
    }

    _pt(r, aDeg) {
      const a = (aDeg - 90) * Math.PI / 180;
      return [100 + r * Math.cos(a), 100 + r * Math.sin(a)].map(v => +v.toFixed(2));
    }

    _render() {
      const d = this._d, sel = Math.min(this._sel, d), fair = this._fair;
      const angles = fair ? Array(d).fill(360 / d) : this._unequalAngles(d);
      let acc = 0, svg = `<circle cx="100" cy="100" r="97" fill="${CRUST}"/>`;
      for (let i = 0; i < d; i++) {
        const a0 = acc, a1 = acc + angles[i]; acc = a1;
        const [x0, y0] = this._pt(92, a0), [x1, y1] = this._pt(92, a1);
        const large = angles[i] > 180 ? 1 : 0;
        const on = fair && i < sel ? " sel" : "";
        const fill = on ? "" : ` fill="${DOUGH}"`;
        svg += `<path class="slice${on}" data-i="${i}" d="M100 100 L${x0} ${y0} A92 92 0 ${large} 1 ${x1} ${y1} Z"${fill}/>`;
        if (!on) { // toppings only on plain slices
          const [tx, ty] = this._pt(70, (a0 + a1) / 2);
          svg += `<circle cx="${tx}" cy="${ty}" r="4.5" fill="${PEPPER}" pointer-events="none"/>`;
        }
      }
      if (!fair) svg += `<circle class="outline" cx="100" cy="100" r="95" pointer-events="none"/>`;
      this._svg.innerHTML = svg;
      this._svg.querySelectorAll(".slice").forEach(p =>
        p.addEventListener("click", () => {
          if (!fair) return;
          const i = +p.dataset.i;
          this._sel = (sel === i + 1) ? i : i + 1; // toggle grow/shrink
          this.setAttribute("selected-slices", this._sel);
          this.dispatchEvent(new CustomEvent("slice-change", { detail: { selected: this._sel }, bubbles: true, composed: true }));
        })
      );
      if (fair) {
        const cn = CN[d];
        const label = sel === 1 ? `1 / ${d}` : `${sel} / ${d}`;
        this._badge.className = "badge fair";
        this._badge.textContent = `${label} 塊披薩`;
        this._cap.innerHTML = sel === 1
          ? `平分成 <span class="fr"><span class="num">${d}</span></span> 份，其中的 1 份是 <span class="fr">${cn}</span>`
          : `平分成 <span class="fr"><span class="num">${d}</span></span> 份，選了 <span class="fr">${sel}</span> 份，是 <span class="fr">${sel} 個 1/${d}</span>`;
      } else {
        this._badge.className = "badge trap";
        this._badge.textContent = "⚠️ 每份大小不同，不是平分！不能用分數表示！";
        this._cap.textContent = "分數的前提：每一份都要一樣大（平分）！";
      }
    }
  }
  customElements.define("fraction-pizza-slice", FractionPizzaSlice);
})();
