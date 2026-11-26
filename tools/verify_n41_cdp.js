/**
 * tools/verify_n41_cdp.js — G4-N-4-1 CDP 實機驗證（390×844 / 1280×800，Light/Dark）
 * A. 真題模式 ?q=1..10 × Light/Dark × 390px/1280px：零溢出、教具 ≤415px、無內部題幹/選項、無內部捲軸、零劇透
 * B. 概念探索 ?mode=concept：三活動切換與真實互動
 * C. 主入口 app/index.html → 四年級 → N-4-1 雙分頁、聽題目、算草稿全流程與截圖
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9411;
const httpPort = 9412;
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
  const server = await startStaticServer();
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let c;
  try {
    const t = await waitTarget(); c = await connect(t.webSocketDebuggerUrl);
    const send = c.send;
    await send('Page.enable'); await send('Runtime.enable');
    const fail = [];
    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails) throw new Error(expr + ' -> ' + JSON.stringify(r.result.exceptionDetails));
      return r.result && r.result.result && r.result.result.value;
    };
    const navWait = async (url, checkReady = true) => {
      await send('Page.navigate', { url });
      for (let i = 0; i < 40; i++) {
        await sleep(100);
        const ok = await evalJs('document.readyState === "complete" && !!document.body' + (checkReady ? ' && !!window.__N41_READY__' : ''));
        if (ok) break;
      }
      await sleep(120);
    };
    const base = 'http://127.0.0.1:' + httpPort + '/app/components/place_value_g4_lab.html';

    // A. 真題模式 Q1..Q10 × Light/Dark × 390px/1280px
    for (const vp of [{ w: 390, h: 844, mob: true }, { w: 1280, h: 800, mob: false }]) {
      await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mob });
      for (const theme of ['light', 'dark']) {
        for (let q = 1; q <= 10; q++) {
          await navWait(base + '?q=' + q + '&theme=' + theme);
          const m = await evalJs(`(() => {
            const app = document.getElementById('app');
            const board = document.getElementById('examBoard');
            return {
              w: document.body.scrollWidth,
              h: app.getBoundingClientRect().height,
              mode: window.__N41_MODE__,
              internalOpts: document.querySelectorAll('.opt,.opts,.stem,.shell-opt').length,
              stepsHidden: document.getElementById('stepsBox').hidden,
              boardOverflow: board.scrollHeight > board.clientHeight
            };
          })()`);
          if (m.w > vp.w) fail.push('q' + q + '/' + vp.w + '/' + theme + ' 橫向溢出 ' + m.w);
          if (m.h > 415) fail.push('q' + q + '/' + vp.w + '/' + theme + ' 教具高 ' + m.h.toFixed(1) + ' > 415');
          if (m.mode !== 'exam') fail.push('q' + q + ' 模式錯誤 ' + m.mode);
          if (m.internalOpts !== 0) fail.push('q' + q + ' 教具私自渲染題幹或選項 ' + m.internalOpts);
          if (!m.stepsHidden) fail.push('q' + q + ' 初始未隱藏算理');
          if (m.boardOverflow) fail.push('q' + q + '/' + vp.w + ' 出現內部捲軸');
          if (vp.w === 390 && q === 1 && theme === 'light') {
            fs.writeFileSync(path.join(out, 'n41_q1_light.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
          }
          if (vp.w === 390 && q === 4 && theme === 'dark') {
            fs.writeFileSync(path.join(out, 'n41_q4_dark.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
          }
        }
      }
    }

    // 真題互動驗證：拖曳放置、讀零亮燈、逐欄比對
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navWait(base + '?q=2&theme=light');
    const dragOk = await evalJs(`(() => {
      const tile = document.querySelector('#examBoard .tile:not(.used)'), slot = document.querySelector('#examBoard .slot[data-i="2"]');
      const r = tile.getBoundingClientRect(), s = slot.getBoundingClientRect();
      const ev = (t,x,y,el) => el.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,pointerId:1}));
      ev('pointerdown', r.x+10, r.y+10, tile);
      ev('pointermove', r.x+30, s.y+10, tile);
      ev('pointerup', s.x+10, s.y+10, slot);
      return slot.classList.contains('set') && !!slot.textContent;
    })()`);
    if (!dragOk) fail.push('Q2 拖曳定位失敗');

    await navWait(base + '?q=4&theme=light');
    const litOk = await evalJs(`(() => { const z = document.querySelector('#examBoard .digit.zero'); z.click(); return z.classList.contains('lit') && document.getElementById('examMsg').textContent.includes('省略'); })()`);
    if (!litOk) fail.push('Q4 讀零亮燈失敗');

    await navWait(base + '?q=10&theme=light');
    const cmpOk = await evalJs(`(() => { document.getElementById('examExtraBtn').click(); return document.querySelectorAll('#examBoard .cbox.diff,#examBoard .cbox.same').length > 0; })()`);
    if (!cmpOk) fail.push('Q10 高位逐欄比對失敗');

    // B. 概念探索模式三活動
    await navWait(base + '?mode=concept&theme=light');
    fs.writeFileSync(path.join(out, 'n41_concept_light.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
    const cOk = await evalJs(`(() => {
      const w = document.body.scrollWidth;
      document.querySelector('.act-btn[data-act="1"]').click();
      const a1 = !document.getElementById('act-1-view').hidden;
      document.querySelector('#c1Board .digit.zero').click();
      const lit = !!document.querySelector('#c1Board .digit.zero.lit');
      document.querySelector('.act-btn[data-act="2"]').click();
      const a2 = !document.getElementById('act-2-view').hidden;
      document.getElementById('c2Step').click();
      const cmp = document.querySelectorAll('#c2Board .cbox.same,#c2Board .cbox.diff').length > 0;
      return { w, a1, lit, a2, cmp, hasGoQuiz: !!document.getElementById('goQuiz') };
    })()`);
    if (cOk.w > 390 || !cOk.a1 || !cOk.lit || !cOk.a2 || !cOk.cmp || !cOk.hasGoQuiz) fail.push('概念探索活動檢查失敗: ' + JSON.stringify(cOk));

    // C. 主入口 app/index.html -> 四年級 -> N-4-1 雙分頁與外觀
    await navWait('http://127.0.0.1:' + httpPort + '/app/index.html', false);
    await sleep(350);
    const shell = await evalJs(`(async () => {
      const g4 = Array.from(document.querySelectorAll('.grade-btn')).find(b => b.textContent.includes('四年級'));
      if (g4) g4.click();
      await new Promise(r => setTimeout(r, 200));
      const card = document.querySelector('.unit-card[data-code="N-4-1"]');
      if (card) card.click();
      await new Promise(r => setTimeout(r, 500));
      const tabs = getComputedStyle(document.getElementById('unitModeTabs')).display;
      const movie = getComputedStyle(document.getElementById('btnConceptMovie')).display;
      const speak = getComputedStyle(document.getElementById('btnSpeak')).display;
      const draft = getComputedStyle(document.getElementById('btnOpenScratchpad')).display;
      const conceptActive = document.getElementById('btnModeConcept').classList.contains('active');
      document.getElementById('btnModeExam').click();
      await new Promise(r => setTimeout(r, 450));
      const frame = document.getElementById('stageFrame');
      const innerOpts = frame && frame.contentDocument ? frame.contentDocument.querySelectorAll('.opt,.opts,.stem').length : -1;
      const shellOpts = document.querySelectorAll('#shellOptions .shell-opt').length;
      return { tabs, movie, speak, draft, conceptActive, innerOpts, shellOpts, w: document.body.scrollWidth };
    })()`);
    if (shell.tabs === 'none' || !shell.conceptActive || shell.movie !== 'none' || shell.speak === 'none' || shell.draft === 'none' || shell.innerOpts !== 0 || shell.shellOpts !== 4 || shell.w > 390) {
      fail.push('主入口整合異常: ' + JSON.stringify(shell));
    }
    fs.writeFileSync(path.join(out, 'n41_shell_light.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
    await evalJs(`(() => {
      document.documentElement.dataset.theme = 'dark';
      const f = document.getElementById('stageFrame');
      if (f && f.contentDocument) f.contentDocument.documentElement.dataset.theme = 'dark';
    })()`);
    await sleep(200);
    fs.writeFileSync(path.join(out, 'n41_shell_dark.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));

    if (c.errors.length) fail.push('Console/Runtime 錯誤: ' + c.errors[0]);
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n41_cdp: Q1~Q10×雙模式×390/1280 (≤415px/零溢出/零捲軸/零劇透) + 概念探索三活動 + 主入口雙分頁全綠');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e)); process.exit(1);
  } finally {
    if (c && c.ws) c.ws.close();
    child.kill();
    server.close();
  }
})();
