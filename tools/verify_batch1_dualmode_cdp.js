/**
 * tools/verify_batch1_dualmode_cdp.js
 * G3 批次 1：390×844 Light/Dark 雙模式 CDP 實機巡檢 + 截圖（?q=6..10）
 * 通過條件：無橫向溢出、主容器 <=420px、題號模式生效、0 console error、深色底色與淺色不同。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const PORT = 9400 + Math.floor(Math.random() * 180);
const OUT = path.resolve(__dirname, '../_scratch/g3_audit_batch1/screenshots');
fs.mkdirSync(OUT, { recursive: true });
const UNITS = [
  { code: 'N-3-16', file: 'weight_concept_lab.html', sel: '#app' },
  { code: 'S-3-2', file: 'square_rectangle_lab.html', sel: '#app-container' },
  { code: 'S-3-4', file: 'solid_geometry_lab.html', sel: 'body' }
];
const QS = [6, 7, 8, 9, 10];
const THEMES = ['light', 'dark'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome 或 Edge 可執行檔');
}
async function waitForTarget(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('CDP target 逾時');
}
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const WebSocket = globalThis.WebSocket || require('ws');
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };
    ws.onerror = (e) => reject(e);
    ws.onopen = () => {
      const send = (method, params = {}) => new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
      resolve({ ws, send });
    };
  });
}

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-g3-batch1-'));
  const cp = spawn(findChrome(), [
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + userDir,
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });
  const cleanup = () => {
    try { cp.kill(); } catch (e) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);
  let client = null;
  let passed = 0;
  try {
    const target = await waitForTarget();
    client = await connect(target.webSocketDebuggerUrl);
    const { send } = client;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

    let consoleErrors = [];
    client.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(msg.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' '));
      }
    });

    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error('Runtime.evaluate 異常：' + JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };

    for (const unit of UNITS) {
      const comp = path.resolve(__dirname, '..', 'app/components/' + unit.file);
      if (!fs.existsSync(comp)) throw new Error(unit.file + ' 不存在');
      for (const q of QS) {
        const qTag = 'Q' + String(q).padStart(2, '0');
        const bgByTheme = {};
        for (const theme of THEMES) {
          consoleErrors = [];
          await send('Page.navigate', { url: pathToFileURL(comp).href + '?q=' + q });
          await sleep(550);
          await evalJs('window.postMessage({type:"THEME_CHANGE",theme:"' + theme + '"},"*");true');
          await sleep(220);
          const m = await evalJs('(() => { const el=document.querySelector(' + JSON.stringify(unit.sel) + '); const de=document.documentElement; return { theme:de.dataset.theme, height:el?Math.round(el.getBoundingClientRect().height):0, overflowX:de.scrollWidth>de.clientWidth+2, qBadge:(document.getElementById("q-badge")||{}).textContent||"", qFocus:(document.getElementById("q-focus")||{}).textContent||"", needle:document.getElementById("needle") ? document.getElementById("needle").style.transform : null, bg:(getComputedStyle(el||document.body).backgroundImage!=="none")?getComputedStyle(el||document.body).backgroundImage:getComputedStyle(el||document.body).backgroundColor }; })()');
          if (!m || m.theme !== theme) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' 主題未生效：' + JSON.stringify(m));
          if (!m.height || m.height > 420) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' 高度 ' + m.height + 'px > 420');
          if (m.overflowX) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' 390px 橫向溢出');
          if (m.qBadge !== qTag) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' q-badge 錯誤：' + m.qBadge);
          if (!m.qFocus) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' q-focus 空白');
          if (m.needle && !/^rotate\(-?[0-9.]+deg\)$/.test(m.needle)) throw new Error(unit.code + ' ' + qTag + ' 非法指針 transform：' + m.needle);
          if (consoleErrors.length) throw new Error(unit.code + ' ' + qTag + ' ' + theme + ' console 錯誤：' + consoleErrors.join('; '));
          bgByTheme[theme] = m.bg;
          const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
          fs.writeFileSync(path.join(OUT, unit.code + '_' + qTag + '_' + theme + '.png'), Buffer.from(shot.data, 'base64'));
          console.log('PASS ' + unit.code + ' ' + qTag + ' ' + theme + ' height=' + m.height + 'px qFocus=' + m.qFocus + ' bg=' + m.bg);
          passed++;
        }
        if (bgByTheme.light === bgByTheme.dark) {
          throw new Error(unit.code + ' ' + qTag + ' Light/Dark 底色相同，雙模式未切換：' + bgByTheme.light);
        }
      }
    }
    console.log('\n🌟 SUCCESS: 批次 1 三單元 × Q06~Q10 × Light/Dark 共 ' + passed + ' 張截圖與雙模式斷言全綠 (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('FAIL: ' + err.message);
    process.exit(1);
  } finally {
    if (client && client.ws) client.ws.close();
    cleanup();
  }
}
main();
