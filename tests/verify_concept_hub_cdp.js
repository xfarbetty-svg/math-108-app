/**
 * tests/verify_concept_hub_cdp.js — 驗證概念探索實驗室快捷導航 CDP 實機通訊
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
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) {}
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();
        const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
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
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.addEventListener('open', () => resolve({ send }));
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
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }
  });
}

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hub-verify-'));
  const chrome = findChrome();
  const cdpPort = 9488;
  const pageUrl = `http://127.0.0.1:${httpPort}/app/index.html`;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`, '--window-size=1200,900', pageUrl
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(cdpPort, 20000);
    const ws = await connect(target.webSocketDebuggerUrl);
    await ws.send('Runtime.enable');
    await sleep(800);

    const testScript = `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const res = [];
      // 切換至二年級
      document.querySelectorAll('#gradeNav .grade-btn')[1].click();
      await sleep(100);

      const hub = document.querySelector('.concept-hub-card');
      res.push(hub ? 'PASS 概念探索卡片存在' : 'FAIL 概念探索卡片不存在');

      const chips = document.querySelectorAll('.btn-concept-chip');
      res.push(chips.length === 24 ? 'PASS G2 擁有 24 顆概念膠囊按鈕' : 'FAIL 膠囊數: ' + chips.length);

      // 點擊 N-2-1
      chips[0].click();
      await sleep(600);
      const stage = document.getElementById('stageView');
      const frame = document.getElementById('conceptFrame');
      res.push(stage.style.display === 'block' ? 'PASS 點擊後開啟舞台' : 'FAIL 舞台未開啟');
      res.push(frame.src.includes('g2_place_value_1000_lab.html') ? 'PASS iframe 載入 N-2-1 小教室' : 'FAIL frame.src: ' + frame.src);

      // 點擊返回
      document.getElementById('btnBack').click();
      await sleep(100);
      res.push(document.getElementById('gradeView').style.display === 'block' ? 'PASS 返回年級列表正常' : 'FAIL 未返回');

      // 點擊 S-2-3 (直尺)
      const rulerChip = [...document.querySelectorAll('.btn-concept-chip')].find(c => c.dataset.code === 'S-2-3');
      if (rulerChip) {
        rulerChip.click();
        await sleep(600);
        res.push(frame.src.includes('g2_ruler_drawing_lab.html') ? 'PASS iframe 載入 S-2-3 直尺小教室' : 'FAIL ruler frame: ' + frame.src);
      } else {
        res.push('FAIL 找不到 S-2-3 直尺按鈕');
      }

      return res;
    })()`;

    let r;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        r = await ws.send('Runtime.evaluate', { expression: testScript, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) {
          const detail = JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails);
          if (detail.includes('Execution context was destroyed') && attempt < 3) { await sleep(600); continue; }
          throw new Error('驗證腳本拋錯: ' + detail);
        }
        break;
      } catch (e) {
        if (String(e.message).includes('Execution context was destroyed') && attempt < 3) { await sleep(600); continue; }
        throw e;
      }
    }
    const results = Array.isArray(r.result && r.result.value) ? r.result.value : [];
    console.log("=== 概念探索小教室導航 CDP 實機驗證結果 ===");
    if (!results.length) { console.error('FAIL harness :: 驗證腳本未回傳任何結果'); process.exit(1); }
    let allOk = true;
    for (const line of results) {
      console.log(line);
      if (line.startsWith('FAIL')) allOk = false;
    }
    if (!allOk) process.exit(1);
    console.log("ALL PASS (Exit Code 0)");
  } finally {
    try { proc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
