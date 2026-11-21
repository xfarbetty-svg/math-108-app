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
      // 等待年級導航渲染完成（release 全量跑時載入較慢）
      for (let t = 0; t < 50; t++) {
        if (document.querySelectorAll('#gradeNav .grade-btn').length >= 2) break;
        await sleep(100);
      }
      // 1. 舊 24 顆概念膠囊快捷區塊已移除
      res.push(!document.querySelector('.concept-hub-card') ? 'PASS 舊概念探索快捷區塊已移除' : 'FAIL 舊概念探索快捷區塊仍存在');
      res.push(document.querySelectorAll('.btn-concept-chip').length === 0 ? 'PASS 24 顆概念膠囊已移除' : 'FAIL 概念膠囊仍存在');
      // 2. 新增「繼續上次進度」橫幅
      const banner = document.querySelector('.continue-banner');
      res.push(!!banner ? 'PASS 繼續上次進度橫幅存在' : 'FAIL 橫幅不存在');
      res.push(!!banner && banner.textContent.includes('從第一單元開始挑戰') ? 'PASS 全新訪客顯示首單元引導' : 'FAIL 橫幅文案: ' + (banner ? banner.textContent : 'null'));
      // 3. 點橫幅直接進單元
      if (banner) {
        banner.click();
        await sleep(800);
        res.push(document.getElementById('stageView').style.display === 'block' ? 'PASS 橫幅點擊直接進入單元' : 'FAIL 橫幅未進入單元');
        res.push((document.getElementById('stageFrame').getAttribute('src') || '').includes('component') ? 'PASS 教具 iframe 已掛載' : 'FAIL 教具 iframe src');
        document.getElementById('btnBack').click();
        await sleep(150);
      }
      // 4. 概念小教室改由「單元 Card → 概念探索 tab」進入
      document.querySelectorAll('#gradeNav .grade-btn')[2].click();
      await sleep(150);
      const card = document.querySelector('#gradeView .unit-card.ready[data-code="N-3-5"]');
      res.push(!!card ? 'PASS G3 N-3-5 卡片存在' : 'FAIL G3 N-3-5 卡片不存在');
      if (card) {
        card.click();
        await sleep(800);
        const tab = document.getElementById('btnModeConcept');
        res.push(!!tab && tab.style.display !== 'none' ? 'PASS 單元內概念探索 tab 存在' : 'FAIL 概念 tab 不存在');
        tab.click();
        await sleep(350);
        const frame = document.getElementById('conceptFrame');
        res.push((frame.getAttribute('src') || '').includes('division_vertical_concept_lab.html') ? 'PASS 概念小教室由單元內進入' : 'FAIL frame.src: ' + frame.getAttribute('src'));
      }
      // 5. Theme 切換與持久化
      const before = document.documentElement.dataset.theme;
      document.getElementById('btnThemeToggle').click();
      await sleep(80);
      res.push(document.documentElement.dataset.theme !== before ? 'PASS Theme 切換生效' : 'FAIL Theme 未切換');
      res.push(!!localStorage.getItem('math108_theme') ? 'PASS Theme 寫入 localStorage' : 'FAIL Theme 未持久化');
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
