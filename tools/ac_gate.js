/**
 * tools/ac_gate.js — 機械化驗收閘門（TCK-08 / RK-04）
 * 一次跑完 G-1 語法、G-4 零外部資源、G-5 體積、G-2 控制台雜訊與 T-01~T-03 全量 AC，
 * 以「真實 exit code」判定；CDP 捕獲之 console error/warning 一律視為失敗。
 * 用法：node tools/ac_gate.js
 * 退出碼：0 = 全綠；1 = 有 FAIL；2 = 閘門本身執行失敗。
 */
'use strict';
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const COMPONENTS = ['ten-frame-grid.js', 'dual-track-diff.js', 'balance-beam.js'];
const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const LIMIT_EACH = 12 * 1024;
const LIMIT_TOTAL = 30 * 1024;

const results = [];
const rec = (id, pass, info) => results.push({ id, pass, info });

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}
const chrome = findChrome();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* G-1 語法 */
for (const f of COMPONENTS) {
  const abs = path.join(ROOT, 'app', 'components', f);
  const r = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf8' });
  rec('G-1 ' + f, r.status === 0, 'node --check exit=' + r.status);
}
// S-1-1 獨立語法閘門 (BP 裁決 D-01)
const absS11 = path.join(ROOT, 'app', 'components', 'isometric-rotator.js');
if (fs.existsSync(absS11)) {
  const r = spawnSync(process.execPath, ['--check', absS11], { encoding: 'utf8' });
  rec('G-1 isometric-rotator.js', r.status === 0, 'node --check exit=' + r.status);
}

// S-1-2 獨立語法閘門
const absS12 = path.join(ROOT, 'app', 'components', 'stack-physics-bench.js');
if (fs.existsSync(absS12)) {
  const r = spawnSync(process.execPath, ['--check', absS12], { encoding: 'utf8' });
  rec('G-1 stack-physics-bench.js', r.status === 0, 'node --check exit=' + r.status);
}

/* G-5 體積（每檔 ≤12KB、合計 ≤30KB） */
let total = 0;
for (const f of COMPONENTS) {
  const size = fs.statSync(path.join(ROOT, 'app', 'components', f)).size;
  total += size;
  rec('G-5 ' + f, size <= LIMIT_EACH, size + ' B (<= ' + LIMIT_EACH + ')');
}
rec('G-5 total', total <= LIMIT_TOTAL, total + ' B (<= ' + LIMIT_TOTAL + ')');

// S-1-1 獨立體積閘門 (BP 裁決 D-01: 單檔 <= 12,288 B，不稀釋舊四單元)
if (fs.existsSync(absS11)) {
  const sizeS11 = fs.statSync(absS11).size;
  rec('G-5 isometric-rotator.js', sizeS11 <= LIMIT_EACH, sizeS11 + ' B (<= ' + LIMIT_EACH + ')');
}

// S-1-2 獨立體積閘門 (單檔 <= 12,288 B)
if (fs.existsSync(absS12)) {
  const sizeS12 = fs.statSync(absS12).size;
  rec('G-5 stack-physics-bench.js', sizeS12 <= LIMIT_EACH, sizeS12 + ' B (<= ' + LIMIT_EACH + ')');
}

/* G-4 零外部資源：僅允許 SVG 命名空間 */
const files = COMPONENTS.map((f) => path.join(ROOT, 'app', 'components', f))
  .concat([path.join(ROOT, 'app', 'playground.html')]);
const hits = [];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const m = text.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  for (const u of m) hits.push(path.basename(f) + ' -> ' + u);
}
const external = hits.filter((h) => !/http:\/\/www\.w3\.org\/2000\/svg$/.test(h));
rec('G-4 零外部依賴', external.length === 0,
  'url_hits=' + hits.length + ' external=' + external.length +
  (external.length ? ' [' + external.join(', ') + ']' : ''));

