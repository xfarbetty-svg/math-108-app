/**
 * tools/verify_n33_concept.js - 驗證 G3-N-3-3 乘以一位數 概念小教室 108 課綱四幕實機互動
 * 閘門：390px 視口零橫向溢出 + 四幕真實按鈕互動 + Console 錯誤數 0 + Exit Code 0
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/multiplication_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-n33-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/multiplication_concept_lab.html` });
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

    // 2. 活動一：面積模型聚焦拆解
    await evaluate(`a1Focus('blue')`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('4 × 3 ＝ 12')) throw new Error('活動一藍塊聚焦失敗: ' + a1Stat);
    console.log('PASS 活動一（藍塊）：4 × 3 ＝ 12');

    await evaluate(`a1Focus('green')`);
    await new Promise((r) => setTimeout(r, 150));
    a1Stat = await evaluate(`document.getElementById("a1-stat").textContent.trim()`);
    if (!a1Stat.includes('30 × 3 ＝ 90')) throw new Error('活動一綠塊聚焦失敗: ' + a1Stat);
    console.log('PASS 活動一（綠塊）：30 × 3 ＝ 90');

    await evaluate(`a1Focus('sum')`);
    await new Promise((r) => setTimeout(r, 150));
    let a1Bubble = await evaluate(`document.getElementById("a1-bubble").textContent.trim()`);
    if (!a1Bubble.includes('90 ＋ 12 ＝ 102')) throw new Error('活動一合體揭示失敗: ' + a1Bubble);
    console.log('PASS 活動一（合體）：90 ＋ 12 ＝ 102');

    // 3. 活動二：連續進位階梯
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`a2Next()`);
    await new Promise((r) => setTimeout(r, 150));
    let a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('寫 0 進 3')) throw new Error('活動二個位進位失敗: ' + a2Stat);
    console.log('PASS 活動二（個位）：6 × 5 ＝ 30，寫 0 進 3');

    await evaluate(`a2Next()`);
    await evaluate(`a2Next()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('2380')) throw new Error('活動二最終答案失敗: ' + a2Stat);
    console.log('PASS 活動二（完成）：答案 2380');

    const a2NextText = await evaluate(`document.getElementById("btn-a2-next").textContent.trim()`);
    if (!a2NextText.includes('重新開始')) throw new Error('活動二重新開始鈕失敗: ' + a2NextText);
    console.log('PASS 活動二：完成後按鈕轉為重新開始');

    await evaluate(`a2Prev()`);
    await new Promise((r) => setTimeout(r, 150));
    a2Stat = await evaluate(`document.getElementById("a2-stat").textContent.trim()`);
    if (!a2Stat.includes('寫 8 進 3')) throw new Error('活動二上一步回退失敗: ' + a2Stat);
    console.log('PASS 活動二：上一步回退正常');

    // 4. 活動三：中間含 0 破招
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`a3Fix()`);
    await new Promise((r) => setTimeout(r, 150));
    let a3Stat = await evaluate(`document.getElementById("a3-stat").textContent.trim()`);
    if (!a3Stat.includes('1224 ✓')) throw new Error('活動三破招失敗: ' + a3Stat);
    const a3FixOpacity = await evaluate(`document.getElementById("a3-fix").style.opacity`);
    if (a3FixOpacity !== '1') throw new Error('活動三破招覆蓋層未顯現: ' + a3FixOpacity);
    console.log('PASS 活動三：放大鏡破招 → 306 × 4 ＝ 1224 ✓');

    // 5. 活動四：規律輪盤與估算
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`a4Spin()`);
    await evaluate(`a4Spin()`);
    await evaluate(`a4Spin()`);
    await new Promise((r) => setTimeout(r, 150));
    let a4Stat = await evaluate(`document.getElementById("a4-stat").textContent.trim()`);
    if (!a4Stat.includes('2100')) throw new Error('活動四規律輪盤失敗: ' + a4Stat);
    console.log('PASS 活動四（規律）：700 × 3 ＝ 2100（補 2 個 0）');

    await evaluate(`a4Estimate()`);
    await new Promise((r) => setTimeout(r, 150));
    let a4Bubble = await evaluate(`document.getElementById("a4-bubble").textContent.trim()`);
    if (!a4Bubble.includes('300 × 4 ＝ 1200')) throw new Error('活動四估算解法失敗: ' + a4Bubble);
    console.log('PASS 活動四（估算）：298 ≈ 300 → 300 × 4 ＝ 1200 元');

    // 6. 頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    const appH = await evaluate(`document.getElementById("app").getBoundingClientRect().height`);
    console.log(`INFO 頁面總高度: ${pageH}px ｜ #app 實體高度: ${Math.round(appH)}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('N33_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
