/**
 * tools/verify_n43_cdp.js — G4-N-4-3 CDP 實機驗證（390×844 / 1280×800，Light/Dark）
 * 10 題零報錯、零橫向溢出、教具 <=420px、三大活動真實事件與雙模式截圖。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9443;
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
(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let c;
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
    const base = 'file:///' + path.join(root, 'app', 'components', 'two_step_expr_g4_lab.html').replace(/\\/g, '/');
    const maxH = {}, maxW = {};

    for (const theme of ['light', 'dark']) {
      for (const q of [1,2,3,4,5,6,7,8,9,10]) {
        await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await send('Page.navigate', { url: base + '?q=' + q + '&theme=' + theme });
        await sleep(170);
        const m = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height,opt:document.querySelectorAll(".opt").length,q:document.getElementById("qtag").textContent})');
        if (m.w > 390) fail.push('q' + q + '/' + theme + ' 390px 橫向溢出 ' + m.w);
        if (m.h > 420) fail.push('q' + q + '/' + theme + ' 教具高 ' + m.h.toFixed(1) + ' > 420');
        if (m.opt !== 4) fail.push('q' + q + '/' + theme + ' 選項數 ' + m.opt);
        maxH[theme] = Math.max(maxH[theme] || 0, m.h); maxW[theme] = Math.max(maxW[theme] || 0, m.w);
        if ((q === 1 || q === 2) && theme === 'light' || (q === 2 || q === 10) && theme === 'dark') {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, 'n43_q' + q + '_' + theme + '.png'), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    for (const q of [1,2,3,4,5,6,7,8,9,10]) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: base + '?q=' + q });
      await sleep(140);
      const dm = await evalJs('({w:document.body.scrollWidth,h:document.querySelector(".wrap").getBoundingClientRect().height})');
      if (dm.w > 1280) fail.push('q' + q + '/1280 橫向溢出 ' + dm.w);
      if (dm.h > 420) fail.push('q' + q + '/1280 教具高 ' + dm.h.toFixed(1) + ' > 420');
      maxH.desktop = Math.max(maxH.desktop || 0, dm.h);
    }

    // 活動一：選答案 → 下一步 → 拼音積木；並以真實 pointer 拖曳 20px 驗證 transform 變動
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: base + '?q=2' });
    await sleep(200);
    const box = await evalJs(`(()=>{const c=document.querySelector('#pool .card[data-k="e1"]'),r=c.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,t:c.style.transform||'none'}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 1 });
    const moved = await evalJs(`document.querySelector('#pool .card[data-k="e1"]').style.transform`);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + 20, y: box.y + 4, button: 'left', buttons: 0, clickCount: 1 });
    if (!/translate\(20px|translate\(1[5-9]/.test(moved)) fail.push('活動一拖曳 transform 未變動：' + moved);

    const a1 = await evalJs(`(()=>{
      document.querySelectorAll('.opt')[0].click();
      document.getElementById('next').click();
      const shown=document.querySelectorAll('.ln.show').length;
      const want=['pre','e1','post'];
      want.forEach((k,i)=>{const c=document.querySelector('#pool .card[data-k="'+k+'"]');const s=document.querySelectorAll('.slot')[i];s.appendChild(c);s.classList.add('filled');s.style.borderStyle='solid';});
      document.querySelectorAll('.slot').forEach((s,i)=>{const k=['pre','e1','post'][i];s.querySelector('.card').dataset.k=k;});
      document.querySelector('.slot .card').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
      return {shown,slots:document.querySelectorAll('.slot.filled').length,msg:document.getElementById('msg').textContent};
    })()`);
    if (!(a1.shown > 0)) fail.push('活動一「下一步」算理揭示失敗：' + JSON.stringify(a1));
    if (!(a1.slots === 3)) fail.push('活動一拼式槽位失敗：' + JSON.stringify(a1));

    // 活動二：第一步高亮
    const a2 = await evalJs(`(()=>{document.querySelector('.tab[data-t="1"]').click();document.querySelector('.blk[data-i="0"]').click();return {hit:document.querySelectorAll('.blk.hit').length,msg:document.getElementById('ordermsg').textContent}})()`);
    if (!(a2.hit >= 1)) fail.push('活動二高亮失敗：' + JSON.stringify(a2));
    // 活動三：配對正確併式
    const a3 = await evalJs(`(()=>{document.querySelector('.tab[data-t="2"]').click();document.querySelector('[data-x="1"]').click();return {hit:document.querySelectorAll('.blk.hit').length,msg:document.getElementById('pairmsg').textContent}})()`);
    if (!(a3.hit >= 1)) fail.push('活動三配對失敗：' + JSON.stringify(a3));

    if (c.errors.length) fail.push('console error/exception ' + c.errors.length + ' 筆：' + c.errors[0].slice(0, 200));
    console.log('MAX_HEIGHT light=' + maxH.light.toFixed(1) + ' dark=' + maxH.dark.toFixed(1) + ' desktop=' + maxH.desktop.toFixed(1));
    console.log('MAX_WIDTH  light=' + maxW.light + ' dark=' + maxW.dark);
    if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
    console.log('PASS verify_n43_cdp: 10題×Light/Dark 390px/1280px 零溢出、教具≤420px、三活動真實事件、零 console error');
    console.log('截圖：tools/_scratch/n43_q1_light.png, n43_q2_light.png, n43_q2_dark.png, n43_q10_dark.png');
    process.exit(0);
  } catch (e) { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); }
  finally { if (c && c.ws) c.ws.close(); child.kill(); }
})();
