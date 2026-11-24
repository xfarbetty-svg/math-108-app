/**
 * tools/verify_n42_cdp.js — G4-N-4-2 CDP 實機驗證（390×844 / 1280×800，Light/Dark）
 * 檢查 10 題零報錯、零橫向溢出、教具 <=420px、分步揭示真實事件、
 * 十位/百位部分積高光與補 0、進位提示、雙模式截圖。任一失敗 Exit 1。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9412;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }

async function waitTarget() {
  const end = Date.now() + 8000;
  while (Date.now() < end) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/list');
      const list = await r.json();
      const t = list.find((x) => x.type === 'page');
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
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({ ws, errors, send: (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }) });
  });
}

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
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
    const base = 'file:///' + path.join(root, 'app', 'components', 'g4_mul_lab.html').replace(/\\/g, '/');
    for (const q of [1,2,3,4,5,6,7,8,9,10]) {
      for (const theme of ['light', 'dark']) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await send('Page.navigate', { url: base + '?q=' + q + '&theme=' + theme });
        await sleep(190);
        const m = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height,opt:document.querySelectorAll(".opt").length,prow:document.querySelectorAll(".prow").length})');
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 橫向溢出 ' + m.w);
        if (m.h > 420) fail.push('q' + q + '/' + theme + ' 教具高 ' + m.h.toFixed(1) + 'px > 420');
        if (m.opt !== 4) fail.push('q' + q + '/' + theme + ' 選項數 ' + m.opt);
        if (m.prow < 2) fail.push('q' + q + '/' + theme + ' 部分積行數 ' + m.prow);
        if (q === 1 && theme === 'light') {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n42_q1_light.png'), Buffer.from(s.result.data, 'base64'));
        }
        if (q === 4 && theme === 'dark') {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n42_q4_dark.png'), Buffer.from(s.result.data, 'base64'));
        }
        if (q === 7 && theme === 'light') {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n42_q7_light.png'), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    for (const q of [1,2,3,4,5,6,7,8,9,10]) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: base + '?q=' + q }); await sleep(150);
      const dm = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height})');
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 420) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + 'px > 420');
    }
    // 真實互動：選答案 → 逐步揭示部分積 → 高光對齊/補 0 → 進位提示
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: base + '?q=4' }); await sleep(220);
    const step = await evalJs(`(()=>{
      const before=document.querySelectorAll('.prow.shown').length;
      document.querySelectorAll('.opt')[1].click();
      document.getElementById('next').click();
      const after1=document.querySelectorAll('.prow.shown').length;
      document.getElementById('next').click();
      const after2=document.querySelectorAll('.prow.shown').length;
      const lines=document.querySelectorAll('#steps .ln.show').length;
      return {before,after1,after2,lines};
    })()`);
    if (!(step.before === 0 && step.after1 === 1 && step.after2 === 2 && step.lines > 0)) fail.push('分步揭示失敗：' + JSON.stringify(step));
    const hl = await evalJs(`(()=>{
      document.getElementById('t-hl').click();
      return {hl:document.querySelectorAll('.cell.hl').length,zero:document.querySelectorAll('.cell.zero').length,badge:document.querySelectorAll('.pbadge').length};
    })()`);
    if (!(hl.hl > 0 && hl.zero > 0 && hl.badge > 0)) fail.push('高光對齊/補 0 失敗：' + JSON.stringify(hl));
    const carry = await evalJs(`(()=>{document.getElementById('t-carry').click();return document.querySelectorAll('.cell.carry').length;})()`);
    if (!(carry > 0)) fail.push('進位提示失敗：' + JSON.stringify(carry));
    if (c.errors.length) fail.push('console exception ' + c.errors.length + ' 筆：' + c.errors[0].slice(0, 180));
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n42_cdp: 10題×雙模式 390px/1280px 零溢出、教具≤420px、分部揭示/高光補0/進位全綠、零 exception');
    console.log('截圖 tools/_scratch/n42_q1_light.png, n42_q4_dark.png, n42_q7_light.png');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e)); process.exit(1);
  } finally {
    if (c && c.ws) c.ws.close();
    child.kill();
  }
})();
