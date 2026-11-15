/**
 * tools/verify_millimeter_concept.js - 驗證 G3-N-3-12 長度（毫米 mm）概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/millimeter_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const cdpPort = 9498;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-mm-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/millimeter_concept_lab.html` });
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

    // 2. 活動一：點數 1mm~10mm 小刻度
    await evaluate(`selectMm(3)`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('3 mm')) throw new Error('活動一點數 3mm 失敗: ' + a1Stat);
    console.log('PASS 活動一（3mm）：3cm ＋ 3 mm 點數同步');

    await evaluate(`selectMm(10)`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Bubble = await evaluate(`document.getElementById("a1-bubble").textContent.trim()`);
    if (!a1Bubble.includes('1 公分') || !a1Bubble.includes('10 毫米')) throw new Error('活動一 10mm 揭示失敗: ' + a1Bubble);
    console.log('PASS 活動一（10mm）：1 公分 ＝ 10 毫米 核心關係揭示');

    // 3. 活動二：微物對齊測量
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`selectObj('staple')`);
    await new Promise((r) => setTimeout(r, 150));
    let a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('12mm')) throw new Error('活動二訂書針讀數失敗: ' + a2Stat);
    console.log('PASS 活動二（訂書針）：右端讀數 12mm');

    await evaluate(`selectObj('eraser')`);
    await new Promise((r) => setTimeout(r, 150));
    let a2Bubble = await evaluate(`document.getElementById("a2-bubble").textContent.trim()`);
    if (!a2Bubble.includes('35mm') || !a2Bubble.includes('3cm 5mm')) throw new Error('活動二橡皮擦換算失敗: ' + a2Bubble);
    console.log('PASS 活動二（橡皮擦）：35mm ＝ 3cm 5mm');

    // 4. 活動三：單名數 ⇄ 複名數 換算
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`setA3Mode('B')`);
    await evaluate(`a3Step()`);
    await evaluate(`a3Step()`);
    await new Promise((r) => setTimeout(r, 150));
    let a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('4cm 8mm')) throw new Error('活動三 48mm 換算失敗: ' + a3Stat);
    console.log('PASS 活動三（48mm）：逐步拆解 → 4cm 8mm');

    await evaluate(`setA3Mode('A')`);
    await evaluate(`a3Step()`);
    await evaluate(`a3Step()`);
    await new Promise((r) => setTimeout(r, 150));
    a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('35mm')) throw new Error('活動三 3cm5mm 換算失敗: ' + a3Stat);
    console.log('PASS 活動三（3cm 5mm）：逐步拆解 → 35mm');

    // 5. 活動四：三大迷思糾錯偵探
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`fixMyth()`);
    await new Promise((r) => setTimeout(r, 150));
    let a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    if (!a4Stat.includes('4 公分')) throw new Error('活動四迷思一糾錯失敗: ' + a4Stat);
    console.log('PASS 活動四（迷思一）：5cm－1cm＝4cm 破招');

    await evaluate(`pickMyth(2)`);
    await evaluate(`fixMyth()`);
    await new Promise((r) => setTimeout(r, 150));
    let a4Bubble = await evaluate(`document.getElementById("a4-bubble").textContent.trim()`);
    if (!a4Bubble.includes('2cm 8mm') || !a4Bubble.includes('10 倍')) throw new Error('活動四迷思二糾錯失敗: ' + a4Bubble);
    console.log('PASS 活動四（迷思二）：28mm＝2cm 8mm，差 10 倍');

    await evaluate(`pickMyth(3)`);
    await evaluate(`fixMyth()`);
    await new Promise((r) => setTimeout(r, 150));
    a4Bubble = await evaluate(`document.getElementById("a4-bubble").textContent.trim()`);
    if (!a4Bubble.includes('26mm')) throw new Error('活動四迷思三糾錯失敗: ' + a4Bubble);
    console.log('PASS 活動四（迷思三）：2cm 6mm＝26mm 小刻度不漏');

    // 6. 頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    console.log(`INFO 頁面總高度（活動四狀態）: ${pageH}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('MILLIMETER_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
