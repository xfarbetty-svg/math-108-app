/**
 * tools/verify_app_shell.js — App Shell CDP 實機驗證（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：G1~G6 年級切換 × 131 條目卡片渲染（11/24/24/26/27/19）、upcoming 卡片禁用態、
 *       G1 N-1-1 可開啟 → iframe 教具掛載 → 題號導航 → 交卷結算。
 * 全部通過且 console 雜訊 = 0 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_app_shell.js [--port=9444]
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
const EXPECTED_UNITS = { 1: 11, 2: 24, 3: 24, 4: 26, 5: 27, 6: 19 };
const argsPort = (() => {
  const a = process.argv.find((x) => x.startsWith('--port='));
  return a ? Number(a.split('=')[1]) : 9444;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) { /* 續走 404 */ }
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
    } catch (e) { /* chrome 尚未就緒 */ }
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('open', () => resolve({ send, on }));
    ws.addEventListener('error', () => reject(new Error('WebSocket 連線失敗')));
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
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-verify-'));
  const chrome = findChrome();
  const pageUrl = `http://127.0.0.1:${httpPort}/app/index.html`;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=1200,900', pageUrl
  ], { stdio: 'ignore' });

  let ws;
  const consoleNoise = [];
  try {
    const target = await waitForTarget(argsPort, 20000);
    ws = await connect(target.webSocketDebuggerUrl);
    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        consoleNoise.push('[console.' + msg.params.type + '] ' + msg.params.args.map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && (msg.params.entry.level === 'error' || msg.params.entry.level === 'warning')) {
        consoleNoise.push('[log.' + msg.params.entry.level + '] ' + msg.params.entry.text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleNoise.push('[exception] ' + (msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text));
      }
    });
    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await sleep(800); // 等 init() fetch curriculum.json

    const body = `(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      // 0. 骨架載入
      ok(document.querySelectorAll('#gradeNav .grade-btn').length === 6, '頂部年級導航 6 顆按鈕');

      // 1. G1~G6 逐級切換：條目數 / 已開放 x/y / ready 卡 / upcoming 卡禁用
      const expect = ${JSON.stringify(EXPECTED_UNITS)};
      for (let g = 1; g <= 6; g++) {
        document.querySelectorAll('#gradeNav .grade-btn')[g - 1].click();
        await sleep(80);
        const cards = [...document.querySelectorAll('#gradeView .unit-card')];
        ok(cards.length === expect[g], 'G' + g + ' 單元卡片數 = ' + cards.length + '（期望 ' + expect[g] + '）');
        const hero = document.querySelector('#gradeView .hero-card p');
        const readyN = cards.filter((c) => c.classList.contains('ready')).length;
        ok(hero && hero.textContent.includes('已開放 ' + readyN + '/' + expect[g]), 'G' + g + ' hero 顯示「已開放 ' + readyN + '/' + expect[g] + '」');
        const upcoming = cards.filter((c) => c.classList.contains('locked'));
        ok(upcoming.length === expect[g] - readyN, 'G' + g + ' upcoming 卡片 = ' + upcoming.length + '（期望 ' + (expect[g] - readyN) + '）');
        ok(upcoming.every((c) => c.disabled), 'G' + g + ' upcoming 卡片全部 disabled（不可進入測驗）');
        ok(upcoming.every((c) => (c.querySelector('.badge-upcoming') || {}).textContent === '即將開放'), 'G' + g + ' upcoming 卡片掛「即將開放」徽章');
        ok(upcoming.slice(0, 3).every((c) => c.querySelector('.desc').textContent.trim().length > 5), 'G' + g + ' 卡片含官方 full_text 條目描述');
      }

      // 2. G1 → N-1-1 開啟測驗舞台
      document.querySelectorAll('#gradeNav .grade-btn')[0].click();
      await sleep(80);
      const n11 = document.querySelector('#gradeView .unit-card.ready');
      ok(!!n11 && n11.dataset.code === 'N-1-1', 'G1 有可點擊 ready 卡且為 N-1-1');
      n11.click();
      await sleep(900); // 等 fetch 題庫 + iframe 掛載
      const stage = document.getElementById('stageView');
      ok(stage.style.display === 'block', '點擊 N-1-1 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 4 題', '題號顯示「第 1 / 4 題」→ 實際「' + num.textContent + '」');
      const src = document.getElementById('progressSource').textContent;
      ok(src.includes('忠孝國小'), '真題來源掛忠孝國小實體試卷 → ' + src);
      const frame = document.getElementById('stageFrame');
      ok(!!frame.getAttribute('src') && frame.getAttribute('src').includes('component'), '教具 iframe 已掛載 src=' + frame.getAttribute('src'));
      ok(document.getElementById('stageTitle').textContent.trim().length > 0, '題目標題已渲染');

      // 3. 題號導航：下一題 → 第 2/4 題，回單元列表
      document.getElementById('btnNext').click();
      await sleep(500);
      ok(num.textContent === '第 2 / 4 題', '下一題 → 「第 2 / 4 題」→ 實際「' + num.textContent + '」');
      document.getElementById('btnBack').click();
      await sleep(100);
      ok(document.getElementById('gradeView').style.display === 'block', '回單元列表正常');
      ok(document.querySelectorAll('#gradeView .unit-card').length === 11, 'G1 單元列表仍為 11 張卡片');

      // 4. 交卷結算
      document.querySelector('#gradeView .unit-card.ready').click();
      await sleep(900);
      document.getElementById('btnFinish').click();
      await sleep(100);
      ok(document.getElementById('resultView').style.display === 'block' &&
         document.querySelectorAll('#resultView .result-item').length === 4, '交卷結算顯示 4 題回顧');

      return results;
    })()`;

    const res = await ws.send('Runtime.evaluate', { expression: body, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error('驗證腳本拋錯: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails));
    const results = res.result.value || [];
    for (const line of results) console.log(line);
    console.log('CONSOLE_NOISE_COUNT=' + consoleNoise.length);
    for (const n of consoleNoise.slice(0, 10)) console.log('  ' + n);
    const failed = results.filter((l) => String(l).startsWith('FAIL')).length;
    if (!results.length) {
      console.log('FAIL harness :: 驗證腳本未回傳任何結果');
      process.exitCode = 1;
    } else if (failed === 0 && consoleNoise.length === 0) {
      console.log('APP_SHELL_CDP_VERIFIED (6 grades × 131 unit cards + N-1-1 full flow) — ALL PASS');
      process.exitCode = 0;
    } else {
      console.log('FAILED (' + failed + ' fails, ' + consoleNoise.length + ' console noise)');
      process.exitCode = 1;
    }
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已結束 */ }
    try { server.close(); } catch (e) { /* 已關閉 */ }
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 佔用中留待清理 */ }
  }
}

main().catch((err) => {
  console.error('ERROR: ' + (err && err.message));
  process.exit(2);
});
