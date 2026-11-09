class DataSorterBench extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this._init();}
_init(){
this.cats=[];this.counts=[];this.pool=[];this.bins={};this.sorted=false;this.view='tally';this._seed=1;this._initPool();
}
_initPool(){
this.pool=[];this.bins={};let id=0;
for(let i=0;i<this.cats.length;i++){this.bins[this.cats[i]]=0;for(let j=0;j<(this.counts[i]||0);j++)this.pool.push({id:id++,t:this.cats[i]});}
this.sorted=this.pool.length===0;
}
_rng(){this._seed=(this._seed*9301+49297)%233280;return this._seed/233280;}
setData(cfg){
this.cats=(cfg&&cfg.categories||['蘋果','香蕉','橘子']).slice(0,3);
this.counts=(cfg&&cfg.counts||[5,3,4]).slice(0,3);
this._seed=7;this._initPool();this.render();this._ev('data');
}
sortItem(cat){
let i=this.pool.findIndex(p=>p.t===cat);if(i<0){this.render();return;}
this.bins[cat]++;this.pool.splice(i,1);this.sorted=this.pool.length===0;
this.render();this._ev('sort');
}
autoSort(){while(this.pool.length)this.bins[this.pool.shift().t]++;this.sorted=true;this.render();this._ev('sort');}
toggleBarView(b){this.view=b?'bar':'tally';this.render();this._ev('view');}
reset(){this._seed=7;this._initPool();this.view='tally';this.render();this._ev('reset');}
getState(){
let totals={};this.cats.forEach(c=>totals[c]=this.bins[c]||0);
let max=-1,min=1e9,most='',least='';this.cats.forEach(c=>{let v=totals[c];if(v>max){max=v;most=c;}if(v<min){min=v;least=c;}});
return{sorted:this.sorted,currentView:this.view,totals,most,least,totalCount:this.cats.reduce((s,c)=>s+(this.counts[c]||0),0)};
}
getSummary(){let s=this.getState();return{totals:s.totals,most:s.most,least:s.least,totalCount:s.totalCount};}
_ev(t){this.dispatchEvent(new CustomEvent('sorter-event',{detail:{type:t,state:this.getState()}}));}
connectedCallback(){if(!this.cats.length)this.setData({});else this.render();}
_shape(t,x,y){
if(t.includes('圓')||t==='蘋果')return`<circle cx="${x}" cy="${y}" r="6" fill="#f66" stroke="#933"/>`;
if(t.includes('三')||t==='香蕉')return`<polygon points="${x},${y-6} ${x-6},${y+5} ${x+6},${y+5}" fill="#fd6" stroke="#a80"/>`;
return`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="#6cf" stroke="#258"/>`;
}
_tally(n,x,y){
let s='',ox=0;
for(let g=0;g<Math.floor(n/5);g++){s+=this._t5(x+ox,y);ox+=14;}
let r=n%5,pts=[[x+ox,y,x+ox+8,y],[x+ox+4,y,x+ox+4,y+10],[x+ox+1,y+4,x+ox+4,y+4],[x+ox+1,y+4,x+ox+1,y+8],[x+ox,y+10,x+ox+8,y+10]];
for(let i=0;i<r;i++)s+=`<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[i][2]}" y2="${pts[i][3]}" stroke="#222" stroke-width="1.5" stroke-linecap="square"/>`;
return s;
}
_t5(x,y){return`<g><line x1="${x}" y1="${y}" x2="${x+8}" y2="${y}" stroke="#222" stroke-width="1.5"/><line x1="${x+4}" y1="${y}" x2="${x+4}" y2="${y+10}" stroke="#222" stroke-width="1.5"/><line x1="${x+1}" y1="${y+4}" x2="${x+4}" y2="${y+4}" stroke="#222" stroke-width="1.5"/><line x1="${x+1}" y1="${y+4}" x2="${x+1}" y2="${y+8}" stroke="#222" stroke-width="1.5"/><line x1="${x}" y1="${y+10}" x2="${x+8}" y2="${y+10}" stroke="#222" stroke-width="1.5"/></g>`;}
render(){
this._seed=7;const W=360,H=220,c=this.cats,b=this.bins,p=this.pool;
let items='';p.forEach((it,i)=>{let rx=20+(i%10)*33+this._rng()*8,ry=22+Math.floor(i/10)*18+this._rng()*6;items+=this._shape(it.t,rx,Math.min(ry,68));});
let drawers='';for(let i=0;i<3;i++){let x=12+i*114,w=108,n=c[i]||'',v=b[n]||0;drawers+=`<rect x="${x}" y="82" width="${w}" height="54" rx="4" fill="#f7f7fb" stroke="#889"/><text x="${x+w/2}" y="96" font-size="11" text-anchor="middle">${n}</text><text x="${x+w/2}" y="128" font-size="10" text-anchor="middle">抽屜:${v}</text>`;}
let stats='';let yb=202;
for(let i=0;i<3;i++){let x=20+i*114,n=c[i]||'',v=b[n]||0;
if(this.view==='bar'){let h=v*12;stats+=`<rect x="${x+30}" y="${yb-h}" width="36" height="${h}" fill="#7aa2ff" stroke="#456"/><text x="${x+48}" y="${yb-h-3}" font-size="10" text-anchor="middle">${v}</text><text x="${x+48}" y="${yb+12}" font-size="10" text-anchor="middle">${n}</text>`;}
else{stats+=`<text x="${x}" y="156" font-size="10">${n}:${v}</text>${this._tally(v,x,162)}`;}
}
let head=`<text x="10" y="10" font-size="10" fill="#555">待分類:${p.length}</text><text x="300" y="10" font-size="10" fill="#555">視圖:${this.view}</text>`;
this.shadowRoot.innerHTML=`<style>:host{display:inline-block;font-family:sans-serif}</style><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff" stroke="#ddd"/>${head}<rect x="12" y="12" width="336" height="62" fill="#fafafa" stroke="#ccc"/>${items}${drawers}<line x1="12" y1="140" x2="348" y2="140" stroke="#ddd"/>${stats}</svg>`;
}
}
customElements.define('data-sorter-bench',DataSorterBench);
