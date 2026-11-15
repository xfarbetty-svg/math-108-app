/**
 * tools/verify_division_vertical_concept.js - 驗證 G3-N-3-5 除以一位數直式概念小教室
 * 390px 實機 CDP：零橫向溢出、四幕互動逐步推進、高度 ≤ 740、console 零錯誤
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

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/division_vertical_concept_lab.html' : req.url.replace(/^\//, ''));
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
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('open', () => resolve({ send, on, close: () => ws.close() }));
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
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
    function on(fn) { listeners.push(fn); }
  });
}

async function main() {
  const chromePath = findChrome();
  const cdpPort = 9495;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-dv-concept-'));
  const { server, port: httpPort } = await startServer();
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);

  let failed = 0;
  const check = (name, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
    if (!ok) failed++;
  };

  try {
    const target = await waitForTarget(cdpPort, 10000);
    const { send, on, close } = await connect(target.webSocketDebuggerUrl);

    let consoleErrors = [];
    on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        if (type === 'error') consoleErrors.push(text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/division_vertical_concept_lab.html` });
    await new Promise((r) => setTimeout(r, 600));

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
      return res.result ? res.result.value : undefined;
    };

    // 1. 零橫向溢出
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    check('390px 視口零橫向溢出', !overflow);

    // 2. 單屏高度 ≤ 740（量測實際內容高度）
    const totalH = await evaluate(`document.getElementById('app').getBoundingClientRect().height`);
    check('總高 ≤ 740px（免滑動）', totalH <= 740, `appHeight=${totalH}px`);

    // 3. 活動一：分錢長除法 4 步推進
    const a1len = await evaluate(`document.getElementById('a1-svg').innerHTML.length`);
    check('活動一 SVG 初始渲染', a1len > 200, `len=${a1len}`);
    await evaluate(`a1Next(); a1Next(); a1Next(); a1Next();`);
    const a1stat = await evaluate(`document.getElementById('a1-stat').textContent`);
    check('活動一 4 步推進至答案 24 元', /24 元/.test(a1stat), a1stat);

    // 4. 活動二：856÷4 三步推進
    await evaluate(`switchAct(2)`);
    await evaluate(`a2Go(1); a2Go(1); a2Go(1);`);
    const a2stat = await evaluate(`document.getElementById('a2-stat').textContent`);
    const a2html = await evaluate(`document.getElementById('a2-svg').innerHTML`);
    check('活動二 三步推進至答案 214', /214/.test(a2stat) && /214/.test(a2html), a2stat);

    // 5. 活動三：補零破招
    await evaluate(`switchAct(3)`);
    await evaluate(`a3ToggleReveal()`);
    const a3stat = await evaluate(`document.getElementById('a3-stat').textContent`);
    const a3html = await evaluate(`document.getElementById('a3-svg').innerHTML`);
    check('活動三 破招顯示 103 並劃掉 13', /103，不是 13/.test(a3stat) && /✗/.test(a3html), a3stat);

    // 6. 活動四：驗算天平三步推進
    await evaluate(`switchAct(4)`);
    await evaluate(`a4Next(); a4Next(); a4Next();`);
    const a4stat = await evaluate(`document.getElementById('a4-stat').textContent`);
    const a4html = await evaluate(`document.getElementById('a4-svg').innerHTML`);
    check('活動四 驗算天平平衡蓋章', /驗算完全正確/.test(a4stat) && /驗算/.test(a4html) && /539/.test(a4html), a4stat);

    // 7. Console 零錯誤
    check('Console 錯誤數 ＝ 0', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 200));

    await close();
  } catch (e) {
    console.error('HARNESS_ERROR', e);
    failed++;
  } finally {
    cleanup();
  }

  if (failed > 0) {
    console.log(`DIVISION_VERTICAL_CONCEPT_VERIFIED :: ${failed} FAILED (Exit 1)`);
    process.exit(1);
  }
  console.log('DIVISION_VERTICAL_CONCEPT_VERIFIED :: ALL PASS (Exit 0)');
}

main();
