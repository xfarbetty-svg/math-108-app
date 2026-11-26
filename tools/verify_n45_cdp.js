/**
 * tools/verify_n45_cdp.js — G4-N-4-5 CDP 實機驗證（2026-11-25 改版）
 *  A. 元件 ?q=1..10 × Light/Dark × 390px：教具含 ≤415px（含展開算理後）、零橫向溢出、零「分之」國字、零劇透、真實教具事件
 *  B. 1280px 桌面版全題零溢出／高度合規
 *  C. 觀念小教室 mode=concept：三活動真實事件（拖曳、互換高亮、分數條檢查）
 *  D. 主入口 app/index.html → 四年級 → N-4-5 → 概念／真題 Q1~Q10 全流程
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9455;
const httpPort = 9456;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }

async function waitTarget() {
  const end = Date.now() + 9000;
  while (Date.now() < end) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/list');
      const t = (await r.json()).find((x) => x.type === 'page');
      if (t && t.webSocketDebuggerUrl) return t;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('CDP target 逾時');
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const WS = globalThis.WebSocket || require('ws');
    const ws = new WS(url); let id = 0; const waiting = new Map(); const errors = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params || {}));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(JSON.stringify(m.params));
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({
      ws, errors,
      send: (method, params = {}) => new Promise((res) => {
        const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
      })
    });
  });
}
function startStaticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm' };
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (e) { res.writeHead(404); res.end('NOT FOUND'); }
  });
  return new Promise((resolve) => server.listen(httpPort, '127.0.0.1', () => resolve(server)));
}

const SPOILER = {
  numberline: `(()=>{const c=document.getElementById('nlCount');return !!c&&c.innerHTML===''&&document.querySelectorAll('.nl-cell.hitA,.nl-cell.hitB').length===0&&document.getElementById('stepsBox').hidden})()`,
  barpack: `(()=>document.querySelectorAll('#examDiagram .bc.on,#examDiagram .bc.full').length===0&&document.getElementById('stepsBox').hidden&&document.getElementById('barCount').innerText.indexOf('已填 0')>=0)()`,
  unitbar: `(()=>document.querySelectorAll('#examDiagram .bc.on,#examDiagram .bc.full').length===0&&document.getElementById('stepsBox').hidden&&document.getElementById('barCount').innerText.indexOf('已填 0')>=0)()`,
  packdiv: `(()=>document.getElementById('packRow').innerHTML===''&&document.getElementById('stepsBox').hidden&&document.getElementById('packCount').innerHTML==='')()`,
  regroup: `(()=>document.getElementById('rgOut').innerHTML===''&&document.getElementById('stepsBox').hidden)()`
};
const INTERACT = {
  numberline: `(()=>{document.getElementById('nlA').click();document.getElementById('nlB').click();return {n:document.querySelectorAll('.nl-cell.hitA,.nl-cell.hitB').length,txt:document.getElementById('nlCount').innerText}})()`,
  barpack: `(()=>{document.getElementById('barFill').click();document.getElementById('barPack').click();return {n:document.querySelectorAll('#examDiagram .bc.full').length,txt:document.getElementById('barCount').innerText}})()`,
  unitbar: `(()=>{document.getElementById('barFill').click();document.getElementById('barPack').click();return {n:document.querySelectorAll('#examDiagram .bc.full').length,txt:document.getElementById('barCount').innerText}})()`,
  packdiv: `(()=>{document.getElementById('pkGo').click();return {n:document.querySelectorAll('.pack-unit').length,txt:document.getElementById('packCount').innerText}})()`,
  regroup: `(()=>{const a=document.getElementById('rgGo');if(a)a.click();const b=document.getElementById('rgGo2');if(b)b.click();return {txt:document.getElementById('rgOut').innerText}})()`
};
const EXPECT = {
  1: { type: 'numberline', min: 11 }, 2: { type: 'barpack', min: 27 },
  3: { type: 'unitbar', min: 7 }, 4: { type: 'packdiv', min: 20 },
  5: { type: 'regroup' }, 6: { type: 'regroup' }, 7: { type: 'regroup' },
  8: { type: 'regroup' }, 9: { type: 'regroup' }, 10: { type: 'barpack', min: 27 }
};

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(out, 'chrome_n45_v2'), '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let c, server;
  try {
    const t = await waitTarget(); c = await connect(t.webSocketDebuggerUrl);
    const send = c.send;
    await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
    const fail = [];
    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails) throw new Error(expr + ' -> ' + JSON.stringify(r.result.exceptionDetails));
      return r.result && r.result.result && r.result.result.value;
    };
    const nav = async (url, ms = 480) => {
      await send('Page.navigate', { url }); await sleep(ms);
      for (let k = 0; k < 20; k++) {
        const ok = await evalJs(`!!(window.__N45_SELFTEST__ && window.__N45_MODE__ && window.__N45_READY__)`);
        if (ok) break; await sleep(120);
      }
    };
    const shot = async (name) => {
      const s = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, name), Buffer.from(s.result.data, 'base64'));
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'fraction_mixed_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-5.json'), 'utf8'));
    const maxH = {}, maxW = {};

    /* A. 10 題 × 雙主題 × 390px */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,mode:window.__N45_MODE__,
          q:window.__N45_Q__,type:window.__N45_TYPE__,navHidden:document.getElementById('actNav').hidden,
          examShown:!document.getElementById('examView').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt').length,
          noCombo:document.querySelectorAll('#comboPool,#comboSlots').length===0,
          badWord:document.documentElement.innerHTML.indexOf('分之')>=0,
          frac:document.querySelectorAll('#examView .frac').length,
          diagram:document.getElementById('examDiagram').children.length>0,
          selftest:window.__N45_SELFTEST__.details[${q}-1].pass,
          stepsHidden:document.getElementById('stepsBox').hidden
        }})()`);
        const tag = 'q' + q + '/' + theme;
        if (m.w > 390) fail.push(tag + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 415) fail.push(tag + ' 教具高 ' + m.h.toFixed(1) + ' > 415');
        if (m.mode !== 'exam' || m.q !== q) fail.push(tag + ' 模式/題號錯誤');
        if (!m.navHidden || !m.examShown) fail.push(tag + ' 真題模式未隱藏手動頁籤');
        if (m.internalOpts !== 0 || !m.noCombo) fail.push(tag + ' 殘留通用模板');
        if (m.badWord) fail.push(tag + ' 出現「分之」國字');
        if (m.frac < 1 || !m.diagram) fail.push(tag + ' 缺標準分數排版或視覺教具');
        if (!m.selftest) fail.push(tag + ' 解析引擎自檢失敗');
        if (m.type !== EXPECT[q].type) fail.push(tag + ' 視覺類型錯誤 ' + m.type);
        maxH[theme] = Math.max(maxH[theme] || 0, m.h); maxW[theme] = Math.max(maxW[theme] || 0, m.w);

        const clean = await evalJs(SPOILER[m.type]);
        if (!clean) fail.push(tag + ' 初始畫面劇透');
        if ((q === 1 && theme === 'light') || (q === 2 && theme === 'light') || (q === 4 && theme === 'light') || (q === 7 && theme === 'dark') || (q === 10 && theme === 'dark')) await shot('n45_' + tag.replace('/', '_') + '.png');

        const act = await evalJs(INTERACT[m.type]);
        const exp = EXPECT[q];
        if (exp.min && (!(act.n >= exp.min) || !act.txt)) fail.push(tag + ' 教具事件未生效 ' + JSON.stringify(act));
        if (!exp.min && !act.txt) fail.push(tag + ' 借位拆解未生效');
        await evalJs(`document.getElementById('revealSteps').click()`);
        const after = await evalJs(`(()=>{const app=document.getElementById('app');return {w:document.body.scrollWidth,h:app.getBoundingClientRect().height,shown:!document.getElementById('stepsBox').hidden,lines:document.querySelectorAll('#stepsBox .st,#stepsBox .fin').length}})()`);
        if (after.w > 390) fail.push(tag + ' 展開後橫向溢出 ' + after.w);
        if (after.h > 415) fail.push(tag + ' 展開算理後高 ' + after.h.toFixed(1) + ' > 415');
        if (!after.shown || after.lines !== 3) fail.push(tag + ' 算理拆解未展開 3 行');
        maxH[theme] = Math.max(maxH[theme], after.h); maxW[theme] = Math.max(maxW[theme], after.w);
      }
    }

    /* B. 桌面 1280px */
    for (let q = 1; q <= 10; q++) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await nav(base + '?q=' + q, 220);
      const dm = await evalJs(`({w:document.body.scrollWidth,h:document.getElementById('app').getBoundingClientRect().height})`);
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 415) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + ' > 415');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    /* C. 觀念小教室三活動 */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 280);
    const c0 = await evalJs(`({mode:window.__N45_MODE__,navShown:!document.getElementById('actNav').hidden,tabs:document.querySelectorAll('.act-btn').length,examHidden:document.getElementById('examView').hidden,badWord:document.documentElement.innerHTML.indexOf('分之')>=0,frac:document.querySelectorAll('.frac').length})`);
    if (c0.mode !== 'concept' || !c0.navShown || c0.tabs !== 3 || !c0.examHidden) fail.push('概念模式初始化失敗：' + JSON.stringify(c0));
    if (c0.badWord || c0.frac < 3) fail.push('概念模式仍有國字分數或缺 .frac：' + JSON.stringify(c0));
    await shot('n45_concept_act0_light.png');
    const box = await evalJs(`(()=>{const c=document.querySelector('#pool .card[data-t="2/5"]'),r=c.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 1 });
    const moved = await evalJs(`document.querySelector('#pool .card[data-t="2/5"]').style.transform`);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 0, clickCount: 1 });
    if (!/translate\(20px|translate\(1[5-9]/.test(moved)) fail.push('活動一拖曳 transform 未變動：' + moved);
    const a2 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="1"]').click();const t=document.querySelector('#a2tokens .tok');if(t)t.click();return {hit:document.querySelectorAll('.tok.hit').length,msg:document.getElementById('a2msg').innerText}})()`);
    if (!(a2.hit >= 1)) fail.push('活動二互換第一步高亮失敗：' + JSON.stringify(a2));
    const a3 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="2"]').click();const cs=[...document.querySelectorAll('#a3cells .seg')];cs.slice(0,5).forEach(x=>x.click());document.getElementById('a3check').click();return {on:document.querySelectorAll('#a3cells .seg.on').length,msg:document.getElementById('a3msg').innerText}})()`);
    if (!(a3.on === 5 && a3.msg.indexOf('正確') >= 0)) fail.push('活動三分數條檢查失敗：' + JSON.stringify(a3));
    await shot('n45_concept_act2_light.png');

    /* D. 主入口全流程 */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 420);
    const gradeClicked = await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'))||bs.find(x=>x.textContent.includes('四'));if(b){b.click();return true}return false})()`);
    if (!gradeClicked) fail.push('主入口找不到四年級按鈕');
    await sleep(260);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('N-4-5'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 N-4-5 單元卡');
    await sleep(420);
    const enterTabs = await evalJs(`getComputedStyle(document.getElementById('unitModeTabs')).display`);
    if (!/flex/.test(enterTabs)) fail.push('N-4-5 未出現概念／真題切換頁籤');
    const concept = await evalJs(`(()=>{const f=document.getElementById('conceptFrame');return {src:f.src,mode:f.contentDocument&&f.contentDocument.defaultView.__N45_MODE__,tabs:f.contentDocument?f.contentDocument.querySelectorAll('.act-btn').length:0}})()`);
    if (!concept.src.includes('mode=concept') || concept.mode !== 'concept' || concept.tabs !== 3) fail.push('概念小教室 iframe 失敗：' + JSON.stringify(concept));
    await evalJs(`document.getElementById('btnModeExam').click()`); await sleep(380);
    const enter = await evalJs(`({frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent})`);
    if (!enter.frame.includes('?q=1')) fail.push('真題 iframe 未帶 ?q=1：' + enter.frame);
    if (enter.stem !== unit.questions[0].stem) fail.push('外殼題幹與題庫不一致：' + enter.stem);
    for (let i = 1; i <= 10; i++) {
      const s = await evalJs(`({frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if (!s.frame.includes('?q=' + i)) fail.push('Q' + i + ' iframe 題號錯誤：' + s.frame);
      if (s.stem !== unit.questions[i - 1].stem) fail.push('Q' + i + ' 外殼題幹不符');
      if (s.opts !== 4) fail.push('Q' + i + ' 外殼選項數 ' + s.opts);
      if (i < 10) { await evalJs(`document.getElementById('btnNext').click()`); await sleep(200); }
    }
    await evalJs(`document.getElementById('btnPrev').click()`); await sleep(200);
    if (!(await evalJs(`document.getElementById('stageFrame').src`)).includes('?q=9')) fail.push('上一題按鈕未回 Q9');
    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error/exception ' + realErrors.length + ' 筆：' + realErrors[0].slice(0, 220));

    console.log('MAX_HEIGHT light=' + maxH.light.toFixed(1) + ' dark=' + maxH.dark.toFixed(1) + ' desktop=' + maxH.desktop.toFixed(1));
    console.log('MAX_WIDTH  light=' + maxW.light + ' dark=' + maxW.dark);
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n45_cdp: 10題×Light/Dark 390px/1280px 零溢出、含展開算理≤415px、零「分之」國字、5 類真實教具事件、零劇透、主入口 Q1~Q10、零 console error');
    console.log('截圖：tools/_scratch/n45_q1_light.png, n45_q2_light.png, n45_q4_light.png, n45_q7_dark.png, n45_q10_dark.png, n45_concept_act0_light.png, n45_concept_act2_light.png');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); if (server) server.close(); child.kill(); }
})();
