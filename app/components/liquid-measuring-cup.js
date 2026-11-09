/* <liquid-measuring-cup> — Grade 2 N-2-4 容量：公升與毫升
   Attributes: volume-ml (0~1000, default 500), liquid-name (default "水") */
(() => {
  const T = document.createElement('template');
  T.innerHTML = `
<style>
  :host{display:block;font-family:"Noto Sans TC",system-ui,sans-serif;max-width:300px;margin:0 auto;color:#1e293b}
  .wrap{background:linear-gradient(180deg,#f0f9ff,#e0f2fe);border:2px solid #7dd3fc;border-radius:16px;padding:12px 10px 10px;text-align:center}
  svg{display:block;width:100%;height:auto}
  .badge{margin:6px auto 4px;display:inline-block;background:#0369a1;color:#fff;font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px}
  .read{font-size:18px;font-weight:800;color:#0c4a6e;margin:2px 0 8px}
  button{font-family:inherit;font-size:13px;font-weight:700;color:#0c4a6e;background:#fff;border:2px solid #0284c7;border-radius:999px;padding:6px 14px;cursor:pointer}
  button:active{background:#bae6fd}
  button.on{background:#0284c7;color:#fff}
</style>
<div class="wrap">
  <svg viewBox="0 0 240 330" role="img" aria-label="量杯">
    <clipPath id="cupClip"><path id="clipShape" d=""/></clipPath>
    <!-- 液體 -->
    <rect id="liquid" x="62" y="0" width="116" height="0" clip-path="url(#cupClip)" fill="#38bdf8" opacity="0.8"/>
    <ellipse id="menis" cx="120" cy="0" rx="58" ry="5" fill="#7dd3fc" opacity="0.95"/>
    <!-- 杯身（半透明，疊在液體上方） -->
    <path id="cupPath" d="" fill="rgba(255,255,255,0.28)" stroke="#64748b" stroke-width="3" stroke-linejoin="round"/>
    <!-- 刻度 -->
    <g id="grad" stroke="#475569" font-family="system-ui" font-size="10" fill="#334155"></g>
    <!-- 視線平視 -->
    <g id="eye" opacity="0">
      <line id="eyeLine" x1="14" x2="226" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="5 4"/>
      <g id="eyeIcon">
        <path d="M2,0 q8,-9 16,0 q-8,9 -16,0 z" fill="#e11d48"/>
        <circle cx="10" cy="0" r="3" fill="#fff"/><circle cx="10" cy="0" r="1.6" fill="#e11d48"/>
      </g>
    </g>
    <text x="120" y="326" text-anchor="middle" font-size="11" fill="#475569" id="liquidLabel">水</text>
  </svg>
  <span class="badge">👁 視線平視凹液面</span>
  <div class="read" id="readout"></div>
  <button type="button" id="toggle">單位換算（公升 / 毫升）</button>
</div>`;
  class LiquidMeasuringCup extends HTMLElement {
    static get observedAttributes(){ return ['volume-ml','liquid-name']; }
    constructor(){
      super();
      this._l = true;         // true=毫升顯示
      this.root = this.attachShadow({mode:'open'});
      this.root.appendChild(T.content.cloneNode(true));
      const $ = s => this.root.querySelector(s);
      this.vt = $('toggle'); this.vo = $('readout');
      this.vt.addEventListener('click', () => { this._l = !this._l; this._paintReadout(); });
      // 杯身：上寬下略窄（標準量杯剖面），0mL 在 y=300，1000mL 在 y=48
      this.TOPY = 48; this.BOTY = 300; this.LX1 = 62; this.LX2 = 178;
      $('cupPath').setAttribute('d','M54,42 L186,42 L170,306 Q170,314 160,314 L80,314 Q70,314 70,306 Z');
      $('clipShape').setAttribute('d','M57,45 L183,45 L167,306 Q167,311 160,311 L80,311 Q73,311 73,306 Z');
    }
    get volume(){ const v = parseFloat(this.getAttribute('volume-ml')); return isNaN(v) ? 500 : Math.max(0, Math.min(1000, v)); }
    connectedCallback(){ if(!this._init){ this._init = true; this._render(); } }
    attributeChangedCallback(){ if(this._init) this._render(); }
    _yAt(ml){ return this.BOTY - (ml/1000*(this.BOTY-this.TOPY)); }
    _xAt(y){ // 杯壁內側 x（線性內差）
      const t = (y - this.TOPY)/(this.BOTY - this.TOPY);
      const hi = this.LX2, lo = 76; // 內壁寬隨深度縮小
      return lo + (hi - lo) * (1 - t) * 0 + (hi - (hi - lo) * t);
    }
    _render(){
      const v = this.volume, g = this.root.querySelector('#grad');
      let html = '';
      for(let m = 100; m <= 1000; m += 100){
        const y = this._yAt(m).toFixed(1), major = (m % 500 === 0) || true;
        const xl = this._xAt(Number(y)) - (m % 500 === 0 ? 26 : 16);
        const xr = 240 - xl - 8;
        html += `<line x1="${xl.toFixed(1)}" x2="${xr.toFixed(1)}" y1="${y}" y2="${y}" stroke-width="${m%500===0?2:1}"/>`;
        html += `<text x="${(xl-3).toFixed(1)}" y="${(Number(y)+3.5).toFixed(1)}" text-anchor="end">${m % 1000 === 0 ? '1 公升' : m}</text>`;
      }
      // 0 基準線
      html += `<line x1="${this._xAt(300)-28}" x2="188" y1="300" y2="300" stroke-width="2"/><text x="${this._xAt(300)-31}" y="304" text-anchor="end">0</text>`;
      g.innerHTML = html;
      const h = v/1000*(this.BOTY - this.TOPY), yF = this.BOTY - h;
      const liq = this.root.querySelector('#liquid');
      liq.setAttribute('y', Math.max(this.TOPY-2, yF).toFixed(1));
      liq.setAttribute('height', h.toFixed(1));
      const men = this.root.querySelector('#menis');
      men.setAttribute('cy', Math.max(this.TOPY-2, yF).toFixed(1));
      // 視線平視徽章 + 眼睛
      const eye = this.root.querySelector('#eye'), icon = this.root.querySelector('#eyeIcon');
      const ly = Math.max(this.TOPY-2, yF).toFixed(1);
      eye.setAttribute('opacity','1');
      this.root.querySelector('#eyeLine').setAttribute('y1', ly);
      this.root.querySelector('#eyeLine').setAttribute('y2', ly);
      icon.setAttribute('transform', `translate(16,${ly})`);
      this.root.querySelector('#liquidLabel').textContent = `${this.getAttribute('liquid-name') || '水'}：${v} 毫升`;
      this._paintReadout();
    }
    _paintReadout(){
      const v = this.volume, L = v/1000;
      this.vo.textContent = this._l
        ? `${v} 毫升（mL）`
        : (v === 1000 ? '1 公升（L）'
          : (v < 1000 ? `${L.toString().replace('0.','.')} 公升（不到 1 公升）`.replace(/^\./,'0.') : `${L} 公升（L）`));
    }
  }
  customElements.define('liquid-measuring-cup', LiquidMeasuringCup);
})();
