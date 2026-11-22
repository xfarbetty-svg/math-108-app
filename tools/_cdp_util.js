/**
 * tools/_cdp_util.js — 共用 raw-CDP 工具（system Chrome + Node 原生 WebSocket）
 * 供 verify_d31_q10_cdp.js / verify_g3_viewport_width.js 使用。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome 或 Edge 可執行檔');
}

async function waitForTarget(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* 尚未啟動 */ }
    await sleep(120);
  }
  throw new Error('CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const WebSocketCtor = globalThis.WebSocket || require('ws');
    const ws = new WebSocketCtor(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
        return;
      }
      if (msg.method) for (const fn of listeners) { try { fn(msg); } catch (e) {} }
    });
    ws.addEventListener('error', (e) => reject(e));
    ws.addEventListener('open', () => {
      const send = (method, params = {}) => new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { res, rej });
        try { ws.send(JSON.stringify({ id, method, params })); }
        catch (e) { pending.delete(id); rej(e); }
      });
      resolve({ ws, send, onMessage: (fn) => listeners.push(fn) });
    });
  });
}

/** 啟動一支全新 Chrome（全新 user-data-dir = 強制清快取/獨立分頁）。 */
async function createSession(options = {}) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-g3-width-'));
  const cp = spawn(findChrome(), [
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userDir,
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--disable-background-networking',
    '--window-size=' + (options.width || 390) + ',' + (options.height || 844),
    'about:blank'
  ], { stdio: 'ignore' });
  let session = null;
  const cleanup = () => {
    try { cp.kill(); } catch (e) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);
  try {
    const target = await waitForTarget(port);
    session = await connect(target.webSocketDebuggerUrl);
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await session.send('Network.enable');
    await session.send('Network.clearBrowserCache');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    return {
      send: session.send,
      onMessage: session.onMessage,
      cleanup,
      async setViewport(width, height) {
        await session.send('Emulation.setDeviceMetricsOverride', {
          width, height, deviceScaleFactor: 2, mobile: true
        });
      },
      async navigate(url, settleMs = 180) {
        await session.send('Page.navigate', { url });
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          const r = await session.send('Runtime.evaluate', {
            expression: 'document.readyState', returnByValue: true
          });
          if (r.result && r.result.value === 'complete') break;
          await sleep(40);
        }
        await sleep(settleMs);
      },
      async eval(expression) {
        const r = await session.send('Runtime.evaluate', {
          expression, returnByValue: true, awaitPromise: true
        });
        if (r.exceptionDetails) throw new Error('Runtime.evaluate 異常：' + JSON.stringify(r.exceptionDetails));
        return r.result ? r.result.value : undefined;
      },
      async screenshot(file) {
        const shot = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      },
      close() {
        try { session.ws.close(); } catch (e) {}
        cleanup();
      }
    };
  } catch (e) {
    cleanup();
    throw e;
  }
}

module.exports = { findChrome, sleep, createSession };