/* ---- CDP 連線工具（Runtime/Log 事件用於攔截控制台雜訊） ---- */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/json/list');
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* chrome 尚未就緒 */ }
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時 (port ' + port + ')');
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

/* 單頁：CDP 導航 → 等 RESULT_END → 同時收集 console 雜訊 */
async function runPage(page) {
  const url = pathToFileURL(path.join(ROOT, page.file)).href;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-gate-'));
  const port = await freePort();
  const noise = [];
  let text = '';
  let ws = null;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--allow-file-access-from-files', '--disable-extensions',
    '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    ...page.args, 'about:blank'
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(port, 20000);
    ws = await connect(target.webSocketDebuggerUrl);
    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' &&
        (msg.params.type === 'error' || msg.params.type === 'warning')) {
        noise.push('[console.' + msg.params.type + '] ' +
          msg.params.args.map((a) => (a.value !== undefined ? String(a.value) : (a.description || a.type))).join(' '));
      }
      if (msg.method === 'Log.entryAdded' &&
        (msg.params.entry.level === 'error' || msg.params.entry.level === 'warning')) {
        noise.push('[log.' + msg.params.entry.level + '] ' + msg.params.entry.text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        noise.push('[exception] ' + (d.exception ? d.exception.description : d.text));
      }
    });
    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await ws.send('Page.enable');
    await ws.send('Page.navigate', { url });

    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      try {
        const r = await ws.send('Runtime.evaluate', {
          expression: '(function(){var e=document.getElementById("result");return e?e.textContent:"";})()',
          returnByValue: true
        });
        text = (r.result && r.result.value) || '';
      } catch (e) { /* 導航中 context 被銷毀，下一輪重試 */ }
      if (text.indexOf('RESULT_END') >= 0) break;
      await sleep(120);
    }
    await sleep(250); /* 收尾事件（例：未捕捉例外）落地 */
  } catch (err) {
    rec('AC ' + page.id + ' harness', false, 'CDP 執行失敗 :: ' + (err && err.message));
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已結束 */ }
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 佔用中 */ }
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => /^(PASS|FAIL) /.test(l));
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  const passes = lines.filter((l) => l.startsWith('PASS'));
  /* RK-04：CONSOLE_NOISE_COUNT > 0 → 該頁 FAIL（並隨總計 exitCode=1） */
  rec('G-2 ' + page.id, noise.length === 0,
    'CONSOLE_NOISE_COUNT=' + noise.length + (noise.length ? ' :: ' + noise.slice(0, 5).join(' | ') : ''));
  rec('AC ' + page.id, fails.length === 0 && passes.length > 0 && noise.length === 0,
    'pass=' + passes.length + ' fail=' + fails.length + ' noise=' + noise.length +
    (text.indexOf('RESULT_END') < 0 ? ' [結果區塊未完成]' : '') +
    (fails.length ? ' :: ' + fails.join(' | ') : ''));
}

(async function main() {
  const PAGES = [
    { id: 'T-01', file: 'tests/ac_t01.html', args: ['--window-size=390,900'] },
    { id: 'T-02', file: 'tests/ac_t02.html', args: ['--window-size=390,900'] },
    { id: 'T-02-RM', file: 'tests/ac_t02.html', args: ['--window-size=390,900', '--force-prefers-reduced-motion'] },
    { id: 'T-03', file: 'tests/ac_t03.html', args: ['--window-size=390,900'] },
    { id: 'T-05', file: 'tests/ac_isometric_rotator.html', args: ['--window-size=390,900'] }
  ];
  for (const page of PAGES) await runPage(page);

  let failed = 0;
  for (const r of results) {
    if (!r.pass) failed++;
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + ' :: ' + r.info);
  }
  console.log('GATE_' + (failed === 0 ? 'GREEN' : 'RED') + ' (' + results.length + ' checks, ' + failed + ' failed)');
  process.exitCode = failed === 0 ? 0 : 1;
})().catch((err) => {
  console.error('GATE_ERROR: ' + (err && err.message));
  process.exit(2);
});
