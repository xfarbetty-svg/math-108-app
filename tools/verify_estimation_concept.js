/**
 * tools/verify_estimation_concept.js - 驗證 G3-N-3-8 四則估算概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/estimation_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-est-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/estimation_concept_lab.html` });
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

    // 2. 活動一：數線磁鐵三個數字
    await evaluate(`selectBall('482')`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('500')) throw new Error('活動一 482 靠攏失敗: ' + a1Stat);
    console.log('PASS 活動一（482）：十位滿 5 往右靠 → 概數 500');

    await evaluate(`selectBall('418')`);
    await new Promise((r) => setTimeout(r, 150));
    a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('400')) throw new Error('活動一 418 靠攏失敗: ' + a1Stat);
    console.log('PASS 活動一（418）：十位未滿 5 往左靠 → 概數 400');

    await evaluate(`selectBall('450')`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Bubble = await evaluate(`document.getElementById("a1-bubble").textContent.trim()`);
    if (!a1Bubble.includes('正中央') || !a1Bubble.includes('500')) throw new Error('活動一 450 正中央失敗: ' + a1Bubble);
    console.log('PASS 活動一（450）：剛好正中央 → 習慣往大的靠 500');

    // 3. 活動二：保險高估法則三步驟
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`a2Step()`);
    await new Promise((r) => setTimeout(r, 150));
    let a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('900') || !a2Stat.includes('1200')) throw new Error('活動二步驟一失敗: ' + a2Stat);
    console.log('PASS 活動二（步驟1）：899→900、1150→1200 往高估');

    await evaluate(`a2Step()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('2100')) throw new Error('活動二步驟二失敗: ' + a2Stat);
    console.log('PASS 活動二（步驟2）：900 ＋ 1200 ＝ 2100 元');

    await evaluate(`a2Step()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    let a2Bubble = await evaluate(`document.getElementById("a2-bubble").textContent.trim()`);
    if (!a2Stat.includes('2049') || !a2Bubble.includes('2049')) throw new Error('活動二精確驗算失敗: ' + a2Stat);
    console.log('PASS 活動二（步驟3）：精確驗算 899 ＋ 1150 ＝ 2049 真的不夠');

    // 4. 活動三：乘法估算雷達兩題
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`radarScan()`);
    await new Promise((r) => setTimeout(r, 300));
    let a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('300')) throw new Error('活動三題目1雷達失敗: ' + a3Stat);
    console.log('PASS 活動三（題目1）：49 看成 50 → 50 × 6 ＝ 300');

    await evaluate(`pickRadar(2)`);
    await evaluate(`radarScan()`);
    await new Promise((r) => setTimeout(r, 300));
    a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    let a3Step2 = await evaluate(`document.getElementById("a3-step2").textContent.trim()`);
    if (!a3Stat.includes('1200') || !a3Step2.includes('1200')) throw new Error('活動三題目2雷達失敗: ' + a3Stat);
    console.log('PASS 活動三（題目2）：295 看成 300 → 300 × 4 ＝ 1200');

    // 5. 活動四：合理性檢驗偵探雷達
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`detectScan()`);
    await new Promise((r) => setTimeout(r, 300));
    let a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    let a4Truth = await evaluate(`document.getElementById("a4-truth").textContent.trim()`);
    let a4Step1 = await evaluate(`document.getElementById("a4-step1").textContent.trim()`);
    if (!a4Step1.includes('3000')) throw new Error('活動四推理卡失敗: ' + a4Step1);
    if (!a4Stat.includes('算錯')) throw new Error('活動四判決失敗: ' + a4Stat);
    if (!a4Truth.includes('24') || !a4Truth.includes('40')) throw new Error('活動四破招真相失敗: ' + a4Truth);
    console.log('PASS 活動四：500 × 6 ＝ 3000 雷達抓包 → 4970 離譜算錯');

    // 6. 四幕頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    console.log(`INFO 頁面總高度（活動四狀態）: ${pageH}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('ESTIMATION_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
