/**
 * tools/verify_r42_cdp.js — G4-R-4-2 CDP 實機驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390×844 / 1280×800：零橫向溢出、高度 ≤415px、無內部垂直捲軸、Q1~Q10 互動有效、初始零劇透
 *  B. 觀念小教室 mode=concept：三活動切換、互動與雙主題切換
 *  C. 主入口 app/index.html → 四年級 → R-4-2 → 預設概念探索、保留語音導讀與算草稿、切換真題 Q1~Q10
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
    const nav = async (url, ms = 200) => {
      await send('Page.navigate', { url });
      await sleep(ms);
      for (let i = 0; i < 15; i++) {
        const ok = await evalJs(`!!(document.body && document.readyState === 'complete')`);
        if (ok) break;
        await sleep(80);
      }
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'calc_laws_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/R-4-2.json'), 'utf8'));
    const maxH = { light: 0, dark: 0, desktop: 0 }, maxW = { light: 0, dark: 0 };
    const targets = ['不一樣', '一樣', '不一樣', '不一樣', '不一樣', '不一樣', '一樣', 8, 235, 120];

    /* ---------- A. 真題模式：10 題 × Light/Dark × 390×844（含互動與展開算理後高度 ≤415px、無內部捲軸） ---------- */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,
          h:app.getBoundingClientRect().height,mode:window.__R42_MODE__,q:window.__R42_Q__,
          tabsHidden:document.getElementById('tabs').hidden || getComputedStyle(document.getElementById('tabs')).display==='none',
          examShown:!document.getElementById('examPanel').hidden,
          explainCount:document.querySelectorAll('.explain').length,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt').length,
          svg:!!document.querySelector('#examPanel svg')
        }})()`);
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 415) fail.push('q' + q + '/' + theme + ' 初始高 ' + m.h.toFixed(1) + ' > 415');
        if (m.mode !== 'exam' || m.q !== q) fail.push('q' + q + '/' + theme + ' 模式錯誤');
        if (!m.tabsHidden || !m.examShown || m.explainCount !== 0) fail.push('q' + q + '/' + theme + ' 狀態或零劇透異常');
        if (m.internalOpts !== 0 || !m.svg) fail.push('q' + q + '/' + theme + ' 選項或SVG異常');

        /* 測試互動與視覺變化 */
        const tgt = targets[q - 1];
        if (typeof tgt === 'string') {
          const beforeSym = await evalJs(`document.getElementById('cmpSym').textContent`);
          await evalJs(`document.querySelector('.symbtn[data-sym="${tgt}"]').click()`);
          const afterSym = await evalJs(`document.getElementById('cmpSym').textContent`);
          if (beforeSym === afterSym) fail.push('q' + q + '/' + theme + ' 比較按鈕未改變 SVG 符號');
        } else {
          const beforeAns = await evalJs(`document.getElementById('ansNode').textContent`);
          await evalJs(`(()=>{const inp=document.getElementById('ws');inp.value='${tgt}';inp.dispatchEvent(new Event('input'));})()`);
          const afterAns = await evalJs(`document.getElementById('ansNode').textContent`);
          if (beforeAns === afterAns) fail.push('q' + q + '/' + theme + ' 數值輸入未改變 SVG 結果');
        }
        await evalJs(`document.getElementById('vbtn').click()`);
        const after = await evalJs(`(()=>{const app=document.getElementById('app'),p=document.getElementById('examPanel'),ex=document.querySelector('.explain');return {
          h:app.getBoundingClientRect().height,
          ok:document.getElementById('msg').classList.contains('ok'),
          hasExplain:!!ex,
          scrollV:(p.scrollHeight > p.clientHeight + 1) || (ex && ex.scrollHeight > ex.clientHeight + 1)
        }})()`);
        if (!after.ok || !after.hasExplain) fail.push('q' + q + '/' + theme + ' 驗證或算理展開失敗');
        if (after.h > 415) fail.push('q' + q + '/' + theme + ' 展開算理後高 ' + after.h.toFixed(1) + ' > 415');
        if (after.scrollV) fail.push('q' + q + '/' + theme + ' 出現內部垂直捲軸');
        maxH[theme] = Math.max(maxH[theme], after.h);
        maxW[theme] = Math.max(maxW[theme], m.w);

        if ((q === 1 || q === 9) && (theme === 'light' || theme === 'dark')) {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'r42_q' + q + '_' + theme + '.png'), Buffer.from(s.result.data, 'base64'));
        }
      }
    }

    /* ---------- A2. 桌面 1280×800 × Light/Dark ---------- */
    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await nav(base + '?q=' + q + '&theme=' + theme, 130);
        await evalJs(`document.getElementById('rbtn').click()`);
        const dm = await evalJs(`(()=>{const app=document.getElementById('app'),p=document.getElementById('examPanel'),ex=document.querySelector('.explain');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,
          scrollV:(p.scrollHeight > p.clientHeight + 1) || (ex && ex.scrollHeight > ex.clientHeight + 1)
        }})()`);
        if (dm.w > 1280) fail.push('q' + q + '/1280/' + theme + ' 橫向溢出 ' + dm.w);
        if (dm.h > 415) fail.push('q' + q + '/1280/' + theme + ' 高 ' + dm.h.toFixed(1) + ' > 415');
        if (dm.scrollV) fail.push('q' + q + '/1280/' + theme + ' 出現內部垂直捲軸');
        maxH.desktop = Math.max(maxH.desktop, dm.h);
      }
    }

    /* ---------- B. 觀念小教室：三活動切換 + 互動 + 雙模式截圖 ---------- */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 200);
    const c0 = await evalJs(`({mode:window.__R42_MODE__,tabs:document.querySelectorAll('.tab').length,h:document.getElementById('app').getBoundingClientRect().height})`);
    if (c0.mode !== 'concept' || c0.tabs !== 3 || c0.h > 415) fail.push('概念活動一異常：' + JSON.stringify(c0));
    await evalJs(`document.querySelector('#act0 .wbtn[data-d="10"]').click(); document.getElementById('rbtn').click();`);
    const h0After = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h0After > 415) fail.push('概念活動一展開後高 ' + h0After.toFixed(1) + ' > 415');
    const cs0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'r42_concept_act0_light.png'), Buffer.from(cs0.result.data, 'base64'));

    await evalJs(`document.querySelector('.tab[data-act="1"]').click()`); await sleep(80);
    const h1 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h1 > 415) fail.push('概念活動二高 ' + h1.toFixed(1) + ' > 415');

    await evalJs(`document.querySelector('.tab[data-act="2"]').click()`); await sleep(80);
    await evalJs(`document.getElementById('btn-theme').click(); document.getElementById('rbtn').click();`);
    const h2 = await evalJs(`document.getElementById('app').getBoundingClientRect().height`);
    if (h2 > 415) fail.push('概念活動三高 ' + h2.toFixed(1) + ' > 415');
    const cs2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'r42_concept_act2_dark.png'), Buffer.from(cs2.result.data, 'base64'));

    /* ---------- C. 主入口 app/index.html 雙分頁預設概念探索 + 語音導讀 + 算草稿 + Q1~Q10 ---------- */
    server = await startStaticServer();
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    await evalJs(`(()=>{const bs=[...document.querySelectorAll('.grade-btn')];const b=bs.find(x=>x.textContent.includes('四年級'));if(b)b.click();})()`);
    await sleep(250);
    const unitClicked = await evalJs(`(()=>{const cs=[...document.querySelectorAll('.unit-card')];const c=cs.find(x=>x.textContent.includes('R-4-2'));if(c){c.click();return true}return false})()`);
    if (!unitClicked) fail.push('四年級找不到 R-4-2 單元卡');
    await sleep(450);
    const enter = await evalJs(`({
      tabs:getComputedStyle(document.getElementById('unitModeTabs')).display,
      conceptActive:document.getElementById('btnModeConcept').classList.contains('active'),
      speakShown:getComputedStyle(document.getElementById('btnSpeak')).display !== 'none',
      scratchShown:!!document.getElementById('btnOpenScratchpad') && getComputedStyle(document.getElementById('btnOpenScratchpad')).display !== 'none',
      cMode:document.getElementById('conceptFrame').contentDocument.defaultView.__R42_MODE__
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
    console.log('PASS verify_r42_cdp: 10題×Light/Dark 390×844/1280×800 零溢出、無內部捲軸、展開算理≤415px、Q1~Q10互動有效、主入口預設概念探索+語音+算草稿全綠');
  } finally {
    try { if (c && c.ws) c.ws.close(); } catch (e) {}
    try { if (server) server.close(); } catch (e) {}
    try { child.kill(); } catch (e) {}
  }
})();
