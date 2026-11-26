/**
 * tools/verify_r43_cdp.js — G4-R-4-3 CDP 實機驗證
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9490;
const httpPort = 9491;
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
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(out, 'chrome_r43_v1'), '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
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
    const nav = async (url, ms = 360) => {
      await send('Page.navigate', { url }); await sleep(ms);
      for (let k = 0; k < 20; k++) {
        const ok = await evalJs(`!!(window.__R43_SELFTEST__ && window.__R43_MODE__ && window.__R43_READY__)`);
        if (ok) break; await sleep(100);
      }
    };
    const shot = async (name) => {
      const s = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(out, name), Buffer.from(s.result.data, 'base64'));
    };

    const base = 'file:///' + path.join(root, 'app', 'components', 'formula_g4_lab.html').replace(/\\/g, '/');
    const maxH = { light: 0, dark: 0, desktop: 0 }, maxW = { light: 0, dark: 0 };

    for (const theme of ['light', 'dark']) {
      for (let q = 1; q <= 10; q++) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await nav(base + '?q=' + q + '&theme=' + theme);
        const m0 = await evalJs(`(()=>{const app=document.getElementById('app');return {
          w:document.body.scrollWidth,h:app.getBoundingClientRect().height,
          vScroll:document.documentElement.scrollHeight>document.documentElement.clientHeight+1,
          navHidden:document.getElementById('actNav').hidden,
          internalOpts:document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem,.opts').length,
          svgHtml:document.querySelector('#examDiagram svg').outerHTML,
          stepsHidden:document.getElementById('stepsBox').hidden
        }})()`);
        if (m0.w > maxW[theme]) maxW[theme] = m0.w;
        if (m0.h > maxH[theme]) maxH[theme] = m0.h;
        if (m0.w > 390) fail.push(`q${q}/${theme} 橫向溢出 ${m0.w}`);
        if (m0.h > 415) fail.push(`q${q}/${theme} 初始高 ${m0.h.toFixed(1)} > 415`);
        if (m0.vScroll) fail.push(`q${q}/${theme} 有垂直捲軸`);
        if (!m0.navHidden) fail.push(`q${q}/${theme} 未隱藏頂部頁籤`);
        if (m0.internalOpts > 0) fail.push(`q${q}/${theme} 含禁止題幹/選項`);
        if (!m0.stepsHidden) fail.push(`q${q}/${theme} 初始劇透算理`);

        await evalJs(`document.getElementById('btnAction').click();document.getElementById('btnSteps').click();`);
        await sleep(60);
        const m1 = await evalJs(`(()=>{const app=document.getElementById('app');return {
          h:app.getBoundingClientRect().height,
          svgHtml:document.querySelector('#examDiagram svg').outerHTML,
          stepsShown:!document.getElementById('stepsBox').hidden
        }})()`);
        if (m1.h > maxH[theme]) maxH[theme] = m1.h;
        if (m1.h > 415) fail.push(`q${q}/${theme} 展開後高 ${m1.h.toFixed(1)} > 415`);
        if (m1.svgHtml === m0.svgHtml) fail.push(`q${q}/${theme} 點擊按鈕 SVG 未變化`);
        if (!m1.stepsShown) fail.push(`q${q}/${theme} 算理未展開`);

        if (theme === 'light' && (q === 6 || q === 8)) await shot(`r43_q${q}_light.png`);
        if (theme === 'dark' && q === 9) await shot('r43_q9_dark.png');
      }
    }

    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    for (let q = 1; q <= 10; q++) {
      await nav(base + '?q=' + q);
      await evalJs(`document.getElementById('btnAction').click();document.getElementById('btnSteps').click();`);
      const md = await evalJs(`(()=>{const app=document.getElementById('app');return {h:app.getBoundingClientRect().height,w:document.body.scrollWidth}})()`);
      if (md.h > maxH.desktop) maxH.desktop = md.h;
      if (md.h > 415) fail.push(`q${q}/desktop 高 ${md.h.toFixed(1)} > 415`);
      if (md.w > 1280) fail.push(`q${q}/desktop 溢出`);
    }

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    for (const [act, theme, shotName] of [[0,'light','r43_concept_act0_light.png'],[1,'dark','r43_concept_act1_dark.png'],[2,'light','r43_concept_act2_light.png']]) {
      await nav(base + '?mode=concept&theme=' + theme);
      await evalJs(`document.querySelectorAll('.act-btn')[${act}].click()`);
      await sleep(80);
      const before = await evalJs(`document.querySelector('#cStage svg').outerHTML`);
      await evalJs(`const bs=document.querySelectorAll('#cBtns .btn-action');bs[${act}===2?0:bs.length-1].click()`);
      await sleep(80);
      const after = await evalJs(`({svg:document.querySelector('#cStage svg').outerHTML, h:document.getElementById('app').getBoundingClientRect().height, w:document.body.scrollWidth})`);
      if (after.svg === before) fail.push(`concept act${act} 點擊無 SVG 變化`);
      if (after.h > 415) fail.push(`concept act${act} 高 ${after.h.toFixed(1)} > 415`);
      if (after.w > 390) fail.push(`concept act${act} 溢出`);
      await shot(shotName);
    }

    server = await startStaticServer();
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/index.html` });
    await sleep(500);
    await evalJs(`(()=>{const b=[...document.querySelectorAll('.grade-btn')].find(x=>x.textContent.includes('四年級'));if(b)b.click();})()`);
    await sleep(250);
    await evalJs(`(()=>{const c=[...document.querySelectorAll('.unit-card')].find(x=>x.textContent.includes('R-4-3'));if(c)c.click();})()`);
    await sleep(450);
    const shellCheck = await evalJs(`(()=>{
      const cf = document.getElementById('conceptFrame');
      return {
        hasSpeak: !!document.getElementById('btnSpeak'),
        hasScratch: !!document.getElementById('btnOpenScratchpad'),
        iframeSrc: cf ? cf.src : ''
      };
    })()`);
    if (!shellCheck.hasSpeak) fail.push('主入口缺「語音導讀」');
    if (!shellCheck.hasScratch) fail.push('主入口缺「算草稿」');
    if (!shellCheck.iframeSrc.includes('formula_g4_lab.html?mode=concept')) fail.push('主入口未預設開啟概念探索：' + shellCheck.iframeSrc);
    await evalJs(`document.getElementById('btnModeExam').click()`); await sleep(350);
    for (let q = 1; q <= 10; q++) {
      const st = await evalJs(`({stem:document.getElementById('shellStem').textContent,src:document.getElementById('stageFrame').src,opts:document.querySelectorAll('#shellOptions .shell-opt').length})`);
      if (!st.src.includes('q=' + q) || !st.stem || st.opts !== 4) fail.push('主入口 Q' + q + ' 載入失敗');
      if (q < 10) { await evalJs(`document.getElementById('btnNext').click()`); await sleep(150); }
    }

    if (c.errors.length) fail.push('Console/Runtime errors: ' + c.errors.join('; '));
    if (fail.length) {
      console.error('FAIL verify_r43_cdp:\n- ' + fail.join('\n- '));
      process.exit(1);
    }
    console.log(`PASS verify_r43_cdp: MAX_H=${JSON.stringify({light:+maxH.light.toFixed(1),dark:+maxH.dark.toFixed(1),desktop:+maxH.desktop.toFixed(1)})} MAX_W=${JSON.stringify(maxW)} 零溢出/零劇透/三活動與主入口全綠`);
    process.exit(0);
  } finally {
    if (server) server.close();
    if (c && c.ws) c.ws.close();
    child.kill();
  }
})();
