/**
 * tools/verify_concept_preview.js — 概念小教室打樣頁面 CDP 實機驗證（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：390px 視口零橫向溢出、重量沙盒物品點擊/清空、容量小教室切換/倒水、秘笈小卡點選、Console 雜訊 = 0
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
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/concept_preview.html' : urlPath.replace(/^\//, ''));
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
    } catch (e) { }
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
  const cdpPort = 9488;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-concept-'));

  const { server, port: httpPort } = await startServer();
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
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

    await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/concept_preview.html` });
    await sleep(600);

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    // 1. 檢查有無橫向溢出
    const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    if (overflow) throw new Error('手機 390px 視口出現橫向溢出！');
    console.log('PASS 390px 視口零橫向溢出');

    // 2. 檢查初始重量
    const initWeight = await evaluate(`document.getElementById("meter-value-primary").textContent.trim()`);
    if (!initWeight.includes('0 公斤 0 公克')) throw new Error('初始重量未歸零: ' + initWeight);
    console.log(`PASS 初始重量狀態正確: ${initWeight}`);

    // 3. 點擊草莓 (index 0) 與 大書包 (index 5)
    await evaluate(`document.querySelectorAll(".item-btn")[0].click()`);
    await sleep(200);
    await evaluate(`document.querySelectorAll(".item-btn")[5].click()`);
    await sleep(200);

    const updatedWeight = await evaluate(`document.getElementById("meter-value-primary").textContent.trim()`);
    if (!updatedWeight.includes('1 公斤 820 公克')) throw new Error('重量累加不正確: ' + updatedWeight);
    console.log(`PASS 放上草莓與書包，即時計算正確: ${updatedWeight}`);

    // 4. 清空秤盤
    await evaluate(`document.querySelector(".btn-reset").click()`);
    await sleep(200);
    const resetWeight = await evaluate(`document.getElementById("meter-value-primary").textContent.trim()`);
    if (!resetWeight.includes('0 公斤 0 公克')) throw new Error('清空失敗: ' + resetWeight);
    console.log('PASS 清空秤盤正確');

    // 5. 切換至容量小教室
    await evaluate(`document.getElementById("tab-capacity").click()`);
    await sleep(300);
    const capTitle = await evaluate(`document.getElementById("story-title").textContent.trim()`);
    if (!capTitle.includes('魔法藥水')) throw new Error('切換容量單元失敗: ' + capTitle);
    console.log(`PASS 成功切換至容量小教室: ${capTitle}`);

    // 6. 點擊養樂多 (index 2) 與 大鮮奶 (index 6)
    await evaluate(`document.querySelectorAll(".item-btn")[2].click()`);
    await sleep(200);
    await evaluate(`document.querySelectorAll(".item-btn")[6].click()`);
    await sleep(200);

    const capValue = await evaluate(`document.getElementById("meter-value-primary").textContent.trim()`);
    if (!capValue.includes('1 公升 100 毫升')) throw new Error('容量計算不正確: ' + capValue);
    console.log(`PASS 倒進養樂多與大鮮奶，容量計算正確: ${capValue}`);

    // 7. 點選秘笈小卡 2
    await evaluate(`document.getElementById("dot-1").click()`);
    await sleep(200);
    const cardTitle = await evaluate(`document.querySelector(".flashcard div[style*='font-size: 14px']").textContent.trim()`);
    if (!cardTitle.includes('量杯平視法')) throw new Error('秘笈小卡切換失敗: ' + cardTitle);
    console.log(`PASS 秘笈小卡切換正確: ${cardTitle}`);

    // 8. 檢查 Console 報錯
    if (consoleErrors.length > 0) {
      throw new Error('發現 Console 錯誤: ' + consoleErrors.join('; '));
    }
    console.log('PASS Console 錯誤數 = 0 (Console noise = 0)');

    // 9. 拍攝全頁手機截圖
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const ssPath = path.resolve(__dirname, '../reports/screenshots/concept_preview_mobile.png');
    fs.mkdirSync(path.dirname(ssPath), { recursive: true });
    fs.writeFileSync(ssPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`PASS 手機實機截圖已儲存至: reports/screenshots/concept_preview_mobile.png`);

    close();
    cleanup();
    console.log('CONCEPT_PREVIEW_CDP_VERIFIED — ALL PASS (Exit 0)');
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
