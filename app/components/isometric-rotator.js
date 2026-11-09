(function(){
'use strict';
var NS='http://www.w3.org/2000/svg',SH=['square','rectangle','triangle','circle','cylinder-unfold'];
function C(t,a,p){var e=document.createElementNS(NS,t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function T(t,a,p){var e=C('text',a,p);e.textContent=t;return e}
function cl(v,a,b){return v<a?a:v>b?b:v}
function n(a){a=+a;return isFinite(a)?a:0}
class IR extends HTMLElement{
  static get observedAttributes(){return['shape','angle','show-labels','progress']}
  constructor(){super();this.attachShadow({mode:'open'});this._s='square';this._a=0;this._p=0;this._sl=true;this._built=false}
  connectedCallback(){if(this._built){this._sync();return}this._built=true;this._init();this._sync()}
  disconnectedCallback(){}
  attributeChangedCallback(k,o,v){if(o===v||!this._built)return;this._sync(k)}
  _init(){
    var r=this.shadowRoot;
    r.innerHTML='<style>:host{display:block;font:12px/1.3 system-ui,sans-serif}.w{max-width:420px;margin:0 auto}svg{display:block;width:100%;height:auto}text{fill:#0f172a;dominant-baseline:middle;text-anchor:middle}text.lb{font-weight:700;font-size:11px}text.sm{font-size:10px}text.note{font-size:10px;fill:#334155}.ctrl{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px}.b{min-width:44px;height:44px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-size:11px;padding:0 6px}.b[aria-pressed="true"]{background:#0284c7;color:#fff;border-color:#0284c7}.rg{flex:1;min-width:120px;height:44px;display:flex;align-items:center}input[type=range]{width:100%}</style><div class="w"><svg part="svg" viewBox="-160 -110 320 220" role="img"><g id="rot"></g><g id="fx"></g></svg><div class="ctrl"><div class="rg"><input id="rg" type="range" min="0" max="360" value="0" aria-label="旋轉角度"></div><button class="b" data-s="square">正方形</button><button class="b" data-s="rectangle">長方形</button><button class="b" data-s="triangle">三角形</button><button class="b" data-s="circle">圓形</button><button class="b" data-s="cylinder-unfold">圓柱展開</button></div></div>';
    this._rot=r.getElementById('rot');this._fx=r.getElementById('fx');this._rg=r.getElementById('rg');this._svg=r.querySelector('svg');
    var self=this;
    this._rg.addEventListener('input',function(){self.setAngle(+this.value)});
    r.querySelectorAll('[data-s]').forEach(function(b){b.addEventListener('click',function(){self.setAttribute('shape',b.getAttribute('data-s'))})});
  }
  _sync(){
    var ns=this.getAttribute('shape');if(SH.indexOf(ns)<0)ns='square';
    var na=Math.round(cl(n(this.getAttribute('angle')),0,360));
    var np=cl(n(this.getAttribute('progress')),0,1);
    var nsl=this.getAttribute('show-labels')!=='false';
    if(this.getAttribute('shape')!==ns)this.setAttribute('shape',ns);
    if(String(this.getAttribute('angle'))!==String(na)&&this.getAttribute('angle')!==null)this.setAttribute('angle',String(na));
    var ch=ns!==this._s||na!==this._a||np!==this._p||nsl!==this._sl;
    this._s=ns;this._a=na;this._p=np;this._sl=nsl;
    if(this._rg){this._rg.value=na;this._rg.style.display=ns==='cylinder-unfold'?'none':'flex'}
    if(this._svg)this._svg.setAttribute('aria-label','形體 '+ns+' 角度 '+na+' 度');
    this.shadowRoot.querySelectorAll('[data-s]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-s')===ns?'true':'false')});
    this._render();
    if(ch)this._emit();
  }
  _emit(){
    var d={shape:this._s,angle:this._a,isSquare:this._s==='square'};
    this.dispatchEvent(new CustomEvent('rotator:change',{bubbles:true,composed:true,detail:d}));
    if(this._s==='cylinder-unfold'&&this._p>=1)this.dispatchEvent(new CustomEvent('rotator:unfolded',{bubbles:true,composed:true,detail:{progress:this._p}}));
  }
  setAngle(deg){this.setAttribute('angle',String(Math.round(cl(n(deg),0,360))))}
  setProgress(p){this.setAttribute('progress',String(cl(n(p),0,1)))}
  _mkCorner(x,y,dx,dy,px,py){var s=12;return (x+dx*s)+','+(y+dy*s)+' '+(x+dx*s+px*s)+','+(y+dy*s+py*s)+' '+(x+px*s)+','+(y+py*s)}
  _ticks(pairs,midOut){var g=[];for(var i=0;i<pairs.length;i++){var a=pairs[i][0],b=pairs[i][1],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/l,ny=dx/l,ox=midOut?(midOut[0]-mx):0,oy=midOut?(midOut[1]-my):0;if(nx*ox+ny*oy<0){nx=-nx;ny=-ny}g.push([mx+nx*4,my+ny*4,mx+nx*10,my+ny*10])}return g}
  _label(t,x,y){if(!this._sl)return;T(t,{x:x,y:y,'class':'lb',transform:'rotate('+(-this._a)+' '+x+' '+y+')'},this._rot)}
  _render(){
    var g=this._rot,f=this._fx,s=this._s,a=this._a;while(g.firstChild)g.removeChild(g.firstChild);while(f.firstChild)f.removeChild(f.firstChild);
    g.setAttribute('transform','rotate('+a+')');
    var sh=C('g',{id:'shape'},g),mk=C('g',{id:'marks'},g),lb=C('g',{id:'labels'},g),self=this;
    function poly(pts,at){at=at||{};at.points=pts.map(function(p){return p[0]+','+p[1]}).join(' ');at.fill=at.fill||'rgba(2,132,199,.12)';at.stroke=at.stroke||'#0284c7';at['stroke-width']=at['stroke-width']||'2';return C('polygon',at,sh)}
    function addMarks(corners,edges,ctr){corners.forEach(function(c){C('polyline',{points:self._mkCorner(c[0],c[1],c[2],c[3],c[4],c[5]),fill:'none',stroke:'#facc15','stroke-width':'2','stroke-linejoin':'miter'},mk)});
      self._ticks(edges,ctr).forEach(function(t){C('line',{x1:t[0],y1:t[1],x2:t[2],y2:t[3],stroke:'#f59e0b','stroke-width':'2','stroke-linecap':'round'},mk)})}
    if(s==='square'){
      var p=[[-45,-45],[45,-45],[45,45],[-45,45]];poly(p);
      addMarks([[-45,-45,0,1,1,0],[45,-45,-1,0,0,1],[45,45,0,-1,-1,0],[-45,45,1,0,0,-1]],[[p[0],p[1]],[p[1],p[2]],[p[2],p[3]],[p[3],p[0]]],[0,0]);
      if(this._sl){this._label('90°',-45,-45);T('正方形',{x:0,y:78,'class':'sm',transform:'rotate('+(-a)+' 0 78)'},lb)}
    }else if(s==='rectangle'){
      var p=[[-65,-40],[65,-40],[65,40],[-65,40]];poly(p);
      addMarks([[-65,-40,0,1,1,0],[65,-40,-1,0,0,1],[65,40,0,-1,-1,0],[-65,40,1,0,0,-1]],[[p[0],p[1]],[p[1],p[2]],[p[2],p[3]],[p[3],p[0]]],[0,0]);
      if(this._sl)T('長方形',{x:0,y:78,'class':'sm',transform:'rotate('+(-a)+' 0 78)'},lb)
    }else if(s==='triangle'){
      var p=[[0,-60],[-55,45],[55,45]];poly(p);
      var cs=[[0,-60,0.67,0.74,-0.67,0.74],[-55,45,1,0,0.4,-0.92],[55,45,-0.4,-0.92,-1,0]];
      cs.forEach(function(c){C('polyline',{points:self._mkCorner(c[0],c[1],c[2],c[3],c[4],c[5]),fill:'none',stroke:'#facc15','stroke-width':'1.8'},mk)});
      this._ticks([[p[0],p[1]],[p[1],p[2]],[p[2],p[0]]],[0,10]).forEach(function(t){C('line',{x1:t[0],y1:t[1],x2:t[2],y2:t[3],stroke:'#f59e0b','stroke-width':'2'},mk)});
      if(this._sl)T('三角形',{x:0,y:78,'class':'sm',transform:'rotate('+(-a)+' 0 78)'},lb)
    }else if(s==='circle'){
      C('circle',{cx:0,cy:0,r:55,fill:'rgba(2,132,199,.12)',stroke:'#0284c7','stroke-width':'2'},sh);
      C('line',{x1:-55,y1:0,x2:55,y2:0,stroke:'#0284c7','stroke-width':'2','stroke-dasharray':'4 3',id:'diameter'},mk);
      C('circle',{cx:0,cy:0,r:3.5,fill:'#0f172a',id:'center'},mk);
      if(this._sl)T('圓形（含直徑線與圓心）',{x:0,y:78,'class':'sm',transform:'rotate('+(-a)+' 0 78)'},lb)
    }else if(s==='cylinder-unfold'){
      this._drawCyl(f);
    }
  }
  _drawCyl(g){
    var p=this._p,a=this._a,k=0.55,R=28,H=70,W=Math.round(2*Math.PI*R*k),x=-W/2,y=-20;
    // blue side rectangle
    C('rect',{x:x,y:y,width:Math.max(0,W*p),height:H,fill:'rgba(37,99,235,.18)',stroke:'#2563eb','stroke-width':'2',id:'side-rect'},g);
    // seam lines
    for(var i=1;i<=3;i++){var sx=x+(W/4)*i;if(p>(i-1)/3)C('line',{x1:sx,y1:y,x2:sx,y2:y+H,stroke:'#60a5fa','stroke-width':'1','stroke-dasharray':'3 2'},g)}
    // green base circles
    var op=cl((p-0.15)/0.25,0,1);
    if(op>0){
      C('ellipse',{cx:x,cy:y+H/2,rx:R*0.35*op,ry:R*op,fill:'rgba(22,163,74,.2)',stroke:'#16a34a','stroke-width':'2',id:'base-left'},g);
      C('ellipse',{cx:x+W*p,cy:y+H/2,rx:R*0.35*op,ry:R*op,fill:'rgba(22,163,74,.2)',stroke:'#16a34a','stroke-width':'2',id:'base-right'},g);
      if(this._sl&&p>0.5){T('底面',{x:x, y:y+H/2, 'class':'sm',fill:'#15803d'},g);T('底面',{x:x+W*p,y:y+H/2,'class':'sm',fill:'#15803d'},g)}
    }
    if(this._sl){
      T('側面展開是長方形',{x:0,y:68,'class':'lb',fill:'#2563eb'},g);
      T('底面拓印是圓形',{x:0,y:86,'class':'lb',fill:'#16a34a'},g);
      T('示意圖，未按真實比例',{x:0,y:102,'class':'note'},g);
    }
  }
}
if(!customElements.get('isometric-rotator'))customElements.define('isometric-rotator',IR);
})();