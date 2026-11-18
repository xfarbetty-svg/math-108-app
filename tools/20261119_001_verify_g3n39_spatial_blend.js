/**
 * tools/20261119_001_verify_g3n39_spatial_blend.js
 * G3-N-3-9 米米透明底空間融合：機械化防偽守門（CDP 實機幾何／樣式／錯誤／單屏驗證）
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCENE_PATH = 'app/scenes/g3_n39_theater/index.html';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.ico': 'image/x-icon'
};
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | ${detail}`);
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const rel = req.url === '/' ? SCENE_PATH : req.url.split('?')[0].replace(/^\/+/, '');
      const fp = path.resolve(ROOT, decodeURIComponent(rel));
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function waitTarget(port) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const body = await new Promise((res, rej) => {
        http.get(`http://127.0.0.1:${port}/json`, (r) => {
          let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(b));
        }).on('error', rej);
      });
      const page = JSON.parse(body).find((t) => t.type === 'page');
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
    const errors = [];
    const badUrls = [];
    ws.on('open', () => resolve({
      errors, badUrls,
      send: (method, params = {}) => new Promise((res, rej) => {
        const rid = id++; pending.set(rid, { res, rej });
        ws.send(JSON.stringify({ id: rid, method, params }));
      }),
      close: () => ws.close()
    }));
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (msg.params.exceptionDetails.text || ''));
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push('console: ' + msg.params.entry.text + ' @ ' + (msg.params.entry.url || '?'));
      if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) badUrls.push(msg.params.response.status + ' ' + msg.params.response.url);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    });
    ws.on('error', reject);
  });
}

const PROBE = `(() => {
  const g = (id) => document.getElementById(id);
  const rect = (el) => { const r = el.getBoundingClientRect(); return { l:r.left, r:r.right, t:r.top, b:r.bottom, w:r.width, h:r.height }; };
  const mimi = g('mimiAnchor'), wrap = g('mimiWrap'), board = g('blackboard'), stage = g('stageWrapper');
  const cs = getComputedStyle(mimi);
  const shadow = getComputedStyle(wrap, '::after');
  return {
    src: mimi.getAttribute('src'),
    natural: { w: mimi.naturalWidth, h: mimi.naturalHeight },
    mask: cs.maskImage || cs.webkitMaskImage,
    objectFit: cs.objectFit, objectPosition: cs.objectPosition,
    shadowBg: shadow.backgroundImage,
    mimi: rect(wrap), board: rect(board), stage: rect(stage),
    scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
    scrollH: document.documentElement.scrollHeight, clientH: document.documentElement.clientHeight
  };
})()`;

async function probe(ws) {
  const r = await ws.send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
  return r.result.value;
}

async function main() {
  const { server, port } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'blend-verify-'));
  const cdpPort = 9800 + Math.floor(Math.random() * 150);
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`,
    '--window-size=1024,768', 'about:blank'
  ], { stdio: 'ignore' });
  try {
    const target = await waitTarget(cdpPort);
    const ws = await connect(target.webSocketDebuggerUrl);
    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await ws.send('Network.enable');
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 600, deviceScaleFactor: 1, mobile: false });
    await ws.send('Page.navigate', { url: `http://127.0.0.1:${port}/${SCENE_PATH}` });
    await sleep(1800);

    const d = await probe(ws);
    check('透明底圖為唯一來源', /mimi_transparent_1024\.png$/.test(d.src), d.src);
    check('透明底圖載入成功(naturalWidth>0)', d.natural.w > 0, JSON.stringify(d.natural));
    check('方形遮罩已移除', d.mask === 'none' || !d.mask, String(d.mask));
    check('object-fit 裁剪透明留白', d.objectFit === 'cover', `${d.objectFit} @ ${d.objectPosition}`);
    check('地面接觸陰影已渲染', /radial-gradient/.test(d.shadowBg), d.shadowBg.slice(0, 90));
    check('米米與黑板零重疊', d.mimi.r <= d.board.l + 0.5, `mimi.right=${d.mimi.r.toFixed(1)} board.left=${d.board.l.toFixed(1)}`);
    check('舞台高度<=420px', d.stage.h <= 420.5, `${d.stage.h.toFixed(1)}px`);
    check('桌面版無橫向溢出', d.scrollW <= d.clientW, `${d.scrollW}/${d.clientW}`);

    await ws.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(700);
    const m = await probe(ws);
    check('390px 無橫向溢出', m.scrollW <= m.clientW, `${m.scrollW}/${m.clientW}`);
    check('390px 舞台高度<=420px', m.stage.h <= 420.5, `${m.stage.h.toFixed(1)}px`);
    check('390px 米米與黑板零重疊', m.mimi.r <= m.board.l + 0.5, `mimi.right=${m.mimi.r.toFixed(1)} board.left=${m.board.l.toFixed(1)}`);
    check('390px 透明底圖仍載入', m.natural.w > 0, JSON.stringify(m.natural));
    check('無 JS 例外／console error', ws.errors.length === 0, ws.errors.join(' | ') || '0 errors');
    check('無 4xx/5xx 資源請求', ws.badUrls.length === 0, ws.badUrls.join(' | ') || '0 bad responses');

    ws.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\nSUMMARY: ${results.length - failed.length}/${results.length} PASS`);
    process.exitCode = failed.length ? 1 : 0;
  } finally {
    proc.kill('SIGKILL');
    server.close();
  }
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
