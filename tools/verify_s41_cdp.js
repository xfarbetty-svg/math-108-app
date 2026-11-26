/**
 * tools/verify_s41_cdp.js — G4-S-4-1 CDP 實機驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390px/1280px：零溢出、教具 ≤415px、q-mode 活動卡片完全隱藏、10 題 SVG 各不相同、初始零劇透
 *  B. 觀念小教室 mode=concept：三活動切換高度 ≤415px、真實 pointer 拖曳與雙主題切換
 *  C. 主入口 app/index.html → 四年級 → S-4-1 → 預設概念探索、保留語音導讀與算草稿、切換真題 Q1~Q10
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9487;
const httpPort = 9488;
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
    const base = 'file:///' + path.join(root, 'app', 'components', 'angle_degree_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/S-4-1.json'), 'utf8'));
    const maxH = { light: 0, dark: 0, desktop: 0 }, maxW = { light: 0, dark: 0 };
    const svgSet = new Set();

    /* ---------- A. 真題模式：10 題 × Light/Dark × 390px（含展開算理後高度 <= 415px） ---------- */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
        await nav(`${base}?q=${q}&theme=${theme}`, 180);
        const m = await evalJs(`(()=>{
          const app = document.getElementById('app').getBoundingClientRect();
          const sw = document.documentElement.scrollWidth, cw = document.documentElement.clientWidth;
          const actVis = [0,1,2].some(i => getComputedStyle(document.getElementById('act-'+i+'-view')).display !== 'none');
          const navVis = getComputedStyle(document.getElementById('activityNav')).display !== 'none';
          const stepsHid = document.getElementById('stepsBox').hidden;
          const opts = document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem').length;
          const svgHtml = document.getElementById('examStage').innerHTML;
          return { h: app.height, sw, cw, actVis, navVis, stepsHid, opts, svgHtml };
        })()`);
        if (theme === 'light') svgSet.add(m.svgHtml);
        if (m.h > maxH[theme]) maxH[theme] = m.h;
        if (m.sw > maxW[theme]) maxW[theme] = m.sw;
        if (m.h > 415) fail.push(`Q${q} ${theme} 初始高 ${m.h.toFixed(1)} > 415`);
        if (m.sw > m.cw) fail.push(`Q${q} ${theme} 橫向溢出 ${m.sw} > ${m.cw}`);
        if (m.actVis || m.navVis) fail.push(`Q${q} ${theme} q-mode 未隱藏活動卡片或頁籤`);
        if (!m.stepsHid) fail.push(`Q${q} ${theme} stepsBox 初始未隱藏`);
        if (m.opts > 0) fail.push(`Q${q} ${theme} 教具內含禁區選項/題幹元件`);

        await evalJs(`document.getElementById('revealSteps').click()`);
        await sleep(60);
        const hAfter = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
        if (hAfter > maxH[theme]) maxH[theme] = hAfter;
        if (hAfter > 415) fail.push(`Q${q} ${theme} 展開算理後高 ${hAfter.toFixed(1)} > 415`);

        if (theme === 'light' && q === 4) {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 's41_q4_light.png'), Buffer.from(shot.result.data, 'base64'));
        }
        if (theme === 'dark' && q === 9) {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 's41_q9_dark.png'), Buffer.from(shot.result.data, 'base64'));
        }
      }
    }
    if (svgSet.size !== 10) fail.push(`Q1~Q10 專屬 SVG 圖形有重複：僅 ${svgSet.size}/10 種`);

    // 桌面 1280×800 檢查
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await nav(`${base}?q=2&theme=light`, 180);
    const hd = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    maxH.desktop = hd;
    if (hd > 415) fail.push(`桌面 1280×800 高度 ${hd.toFixed(1)} > 415`);

    /* ---------- B. 觀念小教室 mode=concept：三活動切換 + 真實 pointer 拖曳 + 雙主題 ---------- */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await nav(`${base}?mode=concept&theme=light`, 220);

    // 活動一拖曳（鱷魚張嘴）
    const before0 = await evalJs(`window.__S41_STATE__.act0Len`);
    const box0 = await evalJs(`(()=>{const r=document.querySelector('#svg0').getBoundingClientRect();return {x:r.x+r.width*0.35,y:r.y+r.height*0.5}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box0.x, y: box0.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box0.x + 40, y: box0.y - 12, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box0.x + 40, y: box0.y - 12, button: 'left', buttons: 0, clickCount: 1 });
    const after0 = await evalJs(`window.__S41_STATE__.act0Len`);
    if (after0 === before0) fail.push('活動一鱷魚張嘴 pointer 拖曳無反應：' + before0);
    const h0 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h0 > 415) fail.push('概念活動一高度 ' + h0.toFixed(1) + ' > 415');
    const cs0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 's41_concept_act0_light.png'), Buffer.from(cs0.result.data, 'base64'));

    // 活動二拖曳（摺扇開合）
    await evalJs(`document.querySelector('.act-btn[data-act="1"]').click()`);
    await sleep(100);
    const before1 = await evalJs(`window.__S41_STATE__.act1Deg`);
    const box1 = await evalJs(`(()=>{const r=document.querySelector('#svg1').getBoundingClientRect();return {x:r.x+r.width*0.32,y:r.y+r.height*0.25}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box1.x, y: box1.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box1.x - 30, y: box1.y + 15, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box1.x - 30, y: box1.y + 15, button: 'left', buttons: 0, clickCount: 1 });
    const after1 = await evalJs(`window.__S41_STATE__.act1Deg`);
    if (after1 === before1) fail.push('活動二摺扇開合 pointer 拖曳無反應：' + before1);
    const h1 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h1 > 415) fail.push('概念活動二高度 ' + h1.toFixed(1) + ' > 415');

    // 活動三拖曳（尋寶量角器） + Dark 截圖
    await evalJs(`document.querySelector('.act-btn[data-act="2"]').click()`);
    await sleep(100);
    const before2 = await evalJs(`window.__S41_STATE__.act2ProtRot`);
    const box2 = await evalJs(`(()=>{const r=document.querySelector('#svg2').getBoundingClientRect();return {x:r.x+r.width*0.5,y:r.y+r.height*0.2}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box2.x, y: box2.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box2.x + 28, y: box2.y, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box2.x + 28, y: box2.y, button: 'left', buttons: 0, clickCount: 1 });
    const after2 = await evalJs(`window.__S41_STATE__.act2ProtRot`);
    if (after2 === before2) fail.push('活動三尋寶量角器 pointer 拖曳無反應：' + before2);
    const h2 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h2 > 415) fail.push('概念活動三高度 ' + h2.toFixed(1) + ' > 415');
    await evalJs(`document.getElementById('btn-theme').click()`);
    const cs2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 's41_concept_act2_dark.png'), Buffer.from(cs2.result.data, 'base64'));

    /* ---------- C. 主入口 app/index.html 雙分頁預設概念探索 + 語音導讀 + 算草稿 + Q1~Q10 ---------- */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'));if(b)b.click();})()`);
    await sleep(250);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>(x.dataset&&x.dataset.code==='S-4-1')||/^\\s*S-4-1\\b/.test(x.textContent));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 S-4-1 單元卡');
    await sleep(450);
    const enter = await evalJs(`({
      tabs:getComputedStyle(document.getElementById('unitModeTabs')).display,
      conceptActive:document.getElementById('btnModeConcept').classList.contains('active'),
      speakShown:getComputedStyle(document.getElementById('btnSpeak')).display !== 'none',
      scratchShown:!!document.getElementById('btnOpenScratchpad') && getComputedStyle(document.getElementById('btnOpenScratchpad')).display !== 'none',
      cMode:document.getElementById('conceptFrame').contentDocument.defaultView.__S41_MODE__
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
    console.log('PASS verify_s41_cdp: 10題×Light/Dark 390px/1280px 零溢出、q-mode 隱藏活動卡、10題圖形各異、展開算理≤415px、三活動pointer拖曳、主入口全綠');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); if (server) server.close(); child.kill(); }
})();
