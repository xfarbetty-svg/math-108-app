/**
 * tools/verify_n410_cdp.js — G4-N-4-10 CDP 實機驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390px/1280px：零溢出、教具 ≤415px、無內部題幹/選項、初始零劇透
 *  B. 觀念小教室 mode=concept：三活動真實 pointer 拖曳與雙主題切換
 *  C. 主入口 app/index.html → 四年級 → N-4-10 → 預設概念探索、保留語音導讀與算草稿、切換真題 Q1~Q10
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9453;
const httpPort = 9454;
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
    const ws = new WS(url);
    let id = 0; const waiting = new Map(); const errors = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params || {}));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(JSON.stringify(m.params));
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({ ws, errors, send: (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }) });
  });
}
function startStaticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
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

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
    const nav = async (url, ms = 220) => {
      await send('Page.navigate', { url });
      await sleep(ms);
      for (let i = 0; i < 15; i++) {
        const ok = await evalJs(`!!(document.body && document.readyState === 'complete')`);
        if (ok) break;
        await sleep(80);
      }
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'protractor_angle_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-10.json'), 'utf8'));
    const maxH = {}, maxW = {};

    /* ---------- A. 真題模式：10 題 × Light/Dark × 390px（含展開算理後高度 <= 415px） ---------- */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,cw:document.documentElement.clientWidth,
          h:app.getBoundingClientRect().height,mode:window.__N410_MODE__,q:window.__N410_Q__,
          navHidden:document.getElementById('actNav').hidden || getComputedStyle(document.getElementById('actNav')).display==='none',
          examShown:!document.getElementById('examView').hidden,
          stepsHidden:document.getElementById('stepsBox').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt').length,
          svg:!!document.querySelector('#examStage svg')
        }})()`);
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 415) fail.push('q' + q + '/' + theme + ' 初始高 ' + m.h.toFixed(1) + ' > 415');
        if (m.mode !== 'exam' || m.q !== q) fail.push('q' + q + '/' + theme + ' 模式錯誤');
        if (!m.navHidden || !m.examShown || !m.stepsHidden) fail.push('q' + q + '/' + theme + ' 狀態或零劇透異常');
        if (m.internalOpts !== 0 || !m.svg) fail.push('q' + q + '/' + theme + ' 選項或SVG異常');

        /* 展開一步一步看算理後高度仍必須 <= 415px */
        await evalJs(`document.getElementById('revealSteps').click()`);
        const hAfter = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
        if (hAfter > 415) fail.push('q' + q + '/' + theme + ' 展開算理後高 ' + hAfter.toFixed(1) + ' > 415');
        maxH[theme] = Math.max(maxH[theme] || 0, hAfter);
        maxW[theme] = Math.max(maxW[theme] || 0, m.w);

        if ((q === 4 && theme === 'light') || (q === 8 && theme === 'dark') || (q === 10 && theme === 'light') || (q === 10 && theme === 'dark')) {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n410_q' + q + '_' + theme + '.png'), Buffer.from(s.result.data, 'base64'));
        }
      }
    }

    /* ---------- A2. 桌面 1280px ---------- */
    for (let q = 1; q <= 10; q++) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await nav(base + '?q=' + q, 140);
      const dm = await evalJs(`({w:document.body.scrollWidth,h:document.getElementById('app').getBoundingClientRect().height})`);
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 415) fail.push('q' + q + '/1280 高 ' + dm.h.toFixed(1) + ' > 415');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    /* ---------- B. 觀念小教室：三活動真實 pointer 拖曳與雙模式截圖 ---------- */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 220);
    const c0 = await evalJs(`({mode:window.__N410_MODE__,tabs:document.querySelectorAll('.act-btn').length,h:document.getElementById('app').getBoundingClientRect().height})`);
    if (c0.mode !== 'concept' || c0.tabs !== 3 || c0.h > 415) fail.push('概念活動一異常：' + JSON.stringify(c0));
    const beforeRot = await evalJs(`window.__N410_STATE__.c0Rot`);
    const box0 = await evalJs(`(()=>{const r=document.querySelector('#c0Stage svg').getBoundingClientRect();return {x:r.x+r.width*0.7,y:r.y+r.height*0.4}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box0.x, y: box0.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box0.x - 45, y: box0.y - 25, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box0.x - 45, y: box0.y - 25, button: 'left', buttons: 0, clickCount: 1 });
    const afterRot = await evalJs(`window.__N410_STATE__.c0Rot`);
    if (afterRot === beforeRot) fail.push('活動一量角器拖曳未改變旋轉角：' + beforeRot);
    const cs0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'n410_concept_act0_light.png'), Buffer.from(cs0.result.data, 'base64'));

    await evalJs(`document.querySelector('.act-btn[data-act="1"]').click()`);
    await sleep(100);
    const h1 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h1 > 415) fail.push('概念活動二高 ' + h1.toFixed(1) + ' > 415');

    await evalJs(`document.querySelector('.act-btn[data-act="2"]').click()`);
    await evalJs(`document.getElementById('c2Step1').click(); document.getElementById('c2Step2').click();`);
    await sleep(100);
    const c2State = await evalJs(`({deg:window.__N410_STATE__.c2Deg,h:document.getElementById('app').getBoundingClientRect().height})`);
    if (c2State.deg !== 215 || c2State.h > 415) fail.push('概念活動三異常：' + JSON.stringify(c2State));
    await evalJs(`document.getElementById('btn-theme').click()`);
    const cs2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'n410_concept_act2_dark.png'), Buffer.from(cs2.result.data, 'base64'));

    /* ---------- C. 主入口 app/index.html 雙分頁預設概念探索 + 語音導讀 + 算草稿 + Q1~Q10 ---------- */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'));if(b)b.click();})()`);
    await sleep(250);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('N-4-10'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 N-4-10 單元卡');
    await sleep(450);
    const enter = await evalJs(`({
      tabs:getComputedStyle(document.getElementById('unitModeTabs')).display,
      conceptActive:document.getElementById('btnModeConcept').classList.contains('active'),
      speakShown:getComputedStyle(document.getElementById('btnSpeak')).display !== 'none',
      scratchShown:!!document.getElementById('btnOpenScratchpad') && getComputedStyle(document.getElementById('btnOpenScratchpad')).display !== 'none',
      cMode:document.getElementById('conceptFrame').contentDocument.defaultView.__N410_MODE__
    })`);
    if (!/flex/.test(enter.tabs) || !enter.conceptActive || !enter.speakShown || !enter.scratchShown || enter.cMode !== 'concept') {
      fail.push('主入口未預設開啟概念探索或漏工具列：' + JSON.stringify(enter));
    }

    await evalJs(`document.getElementById('btnModeExam').click()`); await sleep(300);
    for (let i = 1; i <= 10; i++) {
      const s = await evalJs(`({frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if (!s.frame.includes('?q=' + i)) fail.push('Q' + i + ' iframe 題號錯誤：' + s.frame);
      if (s.stem !== unit.questions[i - 1].stem) fail.push('Q' + i + ' 外殼題幹不符');
      if (s.opts !== 4) fail.push('Q' + i + ' 外殼選項數 ' + s.opts);
      if (i < 10) { await evalJs(`document.getElementById('btnNext').click()`); await sleep(180); }
    }

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error ' + realErrors.length + ' 筆：' + realErrors[0].slice(0, 200));

    console.log('MAX_HEIGHT light=' + maxH.light.toFixed(1) + ' dark=' + maxH.dark.toFixed(1) + ' desktop=' + maxH.desktop.toFixed(1));
    console.log('MAX_WIDTH  light=' + maxW.light + ' dark=' + maxW.dark);
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n410_cdp: 10題×Light/Dark 390px/1280px 零溢出、展開算理≤415px、三活動拖曳、主入口預設概念探索+語音+算草稿、Q1~Q10 全綠');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); if (server) server.close(); child.kill(); }
})();
