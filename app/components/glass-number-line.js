class GlassNumberLine extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this.S={mode:null,start:null,jump:null,end:null,currentTick:null,status:'INIT',revealed:false};}
connectedCallback(){this.render();}
render(){const h=`<style>
:host{display:inline-block;font:14px/1.2 system-ui,sans-serif}
svg{background:#f8fbff;border:1px solid #cfd8dc;border-radius:8px}
.tick{stroke:#607d8b;stroke-width:1}
.tick.m{stroke:#37474f;stroke-width:2}
.lbl{fill:#455a64;font-size:10px;text-anchor:middle}
.mask{fill:rgba(255,255,255,.55);stroke:#90a4ae;stroke-width:1.2}
.q{fill:#546e7a;font-size:14px;text-anchor:middle;dominant-baseline:middle;font-weight:700}
.num{fill:#d4a017;font-size:15px;text-anchor:middle;dominant-baseline:middle;font-weight:700}
.formula{fill:#1565c0;font-size:13px;text-anchor:middle;font-weight:700}
.arc{fill:none;stroke:#1976d2;stroke-width:2;marker-end:url(#ah)}
.ahi{fill:none;stroke:#ff7043;stroke-width:2;stroke-dasharray:4 2}
.jump{fill:#1976d2;font-size:11px;text-anchor:middle}
.mark{fill:#ff7043}
.hl{fill:rgba(255,112,67,.18);stroke:#ff7043;stroke-width:1.5}
.msg{fill:#bf360c;font-size:12px;text-anchor:middle;font-weight:600}
.fade{transition:opacity .5s}
</style>
<svg id="svg" viewBox="0 0 360 220" width="360" height="220" xmlns="http://www.w3.org/2000/svg">
<defs><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#1976d2"/></marker></defs>
<line x1="30" y1="150" x2="330" y2="150" stroke="#37474f" stroke-width="2"/>
<g id="ticks"></g>
<rect id="hl" class="hl" x="0" y="138" width="0" height="24" rx="3" style="display:none"/>
<g id="marks"></g>
<path id="arc" class="arc" d="" style="display:none"/>
<text id="jtxt" class="jump" x="0" y="0"></text>
<g id="maskg" class="fade" opacity="1" style="display:none">
<rect id="mb" class="mask" x="0" y="120" width="24" height="30" rx="4"/>
<text id="mt" class="q" x="0" y="135">?</text>
</g>
<text id="formula" class="formula" x="180" y="45"></text>
<text id="msg" class="msg" x="180" y="75"></text>
</svg>`;this.shadowRoot.innerHTML=h;this._buildTicks();this._refs();}
_buildTicks(){const g=this.shadowRoot.getElementById('ticks');let s='';for(let i=0;i<=20;i++){const x=30+i*15,m=i%5===0; s+=`<line class="tick${m?' m':''}" x1="${x}" y1="${m?142:145}" x2="${x}" y2="${m?158:155}"/>`; if(m) s+=`<text class="lbl" x="${x}" y="172">${i}</text>`;} g.innerHTML=s;}
_refs(){const r=id=>this.shadowRoot.getElementById(id);this.$={svg:r('svg'),hl:r('hl'),marks:r('marks'),arc:r('arc'),jtxt:r('jtxt'),maskg:r('maskg'),mb:r('mb'),mt:r('mt'),formula:r('formula'),msg:r('msg')};}
tx(k){k=Math.max(0,Math.min(20,Math.round(+k||0)));return 30+k*15;}
_emit(type,tick){const S=this.S;this.dispatchEvent(new CustomEvent('numline-event',{detail:{type,tick:tick??S.currentTick,status:S.status,equation:{mode:S.mode,start:S.start,jump:S.jump,end:S.end}}}));if(type==='snap')this.dispatchEvent(new CustomEvent('numline:snap',{detail:{tick:tick??S.currentTick}}));}
setEquation(eq={}){let {mode,start,jump,end}=eq; if(mode==='add_start'){ // (?)+jump=end
if(end==null&&start!=null&&jump!=null)end=start+jump;
if(start==null&&end!=null&&jump!=null)start=end-jump;
if(jump==null&&start!=null&&end!=null)jump=end-start;
this.S={mode,start,jump,end,currentTick:null,status:'MASKED',revealed:false};
this._clearDraw();this.moveToTick(start);this.S.status='MASKED';this._emit('set',start);
}else if(mode==='sub_middle'){ // start-(?)=end
if(jump==null&&start!=null&&end!=null)jump=start-end;
if(end==null&&start!=null&&jump!=null)end=start-jump;
this.S={mode,start,jump,end,currentTick:null,status:'MASKED',revealed:false};
this._drawSubMiddle();this._emit('set',null);
} else {this.S={mode:mode||null,start:start??null,jump:jump??null,end:end??null,currentTick:null,status:'MASKED',revealed:false};}
return this;}
_clearDraw(){const $=this.$;$.hl.style.display='none';$.marks.innerHTML='';$.arc.style.display='none';$.arc.setAttribute('d','');$.jtxt.textContent='';$.formula.textContent='';$.msg.textContent='';$.maskg.style.display='none';$.maskg.style.opacity='1';$.mt.textContent='?';$.mt.setAttribute('class','q');}
_drawSubMiddle(){this._clearDraw();const {start,end,jump}=this.S,$=this.$;const x1=this.tx(end),x2=this.tx(start);
$.hl.setAttribute('x',Math.min(x1,x2));$.hl.setAttribute('width',Math.abs(x2-x1));$.hl.style.display='';
$.marks.innerHTML=`<circle class="mark" cx="${x1}" cy="150" r="4"/><circle class="mark" cx="${x2}" cy="150" r="4"/><text class="lbl" x="${x1}" y="190">${end}</text><text class="lbl" x="${x2}" y="190">${start}</text>`;
$.msg.textContent=`跨越 ${jump} 格`;
$.formula.textContent=`(□) = ${jump}`; this.S.status='SNAPPED'; this.S.revealed=false;}
moveToTick(k){const t=Math.max(0,Math.min(20,Math.round(+k||0)));this.S.currentTick=t;const x=this.tx(t),$=this.$;$.maskg.style.display='';$.mb.setAttribute('x',x-12);$.mt.setAttribute('x',x);this._emit('snap',t);return this;}
stepReverse(){const S=this.S;if(S.mode==='add_start'&&S.end!=null&&S.jump!=null){S.status='REVERSE_ACTIVE';this._emit('reverse',S.currentTick);
const from=S.end,to=S.end-S.jump,x1=this.tx(from),x2=this.tx(to),mid=(x1+x2)/2,h=Math.max(25,Math.abs(x1-x2)*0.35);
this.$.arc.setAttribute('d',`M${x1},145 Q${mid},${145-h} ${x2},145`);this.$.arc.style.display='';this.$.jtxt.setAttribute('x',mid);this.$.jtxt.setAttribute('y',145-h-6);this.$.jtxt.textContent=`🐸 倒退 ${S.jump} 格`;this.$.msg.textContent=`破招：小青蛙從終點往回跳 ${S.jump} 格`;
this.$.maskg.style.display='';this.$.mb.setAttribute('x',x1-12);this.$.mt.setAttribute('x',x1);
let t0=null,dur=450;const anim=ts=>{if(!t0)t0=ts;const p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,2);const cx=x1+(x2-x1)*e; this.$.mb.setAttribute('x',cx-12);this.$.mt.setAttribute('x',cx); if(p<1)requestAnimationFrame(anim); else{this.moveToTick(to);S.status='REVERSE_ACTIVE';S.currentTick=to;this._emit('snapped',to);} };requestAnimationFrame(anim);
} else if(S.mode==='sub_middle'){S.status='SNAPPED';this._drawSubMiddle();this._emit('reverse',null);} return this;}
reveal(){const S=this.S;if(S.mode==='add_start'){S.revealed=true;S.status='REVEALED';this.$.mt.textContent=String(S.start);this.$.mt.setAttribute('class','num');this.$.mb.setAttribute('style','fill:rgba(255,248,225,.25);stroke:#d4a017');this.$.maskg.style.opacity='.35';
this.$.formula.textContent=`${S.end} - ${S.jump} = ${S.start}`;this.$.msg.textContent=`破招：小青蛙從終點往回跳 ${S.jump} 格`;this.moveToTick(S.start);}
else if(S.mode==='sub_middle'){S.revealed=true;S.status='REVEALED';this._drawSubMiddle();this.$.formula.textContent=`${S.start} - ${S.end} = ${S.jump}`;}
this._emit('reveal',S.currentTick);return this;}
reset(){this._clearDraw();this.S={mode:null,start:null,jump:null,end:null,currentTick:null,status:'INIT',revealed:false};this._emit('reset',null);return this;}
setScenario(type,opt={}){if(type==='sub_unknown')return this.setEquation({mode:'sub_middle',start:opt.start,end:opt.end});return this;}
getState(){return {...this.S};}
}
customElements.define('glass-number-line',GlassNumberLine);
