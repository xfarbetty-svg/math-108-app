/**
 * tools/verify_n47_cdp.js — G4-N-4-7 CDP 實機驗證（port 9476/9477）
 *  A. ?q=1..10 × Light/Dark × 390px：≤415px（含展開算理）、零橫向溢出、零內部垂直捲軸、零劇透、真實教具事件
 *  B. 1280px 桌面全題合規
 *  C. 概念探索三活動真實事件（位值卡放入、補零比大小、直式對齊與加法檢查）
 *  D. 主入口四年級 → N-4-7 → 概念／真題 Q1~Q10 全流程
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9476;
const httpPort = 9477;
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
    ws.onopen = () => resolve({ ws, errors, send: (method, params = {}) => new Promise((res) => {
      const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
    }) });
  });
}
function startStaticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { if (!res.headersSent) res.writeHead(403); res.end(); return; }
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (e) {
      if (!res.headersSent) res.writeHead(404);
      res.end('NOT FOUND');
    }
  });
  server.on('clientError', () => {});
  return new Promise((resolve) => server.listen(httpPort, '127.0.0.1', () => resolve(server)));
}

const SPOILER = `(()=>document.querySelectorAll('#examDiagram .on,#examDiagram .fin,#examDiagram .cmp-tick').length===0&&document.getElementById('stepsBox').hidden&&document.getElementById('eqCount').innerHTML==='')()`;
const INTERACT = {
  place: `(()=>{document.getElementById('eqGo').click();return {n:document.querySelectorAll('#examDiagram .vt-cell.on').length,txt:document.getElementById('eqCount').innerText}})()`,
  convert: `(()=>{document.getElementById('eqGo').click();return {n:document.querySelectorAll('#examDiagram .on').length,txt:document.getElementById('eqCount').innerText}})()`,
  compare: `(()=>{document.getElementById('eqGo').click();return {n:document.querySelectorAll('#examDiagram .cmp-tick').length,txt:document.getElementById('eqCount').innerText}})()`,
  vertical: `(()=>{document.getElementById('eqGo').click();document.getElementById('eqGo2').click();return {n:document.querySelectorAll('#examDiagram .vcell.fin').length,txt:document.getElementById('eqCount').innerText}})()`
};

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(out, 'chrome_n47_v1'), '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
    const nav = async (url, ms = 420) => {
      await send('Page.navigate', { url }); await sleep(ms);
      for (let k = 0; k < 20; k++) {
        if (await evalJs(`!!(window.__N47_SELFTEST__ && window.__N47_MODE__ && window.__N47_READY__)`)) break;
        await sleep(120);
      }
    };
    const shot = async (name) => {
      const s = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, name), Buffer.from(s.result.data, 'base64'));
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'decimal_hundredth_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-7.json'), 'utf8'));
    const maxH = {}, maxW = {};

    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,mode:window.__N47_MODE__,
          q:window.__N47_Q__,type:window.__N47_TYPE__,navHidden:document.getElementById('actNav').hidden,
          examShown:!document.getElementById('examView').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem').length,
          diagram:document.getElementById('examDiagram').children.length>0,
          selftest:window.__N47_SELFTEST__.details[${q}-1].pass,
          stepsHidden:document.getElementById('stepsBox').hidden,
          noVScroll:app.scrollHeight<=app.clientHeight+2&&document.documentElement.scrollHeight<=document.documentElement.clientHeight+2,
          theme:document.documentElement.dataset.theme
        }})()`);
        const tag = 'q' + q + '/' + theme;
        if (m.w > 390) fail.push(tag + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 415) fail.push(tag + ' 教具高 ' + m.h.toFixed(1) + ' > 415');
        if (m.mode !== 'exam' || m.q !== q) fail.push(tag + ' 模式/題號錯誤');
        if (!m.navHidden || !m.examShown) fail.push(tag + ' 真題模式未隱藏頁籤');
        if (m.internalOpts !== 0 || !m.diagram) fail.push(tag + ' 自帶題幹選項或缺視覺教具');
        if (!m.selftest) fail.push(tag + ' 解析引擎自檢失敗');
        if (!m.noVScroll) fail.push(tag + ' 含內部垂直捲軸');
        if (m.theme !== theme) fail.push(tag + ' 主題未生效');
        if (!INTERACT[m.type]) fail.push(tag + ' 未知視覺類型 ' + m.type);
        maxH[theme] = Math.max(maxH[theme] || 0, m.h); maxW[theme] = Math.max(maxW[theme] || 0, m.w);

        if (!(await evalJs(SPOILER))) fail.push(tag + ' 初始畫面劇透');
        if ((q === 1 && theme === 'light') || (q === 5 && theme === 'light') || (q === 9 && theme === 'light') || (q === 2 && theme === 'dark') || (q === 10 && theme === 'dark')) await shot('n47_' + tag.replace('/', '_') + '.png');

        const act = await evalJs(INTERACT[m.type]);
        if (!(act.n >= 1) || !act.txt) fail.push(tag + ' 教具事件未生效 ' + JSON.stringify(act));
        await evalJs(`document.getElementById('revealSteps').click()`);
        const after = await evalJs(`(()=>{const app=document.getElementById('app');return {w:document.body.scrollWidth,h:app.getBoundingClientRect().height,shown:!document.getElementById('stepsBox').hidden,lines:document.querySelectorAll('#stepsBox .st,#stepsBox .fin').length,noVScroll:app.scrollHeight<=app.clientHeight+2}})()`);
        if (after.w > 390) fail.push(tag + ' 展開後橫向溢出 ' + after.w);
        if (after.h > 415) fail.push(tag + ' 展開算理後高 ' + after.h.toFixed(1) + ' > 415');
        if (!after.shown || after.lines !== 3) fail.push(tag + ' 算理拆解未展開 3 行');
        if (!after.noVScroll) fail.push(tag + ' 展開後含垂直捲軸');
        maxH[theme] = Math.max(maxH[theme], after.h); maxW[theme] = Math.max(maxW[theme], after.w);
      }
    }

    for (let q = 1; q <= 10; q++) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await nav(base + '?q=' + q, 220);
      const dm = await evalJs(`({w:document.body.scrollWidth,h:document.getElementById('app').getBoundingClientRect().height})`);
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 415) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + ' > 415');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 280);
    const c0 = await evalJs(`({mode:window.__N47_MODE__,navShown:!document.getElementById('actNav').hidden,tabs:document.querySelectorAll('.act-btn').length,examHidden:document.getElementById('examView').hidden,voice:!!document.getElementById('btnSpeakLab'),draft:!!document.getElementById('btnDraftLab')})`);
    if (c0.mode !== 'concept' || !c0.navShown || c0.tabs !== 3 || !c0.examHidden || !c0.voice || !c0.draft) fail.push('概念模式初始化失敗：' + JSON.stringify(c0));
    await shot('n47_concept_act0_light.png');
    const a0 = await evalJs(`(()=>{document.querySelector('#a0Pool .digit-card[data-v="1"]').click();document.querySelector('#a0Slots [data-slot="個位"]').click();document.querySelector('#a0Pool .digit-card[data-v="3"]').click();document.querySelector('#a0Slots [data-slot="十分位"]').click();document.querySelector('#a0Pool .digit-card[data-v="7"]').click();document.querySelector('#a0Slots [data-slot="百分位"]').click();document.getElementById('a0Check').click();return {on:document.querySelectorAll('#a0Slots .filled').length,msg:document.getElementById('a0Msg').innerText}})()`);
    if (!(a0.on === 3 && a0.msg.indexOf('1.37') >= 0)) fail.push('活動一三活動事件失敗：' + JSON.stringify(a0));
    const a1 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="1"]').click();document.getElementById('a1Go').click();return {n:document.querySelectorAll('#a1bars .eq-cell.on').length,txt:document.getElementById('a1svg').textContent,msg:document.getElementById('a1Msg').innerText}})()`);
    if (!(a1.n >= 10 && a1.txt.indexOf('2.05') >= 0 && a1.msg.indexOf('2.50') >= 0)) fail.push('活動二補零比大小失敗：' + JSON.stringify(a1));
    const a2 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="2"]').click();document.getElementById('a2Align').click();document.getElementById('a2Check').click();return {on:document.querySelectorAll('#a2grid .vcell.on').length,txt:document.getElementById('a2count').innerText,msg:document.getElementById('a2Msg').innerText}})()`);
    if (!(a2.on >= 6 && a2.txt.indexOf('0.63') >= 0 && a2.msg.indexOf('0.63') >= 0)) fail.push('活動三直式檢查失敗：' + JSON.stringify(a2));
    await shot('n47_concept_act2_light.png');

    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 420);
    const gradeClicked = await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'))||bs.find(x=>x.textContent.includes('四'));if(b){b.click();return true}return false})()`);
    if (!gradeClicked) fail.push('主入口找不到四年級按鈕');
    await sleep(260);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('N-4-7'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 N-4-7 單元卡');
    await sleep(420);
    const enterTabs = await evalJs(`getComputedStyle(document.getElementById('unitModeTabs')).display`);
    if (!/flex/.test(enterTabs)) fail.push('N-4-7 未出現概念／真題切換頁籤');
    const concept = await evalJs(`(()=>{const f=document.getElementById('conceptFrame');return {src:f.src,mode:f.contentDocument&&f.contentDocument.defaultView.__N47_MODE__,tabs:f.contentDocument?f.contentDocument.querySelectorAll('.act-btn').length:0}})()`);
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
    console.log('PASS verify_n47_cdp: 10題×Light/Dark 390px/1280px 零溢出、含展開算理≤415px、零劇透、四類真實教具事件、三活動、主入口 Q1~Q10、零 console error');
    console.log('截圖：tools/_scratch/n47_q1_light.png, n47_q5_light.png, n47_q9_light.png, n47_q2_dark.png, n47_q10_dark.png, n47_concept_act0_light.png, n47_concept_act2_light.png');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); if (server) server.close(); child.kill(); }
})();
