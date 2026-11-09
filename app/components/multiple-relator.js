/*
 * <multiple-relator> — N-2-7 乘法算式與倍數關係（二年級）
 * 純 vanilla Web Component，零依賴。
 * 屬性：base(1-9 被乘數/每份個數)、multiplier(1-9 乘數/份數)、item-label(預設「個」)、group-label(預設「盒」)
 * 功能：分群 SVG 視覺、標準公式高亮（每份個數×份數＝總數）、6×4 vs 4×6 物理意義對比陷阱開關。
 */
'use strict';
const MR_ESC = (s) => String(s).replace(/[<>&"]/g, '');

class MultipleRelator extends HTMLElement {
  static get observedAttributes() { return ['base', 'multiplier', 'item-label', 'group-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._trap = false;
  }

  connectedCallback() { this._render(); }
  attributeChangedCallback() { this._render(); }

  get base() {
    const v = parseInt(this.getAttribute('base'), 10);
    return Number.isFinite(v) ? Math.min(9, Math.max(1, v)) : 6;
  }
  get multiplier() {
    const v = parseInt(this.getAttribute('multiplier'), 10);
    return Number.isFinite(v) ? Math.min(9, Math.max(1, v)) : 4;
  }

  _svg(per, groups, il, gl) {
    const CS = 26;
    const pc = per <= 3 ? per : per <= 4 ? 2 : 3, pr = Math.ceil(per / pc);
    const gc = groups <= 3 ? groups : groups <= 6 ? 3 : 4, gr = Math.ceil(groups / gc);
    const BW = pc * CS + 8, BH = pr * CS + 10, G = 6;
    const W = gc * (BW + G) - G, H = gr * (BH + G) - G;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${groups}個${gl}，每個${gl}裝${per}${il}">`;
    for (let g = 0; g < groups; g++) {
      const gx = (g % gc) * (BW + G) + 3, gy = ((g / gc) | 0) * (BH + G) + 3;
      s += `<rect x="${gx}" y="${gy}" width="${BW}" height="${BH}" rx="7" fill="#fff7ed" stroke="#fb923c" stroke-width="1.5"/>`;
      for (let k = 0; k < per; k++) {
        const cx = gx + 4 + (k % pc) * CS + CS / 2, cy = gy + 5 + ((k / pc) | 0) * CS + CS / 2;
        s += `<circle cx="${cx}" cy="${cy}" r="8" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>`;
      }
    }
    return s + '</svg>';
  }

  _render() {
    const b = this.base, m = this.multiplier, t = b * m;
    const il = MR_ESC(this.getAttribute('item-label') || '個');
    const gl = MR_ESC(this.getAttribute('group-label') || '盒');
    const tr = this._trap;
    const per = tr ? m : b, gt = tr ? b : m;

    const scene =
      `<div class="scene">每${gl}裝 <b>${per}</b> ${il}，買了 <b>${gt}</b> ${gl}</div>` +
      this._svg(per, gt, il, gl);

    const fml =
      `<div class="fml">` +
      `<span class="term t1"><i>每份個數（被乘數）</i><b>${per}</b></span>` +
      `<span class="op">×</span>` +
      `<span class="term t2"><i>份數（乘數）</i><b>${gt}</b></span>` +
      `<span class="op">＝</span>` +
      `<span class="term t3"><i>總數（積）</i><b>${t}</b></span>` +
      `</div>`;

    const warn = tr
      ? `<div class="warnc">⚠️ 雖然 <b>${b}×${m}</b> 和 <b>${m}×${b}</b> 都等於 <b>${t}</b>，但物理意義完全不同！<br>` +
        `「每${gl}裝 ${b} ${il}、買 ${m} ${gl}」一定要寫成 <b>${b} × ${m}</b>，<b>不能</b>寫成 <b>${m} × ${b}</b>！</div>`
      : '';

    const btn =
      `<button class="tbtn" type="button" aria-pressed="${tr}">` +
      (tr ? `↩ 回到原本的擺法（${per} × ${gt}）` : `🔄 物理意義對比：${b}×${m} vs ${m}×${b}`) +
      `</button>`;

    this.shadowRoot.innerHTML =
      `<style>
:host{display:block;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;color:#1e293b;max-width:520px;margin:0 auto}
.w{background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:12px;text-align:center;box-sizing:border-box}
.scene{font-size:1rem;font-weight:700;margin-bottom:6px}
.scene b{color:#2563eb}
svg{width:100%;height:auto;max-width:440px}
.fml{display:flex;justify-content:center;align-items:center;gap:6px;margin:8px 0;flex-wrap:wrap}
.term{background:#eef2ff;border:2px solid #c7d2fe;border-radius:10px;padding:3px 10px;min-width:60px}
.term i{display:block;font-style:normal;font-size:10px;color:#475569;white-space:nowrap}
.term b{font-size:1.3rem}
.t1 b{color:#2563eb}.t2 b{color:#16a34a}.t3 b{color:#ea580c}
.op{font-size:1.3rem;font-weight:800}
.warnc{background:#fef2f2;border:2px dashed #ef4444;color:#b91c1c;border-radius:10px;padding:8px 10px;font-size:.82rem;margin-top:8px;text-align:left;line-height:1.5}
.tbtn{margin-top:10px;background:#ede9fe;border:2px solid #a78bfa;color:#6d28d9;font-weight:700;border-radius:999px;padding:8px 14px;cursor:pointer;font-size:.85rem}
.tbtn:active{transform:scale(.97)}
</style>` +
      `<div class="w">${scene}${fml}${warn}${btn}</div>`;

    this.shadowRoot.querySelector('.tbtn')
      .addEventListener('click', () => { this._trap = !this._trap; this._render(); });
  }
}

if (!customElements.get('multiple-relator')) {
  customElements.define('multiple-relator', MultipleRelator);
}
