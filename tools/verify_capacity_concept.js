/**
 * tools/verify_capacity_concept.js — 驗證 108 課綱活動一、活動二、活動三與沙盒實機互動
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
  const cdpPort = 9478;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-act-concept-'));

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

    // 2. 活動一：點擊倒水 4 次裝滿 400mL
    await evaluate(`act1AddCup(); act1AddCup(); act1AddCup(); act1AddCup();`);
    await new Promise((r) => setTimeout(r, 200));
    const act1Stat = await evaluate(`document.getElementById("act1-stat").textContent.trim()`);
    if (!act1Stat.includes('4 杯 ＝ 400 毫升')) throw new Error('活動一倒滿 4 杯失敗: ' + act1Stat);
    console.log(`PASS 活動一（水壺實測）：4 杯 ＝ 400 毫升成功！`);

    // 3. 活動二：切換至活動二，點擊喝水 5 次
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 200));
    await evaluate(`act2DrinkBottle(); act2DrinkBottle(); act2DrinkBottle(); act2DrinkBottle(); act2DrinkBottle();`);
    await new Promise((r) => setTimeout(r, 200));
    const act2Stat = await evaluate(`document.getElementById("act2-stat").textContent.trim()`);
    if (!act2Stat.includes('5 壺 ＝ 2000 毫升')) throw new Error('活動二喝水 5 壺失敗: ' + act2Stat);
    console.log(`PASS 活動二（1800mL 喝水任務）：5 壺 ＝ 2000 毫升達成！`);

    // 4. 活動三：切換至活動三，點擊拆解切換
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 200));
    await evaluate(`act3ToggleDemo()`);
    await new Promise((r) => setTimeout(r, 200));
    const act3Stat = await evaluate(`document.getElementById("act3-stat").textContent.trim()`);
    if (!act3Stat.includes('3.4 公升')) throw new Error('活動三小數切換失敗: ' + act3Stat);
    console.log(`PASS 活動三（2.7L / 3.4L 小數橋樑）：切換拆解成功！`);

    // 5. 活動四：切換至自由沙盒
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 200));
    await evaluate(`sbAdd(400, '水壺')`);
    await new Promise((r) => setTimeout(r, 200));
    const sbStat = await evaluate(`document.getElementById("sb-stat").textContent.trim()`);
    if (!sbStat.includes('400 毫升')) throw new Error('沙盒倒水失敗: ' + sbStat);
    console.log(`PASS 活動四（自由沙盒）：倒水 400mL 成功！`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('CAPACITY_108_ACTIVITIES_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
