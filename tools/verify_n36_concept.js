/**
 * tools/verify_n36_concept.js - 驗證 G3-N-3-6 乘除應用問題 概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/mult_div_relation_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-n36-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/mult_div_relation_concept_lab.html` });
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

    // 2. 四幕 DOM 骨架存在
    for (let i = 1; i <= 4; i++) {
      const ok = await evaluate(`!!document.getElementById("act-${i}-view")`);
      if (!ok) throw new Error(`活動 ${i} 區塊不存在`);
    }
    console.log('PASS 四幕活動區塊全部掛載');

    // 3. 活動一：翻轉算式 → 除法雙算式
    await evaluate(`flipEquation()`);
    await new Promise((r) => setTimeout(r, 250));
    let a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('120 ÷ 8') || !a1Stat.includes('120 ÷ 15')) throw new Error('活動一翻轉失敗: ' + a1Stat);
    console.log('PASS 活動一（翻轉）：120 ÷ 8 ＝ 15 、 120 ÷ 15 ＝ 8');

    await evaluate(`flipEquation()`);
    await new Promise((r) => setTimeout(r, 150));
    a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('15 × 8')) throw new Error('活動一翻回失敗: ' + a1Stat);
    console.log('PASS 活動一（翻回）：15 × 8 ＝ 120');

    // 4. 活動二：三模式求解
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));

    await evaluate(`setA2Mode('A')`);
    await evaluate(`solveA2()`);
    await new Promise((r) => setTimeout(r, 150));
    let a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('120 瓶')) throw new Error('活動二模式A失敗: ' + a2Stat);
    console.log('PASS 活動二（模式A）：24 × 5 ＝ 120 瓶');

    await evaluate(`setA2Mode('B')`);
    await evaluate(`solveA2()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('24 瓶')) throw new Error('活動二模式B失敗: ' + a2Stat);
    console.log('PASS 活動二（模式B）：120 ÷ 5 ＝ 24 瓶');

    await evaluate(`setA2Mode('C')`);
    await evaluate(`solveA2()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('5 箱')) throw new Error('活動二模式C失敗: ' + a2Stat);
    console.log('PASS 活動二（模式C）：120 ÷ 24 ＝ 5 箱');

    // 5. 活動三：四種解密槽
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));

    await evaluate(`pickCipher(1)`);
    await evaluate(`crackCipher()`);
    await new Promise((r) => setTimeout(r, 150));
    let a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('8')) throw new Error('活動三題型1失敗: ' + a3Stat);
    console.log('PASS 活動三（題型1）：( ) × 7 ＝ 56 → 8');

    await evaluate(`pickCipher(2)`);
    await evaluate(`crackCipher()`);
    await new Promise((r) => setTimeout(r, 150));
    a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('8')) throw new Error('活動三題型2失敗: ' + a3Stat);
    console.log('PASS 活動三（題型2）：9 × ( ) ＝ 72 → 8');

    await evaluate(`pickCipher(3)`);
    await evaluate(`crackCipher()`);
    await new Promise((r) => setTimeout(r, 150));
    a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('84')) throw new Error('活動三題型3失敗: ' + a3Stat);
    console.log('PASS 活動三（題型3）：( ) ÷ 6 ＝ 14 → 84（商×除數）');

    await evaluate(`pickCipher(4)`);
    await evaluate(`crackCipher()`);
    await new Promise((r) => setTimeout(r, 150));
    a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('6')) throw new Error('活動三題型4失敗: ' + a3Stat);
    console.log('PASS 活動三（題型4）：96 ÷ ( ) ＝ 16 → 6（被除數÷商）');

    // 6. 活動四：兩大生活情境
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));

    await evaluate(`solveScene()`);
    await new Promise((r) => setTimeout(r, 150));
    let a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    if (!a4Stat.includes('25 盒')) throw new Error('活動四情境一失敗: ' + a4Stat);
    console.log('PASS 活動四（情境一）：150 ÷ 6 ＝ 25 盒');

    await evaluate(`pickScene(2)`);
    await evaluate(`solveScene()`);
    await new Promise((r) => setTimeout(r, 150));
    a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    if (!a4Stat.includes('16 枝')) throw new Error('活動四情境二失敗: ' + a4Stat);
    console.log('PASS 活動四（情境二）：12 × 8 ＝ 96，96 ÷ 6 ＝ 16 枝');

    // 7. 頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    console.log(`INFO 頁面總高度（活動四狀態）: ${pageH}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('N36_MULT_DIV_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
