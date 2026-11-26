/**
 * tools/verify_n44_cdp.js — G4-N-4-4 CDP 實機驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390px/1280px：零溢出、教具 ≤420px、無內部題幹/選項、逐題解析引擎自檢、零劇透
 *  B. 觀念小教室 mode=concept：三活動真實事件（pointerdown/move/up、高亮、配對）
 *  C. 主入口 app/index.html → 四年級 → N-4-4 → 概念／真題 Q1~Q10 全流程（本機 HTTP 靜態伺服器）
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9446;
const httpPort = 9447;
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

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(out, 'chrome_n44'), '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
    const nav = async (url, ms = 450) => {
      await send('Page.navigate', { url });
      await sleep(ms);
      for (let k = 0; k < 20; k++) {
        const ok = await evalJs(`!!(window.__N44_SELFTEST__ && window.__N44_MODE__)`);
        if (ok) break;
        await sleep(120);
      }
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'two_step_adv_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-4.json'), 'utf8'));
    const maxH = {}, maxW = {};

    /* ---------- A. 真題模式：10 題 × Light/Dark × 390px ---------- */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');const st=window.__N44_SELFTEST__;const d=st.details[${q}-1];return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,mode:window.__N44_MODE__,q:window.__N44_Q__,
          navHidden:document.getElementById('actNav').hidden,examShown:!document.getElementById('examView').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt').length,
          selftest:d.pass,final:d.final,expected:d.expected,steps:d.steps,
          diagram:!!document.querySelector('#examDiagram svg'),badge:document.getElementById('examBadge').textContent
        }})()`);
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 420) fail.push('q' + q + '/' + theme + ' 教具高 ' + m.h.toFixed(1) + ' > 420');
        if (m.mode !== 'exam' || m.q !== q) fail.push('q' + q + '/' + theme + ' 模式/題號錯誤 ' + JSON.stringify({ mode: m.mode, q: m.q }));
        if (!m.navHidden || !m.examShown) fail.push('q' + q + '/' + theme + ' 真題模式未隱藏手動頁籤');
        if (m.internalOpts !== 0) fail.push('q' + q + '/' + theme + ' 教具私自重畫選項 ' + m.internalOpts);
        if (!m.selftest || Math.abs(m.final - m.expected) > 1e-9 || m.steps.length < 2) fail.push('q' + q + '/' + theme + ' 解析引擎自檢失敗 ' + JSON.stringify(m));
        if (!m.diagram) fail.push('q' + q + '/' + theme + ' 缺情境條件圖');
        maxH[theme] = Math.max(maxH[theme] || 0, m.h); maxW[theme] = Math.max(maxW[theme] || 0, m.w);
        /* 零劇透守門：初始 DOM 不得出現正解併式或最終 ＝答案，階段 B 必須隱藏 */
        const sp = await evalJs(`(()=>{const v=document.getElementById('examView');const t=v.innerText;const s=window.__N44_SELFTEST__.details[${q}-1];return {
          tokens:document.querySelectorAll('#comboPool .token-btn').length,
          stepsHidden:document.getElementById('stepsBox').hidden,
          leakExp:t.indexOf(s.exp)>=0,
          leakFinal:t.indexOf('＝'+s.final)>=0
        }})()`);
        if (sp.tokens < 4 || !sp.stepsHidden || sp.leakExp || sp.leakFinal) fail.push('q' + q + '/' + theme + ' 初始劇透或組合器缺損 ' + JSON.stringify(sp));
        if ((q === 1 && theme === 'light') || (q === 2 && theme === 'light') || (q === 2 && theme === 'dark') || (q === 10 && theme === 'dark')) {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n44_q' + q + '_' + theme + '.png'), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    /* Q1 括號先加後除回歸 */
    await nav(base + '?q=1&theme=light');
    const q1 = await evalJs(`window.__N44_SELFTEST__.details[0]`);
    if (q1.steps[0] !== '10＋6＝16' || q1.steps[1] !== '128÷16＝8' || q1.final !== 8) fail.push('Q1 括號拆解錯誤：' + JSON.stringify(q1));

    /* 兩階段互動實測：Q2 點積木組出 (50−25)×8 → 驗證 → 才展開算理 */
    await nav(base + '?q=2&theme=light');
    const composed = await evalJs(`(()=>{
      const want=window.__N44_SELFTEST__.details[1].exp;
      const toks=want.match(/\\d+|[＋−×÷()]/g);
      const btns=[...document.querySelectorAll('#comboPool .token-btn')];
      toks.forEach(t=>{const b=btns.find(x=>x.dataset.t===t); if(b) b.click();});
      document.getElementById('verifyCombo').click();
      return {text:document.getElementById('comboSlots').textContent.replace(/\\s/g,''),
        ok:document.getElementById('comboSlots').classList.contains('ok'),
        revealed:!document.getElementById('stepsBox').hidden,
        steps:document.getElementById('stepsBox').textContent};
    })()`);
    if (composed.text !== '(50−25)×8' || !composed.ok || !composed.revealed || composed.steps.indexOf('25×8＝200') < 0) fail.push('Q2 兩階段組合器失敗：' + JSON.stringify(composed));
    await nav(base + '?q=1&theme=light');
    const revealed = await evalJs(`(()=>{document.getElementById('revealSteps').click();return {shown:!document.getElementById('stepsBox').hidden,hasFirst:document.getElementById('stepsBox').textContent.indexOf('10＋6＝16')>=0}})()`);
    if (!revealed.shown || !revealed.hasFirst) fail.push('看算理拆解按鈕失敗：' + JSON.stringify(revealed));

    /* ---------- A2. 桌面 1280px ---------- */
    for (let q = 1; q <= 10; q++) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await nav(base + '?q=' + q, 140);
      const dm = await evalJs(`({w:document.body.scrollWidth,h:document.getElementById('app').getBoundingClientRect().height})`);
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 420) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + ' > 420');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    /* ---------- B. 觀念小教室：三活動真實事件 ---------- */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 220);
    const c0 = await evalJs(`({mode:window.__N44_MODE__,navShown:!document.getElementById('actNav').hidden,tabs:document.querySelectorAll('.act-btn').length,examHidden:document.getElementById('examView').hidden})`);
    if (c0.mode !== 'concept' || !c0.navShown || c0.tabs !== 3 || !c0.examHidden) fail.push('概念模式初始化失敗：' + JSON.stringify(c0));
    const distinct = await evalJs(`(()=>{const t=[...document.querySelectorAll('.act-card')].map(x=>x.textContent);return {
      a1:t[0].indexOf('3 盒牛奶')>=0 && t[0].indexOf('28×3＋45')>=0,
      a2:t[1].indexOf('120 公分')>=0 && t[1].indexOf('(120−32)÷4')>=0 && t[1].indexOf('120−32÷4')>=0,
      a3:t[2].indexOf('84 顆')>=0 && t[2].indexOf('84÷6×(6−2)')>=0,
      noN43:t[0].indexOf('鉛筆 15 元')<0 && t[1].indexOf('360÷6÷5')<0 && t[2].indexOf('240 條紙藤')<0,
      pairs:document.querySelectorAll('#a3pairs .pair-btn').length
    }})()`);
    if (!distinct.a1 || !distinct.a2 || !distinct.a3 || !distinct.noN43 || distinct.pairs !== 3) fail.push('概念三活動未用三道不同例題：' + JSON.stringify(distinct));
    const cs0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'n44_concept_act0_light.png'), Buffer.from(cs0.result.data, 'base64'));
    const box = await evalJs(`(()=>{const c=document.querySelector('#pool .card[data-k="pre"]'),r=c.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 1 });
    const moved = await evalJs(`document.querySelector('#pool .card[data-k="pre"]').style.transform`);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 0, clickCount: 1 });
    if (!/translate\(20px|translate\(1[5-9]/.test(moved)) fail.push('活動一拖曳 transform 未變動：' + moved);
    const a2 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="1"]').click();const i=firstTokenIndex();document.querySelector('.tok[data-i="'+i+'"]').click();return {hit:document.querySelectorAll('.tok.hit').length,msg:document.getElementById('a2msg').textContent}})()`);
    if (!(a2.hit >= 1)) fail.push('活動二優先區塊高亮失敗：' + JSON.stringify(a2));
    const a3 = await evalJs(`(()=>{document.querySelector('.act-btn[data-act="2"]').click();document.querySelector('[data-x="1"]').click();return {right:document.querySelectorAll('.pair-btn.right').length,msg:document.getElementById('a3msg').textContent}})()`);
    if (!(a3.right >= 1)) fail.push('活動三線段圖配對失敗：' + JSON.stringify(a3));
    const cs2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'n44_concept_act2_light.png'), Buffer.from(cs2.result.data, 'base64'));

    /* ---------- C. 主入口全流程（HTTP 靜態伺服器） ---------- */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    const gradeClicked = await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'))||bs.find(x=>x.textContent.includes('四'));if(b){b.click();return true}return false})()`);
    if (!gradeClicked) fail.push('主入口找不到四年級按鈕');
    await sleep(250);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('N-4-4'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 N-4-4 單元卡');
    await sleep(400);
    const enter = await evalJs(`({tabs:getComputedStyle(document.getElementById('unitModeTabs')).display,frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent})`);
    if (!/flex/.test(enter.tabs)) fail.push('N-4-4 未出現概念／真題切換頁籤');
    if (!enter.frame.includes('?q=1')) fail.push('真題 iframe 未帶 ?q=1：' + enter.frame);
    if (enter.stem !== unit.questions[0].stem) fail.push('外殼題幹與題庫不一致：' + enter.stem);
    await evalJs(`document.getElementById('btnModeConcept').click()`); await sleep(350);
    const concept = await evalJs(`(()=>{const f=document.getElementById('conceptFrame');return {src:f.src,mode:f.contentDocument&&f.contentDocument.defaultView.__N44_MODE__,tabs:f.contentDocument?f.contentDocument.querySelectorAll('.act-btn').length:0}})()`);
    if (!concept.src.includes('mode=concept') || concept.mode !== 'concept' || concept.tabs !== 3) fail.push('概念小教室iframe失敗：' + JSON.stringify(concept));
    await evalJs(`document.getElementById('btnModeExam').click()`); await sleep(300);
    for (let i = 1; i <= 10; i++) {
      const s = await evalJs(`({frame:document.getElementById('stageFrame').src,stem:document.getElementById('shellStem').textContent,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if (!s.frame.includes('?q=' + i)) fail.push('Q' + i + ' iframe 題號錯誤：' + s.frame);
      if (s.stem !== unit.questions[i - 1].stem) fail.push('Q' + i + ' 外殼題幹不符');
      if (s.opts !== 4) fail.push('Q' + i + ' 外殼選項數 ' + s.opts);
      if (i < 10) { await evalJs(`document.getElementById('btnNext').click()`); await sleep(200); }
    }
    await evalJs(`document.getElementById('btnPrev').click()`); await sleep(200);
    const prevQ = await evalJs(`document.getElementById('stageFrame').src`);
    if (!prevQ.includes('?q=9')) fail.push('上一題按鈕未回 Q9：' + prevQ);

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error/exception ' + realErrors.length + ' 筆：' + realErrors[0].slice(0, 220));

    console.log('MAX_HEIGHT light=' + maxH.light.toFixed(1) + ' dark=' + maxH.dark.toFixed(1) + ' desktop=' + maxH.desktop.toFixed(1));
    console.log('MAX_WIDTH  light=' + maxW.light + ' dark=' + maxW.dark);
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n44_cdp: 10題×Light/Dark 390px/1280px 零溢出、教具≤420px、三活動真實事件、主入口全流程 Q1~Q10、零 console error');
    console.log('截圖：tools/_scratch/n44_q1_light.png, n44_q2_light.png, n44_q2_dark.png, n44_q10_dark.png, n44_concept_act0_light.png, n44_concept_act2_light.png');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); if (server) server.close(); child.kill(); }
})();
