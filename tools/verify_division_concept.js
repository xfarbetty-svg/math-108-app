/**
 * tools/verify_division_concept.js - 驗證 G3-N-3-4 除法概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/division_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const cdpPort = 9499;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-div-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/division_concept_lab.html` });
    await new Promise((r) => setTimeout(r, 600));

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    // 1. 檢驗 390px 視口零溢出
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    if (overflow) throw new Error('手機 390px 出現橫向溢出！');
    console.log('PASS 390px 視口零橫向溢出');

    // 2. 活動一：包含除 18 ÷ 6（裝盒三次）
    await evaluate(`a1Pack()`);
    await new Promise((r) => setTimeout(r, 120));
    await evaluate(`a1Pack()`);
    await new Promise((r) => setTimeout(r, 120));
    let a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('已裝 2 盒') || !a1Stat.includes('還有 6 顆')) throw new Error('活動一裝盒兩次狀態錯: ' + a1Stat);
    console.log('PASS 活動一（裝2盒）：剩 6 顆，已裝 2 盒');

    await evaluate(`a1Pack()`);
    await new Promise((r) => setTimeout(r, 120));
    a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    let a1Eq = await evaluate(`document.getElementById("a1-eq").textContent.trim()`);
    if (!a1Stat.includes('18 ÷ 6 ＝ 3 盒') || !a1Eq.includes('3 盒 ✓')) throw new Error('活動一完成揭示失敗: ' + a1Stat + ' / ' + a1Eq);
    console.log('PASS 活動一（完成）：18 ÷ 6 ＝ 3 盒');

    await evaluate(`a1Reset()`);
    await new Promise((r) => setTimeout(r, 120));

    // 3. 活動二：等分除 20 ÷ 4（輪流發 5 輪）
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 120));
    await evaluate(`a2Deal()`);
    await evaluate(`a2Deal()`);
    await new Promise((r) => setTimeout(r, 120));
    let a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('還有 12 塊') || !a2Stat.includes('已發 2 輪')) throw new Error('活動二發牌兩輪狀態錯: ' + a2Stat);
    console.log('PASS 活動二（發2輪）：倉庫剩 12 塊');

    await evaluate(`a2Deal()`);
    await evaluate(`a2Deal()`);
    await evaluate(`a2Deal()`);
    await new Promise((r) => setTimeout(r, 120));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    let a2Eq = await evaluate(`document.getElementById("a2-eq").textContent.trim()`);
    if (!a2Stat.includes('20 ÷ 4 ＝ 5 塊') || !a2Eq.includes('5 塊 ✓')) throw new Error('活動二完成揭示失敗: ' + a2Stat + ' / ' + a2Eq);
    console.log('PASS 活動二（完成）：20 ÷ 4 ＝ 5 塊');

    await evaluate(`a2Reset()`);
    await new Promise((r) => setTimeout(r, 120));

    // 4. 活動三：餘數守則 17 ÷ 5 ＝ 3 餘 2 ＋ 迷思破招
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 120));
    await evaluate(`a3Basket()`);
    await evaluate(`a3Basket()`);
    await evaluate(`a3Basket()`);
    await new Promise((r) => setTimeout(r, 120));
    let a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    let a3Banner = await evaluate(`document.getElementById("a3-banner").textContent.trim()`);
    if (!a3Stat.includes('3 籃 … 2 顆') || !a3Banner.includes('餘數 (2) ＜ 除數 (5)')) throw new Error('活動三完成守則揭示失敗: ' + a3Stat + ' / ' + a3Banner);
    console.log('PASS 活動三（完成）：17 ÷ 5 ＝ 3 餘 2，餘數 2 ＜ 除數 5');

    await evaluate(`a3MythToggle()`);
    await new Promise((r) => setTimeout(r, 120));
    let a3Bubble = await evaluate(`document.getElementById("a3-bubble").textContent.trim()`);
    if (!a3Bubble.includes('7 顆比 5 還大') || !a3Bubble.includes('3 餘 2')) throw new Error('活動三迷思破招失敗: ' + a3Bubble);
    console.log('PASS 活動三（破招）：2 餘 7 不成立，正解 3 餘 2');

    await evaluate(`a3Reset()`);
    await new Promise((r) => setTimeout(r, 120));

    // 5. 活動四：乘除互逆輪盤四道切換
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 120));
    for (let i = 0; i < 4; i++) {
      await evaluate(`a4Rotate()`);
      await new Promise((r) => setTimeout(r, 100));
    }
    let a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    if (!a4Stat.includes('4 × 6 ＝ 24')) throw new Error('活動四輪盤歸位失敗: ' + a4Stat);
    console.log('PASS 活動四（輪盤）：四道乘除互逆切換正常');

    await evaluate(`a4Rotate()`);
    await new Promise((r) => setTimeout(r, 120));
    let a4Bubble = await evaluate(`document.getElementById("a4-bubble").textContent.trim()`);
    if (!a4Bubble.includes('6 × 4')) throw new Error('活動四交換律揭示失敗: ' + a4Bubble);
    console.log('PASS 活動四（交換律）：6 × 4 ＝ 24');

    // 6. 頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    console.log(`INFO 頁面總高度（活動四狀態）: ${pageH}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('DIVISION_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
