/**
 * tools/verify_g3_showcase.js — 三年級日系繪本打樣 Showcase v2 機械化 CDP 驗收閘門
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
const httpPort = 9535;
const cdpPort = 9536;

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let fp = path.join(process.cwd(), req.url.split('?')[0].replace(/^\//, ''));
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buf);
      });
    });
    server.listen(httpPort, () => resolve(server));
  });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('open', () => resolve({ send, on }));
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
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }
    function on(fn) { listeners.push(fn); }
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTarget(port, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((x) => x.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (_e) {}
    await sleep(250);
  }
  throw new Error('等待 CDP target 逾時');
}

async function main() {
  console.log('🚀 開始執行 G3 Showcase v2 日系繪本 CDP 實機驗收...');
  const server = await startServer();
  const chromePath = findChrome();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g3-showcase-v2-'));
  const pageUrl = `http://127.0.0.1:${httpPort}/reports/g3_visual_samples_showcase.html`;

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    '--window-size=1200,900',
    pageUrl
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(cdpPort, 15000);
    const ws = await connect(target.webSocketDebuggerUrl);

    await ws.send('Page.enable');
    await ws.send('Runtime.enable');

    const evalExp = async (expression) => {
      const res = await ws.send('Runtime.evaluate', { expression, returnByValue: true });
      return res.result ? res.result.value : null;
    };

    // 測試 1: 360px 與 390px 視口寬度與零溢出檢驗
    console.log('📱 正在檢測 360px 手機視口零溢出...');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 800,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(500);

    const w360 = await evalExp('window.innerWidth');
    const sw360 = await evalExp('document.body.scrollWidth');
    console.log(`  360px 測試結果: innerWidth=${w360}, scrollWidth=${sw360}`);
    if (sw360 > w360) {
      throw new Error(`[FAIL] 360px 視口水平溢出！scrollWidth (${sw360}) > innerWidth (${w360})`);
    }

    console.log('📱 正在檢測 390px (iPhone) 視口零溢出...');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });
    await sleep(500);

    const w390 = await evalExp('window.innerWidth');
    const sw390 = await evalExp('document.body.scrollWidth');
    console.log(`  390px 測試結果: innerWidth=${w390}, scrollWidth=${sw390}`);
    if (sw390 > w390) {
      throw new Error(`[FAIL] 390px 視口水平溢出！scrollWidth (${sw390}) > innerWidth (${w390})`);
    }

    // 測試 2: Tab 1 蒸氣小火車跳數互動
    console.log('🚂 正在測試【日系繪本跳數小火車】...');
    await evalExp('document.getElementById("trainModeA").click()');
    await sleep(300);
    const segCountA = await evalExp('document.querySelectorAll("#trainCarriages .carriage").length');
    console.log(`  模式 A 車廂節數: ${segCountA} (預期 7 節)`);
    if (segCountA !== 7) throw new Error('[FAIL] 模式 A 應有 7 節車廂！');

    await evalExp('document.getElementById("startTrain").click()');
    await sleep(600);
    const expVis = await evalExp('document.getElementById("trainExplanation").style.display !== "none"');
    console.log(`  跳數破招卡片彈出: ${expVis}`);

    // 測試 3: Tab 2 卡牌桌遊盤 (最大最小雙槽對照)
    console.log('🃏 正在測試【立體卡牌桌遊盤】...');
    await evalExp('document.querySelectorAll(".tab-button")[1].click()');
    await sleep(300);

    await evalExp('document.getElementById("arrangeMax").click()');
    await sleep(200);
    const maxVal = await evalExp('Array.from(document.querySelectorAll("#maxNumberSlots .card-slot")).map(s=>s.innerText).join("")');
    console.log(`  最大四位數槽: ${maxVal} (預期 8720)`);
    if (maxVal !== '8720') throw new Error(`[FAIL] 最大四位數應為 8720，實際為 ${maxVal}`);

    await evalExp('document.getElementById("arrangeMin").click()');
    await sleep(200);
    const minVal = await evalExp('Array.from(document.querySelectorAll("#minNumberSlots .card-slot")).map(s=>s.innerText).join("")');
    console.log(`  最小四位數槽: ${minVal} (預期 2078)`);
    if (minVal !== '2078') throw new Error(`[FAIL] 最小四位數應為 2078，實際為 ${minVal}`);

    // 測試 4: Tab 3 四艙位值收納台
    console.log('📦 正在測試【四艙位值收納台】...');
    await evalExp('document.querySelectorAll(".tab-button")[2].click()');
    await sleep(300);
    const vaultCompartments = await evalExp('document.querySelectorAll(".vault-box").length');
    console.log(`  位值艙數量: ${vaultCompartments} (預期 4 個)`);
    if (vaultCompartments !== 4) throw new Error('[FAIL] 位值艙必須有 4 個！');

    console.log('🎉 G3 Showcase v2 日系繪本版實機驗收全部 PASS！Exit 0！');
    process.exitCode = 0;
  } catch (err) {
    console.error('❌ 驗收失敗:', err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
}

main();
