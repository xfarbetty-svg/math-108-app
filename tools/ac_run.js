/**
 * tools/ac_run.js — AC 驗收執行器（Chrome DevTools Protocol）
 * 用途：以真實 file:// 頁面 + 真實事件互動跑驗收，回傳逐條 PASS/FAIL 與 console 雜訊。
 * 用法：node tools/ac_run.js <page.html> <body.js> [--viewport=390x900] [--port=9333]
 * body.js 內容為 async 函式本體，必須 return 陣列，元素如 "PASS AC-xx :: ..."。
 * 退出碼：全部 PASS = 0，任一 FAIL = 1，執行錯誤 = 2。
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

function parseArgs(argv) {
  const args = { positional: [], viewport: null, port: 9333 };
  for (const a of argv) {
    if (a.startsWith('--viewport=')) {
      const m = /^(\d+)x(\d+)$/.exec(a.split('=')[1]);
      if (m) args.viewport = { width: Number(m[1]), height: Number(m[2]) };
    } else if (a.startsWith('--port=')) {
      args.port = Number(a.split('=')[1]);
    } else {
      args.positional.push(a);
    }
  }
  return args;
}

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget(port, pageUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.url.startsWith('file:'));
      if (page && page.webSocketDebuggerUrl) return page;
      if (page) return page;
    } catch (e) { /* chrome 尚未就緒 */ }
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時: ' + pageUrl);
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('open', () => resolve({ send, on }));
    ws.addEventListener('error', (e) => reject(new Error('WebSocket 連線失敗')));
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method) {
        for (const fn of listeners) fn(msg);
      }
    });
    function send(method, params) {
      const id = ++seq;
      return new Promise((res, rej) => {
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }
    function on(fn) { listeners.push(fn); }
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.positional.length < 2) {
    console.error('用法: node tools/ac_run.js <page.html> <body.js> [--viewport=WxH]');
    process.exit(2);
  }
  const pagePath = path.resolve(args.positional[0]);
  const bodyPath = path.resolve(args.positional[1]);
  if (!fs.existsSync(pagePath)) throw new Error('頁面不存在: ' + pagePath);
  if (!fs.existsSync(bodyPath)) throw new Error('驗收腳本不存在: ' + bodyPath);

  const pageUrl = pathToFileURL(pagePath).href;
  const body = fs.readFileSync(bodyPath, 'utf8');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-run-'));
  const chrome = findChrome();

  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', '--disable-extensions',
    `--remote-debugging-port=${args.port}`, `--user-data-dir=${profile}`,
    '--window-size=' + (args.viewport ? `${args.viewport.width},${args.viewport.height}` : '1200,900'),
    pageUrl
  ], { stdio: 'ignore' });

  let ws;
  const consoleNoise = [];
  try {
    const target = await waitForTarget(args.port, pageUrl, 20000);
    ws = await connect(target.webSocketDebuggerUrl);

    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        consoleNoise.push('[console.' + msg.params.type + '] ' +
          msg.params.args.map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && (msg.params.entry.level === 'error' || msg.params.entry.level === 'warning')) {
        consoleNoise.push('[log.' + msg.params.entry.level + '] ' + msg.params.entry.text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleNoise.push('[exception] ' + (msg.params.exceptionDetails.exception ?
          msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text));
      }
    });

    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await ws.send('Page.enable');
    if (args.viewport) {
      await ws.send('Emulation.setDeviceMetricsOverride', {
        width: args.viewport.width, height: args.viewport.height,
        deviceScaleFactor: 1, mobile: args.viewport.width < 700
      });
    }
    await sleep(600);

    const wrapped = '(async () => {\n' + body + '\n})()';
    const res = await ws.send('Runtime.evaluate', {
      expression: wrapped, awaitPromise: true, returnByValue: true, allowUnsafeEvalBlockedByCSP: true
    });
    if (res.exceptionDetails) {
      throw new Error('驗收腳本拋錯: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails));
    }
    const results = res.result.value || [];
    for (const line of results) console.log(line);
    console.log('CONSOLE_NOISE_COUNT=' + consoleNoise.length);
    for (const n of consoleNoise.slice(0, 10)) console.log('  ' + n);
    const failed = results.filter((l) => String(l).startsWith('FAIL'));
    if (!results.length) {
      console.log('FAIL harness :: 驗收腳本未回傳任何結果');
      process.exitCode = 1;
    } else {
      console.log(failed.length === 0 ? 'ALL_PASS (' + results.length + ' checks)' : 'FAILED (' + failed.length + ')');
      process.exitCode = failed.length === 0 ? 0 : 1;
    }
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已結束 */ }
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 佔用中，留待系統清理 */ }
  }
}

main().catch((err) => {
  console.error('ERROR: ' + (err && err.message));
  process.exit(2);
});
