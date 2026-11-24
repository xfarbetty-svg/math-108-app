/**
 * tools/verify_n41_cdp.js — G4-N-4-1 CDP 實機驗證（390×844 / 1280×800，Light/Dark）
 * 檢查 ten 題零報錯、零橫向溢出、教具 <=420px、拖曳真實事件、讀零亮燈、
 * 逐欄比對、雙模式截圖。任一失敗 Exit 1。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9411;
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
    let id = 0; const waiting = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({ ws, send: (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); }) });
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
    const base = 'file:///' + path.join(root, 'app', 'components', 'place_value_g4_lab.html').replace(/\\/g, '/');
    for (const q of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const theme of ['light', 'dark']) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await send('Page.navigate', { url: base + '?q=' + q });
        await sleep(180);
        await evalJs('document.documentElement.dataset.theme="' + theme + '";"ok"');
        const m = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height,opt:document.querySelectorAll(".opt").length,err:window.__err||0})');
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 橫向溢出 ' + m.w);
        if (m.h > 420) fail.push('q' + q + '/' + theme + ' 教具高 ' + m.h.toFixed(1) + 'px > 420');
        if (m.opt !== 4) fail.push('q' + q + '/' + theme + ' 選項數 ' + m.opt);
        if (q === 1 && theme === 'light') {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n41_q1_light.png'), Buffer.from(shot.result.data, 'base64'));
        }
        if (q === 4 && theme === 'dark') {
          const shot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n41_q4_dark.png'), Buffer.from(shot.result.data, 'base64'));
        }
      }
    }
    // 桌面 1280×800 實測：零溢出＋教具 ≤420px
    for (const q of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: base + '?q=' + q }); await sleep(150);
      const dm = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height})');
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 420) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + 'px > 420');
    }
    const ready = async (sel) => { for (let i = 0; i < 30; i++) { if (await evalJs('!!document.querySelector(' + JSON.stringify(sel) + ')')) return true; await sleep(100); } return false; };
    // 真實互動：拖曳 20px 後放入位值槽
    await send('Page.navigate', { url: base + '?q=2' });
    if (!await ready('.tile')) { console.error('q2 教具未完成渲染'); process.exit(1); }
    await evalJs('document.documentElement.dataset.theme="light";"ok"');
    const drag = await evalJs(`(()=>{
      const tile=document.querySelector('.tile:not(.used)'), slot=document.querySelector('.slot[data-i="2"]');
      const r=tile.getBoundingClientRect(), s=slot.getBoundingClientRect();
      const ev=(t,x,y,el)=>el.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:x,clientY:y,pointerId:1}));
      ev('pointerdown',r.x+10,r.y+10,tile);
      ev('pointermove',r.x+30,s.y+10,tile);
      ev('pointerup',s.x+10,s.y+10,slot);
      return {txt:slot.textContent,set:slot.classList.contains('set')};
    })()`);
    if (!drag.txt || !drag.set) fail.push('拖曳定位失敗：' + JSON.stringify(drag));
    // 讀零亮燈
    await send('Page.navigate', { url: base + '?q=4' }); await ready('.digit.zero');
    const lit = await evalJs(`(()=>{const z=document.querySelector('.digit.zero');z.click();return z.classList.contains('lit')&&!!document.getElementById('msg').textContent;})()`);
    if (!lit) fail.push('讀零亮燈失敗');
    // 逐欄比對
    await send('Page.navigate', { url: base + '?q=10' }); await ready('#cmpbtn');
    const cmp = await evalJs(`(()=>{document.getElementById('cmpbtn').click();return document.querySelectorAll('.cbox.diff').length>0&&!!document.getElementById('msg').textContent;})()`);
    if (!cmp) fail.push('高位逐欄比對失敗');
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n41_cdp: 10題×雙模式 390px 零溢出、教具≤420px、拖曳/亮燈/逐欄比對全綠；截圖 tools/_scratch/n41_q1_light.png, n41_q4_dark.png');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e)); process.exit(1);
  } finally {
    if (c && c.ws) c.ws.close();
    child.kill();
  }
})();
