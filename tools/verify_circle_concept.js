/**
 * tools/verify_circle_concept.js - 驗證 G3-S-3-3 圓概念小教室 108 課綱四幕實機互動
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
      let fp = path.join(process.cwd(), req.url === '/' ? 'app/components/circle_concept_lab.html' : req.url.replace(/^\//, ''));
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
  const cdpPort = 9497;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-circle-concept-'));

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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/circle_concept_lab.html` });
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

    // 2. 活動一：四部位膠囊按鈕切換
    await evaluate(`selectPart('center')`);
    await new Promise((r) => setTimeout(r, 150));
    let act1Bubble = await evaluate(`document.getElementById("act1-bubble").textContent.trim()`);
    if (!act1Bubble.includes('圓心')) throw new Error('活動一圓心切換失敗: ' + act1Bubble);
    console.log('PASS 活動一（圓心）：解說正確');

    await evaluate(`selectPart('diameter')`);
    await new Promise((r) => setTimeout(r, 150));
    act1Bubble = await evaluate(`document.getElementById("act1-bubble").textContent.trim()`);
    if (!act1Bubble.includes('直徑')) throw new Error('活動一直徑切換失敗: ' + act1Bubble);
    console.log('PASS 活動一（直徑）：解說正確');

    // 3. 活動二：旋轉指針角度與對向半徑
    await evaluate(`switchAct(2)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`setPointerAngle(120)`);
    await new Promise((r) => setTimeout(r, 150));
    let angleTag = await evaluate(`document.getElementById("c2-angle-tag").textContent.trim()`);
    if (!angleTag.includes('120°') || !angleTag.includes('5 cm')) throw new Error('活動二旋轉指針失敗: ' + angleTag);
    console.log('PASS 活動二（旋轉120°）：長度依然是 5 cm');

    await evaluate(`toggleOpposite()`);
    await new Promise((r) => setTimeout(r, 150));
    let act2Bubble = await evaluate(`document.getElementById("act2-bubble").textContent.trim()`);
    if (!act2Bubble.includes('10cm')) throw new Error('活動二對向半徑失敗: ' + act2Bubble);
    console.log('PASS 活動二（對向半徑）：半徑 5cm ＋ 半徑 5cm ＝ 直徑 10cm');

    // 4. 活動三：圓規張開與畫圓動畫
    await evaluate(`switchAct(3)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`setCompassOpening(5)`);
    await new Promise((r) => setTimeout(r, 150));
    let act3Stat = await evaluate(`document.getElementById("act3-stat").textContent.trim()`);
    if (!act3Stat.includes('5 cm')) throw new Error('活動三張開距離失敗: ' + act3Stat);
    console.log('PASS 活動三（張開 5 cm）：半徑 r = 5 cm 同步成功');

    await evaluate(`drawCircle()`);
    await new Promise((r) => setTimeout(r, 2600)); // 90 步 × 22ms ≈ 2s 動畫
    let act3Bubble = await evaluate(`document.getElementById("act3-bubble").textContent.trim()`);
    if (!act3Bubble.includes('直徑') || !act3Bubble.includes('10')) throw new Error('活動三畫圓完成回饋失敗: ' + act3Bubble);
    console.log('PASS 活動三（畫圓完成）：半徑 5 公分 / 直徑 10 公分');

    // 5. 活動四：直徑小偵探
    await evaluate(`switchAct(4)`);
    await new Promise((r) => setTimeout(r, 150));
    await evaluate(`pickLine('A')`);
    await new Promise((r) => setTimeout(r, 150));
    let act4Bubble = await evaluate(`document.getElementById("act4-bubble").textContent.trim()`);
    if (!act4Bubble.includes('沒有通過圓心')) throw new Error('活動四線A反饋失敗: ' + act4Bubble);
    console.log('PASS 活動四（線A ✗）：弦缺「通過圓心」條件');

    await evaluate(`pickLine('C')`);
    await new Promise((r) => setTimeout(r, 150));
    act4Bubble = await evaluate(`document.getElementById("act4-bubble").textContent.trim()`);
    if (!act4Bubble.includes('答對了')) throw new Error('活動四線C反饋失敗: ' + act4Bubble);
    console.log('PASS 活動四（線C ✓）：真直徑 10cm 圓內最長線段');

    // 6. 頁面高度檢測（概念小教室緊湊性）
    const pageH = await evaluate(`document.documentElement.scrollHeight`);
    console.log(`INFO 頁面總高度（活動四狀態）: ${pageH}px`);

    if (consoleErrors.length > 0) throw new Error('Console 錯誤: ' + consoleErrors.join('; '));
    console.log('PASS Console 錯誤數 = 0');

    close();
    cleanup();
    console.log('CIRCLE_CONCEPT_LAB_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
