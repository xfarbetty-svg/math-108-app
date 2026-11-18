/**
 * tools/capture_theater_acts.js
 * 透過 CDP 實機截取 G3-N-3-9 一體化教室情境劇院四幕獨立畫面
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCENE_PATH = 'app/scenes/g3_n39_theater/index.html';
const OUT_DIR = path.join(ROOT, 'reports', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const rel = urlPath === '/' ? SCENE_PATH : urlPath.replace(/^\/+/, '');
      const fp = path.resolve(ROOT, rel);
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function waitForTarget(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve(body));
        }).on('error', reject);
      });
      const list = JSON.parse(data);
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch (e) {}
    await sleep(200);
  }
  throw new Error('CDP target timeout');
}

function connect(wsUrl) {
  const WebSocket = require('ws');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    ws.on('open', () => {
      resolve({
        send: (method, params = {}) => new Promise((res, rej) => {
          const reqId = id++;
          pending.set(reqId, { res, rej });
          ws.send(JSON.stringify({ id: reqId, method, params }));
        }),
        close: () => ws.close()
      });
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    });
    ws.on('error', reject);
  });
}

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'act-shots-'));
  const chrome = findChrome();
  const cdpPort = 9600 + Math.floor(Math.random() * 200);
  const pageUrl = `http://127.0.0.1:${httpPort}/${SCENE_PATH}`;

  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`,
    '--window-size=1024,768', 'about:blank'
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(cdpPort);
    const ws = await connect(target.webSocketDebuggerUrl);

    await ws.send('Runtime.enable');
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 1000, height: 600, deviceScaleFactor: 1.5, mobile: false
    });

    await ws.send('Page.navigate', { url: pageUrl });
    await sleep(2000);

    for (let act = 1; act <= 4; act++) {
      console.log(`📸 正在切換並截取 Act ${act}...`);
      await ws.send('Runtime.evaluate', {
        expression: `
          setMode('act', ${act - 1});
          renderFrame(1.0);
        `
      });
      await sleep(800);

      const shotRes = await ws.send('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join(OUT_DIR, `theater_act${act}.png`);
      fs.writeFileSync(outPath, Buffer.from(shotRes.data, 'base64'));
      console.log(`  ✅ Act ${act} 截圖完成: ${outPath}`);
    }

    ws.close();
  } finally {
    proc.kill('SIGKILL');
    server.close();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
