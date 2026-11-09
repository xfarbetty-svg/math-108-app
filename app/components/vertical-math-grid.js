/* <vertical-math-grid> — 直式算架：加減直式、進位／退位、逐步演示 */
(() => {
  const CN = ["個位", "十位", "百位", "千位"];
  class VMG extends HTMLElement {
    static get observedAttributes() { return ["op", "num1", "num2"]; }
    constructor() {
      super();
      this.step = 0;
      this.root = this.attachShadow({ mode: "open" });
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.step = 0; if (this.isConnected) this.render(); }

    /* 逐欄計算：產生進位／退位記號資料 */
    calc() {
      const op = this.getAttribute("op") === "-" ? "-" : "+";
      const a = String(+this.getAttribute("num1") || 0).split("").map(Number).reverse();
      const b = String(+this.getAttribute("num2") || 0).split("").map(Number).reverse();
      const cols = [];
      let c = 0;
      const w = op === "+" ? Math.max(a.length, b.length) : a.length;
      for (let i = 0; i < w; i++) {
        const x = a[i] || 0, y = b[i] || 0;
        if (op === "+") {
          const s = x + y + c;
          cols.push({ a: x, b: y, r: s % 10, carry: s >= 10 });
          c = s >= 10 ? 1 : 0;
        } else {
          let d = x - c - y;
          const borrow = d < 0;
          if (borrow) d += 10;
          cols.push({ a: x, b: y, r: d, borrow, lent: !borrow && c === 1 });
          c = borrow ? 1 : 0;
        }
      }
      if (op === "+" && c) cols.push({ a: null, b: null, r: c, carryTop: true });
      return { op, a, b, cols, ans: op === "+" ? (+this.getAttribute("num1") || 0) + (+this.getAttribute("num2") || 0) : (+this.getAttribute("num1") || 0) - (+this.getAttribute("num2") || 0) };
    }

    caption(c) {
      const n = CN[c.place] || "更高位", t = `${n}：${c.a}${this.d.op}${c.b}`;
      if (this.d.op === "+") return c.carry ? `${t}=${c.a + c.b}，滿10進1` : `${t}=${c.a + c.b}`;
      if (c.borrow) return `${t} 不夠減，向${CN[c.place + 1] || "更高位"}借1`;
      if (c.lent) return `${t}，借出1要扣回：=${c.r}`;
      return `${t}=${c.r}`;
    }

    render() {
      const d = (this.d = this.calc()), cols = d.cols, n = cols.length;
      const CW = 34, L = 40, M = { mark: 18, top: 46, bot: 74, res: 106 };
      const W = L + n * CW + 4, H = 148;
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="直式計算 ${this.getAttribute("num1")} ${d.op} ${this.getAttribute("num2")}">`;
      for (let i = n - 1; i >= 0; i--) {
        const c = cols[i], x = L + i * CW, cx = x + CW / 2;
        const cur = i === this.step - 1, on = i < this.step;
        if (cur) s += `<rect x="${x + 1}" y="26" width="${CW - 2}" height="88" fill="#e8f1ff" rx="6"/>`;
        if (!on) continue;
        /* 進位記號：上一欄滿10時在本欄上方畫 +1 圓點 */
        if (d.op === "+" && i > 0 && cols[i - 1].carry)
          s += `<circle cx="${cx}" cy="${M.mark}" r="8" fill="#ff7043"/><text x="${cx}" y="${M.mark + 4}" text-anchor="middle" font-size="10" fill="#fff">+1</text>`;
        if (d.op === "-") {
          /* 退位：需借位的欄上方標 +10；借出的那位數劃掉並標 -1 */
          if (c.borrow) s += `<text x="${cx + 2}" y="${M.mark + 2}" font-size="12" font-weight="bold" fill="#e53935">+10</text>`;
          if (c.lent) s += `<line x1="${cx - 7}" y1="${M.top - 8}" x2="${cx + 7}" y2="${M.top + 8}" stroke="#e53935" stroke-width="2"/><text x="${cx + 10}" y="${M.top - 4}" font-size="11" fill="#e53935" font-weight="bold">-1</text>`;
        }
        const dg = (v, y, cls) => v === null ? "" : `<text x="${cx}" y="${y}" text-anchor="middle" font-size="22" font-family="sans-serif" fill="#1a2b4c" class="${cls || ""}">${v}</text>`;
        s += dg(c.a, M.top);
        s += dg(c.b, M.bot, "dim");
        s += dg(c.r, M.res, "res");
        if (i === n - 1 || (i === n - 1 && c.a === null)) s += `<text x="${L - 14}" y="${M.bot}" text-anchor="middle" font-size="22" font-family="sans-serif" fill="#1a2b4c">${d.op}</text>`;
      }
      s += `<line x1="${L - 28}" y1="84" x2="${W - 2}" y2="84" stroke="#1a2b4c" stroke-width="2"/><text x="${L - 34}" y="${M.res}" font-size="12" fill="#666">答</text></svg>
<style>:host{display:block;font-family:sans-serif}svg{width:100%;max-width:280px}text{user-select:none}.dim{fill:#7c8aa5!important}.res{fill:#1565c0!important;font-weight:bold}button{border:0;border-radius:8px;padding:6px 14px;background:#1565c0;color:#fff;font-size:14px;cursor:pointer}button:hover{background:#0d4ea6}p{margin:8px 0;font-size:14px;color:#333;min-height:20px}</style>
<p id="cap"></p>
<button>${this.step === 0 ? "逐步演示" : this.step >= n ? "重新演示" : "下一步"}</button>`;
      const cap = this.root.querySelector("#cap") || null;
      this.root.innerHTML = s;
      this.root.querySelector("button").onclick = () => {
        const total = this.d.cols.length;
        this.step = this.step >= total ? 0 : this.step + 1;
        this.render();
        if (this.step > 0 && this.step <= total) {
          const c = this.d.cols[this.step - 1];
          c.place = this.step - 1;
          this.root.querySelector("#cap").textContent = this.caption(c);
        } else if (this.step >= total) this.root.querySelector("#cap").textContent = `答案：${this.getAttribute("num1")} ${this.d.op} ${this.getAttribute("num2")} = ${this.d.ans}`;
        this.dispatchEvent(new CustomEvent("gridstep", { detail: { step: this.step, total }, bubbles: true }));
      };
      if (this.step > 0 && this.step <= cols.length) {
        const c = cols[this.step - 1];
        c.place = this.step - 1;
        this.root.querySelector("#cap").textContent = this.caption(c);
      }
    }
  }
  customElements.define("vertical-math-grid", VMG);
})();
