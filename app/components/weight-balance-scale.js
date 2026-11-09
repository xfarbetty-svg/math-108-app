/*! <weight-balance-scale> N-2-12 圓盤指針式磅秤｜vanilla web component，零依賴 */
'use strict';
class WBS extends HTMLElement {
  static get observedAttributes() { return ['weight-g', 'tare-offset', 'item-name']; }
  connectedCallback() {
    if (!this._i) {
      this._i = 1; this._u = 0; this._x = 0;
      const s = this.attachShadow({ mode: 'open' });
      s.innerHTML = `<style>
:host{display:block;max-width:400px;margin:0 auto;font-family:"Noto Sans TC",system-ui,sans-serif}
.big{font-size:1.65rem;font-weight:800;text-align:center;color:#17324d;letter-spacing:.5px;line-height:1.4}
.sub{text-align:center;color:#5b7185;font-size:.9rem;margin-top:2px}
.row{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap}
button{border:0;border-radius:999px;padding:9px 14px;font-size:.92rem;font-weight:700;cursor:pointer;color:#fff}
#bu{background:#2e7d32}#bt{background:#e65100}
button:active{transform:scale(.96)}
.warn{display:none;margin:10px auto 0;padding:10px 12px;border:3px solid #e53935;border-radius:12px;background:#fff5f5;color:#c62828;font-weight:800;text-align:center;animation:pl 1s infinite}
.on{display:block}
@keyframes pl{0%,100%{box-shadow:0 0 0 2px rgba(229,57,53,.75)}50%{box-shadow:0 0 0 12px rgba(229,57,53,0)}}
.trap{margin:10px auto 0;padding:12px 14px;border-radius:12px;background:#fff8e1;border:2px dashed #f9a825;color:#5d4037;line-height:1.75;font-size:.95rem}
.trap b{color:#c62828}
ol{margin:6px 0 4px;padding-left:1.3em;text-align:left}
.badge{background:#e65100;color:#fff;border-radius:6px;padding:1px 7px;font-size:.82rem}
.tg{animation:bl 1s infinite}
@keyframes bl{50%{opacity:.25}}
svg text{font-family:inherit}
</style><div id="w"></div>`;
      s.addEventListener('click', e => {
        const i = e.target.id;
        if (i === 'bu') { this._u ^= 1; this.r(); }
        else if (i === 'bt') { this._x ^= 1; this.r(); }
      });
    }
    this.r();
  }
  attributeChangedCallback() { if (this._i) this.r(); }
  get w() { const q = +this.getAttribute('weight-g'); return isNaN(q) ? 450 : Math.max(0, q); }
  get t() { const q = +this.getAttribute('tare-offset'); return isNaN(q) ? 0 : Math.max(0, q); }
  get n() { return this.getAttribute('item-name') || '高麗菜'; }
  r() {
    const w = this.w, t = this.t, n = this.n, rd = w + t, cx = 100, cy = 120,
      ang = v => (Math.min(Math.max(v, 0), 1000) / 1000) * 240 - 120,
      P = d => d * Math.PI / 180,
      f = x => x.toFixed(1);
    let dm = '', dM = '', lb = '';
    for (let v = 10; v < 1000; v += 10) {
      const a = P(ang(v)), s = Math.sin(a), c = Math.cos(a), r1 = v % 50 ? 58 : 61;
      dm += `M${f(cx + s * r1)} ${f(cy - c * r1)}L${f(cx + s * 74)} ${f(cy - c * 74)}`;
    }
    for (let v = 0; v <= 1000; v += 100) {
      const a = P(ang(v)), s = Math.sin(a), c = Math.cos(a);
      dM += `M${f(cx + s * 64)} ${f(cy - c * 64)}L${f(cx + s * 74)} ${f(cy - c * 74)}`;
      const x = f(cx + s * 50), y = f(cy - c * 50 + 3.4);
      lb += v === 1000
        ? `<text x="${x}" y="${f(cy - c * 47)}" text-anchor="middle" font-size="8" font-weight="700" fill="#d32f2f">1000<tspan x="${x}" dy="9">1公斤</tspan></text>`
        : `<text x="${x}" y="${y}" text-anchor="middle" font-size="9.5" font-weight="${v === 500 ? '800' : '600'}" fill="${v === 500 ? '#d32f2f' : '#37474f'}">${v}</text>`;
    }
    const na = P(ang(t)),
      tmk = t ? `<g class="tg"><line x1="${f(cx + Math.sin(na) * 66)}" y1="${f(cy - Math.cos(na) * 66)}" x2="${f(cx + Math.sin(na) * 78)}" y2="${f(cy - Math.cos(na) * 78)}" stroke="#e53935" stroke-width="4" stroke-linecap="round"/></g>` : '',
      needle = `<g transform="rotate(${f(ang(rd))} ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="58" stroke="#d32f2f" stroke-width="3.5" stroke-linecap="round"/><polygon points="96,60 104,60 100,47" fill="#d32f2f"/></g>`;
    const mix = v => v >= 1000 ? (v % 1000 ? `${v / 1000 | 0} 公斤 ${v % 1000} 公克` : `${v / 1000 | 0} 公斤 (kg)`) : '',
      big = this._u ? (mix(w) || `未滿 1 公斤（${w} 公克）`) : `${w} 公克 (g)`,
      hint = !this._u && w >= 1000 ? `＝ ${mix(w)}` : '',
      sub = `磅秤讀數：${rd} g${t ? `（含未歸零誤差 ${t} g）` : ''}${rd > 1000 ? ' ⚠️超出錶面' : ''}`;
    this.shadowRoot.getElementById('w').innerHTML = `
<svg class="dial" style="width:100%;height:auto;display:block" viewBox="0 -10 200 212" role="img" aria-label="指針式磅秤">
 <ellipse cx="100" cy="4" rx="27" ry="12" fill="#ff8a65" stroke="#d84315" stroke-width="1.5"/>
 <text x="100" y="8" text-anchor="middle" font-size="10.5" font-weight="800" fill="#4e2000">${n}</text>
 <rect x="55" y="14" width="90" height="11" rx="5.5" fill="#b0bec5" stroke="#78909c"/>
 <path d="M66 25v20M134 25v20" stroke="#90a4ae" stroke-width="5" stroke-linecap="round"/>
 <circle cx="${cx}" cy="${cy}" r="79" fill="none" stroke="#37474f" stroke-width="7"/>
 <circle cx="${cx}" cy="${cy}" r="74" fill="#fff" stroke="#cfd8dc"/>
 <path d="${dm}" fill="none" stroke="#b0bec5" stroke-width="1.4"/>
 <path d="${dM}" fill="none" stroke="#546e7a" stroke-width="2.8"/>
 ${lb}${tmk}${needle}
 <circle cx="${cx}" cy="${cy}" r="7" fill="#37474f" stroke="#fff" stroke-width="2"/>
 <text x="${cx}" y="166" text-anchor="middle" font-size="12.5" font-weight="800" fill="#263238">讀數：${rd} g</text>
 ${t ? `<text x="${cx}" y="182" text-anchor="middle" font-size="10" font-weight="700" fill="#e53935" class="tg">指針起點：${t} g（未歸零）</text>` : ''}
</svg>
<div class="big">${big}</div>
<div class="sub">${hint ? hint + '<br>' : ''}${sub}</div>
<div class="row"><button id="bu" type="button">單位換算 (公斤/公克)</button><button id="bt" type="button">陷阱解密 🕵️ 未歸零指針校準</button></div>
${t ? `<div class="warn on">⚠️ 磅秤放東西前沒歸零，必須減掉原本的刻度！<br>實際重量 ＝ 讀數 ${rd}g － 歸零誤差 ${t}g ＝ ${w}g</div>` : ''}
${this._x ? `<div class="trap">🔍 <span class="badge">陷阱解密｜未歸零指針校準</span><br>${t ? `<ol><li>放東西前：指針已指在 <b>${t} g</b> → 這就是「歸零誤差」</li><li>放東西後：指針指在 <b>${rd} g</b>（讀數＝物重＋誤差）</li><li>實際重量 ＝ 讀數 ${rd} − 誤差 ${t} ＝ <b>${w} 公克</b></li></ol>💡 放東西前要先「歸零」，不然讀數會<strong>灌水</strong>！` : `這台磅秤<b>已正確歸零</b>：指針從 0 開始，讀數即實際重量。<br>👉 想看陷阱？把「未歸零誤差 (tare)」調到大於 0！`}</div>` : ''}`;
  }
}
customElements.define('weight-balance-scale', WBS);
