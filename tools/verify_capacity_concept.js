/**
 * tools/verify_capacity_concept.js — 驗證容量概念小教室在 390px 手機實機渲染、互動與零錯誤
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/capacity_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const cdpPort = 9477;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-cap-concept-'));

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
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/capacity_concept_lab.html` });
    await new Promise((r) => setTimeout(r, 600));

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    // 1. 檢查零橫向溢出
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    if (overflow) throw new Error('手機 390px 出現橫向溢出！');
    console.log('PASS 390px 視口零橫向溢出');

    // 2. 初始容量為 0
    const initCap = await evaluate(`document.getElementById("meter-primary").textContent.trim()`);
    if (!initCap.includes('0 公升 0 毫升')) throw new Error('初始容量未歸零: ' + initCap);
    console.log(`PASS 初始容量正確: ${initCap}`);

    // 3. 點擊水壺 (index 2: +400mL) 和 大鮮奶 (index 5: +1000mL)
    await evaluate(`document.querySelectorAll(".item-btn")[2].click()`);
    await new Promise((r) => setTimeout(r, 100));
    await evaluate(`document.querySelectorAll(".item-btn")[5].click()`);
    await new Promise((r) => setTimeout(r, 100));

    const capUpdated = await evaluate(`document.getElementById("meter-primary").textContent.trim()`);
    if (!capUpdated.includes('1 公升 400 毫升')) throw new Error('容量計算不正確: ' + capUpdated);
    console.log(`PASS 水壺與大鮮奶累加容量正確: ${capUpdated}`);

    // 4. 倒光重來
    await evaluate(`document.querySelector(".btn-reset").click()`);
    await new Promise((r) => setTimeout(r, 100));
    const capReset = await evaluate(`document.getElementById("meter-primary").textContent.trim()`);
    if (!capReset.includes('0 公升 0 毫升')) throw new Error('倒光重來失敗: ' + capReset);
    console.log('PASS 倒光重來正確');

    // 5. 秘笈卡切換
    await evaluate(`document.getElementById("dot-2").click()`);
    await new Promise((r) => setTimeout(r, 100));
    const cardTitle = await evaluate(`document.querySelector(".fc-title").textContent.trim()`);
    if (!cardTitle.includes('小心「十位與百位補 0」陷阱')) throw new Error('秘笈卡切換失敗: ' + cardTitle);
    console.log(`PASS 秘笈卡切換正確: ${cardTitle}`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('CAPACITY_CONCEPT_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
