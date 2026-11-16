/**
 * tools/capture_preview.js
 * Universal Headless Chrome / CDP Snapshot Tool for Visual Review
 * 
 * Usage:
 *   node tools/capture_preview.js <htmlPath> [outputPath] [--width 390] [--height 844] [--selector .container]
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('找不到 Chrome 或 Edge 瀏覽器執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) {}

      fs.readFile(fp, (err, buf) => {
        if (err) {
          res.writeHead(404);
          res.end('404 Not Found');
          return;
        }
        const ext = path.extname(fp).toLowerCase();
        const mime = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.png': 'image/png'
        }[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function waitForTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (_e) {}
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.addEventListener('open', () => resolve({ send, close: () => ws.close() }));
    ws.addEventListener('error', () => reject(new Error('WebSocket 連線失敗')));
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });

    function send(method, params) {
      const id = ++seq;
      return new Promise((res, rej) => {
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
  });
}

async function capture() {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error('用法: node tools/capture_preview.js <htmlPath> [outputPath] [--width 390] [--height 844] [--selector .container]');
    process.exit(1);
  }

  const rawHtmlPath = args[0].replace(/\\/g, '/');
  let outputPath = args[1] && !args[1].startsWith('--') ? args[1] : null;

  if (!outputPath) {
    const base = path.basename(rawHtmlPath, path.extname(rawHtmlPath));
    outputPath = path.join('reports', 'screenshots', `${base}_preview.png`);
  }

  let width = 390;
  let height = 844;
  let selector = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--width' && args[i + 1]) width = parseInt(args[i + 1], 10);
    if (args[i] === '--height' && args[i + 1]) height = parseInt(args[i + 1], 10);
    if (args[i] === '--selector' && args[i + 1]) selector = args[i + 1];
  }

  const chromePath = findChrome();
  const cdpPort = 9222 + Math.floor(Math.random() * 500);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-preview-'));
  const { server, port: httpPort } = await startServer();

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);

  try {
    const target = await waitForTarget(cdpPort, 10000);
    const { send, close } = await connect(target.webSocketDebuggerUrl);

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true
    });

    const targetUrl = `http://127.0.0.1:${httpPort}/${rawHtmlPath.replace(/^\//, '')}`;
    await send('Page.navigate', { url: targetUrl });
    await sleep(800);

    let clip = undefined;
    if (selector) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, width: r.width, height: r.height };
        })()`,
        returnByValue: true
      });
      const rect = evalRes.result ? evalRes.result.value : null;
      if (rect && rect.width > 0 && rect.height > 0) {
        clip = {
          x: Math.max(0, rect.x),
          y: Math.max(0, rect.y),
          width: rect.width,
          height: rect.height,
          scale: 1
        };
      }
    }

    const screenshotParams = { format: 'png' };
    if (clip) screenshotParams.clip = clip;

    const ss = await send('Page.captureScreenshot', screenshotParams);
    const outFull = path.resolve(process.cwd(), outputPath);
    fs.mkdirSync(path.dirname(outFull), { recursive: true });
    fs.writeFileSync(outFull, Buffer.from(ss.data, 'base64'));

    console.log(`[PASS] 實機視覺截圖已產出: ${outputPath} (${width}x${height}${selector ? ` [${selector}]` : ''})`);
    close();
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL] 截圖失敗: ${err.message}`);
    process.exit(1);
  } finally {
    cleanup();
  }
}

capture();
