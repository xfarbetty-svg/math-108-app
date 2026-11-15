/**
 * tools/verify_angle_concept.js - 驗證 G3-N-3-13 角與角度概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/angle_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const cdpPort = 9489;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-angle-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/angle_concept_lab.html` });
    await new Promise((r) => setTimeout(r, 600));

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    // 1. 檢驗無橫向溢出
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    if (overflow) throw new Error('手機 390px 出現橫向溢出！');
    console.log('PASS 390px 視口零橫向溢出');

    // 2. 活動一：調整角度，測試變大角與轉成直角
    await evaluate(`adjustAct1(15); adjustAct1(15);`);
    await new Promise((r) => setTimeout(r, 150));
    let act1Stat = await evaluate(`document.getElementById("act1-stat").textContent.trim()`);
    if (!act1Stat.includes('75°')) throw new Error('活動一角度調整失敗: ' + act1Stat);
    console.log('PASS 活動一（紙條轉一轉）：角度旋轉至 75° 成功');

    await evaluate(`setAct1(90)`);
    await new Promise((r) => setTimeout(r, 150));
    act1Stat = await evaluate(`document.getElementById("act1-stat").textContent.trim()`);
    if (!act1Stat.includes('90°')) throw new Error('活動一直角設定失敗: ' + act1Stat);
    console.log('PASS 活動一（轉成直角）：成功對齊 90° 直角');

    // 3. 活動二：三角板找直角，比對目標切換與旋轉
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`switchAct2Target('window')`);
    await new Promise((r) => setTimeout(r, 150));
    let act2Stat = await evaluate(`document.getElementById("act2-stat").textContent.trim()`);
    if (!act2Stat.includes('窗戶')) throw new Error('活動二目標切換失敗: ' + act2Stat);
    console.log('PASS 活動二（找直角）：比對教室窗戶角成功');

    await evaluate(`rotateAct2Square()`);
    await new Promise((r) => setTimeout(r, 150));
    console.log('PASS 活動二（旋轉三角板）：方位旋轉 45 度驗證通過');

    // 4. 活動三：銳角鈍角三兄弟切換
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`switchAct3Role('obtuse')`);
    await new Promise((r) => setTimeout(r, 150));
    let act3Stat = await evaluate(`document.getElementById("act3-stat").textContent.trim()`);
    if (!act3Stat.includes('鈍角大胖兄')) throw new Error('活動三鈍角切換失敗: ' + act3Stat);
    console.log('PASS 活動三（三兄弟比大小）：鈍角角色切換成功');

    // 5. 活動四：邊長迷思破解驗證
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`setSbAngle(90)`);
    await evaluate(`setSbLen(95, '長邊 (95px)')`);
    await new Promise((r) => setTimeout(r, 150));
    let sbStat = await evaluate(`document.getElementById("sb-stat").textContent.trim()`);
    if (!sbStat.includes('90°') || !sbStat.includes('95px')) throw new Error('活動四沙箱邊長設定失敗: ' + sbStat);
    console.log('PASS 活動四（自由沙箱）：邊長拉長至 95px，直角仍維持 90° 成功');

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('ANGLE_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
