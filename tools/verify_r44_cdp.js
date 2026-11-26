/** tools/verify_r44_cdp.js — G4-R-4-4 CDP 實機量測（390px/1280px × Light/Dark × 10 題 + 三活動） */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9464, httpPort = 9465;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHROME = ['C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }
async function waitTarget(){const end=Date.now()+9000;while(Date.now()<end){try{const r=await fetch('http://127.0.0.1:'+port+'/json/list');const t=(await r.json()).find(x=>x.type==='page');if(t&&t.webSocketDebuggerUrl)return t;}catch(e){}await sleep(150);}throw new Error('CDP target 逾時');}
function connect(url){return new Promise((resolve,reject)=>{const WS=globalThis.WebSocket||require('ws');const ws=new WS(url);let id=0;const waiting=new Map();const errors=[];ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params||{}));if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(JSON.stringify(m.params));if(m.id&&waiting.has(m.id)){waiting.get(m.id)(m);waiting.delete(m.id);}};ws.onerror=reject;ws.onopen=()=>resolve({ws,errors,send:(method,params={})=>new Promise(res=>{const i=++id;waiting.set(i,res);ws.send(JSON.stringify({id:i,method,params}));})});});}
function startServer(){const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8'};return new Promise(resolve=>{const s=http.createServer((req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=path.join(root,rel);if(!file.startsWith(root)){res.writeHead(403);res.end();return;}const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch(e){res.writeHead(404);res.end('NOT FOUND');}});s.listen(httpPort,'127.0.0.1',()=>resolve(s));});}
(async()=>{
  if(!fs.existsSync(out))fs.mkdirSync(out,{recursive:true});
  const child=spawn(CHROME,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--window-size=390,844','about:blank'],{stdio:'ignore'});
  let c,srv;
  try{
    const t=await waitTarget();c=await connect(t.webSocketDebuggerUrl);const send=c.send;
    await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
    const fail=[];
    const ev=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.result&&r.result.exceptionDetails)throw new Error(expr+' -> '+JSON.stringify(r.result.exceptionDetails));return r.result&&r.result.result&&r.result.result.value;};
    const nav=async(url,ms=180)=>{await send('Page.navigate',{url});await sleep(ms);for(let i=0;i<15;i++){if(await ev(`!!(document.body&&document.readyState==='complete')`))break;await sleep(80);}};
    const base='file:///'+path.join(root,'app','components','pattern_logic_g4_lab.html').replace(/\\/g,'/');
    const unit=JSON.parse(fs.readFileSync(path.join(root,'data/units/G4/R-4-4.json'),'utf8'));
    const svgSet=new Set();let maxH=0,maxW=0;
    for(const theme of ['light','dark']){
      for(let q=1;q<=10;q++){
        await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
        await nav(`${base}?q=${q}&theme=${theme}`);
        const m=await ev(`(()=>{const app=document.getElementById('app').getBoundingClientRect();const svg=document.querySelector('.stage svg');const tabs=getComputedStyle(document.getElementById('tabs')).display;const bad=document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem').length;return {h:app.height,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,tabs,bad,spoiler:document.querySelectorAll('.explain').length,svg:svg?svg.innerHTML:''};})()`);
        if(theme==='light')svgSet.add(m.svg);
        maxH=Math.max(maxH,m.h);maxW=Math.max(maxW,m.sw);
        if(m.h>415)fail.push(`Q${q} ${theme} 初始高 ${m.h.toFixed(1)}>415`);
        if(m.sw>m.cw)fail.push(`Q${q} ${theme} 橫向溢出 ${m.sw}>${m.cw}`);
        if(m.tabs!=='none')fail.push(`Q${q} ${theme} 活動頁籤未隱藏`);
        if(m.bad>0)fail.push(`Q${q} ${theme} 教具自帶題幹/選項`);
        if(m.spoiler>0)fail.push(`Q${q} ${theme} 初始劇透`);
        await ev(`document.querySelector('[data-r="1"]').click()`);await sleep(50);
        const m2=await ev(`({h:document.getElementById('app').getBoundingClientRect().height,e:document.querySelectorAll('.explain').length})`);
        maxH=Math.max(maxH,m2.h);
        if(m2.h>415)fail.push(`Q${q} ${theme} 展開算理後高 ${m2.h.toFixed(1)}>415`);
        if(m2.e!==1)fail.push(`Q${q} ${theme} 算理未展開`);
        if(theme==='light'&&q===1){const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'r44_q1_light.png'),Buffer.from(s.result.data,'base64'));}
        if(theme==='dark'&&q===5){const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'r44_q5_dark.png'),Buffer.from(s.result.data,'base64'));}
      }
    }
    if(svgSet.size<9)fail.push(`10 題專屬 SVG 重複過多：僅 ${svgSet.size}/10`);
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
    await nav(`${base}?q=4&theme=light`);
    const hd=await ev(`document.getElementById('app').getBoundingClientRect().height`);
    if(hd>415)fail.push(`桌面 1280×800 高 ${hd.toFixed(1)}>415`);

    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
    await nav(`${base}?mode=concept&theme=light`,220);
    for(let i=0;i<3;i++){
      await ev(`document.querySelectorAll('.tab')[${i}].click()`);await sleep(80);
      const before=await ev(`document.querySelector('.stage svg').innerHTML`);
      await ev(`(()=>{const b=document.querySelector('[data-op="0"]')||document.querySelector('[data-addrow]')||document.querySelector('[data-fill]');if(b)b.click();return true;})()`);await sleep(50);
      const after=await ev(`document.querySelector('.stage svg').innerHTML`);
      if(before===after)fail.push(`概念活動 ${i+1} 按鈕未造成 SVG 真實變化`);
      const h=await ev(`document.getElementById('app').getBoundingClientRect().height`);
      if(h>415)fail.push(`概念活動 ${i+1} 高 ${h.toFixed(1)}>415`);
    }
    await ev(`document.getElementById('btn-theme').click()`);
    const cs=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'r44_concept_dark.png'),Buffer.from(cs.result.data,'base64'));

    srv=await startServer();
    await nav('http://127.0.0.1:'+httpPort+'/app/index.html',400);
    await ev(`(()=>{const b=[...document.querySelectorAll('.grade-btn')].find(x=>x.textContent.includes('四年級'));if(b)b.click();})()`);await sleep(250);
    const clicked=await ev(`(()=>{const c=[...document.querySelectorAll('.unit-card')].find(x=>x.textContent.includes('R-4-4'));if(c){c.click();return true}return false})()`);
    if(!clicked)fail.push('主入口找不到 R-4-4 單元卡');
    await sleep(420);
    const enter=await ev(`({tabs:getComputedStyle(document.getElementById('unitModeTabs')).display,concept:document.getElementById('btnModeConcept').classList.contains('active'),speak:getComputedStyle(document.getElementById('btnSpeak')).display!=='none',scratch:!!document.getElementById('btnOpenScratchpad')&&getComputedStyle(document.getElementById('btnOpenScratchpad')).display!=='none',mode:document.getElementById('conceptFrame').contentDocument.defaultView.__R44_MODE__})`);
    if(!/flex/.test(enter.tabs)||!enter.concept||!enter.speak||!enter.scratch||enter.mode!=='concept')fail.push('主入口未預設概念探索或漏工具列：'+JSON.stringify(enter));
    await ev(`document.getElementById('btnModeExam').click()`);await sleep(280);
    for(let i=1;i<=10;i++){
      const s=await ev(`({frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if(!s.frame.includes('?q='+i))fail.push(`Q${i} iframe 題號錯誤`);
      if(s.stem!==unit.questions[i-1].stem)fail.push(`Q${i} 外殼題幹不符`);
      if(s.opts!==4)fail.push(`Q${i} 外殼選項數 ${s.opts}`);
      if(i<10){await ev(`document.getElementById('btnNext').click()`);await sleep(160);}
    }
    if(c.errors.length)fail.push('瀏覽器執行錯誤：'+c.errors.slice(0,2).join(' | '));
    console.log('CDP maxH='+maxH.toFixed(1)+' maxW='+maxW+' svgVariants='+svgSet.size);
    console.log(fail.length===0?'R44_CDP_ALL_PASS — ALL PASS':'FAILED '+fail.length+'\n'+fail.join('\n'));
    process.exit(fail.length===0?0:1);
  }catch(e){console.error('CDP_ERROR',e);process.exit(1);}
  finally{try{c&&c.ws.close();}catch(e){}try{child.kill();}catch(e){}try{srv&&srv.close();}catch(e){}}
})();
