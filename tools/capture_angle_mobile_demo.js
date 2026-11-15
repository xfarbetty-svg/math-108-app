/**
 * tools/capture_angle_mobile_demo.js - 390px 手機實機四幕截圖捕獲
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) { }
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
    await sleep(150);
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
  const cdpPort = 9492;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-angle-demo-'));

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

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    const ssDir = path.resolve(__dirname, '../reports/screenshots');
    fs.mkdirSync(ssDir, { recursive: true });

    // 1. 直接載入獨立概念小教室
    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/angle_concept_lab.html` });
    await sleep(600);

    // 截圖 Act 1
    await evaluate(`adjustAct1(15);`);
    await sleep(200);
    let ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ssDir, 'angle_mobile_act1.png'), Buffer.from(ss1.data, 'base64'));
    console.log('PASS Act 1 截圖已保存：angle_mobile_act1.png');

    // 截圖 Act 2 (三角板找直角)
    await evaluate(`switchAct(2); switchAct2Target('desk');`);
    await sleep(300);
    let ss2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ssDir, 'angle_mobile_act2.png'), Buffer.from(ss2.data, 'base64'));
    console.log('PASS Act 2 截圖已保存：angle_mobile_act2.png');

    // 截圖 Act 3 (銳角鈍角三兄弟)
    await evaluate(`switchAct(3); switchAct3Role('right');`);
    await sleep(300);
    let ss3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ssDir, 'angle_mobile_act3.png'), Buffer.from(ss3.data, 'base64'));
    console.log('PASS Act 3 截圖已保存：angle_mobile_act3.png');

    // 截圖 Act 4 (邊長迷思沙箱)
    await evaluate(`switchAct(4); setSbAngle(60); setSbLen(95, '長邊 (95px)');`);
    await sleep(300);
    let ss4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ssDir, 'angle_mobile_act4.png'), Buffer.from(ss4.data, 'base64'));
    console.log('PASS Act 4 截圖已保存：angle_mobile_act4.png');

    // 2. 載入主應用 Shell，切換至三年級 N-3-13 概念小教室模式
    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/index.html` });
    await sleep(700);
    // 點擊三年級 (index 2)
    await evaluate(`document.querySelectorAll('#gradeNav .grade-btn')[2].click();`);
    await sleep(400);
    // 點擊 N-3-13 卡片
    await evaluate(`
      const card = document.querySelector('#gradeView .unit-card[data-code="N-3-13"]');
      if (card) card.click();
    `);
    await sleep(900);
    // 切換至概念小教室模式
    await evaluate(`
      const btn = document.getElementById('btnModeConcept');
      if (btn) btn.click();
    `);
    await sleep(700);

    let ssShell = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ssDir, 'angle_mobile_shell.png'), Buffer.from(ssShell.data, 'base64'));
    console.log('PASS 主應用 Shell 整合截圖已保存：angle_mobile_shell.png');

    close();
    cleanup();
    console.log('ALL MOBILE SCREENSHOTS CAPTURED SUCCESSFULLY (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
