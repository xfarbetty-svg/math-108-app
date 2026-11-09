class MultiplicationArray extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this.rows=3;this.cols=4;this.group='rows';this._el={};}
static get observedAttributes(){return['rows','cols','group'];}
attributeChangedCallback(n,o,v){if(o===v)return; if(n==='rows')this.rows=Math.max(1,Math.min(10,+v||3)); if(n==='cols')this.cols=Math.max(1,Math.min(10,+v||4)); if(n==='group')this.group=v==='cols'?'cols':'rows'; this.render();}
connectedCallback(){this.rows=Math.max(1,Math.min(10,+this.getAttribute('rows')||3));this.cols=Math.max(1,Math.min(10,+this.getAttribute('cols')||4));this.group=this.getAttribute('group')==='cols'?'cols':'rows';this.render();}
transpose(){[this.rows,this.cols]=[this.cols,this.rows];this.setAttribute('rows',this.rows);this.setAttribute('cols',this.cols);this._emit();}
setGroup(g){this.group=g;this.setAttribute('group',g);this.render();this._emit();}
_emit(){this.dispatchEvent(new CustomEvent('array-change',{detail:{rows:this.rows,cols:this.cols,group:this.group,total:this.rows*this.cols}}));}
render(){const r=this.rows,c=this.cols,g=this.group,total=r*c,pad=12,gap=8,cell=26,w=c*cell+(c-1)*gap+pad*2,h=r*cell+(r-1)*gap+pad*2+52;
let dots='',halos='';
for(let i=0;i<r;i++)for(let j=0;j<c;j++){const x=pad+j*(cell+gap)+cell/2,y=pad+i*(cell+gap)+cell/2; dots+=`<circle cx="${x}" cy="${y}" r="8" fill="#4f46e5"><title>${i+1},${j+1}</title></circle>`;}
if(g==='rows'){for(let i=0;i<r;i++){const x=pad-4,y=pad+i*(cell+gap)-4; halos+=`<rect x="${x}" y="${y}" width="${c*cell+(c-1)*gap+8}" height="${cell+8}" rx="10" fill="rgba(16,185,129,.12)" stroke="#10b981" stroke-width="2"/>`;}}
else{for(let j=0;j<c;j++){const x=pad+j*(cell+gap)-4,y=pad-4; halos+=`<rect x="${x}" y="${y}" width="${cell+8}" height="${r*cell+(r-1)*gap+8}" rx="10" fill="rgba(245,158,11,.12)" stroke="#f59e0b" stroke-width="2"/>`;}}
const add=g==='rows'?Array(r).fill(c).join(' + '):Array(c).fill(r).join(' + ');
const mul=g==='rows'?`${c} × ${r} = ${total}`:`${r} × ${c} = ${total}`;
const alt=g==='rows'?`${r} × ${c} = ${total}`:`${c} × ${r} = ${total}`;
this.shadowRoot.innerHTML=`<style>
:host{display:block;max-width:390px;margin:0 auto;font:14px/1.4 system-ui,"Noto Sans TC",sans-serif;color:#1f2937}
.wrap{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
svg{width:100%;height:auto;display:block;background:#f8fafc;border-radius:8px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
button{flex:1 1 100px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;padding:8px 10px;font:inherit;cursor:pointer}
button.on{background:#e0e7ff;border-color:#818cf8;color:#3730a3;font-weight:600}
.eq{margin-top:8px;padding:8px;border-radius:8px;background:#f1f5f9;font-size:13px}
.eq b{color:#4f46e5}.small{color:#64748b;font-size:12px}
@media (max-width:390px){.wrap{padding:8px}button{font-size:13px}}
</style>
<div class="wrap" part="wrap">
<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${r}列${c}行陣列，共${total}個">
${halos}${dots}
<text x="${w/2}" y="${h-30}" text-anchor="middle" font-size="12" fill="#334155">加法：${add} = ${total}</text>
<text x="${w/2}" y="${h-12}" text-anchor="middle" font-size="13" font-weight="700" fill="#4f46e5">乘法：${mul}</text>
</svg>
<div class="eq"><b>${mul}</b><div class="small">也可以看成 ${alt}（交換後仍是 ${total}）</div></div>
<div class="row">
<button id="br" class="${g==='rows'?'on':''}" type="button">依列分組（每列${c}個）</button>
<button id="bc" class="${g==='cols'?'on':''}" type="button">依行分組（每行${r}個）</button>
<button id="rot" type="button">旋轉/轉置陣列</button>
</div></div>`;
this.shadowRoot.getElementById('br').onclick=()=>this.setGroup('rows');
this.shadowRoot.getElementById('bc').onclick=()=>this.setGroup('cols');
this.shadowRoot.getElementById('rot').onclick=()=>this.transpose();
this._emit();
}}
customElements.define('multiplication-array',MultiplicationArray);