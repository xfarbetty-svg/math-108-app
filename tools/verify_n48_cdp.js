/**
 * tools/verify_n48_cdp.js — G4-N-4-8 CDP 實機驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390px：高 <= 415px（含展開算理後）、零橫向溢出、零內部捲軸、零劇透、真實事件
 *  B. 1280px 桌面版全題零溢出／高度合規
 *  C. 觀念小教室 mode=concept：三活動真實事件（活動一拖曳、活動二跳格、活動三標記）＋ 雙模式截圖
 *  D. 主入口 app/index.html → 四年級 → N-4-8 → 概念／真題 Q1~Q10 全流程
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9486;
const httpPort = 9487;
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

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(out, 'chrome_n48_v1'), '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
        const ok = await evalJs(`!!(window.__N48_SELFTEST__ && window.__N48_MODE__ && window.__N48_READY__)`);
        if (ok) break; await sleep(100);
      }
    };
    const shot = async (name) => {
      const s = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, name), Buffer.from(s.result.data, 'base64'));
    };

    const base = 'file:///' + path.join(root, 'app', 'components', 'number_line_g4_lab.html').replace(/\\/g, '/');
    const maxH = {}, maxW = {};

    /* A. 10 題 × 雙主題 × 390px */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,
          vScroll:document.documentElement.scrollHeight>document.documentElement.clientHeight+1,
          mode:window.__N48_MODE__,q:window.__N48_Q__,type:window.__N48_TYPE__,
          navHidden:document.getElementById('actNav').hidden,
          examShown:!document.getElementById('examView').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem,.opts').length,
          svgCnt:document.querySelectorAll('#examDiagram svg').length,
          selftest:window.__N48_SELFTEST__.details[${q}-1].pass,
          stepsHidden:document.getElementById('stepsBox').hidden,
          nlStatus:document.getElementById('nlStatus').textContent,
          hits0:document.querySelectorAll('#examDiagram .nl-hit, #examDiagram .nl-arc').length
        }})()`);
        const tag = 'q' + q + '/' + theme;
        if (m.w > 390) fail.push(tag + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 415) fail.push(tag + ' 教具高 ' + m.h.toFixed(1) + ' > 415');
        if (m.vScroll) fail.push(tag + ' 出現內部垂直捲軸');
        if (m.mode !== 'exam' || m.q !== q) fail.push(tag + ' 模式/題號錯誤');
        if (!m.navHidden || !m.examShown) fail.push(tag + ' 真題模式未隱藏手動頁籤');
        if (m.internalOpts !== 0) fail.push(tag + ' 教具自帶題幹或選項');
        if (m.svgCnt < 1) fail.push(tag + ' 缺 SVG 數線');
        if (!m.selftest) fail.push(tag + ' 解析引擎自檢失敗');
        if (!m.stepsHidden || m.nlStatus !== '' || m.hits0 !== 0) fail.push(tag + ' 初始畫面劇透');
        maxH[theme] = Math.max(maxH[theme] || 0, m.h); maxW[theme] = Math.max(maxW[theme] || 0, m.w);

        await evalJs(`document.getElementById('nlGo').click()`);
        const act = await evalJs(`({hits:document.querySelectorAll('#examDiagram .nl-hit, #examDiagram .nl-arc').length,txt:document.getElementById('nlStatus').textContent})`);
        if (act.hits < 1 || !act.txt) fail.push(tag + ' 教具事件未生效 ' + JSON.stringify(act));

        await evalJs(`document.getElementById('revealSteps').click()`);
        const after = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,
          shown:!document.getElementById('stepsBox').hidden,
          lines:document.querySelectorAll('#stepsBox .st,#stepsBox .fin').length
        }})()`);
        if (after.w > 390) fail.push(tag + ' 展開後橫向溢出 ' + after.w);
        if (after.h > 415) fail.push(tag + ' 展開算理後高 ' + after.h.toFixed(1) + ' > 415');
        if (!after.shown || after.lines !== 3) fail.push(tag + ' 算理拆解未展開 3 行');
        maxH[theme] = Math.max(maxH[theme], after.h); maxW[theme] = Math.max(maxW[theme], after.w);

        if ((q === 1 && theme === 'light') || (q === 6 && theme === 'dark') || (q === 9 && theme === 'light')) {
          await shot('n48_' + tag.replace('/', '_') + '.png');
        }
      }
    }

    /* B. 桌面 1280px */
    for (let q = 1; q <= 10; q++) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await nav(base + '?q=' + q, 200);
      const dm = await evalJs(`({w:document.body.scrollWidth,h:document.getElementById('app').getBoundingClientRect().height})`);
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 415) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + ' > 415');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    /* C. 觀念小教室三活動 */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 260);
    const c0 = await evalJs(`({mode:window.__N48_MODE__,navShown:!document.getElementById('actNav').hidden,tabs:document.querySelectorAll('.act-btn').length,examHidden:document.getElementById('examView').hidden,h:document.getElementById('app').getBoundingClientRect().height})`);
    if (c0.mode !== 'concept' || !c0.navShown || c0.tabs !== 3 || !c0.examHidden || c0.h > 415) fail.push('概念模式初始化失敗：' + JSON.stringify(c0));
    const kb0 = await evalJs(`(()=>{const r=document.getElementById('a0knob').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,t:document.getElementById('a0knob').style.transform}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: kb0.x, y: kb0.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: kb0.x + 120, y: kb0.y, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: kb0.x + 120, y: kb0.y, button: 'left', buttons: 0, clickCount: 1 });
    const kb1 = await evalJs(`document.getElementById('a0knob').style.transform`);
    if (kb1 === kb0.t) fail.push('活動一拖曳 transform 未變動：' + kb1);
    await shot('n48_concept_act0_light.png');

    await evalJs(`document.querySelector('.act-btn[data-act="1"]').click();document.getElementById('a1d5').click();document.getElementById('a1next').click();document.getElementById('btn-theme').click();`);
    const a1 = await evalJs(`({msg:document.getElementById('a1msg').innerText,h:document.getElementById('app').getBoundingClientRect().height,theme:document.documentElement.dataset.theme})`);
    if (!a1.msg.includes('1 格') || a1.h > 415 || a1.theme !== 'dark') fail.push('活動二跳格或主題切換失敗：' + JSON.stringify(a1));
    await shot('n48_concept_act1_dark.png');

    await evalJs(`document.getElementById('btn-theme').click();document.querySelector('.act-btn[data-act="2"]').click();document.getElementById('a2mark').click();`);
    const a2 = await evalJs(`({msg:document.getElementById('a2msg').innerText,h:document.getElementById('app').getBoundingClientRect().height})`);
    if (!a2.msg.includes('0.75') || a2.h > 415) fail.push('活動三標記失敗：' + JSON.stringify(a2));
    await shot('n48_concept_act2_light.png');

    /* D. 主入口全流程 */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    const gradeClicked = await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'))||bs.find(x=>x.textContent.includes('四'));if(b){b.click();return true}return false})()`);
    if (!gradeClicked) fail.push('主入口找不到四年級按鈕');
    await sleep(240);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('N-4-8'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 N-4-8 單元卡');
    await sleep(400);
    const enterTabs = await evalJs(`getComputedStyle(document.getElementById('unitModeTabs')).display`);
    if (!/flex/.test(enterTabs)) fail.push('N-4-8 未出現概念／真題切換頁籤');
    const concept = await evalJs(`(()=>{const f=document.getElementById('conceptFrame');return {src:f.src,mode:f.contentDocument&&f.contentDocument.defaultView.__N48_MODE__,tabs:f.contentDocument?f.contentDocument.querySelectorAll('.act-btn').length:0}})()`);
    if (!concept.src.includes('mode=concept') || concept.mode !== 'concept' || concept.tabs !== 3) fail.push('概念小教室 iframe 失敗：' + JSON.stringify(concept));

    await evalJs(`document.getElementById('btnModeExam').click()`); await sleep(350);
    for (let q = 1; q <= 10; q++) {
      const st = await evalJs(`({stem:document.getElementById('shellStem').textContent,src:document.getElementById('stageFrame').src,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if (!st.src.includes('q=' + q) || !st.stem || st.opts !== 4) fail.push('主入口 Q' + q + ' 載入失敗');
      if (q < 10) { await evalJs(`document.getElementById('btnNext').click()`); await sleep(180); }
    }
    await evalJs(`document.getElementById('btnPrev').click()`); await sleep(180);
    if (!(await evalJs(`document.getElementById('stageFrame').src`)).includes('?q=9')) fail.push('上一題按鈕未回 Q9');

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('Console/Page errors: ' + realErrors.slice(0, 3).join(' | '));
    if (fail.length) {
      console.error('FAIL verify_n48_cdp (' + fail.length + '):\n- ' + fail.join('\n- '));
      process.exit(1);
    }
    console.log('PASS verify_n48_cdp: 10 題×Light/Dark×390px + 1280px + 概念三活動 + 主入口全綠',
      'MAX_H=', JSON.stringify(maxH), 'MAX_W=', JSON.stringify(maxW));
  } finally {
    if (server) server.close();
    try { if (c && c.ws) c.ws.close(); } catch (e) {}
    try { child.kill('SIGKILL'); } catch (e) {}
  }
})();
