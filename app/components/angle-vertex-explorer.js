/* <angle-vertex-explorer> S-2-1 邊・角・頂點互動探索器 — vanilla web component, no deps */
class AngleVertexExplorer extends HTMLElement {
static get observedAttributes(){return['shape'];}
constructor(){super();this.attachShadow({mode:'open'});this.on={v:false,e:false,a:false};this._booted=false;}
connectedCallback(){this._boot();}
attributeChangedCallback(){if(this._booted)this._boot();}

_boot(){
  const S=(this.getAttribute('shape')||'triangle').toLowerCase();
  const SH={
    angle:{ped:'1 個頂點 ＋ 2 條直線邊 ＝ 1 個角',pts:[[36,168],[188,168],[36,38]],
      ed:[[0,1],[0,2]],lb:['邊1','邊2']},
    triangle:{ped:'3 條邊 ＋ 3 個角 ＋ 3 個頂點',pts:[[108,30],[30,172],[186,172]],
      ed:[[0,1],[1,2],[2,0]],lb:['邊1','邊2','邊3']},
    square:{ped:'4 條邊一樣長 ＋ 4 個直角 ＋ 4 個頂點',pts:[[46,34],[184,34],[184,172],[46,172]],
      ed:[[0,1],[1,2],[2,3],[3,0]],lb:['邊1','邊2','邊3','邊4']},
    rectangle:{ped:'上下邊相等、左右邊相等 ＋ 4 個直角 ＋ 4 個頂點',pts:[[24,62],[196,62],[196,158],[24,158]],
      ed:[[0,1],[1,2],[2,3],[3,0]],lb:['長','寬','長','寬']}
  };
  this._shape=S;this._g=SH[S]||SH.triangle;
  this.shadowRoot.innerHTML=this._css()+this._shell();
  const self=this;
  this.shadowRoot.querySelectorAll('button[data-k]').forEach(function(b){
    b.addEventListener('click',function(){
      const k=b.dataset.k;self.on[k]=!self.on[k];b.classList.toggle('act',self.on[k]);self._draw();
    });
  });
  this._booted=true;this._draw();
}

_css(){return`<style>
:host{display:block;font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;color:#1e293b}
.box{background:#fff;border:2px solid #e2e8f0;border-radius:18px;padding:12px;max-width:430px;margin:0 auto}
svg{display:block;width:100%;height:auto}
.wrap{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
button{border:2px solid #cbd5e1;background:#f8fafc;border-radius:999px;padding:7px 10px;font-size:13px;font-weight:700;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:5px}
button.act{color:#fff;transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.15)}
.bv.act{background:#e11d48;border-color:#e11d48}
.be.act{background:#059669;border-color:#059669}
.ba.act{background:#d97706;border-color:#d97706}
.n{background:rgba(0,0,0,.08);border-radius:999px;font-size:11px;padding:1px 7px}
.act .n{background:rgba(255,255,255,.28)}
.glow{animation:gl 1.8s ease-in-out infinite}
@keyframes gl{0%,100%{opacity:.3}50%{opacity:.8}}
.pulse{stroke-dasharray:10 6;animation:pu 1.1s linear infinite}
@keyframes pu{to{stroke-dashoffset:-32}}
.ped{background:#eef2ff;border:1.5px dashed #6366f1;color:#4338ca;text-align:center;font-weight:700;font-size:13.5px;border-radius:10px;padding:7px 6px;margin-top:8px}
</style>`;}

_shell(){return`<div class="box"><div class="wrap">
<button class="bv" data-k="v">🔴 點頂點<span class="n"></span></button>
<button class="be" data-k="e">🟢 數邊長<span class="n"></span></button>
<button class="ba" data-k="a">🟠 標內角<span class="n"></span></button>
</div><div class="viz"></div><div class="ped"></div></div>`;}

_badge(x,y,t,c){return`<g><circle cx="${x}" cy="${y}" r="11" fill="${c}"/><text x="${x}" y="${y+4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${t}</text></g>`;}

_draw(){
  const self=this,g=this._g,P=g.pts,ed=g.ed;
  let inner=`<circle cx="110" cy="104" r="98" fill="#f8fafc"/>`,out='';
  /* outline: one indigo line per edge (works for closed shapes and the open angle) */
  ed.forEach(function(p){const a=P[p[0]],b=P[p[1]];
    inner+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#4f46e5" stroke-width="5" stroke-linecap="round"/>`;});
  /* edges: pulse + numbered / 長寬 badges */
  ed.forEach(function(p,i){const a=P[p[0]],b=P[p[1]];
    if(!self.on.e)return;
    inner+=`<line class="pulse" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#10b981" stroke-width="9" stroke-linecap="round"/>`;
    let mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
    if(a[1]===b[1])my+=my<104?16:-16;else if(a[0]===b[0])mx+=mx<110?16:-16;
    else{const cx=(P[0][0]+P[1][0]+P[2][0])/3,cy=(P[0][1]+P[1][1]+P[2][1])/3,d=Math.hypot(cx-mx,cy-my);mx+=(cx-mx)/d*17;my+=(cy-my)/d*17;}
    out+=self._badge(mx,my,g.lb[i],'#059669');
  });
  /* vertices: glowing dots */
  const vs=[...new Set(ed.flat())];
  vs.forEach(function(vi){const v=P[vi];
    if(!self.on.v)return;
    inner+=`<circle class="glow" cx="${v[0]}" cy="${v[1]}" r="13" fill="#fb7185"/><circle cx="${v[0]}" cy="${v[1]}" r="6.5" fill="#e11d48" stroke="#fff" stroke-width="2.5"/>`;});
  /* angles: arcs + right-angle squares */
  if(self.on.a)vs.forEach(function(vi){const v=P[vi];
    const ns=ed.filter(function(p){return p[0]===vi||p[1]===vi;}).map(function(p){return P[p[0]===vi?p[1]:p[0]];});
    if(ns.length<2)return;const u=ns[0],w=ns[1];
    const ux=u[0]-v[0],uy=u[1]-v[1],wx=w[0]-v[0],wy=w[1]-v[1];
    const lu=Math.hypot(ux,uy),lw=Math.hypot(wx,wy);if(!lu||!lw)return;
    const un=[ux/lu,uy/lu],wn=[wx/lw,wy/lw];
    const dot=un[0]*wn[0]+un[1]*wn[1],cross=un[0]*wn[1]-un[1]*wn[0];
    if(Math.abs(dot)<0.05){const s=17;
      const p1=[v[0]+un[0]*s,v[1]+un[1]*s],p2=[v[0]+(un[0]+wn[0])*s,v[1]+(un[1]+wn[1])*s],p3=[v[0]+wn[0]*s,v[1]+wn[1]*s];
      inner+=`<path d="M${p1} L${p2} L${p3}" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linejoin="round"/>`;
      inner+=`<text x="${v[0]+(un[0]+wn[0])*26}" y="${v[1]+(un[1]+wn[1])*26+4}" font-size="10" font-weight="700" fill="#b45309" text-anchor="middle">直角</text>`;}
    else{const s=20;
      const p1=[v[0]+un[0]*s,v[1]+un[1]*s],p2=[v[0]+wn[0]*s,v[1]+wn[1]*s];
      inner+=`<path d="M${p1} A${s} ${s} 0 0 ${cross>0?1:0} ${p2}" fill="none" stroke="#f59e0b" stroke-width="3.5"/>`;}
    inner+=`<circle cx="${v[0]}" cy="${v[1]}" r="3.5" fill="#f59e0b"/>`;});
  /* count chips on top of the canvas */
  let bx=14;const chip=function(t,c){out+=`<g><rect x="${bx}" y="6" rx="9" width="48" height="18" fill="${c}"/><text x="${bx+24}" y="19" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">${t}</text></g>`;bx+=54;};
  if(this.on.v)chip('頂點 '+vs.length,'#e11d48');
  if(this.on.e)chip('邊 '+ed.length,'#059669');
  if(this.on.a)chip('角 '+vs.length,'#d97706');
  this.shadowRoot.querySelector('.viz').innerHTML='<svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">'+inner+out+'</svg>';
  this.shadowRoot.querySelector('.ped').textContent=g.ped;
  const n=this.shadowRoot.querySelectorAll('button .n');
  n[0].textContent='頂點 '+vs.length+' 個';n[1].textContent='邊 '+ed.length+' 條';n[2].textContent='角 '+vs.length+' 個';
}
}
customElements.define('angle-vertex-explorer',AngleVertexExplorer);
