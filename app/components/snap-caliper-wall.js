class SnapCaliperWall extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this._init()}
_init(){this.objL=180;this.objX=60;this.aligned=false;this.units=0;this.status='IDLE';this.cmp=null;this._render()}
_render(){
const s=this.status,u=this.units,L=this.objL,x=this.aligned?30:this.objX,ml=u*45,showR=s==='READOUT_EXACT';
let clips='';for(let i=0;i<u;i++){const cx=30+i*45;clips+=`<rect x="${cx}" y="150" width="45" height="18" rx="4" fill="#fbbf24" stroke="#92400e" stroke-width="1.2"/><text x="${cx+22}" y="163" font-size="10" text-anchor="middle" fill="#78350f">${i+1}</text>`}
let objs='',extra='';
if(this.cmp){
const [a,b]=this.cmp,lo=Math.min(a,b),hi=Math.max(a,b),dy=hi===a?0:30;
objs=`<rect x="30" y="62" width="${a}" height="16" rx="3" fill="#60a5fa" stroke="#1d4ed8"/><text x="${34}" y="74" font-size="10" fill="#fff">A ${a/45|0}夾</text>
<rect x="30" y="92" width="${b}" height="16" rx="3" fill="#34d399" stroke="#047857"/><text x="${34}" y="104" font-size="10" fill="#fff">B ${b/45|0}夾</text>`;
extra=`<rect x="${30+lo}" y="${60+dy}" width="${hi-lo}" height="20" fill="none" stroke="#f59e0b" stroke-width="3"/><text x="${30+lo+4}" y="${56+dy}" font-size="11" fill="#b45309">長出 ${(hi-lo)/45|0} 根迴紋針</text>`;
}else{
objs=`<rect x="${x}" y="118" width="${L}" height="16" rx="3" fill="#60a5fa" stroke="#1d4ed8"/><text x="${x+4}" y="130" font-size="10" fill="#fff">鉛筆</text>`;
if(showR)extra=`<line x1="${30+L}" y1="40" x2="${30+L}" y2="175" stroke="#10b981" stroke-width="2" stroke-dasharray="4"/><g><rect x="${30+L-2}" y="42" width="86" height="20" rx="4" fill="#10b981"/><text x="${30+L+41}" y="56" font-size="11" text-anchor="middle" fill="#fff">剛好 ${u} 根迴紋針長</text></g>`;
}
this.shadowRoot.innerHTML=`<style>:host{display:block;font:12px sans-serif}svg{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px}.r{font-size:11px;fill:#334155}</style>
<svg viewBox="0 0 360 220" width="360" height="220" aria-label="caliper">
<line x1="30" y1="30" x2="30" y2="190" stroke="#EF4444" stroke-width="3"/>
<text x="12" y="44" font-size="11" fill="#EF4444">基準線</text>
${objs}${clips}${extra}
<text x="8" y="210" class="r">狀態:${s} 單位:${u} 量測:${ml}px</text>
</svg>
<div><button data-a="al">靠齊基準線</button> <button data-a="ad">+迴紋針</button> <button data-a="rm">-迴紋針</button> <button data-a="au">自動量測</button> <button data-a="cp">比較</button> <button data-a="rs">重設</button></div>`;
this.shadowRoot.querySelectorAll('button').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='al')this.alignWall();else if(a==='ad')this.addUnit();else if(a==='rm')this.removeUnit();else if(a==='au')this.autoMeasure();else if(a==='cp')this.compareMode(180,135);else this.reset()});
}
_ev(t){this.dispatchEvent(new CustomEvent('caliper-event',{detail:{type:t,status:this.status,unitCount:this.units}}))}
alignWall(){this.cmp=null;this.aligned=true;this.objX=30;if(this.status==='IDLE')this.status='WALL_ALIGNED';if(this.units>0&&this.units*45===this.objL)this.status='READOUT_EXACT';else if(this.status!=='READOUT_EXACT')this.status='WALL_ALIGNED';this._render();this._ev('align')}
addUnit(){if(this.cmp)this.cmp=null;if(!this.aligned)this.alignWall();this.units++;this.status='CHAIN_SNAP';if(this.units*45===this.objL)this.status='READOUT_EXACT';else if(this.units*45>this.objL)this.status='CHAIN_SNAP';this._render();this._ev(this.status==='READOUT_EXACT'?'readout':'snap')}
removeUnit(){if(this.cmp)return;if(this.units>0)this.units--;if(!this.aligned)this.status='IDLE';else if(this.units*45===this.objL&&this.units>0)this.status='READOUT_EXACT';else this.status=this.aligned?'WALL_ALIGNED':'IDLE';this._render();this._ev('snap')}
autoMeasure(){this.cmp=null;if(!this.aligned)this.alignWall();this.units=Math.round(this.objL/45);this.status='READOUT_EXACT';this._render();this._ev('readout')}
compareMode(lenA,lenB){this.cmp=[lenA,lenB];this.aligned=true;this.status='DUAL_COMPARE';this._render();this._ev('align')}
reset(){this._init();this._render();this._ev('reset')}
setObject(o){this.objL=o.length||180;this.objX=60;this.aligned=false;this.units=0;this.cmp=null;this.status='IDLE';this._render()}
moveTo(x){this.cmp=null;this.objX=x;if(Math.abs(x-30)<=15)this.alignWall();else{this.aligned=false;this.status='IDLE';this._render()}}
getUnitPositions(){const a=[];for(let i=0;i<this.units;i++)a.push(30+i*45);return a}
getState(){return{objectLength:this.objL,aligned:this.aligned,unitCount:this.units,measuredLength:this.units*45,status:this.status}}
}
customElements.define('snap-caliper-wall',SnapCaliperWall);
