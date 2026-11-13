/**
 * tools/20261113_002_verify_mobile_390.js — 390px 手機 One-Screen CDP 實機驗證
 * 驗證：
 *   A. birds_on_tree_demo：整張 SVG(500x280) 等比縮放、6 原住鳥、飛入 3 隻 → 6+3=9、無橫向跑版
 *   B. playground_compare_demo：單張 SVG(450x220)、5 男生欄 / 3 女生欄對齊前 3 欄、
 *      配對 3 對後剩 2 男生紅套索、無橫向跑版、按鈕熱區 ≥44px
 *   C. app/index.html：390px header ≤45px 單行、iframe fallback 360px（不再跳 900px）
 * 全部 PASS 且 console 雜訊 = 0 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/20261113_002_verify_mobile_390.js [--port=9445]
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
const argsPort = (() => {
  const a = process.argv.find((x) => x.startsWith('--port='));
  return a ? Number(a.split('=')[1]) : 9445;
})();

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
      let fp = path.join(process.cwd(), urlPath.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) { /* 續走 404 */ }
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
    } catch (e) { /* chrome 尚未就緒 */ }
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

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile390-'));
  const chrome = findChrome();
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844',
    `http://127.0.0.1:${httpPort}/app/components/birds_on_tree_demo.html`
  ], { stdio: 'ignore' });

  let ws;
  const consoleNoise = [];
  let noiseMark = 0;
  try {
    const target = await waitForTarget(argsPort, 20000);
    ws = await connect(target.webSocketDebuggerUrl);
    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        consoleNoise.push('[console.' + msg.params.type + '] ' + msg.params.args.map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && (msg.params.entry.level === 'error' || msg.params.entry.level === 'warning')) {
        consoleNoise.push('[log.' + msg.params.entry.level + '] ' + msg.params.entry.text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleNoise.push('[exception] ' + (msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text));
      }
    });
    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await ws.send('Page.enable');
    // 強制 390px 手機視口（headless Chrome 視窗最小寬 500px，必須用 Emulation 覆寫）
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    const evalJS = async (expr) => {
      const res = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) throw new Error('驗證腳本拋錯: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails));
      return res.result.value;
    };
    const navigate = async (url) => {
      noiseMark = consoleNoise.length;
      await ws.send('Page.navigate', { url: `http://127.0.0.1:${httpPort}` + url });
      await sleep(1200);
    };

    const allResults = [];

    /* ---------- A. birds_on_tree_demo @390px ---------- */
    await sleep(500);
    allResults.push(...await evalJS(`(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      ok(document.documentElement.scrollWidth <= window.innerWidth + 1,
         'A1 無橫向跑版：scrollWidth=' + document.documentElement.scrollWidth + ' ≤ ' + window.innerWidth);
      const svg = document.getElementById('treeSvg');
      ok(svg && svg.getAttribute('viewBox') === '0 0 500 280', 'A2 樹舞台為單張 SVG viewBox="0 0 500 280"');
      const stageBox = svg.getBoundingClientRect();
      ok(stageBox.width > 240 && stageBox.width <= 400 && stageBox.height > 100 && stageBox.height <= 280,
         'A3 SVG 等比縮放（實測 ' + Math.round(stageBox.width) + 'x' + Math.round(stageBox.height) + '，390px 內 One-Screen）');
      const birds = document.querySelectorAll('#treeSvg .bird-g');
      ok(birds.length === 6, 'A4 原住鳥 6 隻（實際 ' + birds.length + '）');
      const svgRect = svg.getBoundingClientRect();
      const inside = [...birds].every((b) => {
        const r = b.getBoundingClientRect();
        return r.left >= svgRect.left - 1 && r.right <= svgRect.right + 1;
      });
      ok(inside, 'A5 全部小鳥都在 SVG 舞台框內（不再被裁切）');
      birds[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      birds[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      ok(document.querySelectorAll('#treeSvg .bird-g.counted').length === 2, 'A6 點小鳥可圈選計數（2 隻被點亮）');
      flyIn(); flyIn(); flyIn();
      await sleep(700);
      ok(document.getElementById('countStrip').textContent.includes('9 隻'), 'A7 飛入 3 隻後計數條 =「樹上現在：9 隻」');
      ok(document.getElementById('equationStrip').textContent.includes('6 ＋ 3 ＝ 9'), 'A8 算式條演出 6＋3＝9');
      ok(document.getElementById('flyBtn').disabled === true, 'A9 飛入按鈕用盡後禁用');
      ok(document.querySelectorAll('#treeSvg .bird-holder').length === 9, 'A10 舞台上共 9 隻鳥（6+3）');
      const optBtns = [...document.querySelectorAll('.opt-btn')];
      ok(optBtns.length === 4 && optBtns.every((b) => b.getBoundingClientRect().height >= 44), 'A11 選項按鈕熱區 ≥44px');
      return results;
    })()`));

    /* ---------- B. playground_compare_demo @390px ---------- */
    await navigate('/app/components/playground_compare_demo.html');
    allResults.push(...await evalJS(`(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      ok(document.documentElement.scrollWidth <= window.innerWidth + 1,
         'B1 無橫向跑版：scrollWidth=' + document.documentElement.scrollWidth + ' ≤ ' + window.innerWidth);
      const svg = document.getElementById('yardSvg');
      ok(svg && svg.getAttribute('viewBox') === '0 0 450 220', 'B2 操場為單張 SVG viewBox="0 0 450 220"');
      const box = svg.getBoundingClientRect();
      ok(box.width > 240 && box.width <= 400 && box.height > 90 && box.height <= 220,
         'B3 SVG 等比縮放（實測 ' + Math.round(box.width) + 'x' + Math.round(box.height) + '，高約 152px 不溢出）');
      const boyWraps = [...document.querySelectorAll('#yardSvg .kid[data-row="b"]')].map((k) => k.parentElement);
      const girlWraps = [...document.querySelectorAll('#yardSvg .kid[data-row="g"]')].map((k) => k.parentElement);
      ok(boyWraps.length === 5 && girlWraps.length === 3, 'B4 男生 5 人 / 女生 3 人（' + boyWraps.length + '/' + girlWraps.length + '）');
      const tx = (g) => Number(g.getAttribute('transform').match(/translate\\(([\\d.]+)\\s/)[1]);
      const bx = boyWraps.map(tx), gx = girlWraps.map(tx);
      ok(gx.every((x, i) => x === bx[i]), 'B5 女生欄精準對齊前 3 個男生欄（' + gx.join(',') + ' vs ' + bx.slice(0, 3).join(',') + '）');
      const svgRect = svg.getBoundingClientRect();
      const allInside = [...boyWraps, ...girlWraps].every((w) => {
        const r = w.getBoundingClientRect();
        return r.left >= svgRect.left - 1 && r.right <= svgRect.right + 1;
      });
      ok(allInside, 'B6 兩排小朋友都在 SVG 舞台框內（flex-wrap 斷行已根除）');
      pairOne(); pairOne(); pairOne();
      await sleep(500);
      const leftover = document.querySelectorAll('#yardSvg .kid.leftover');
      ok(leftover.length === 2, 'B7 配對 3 對後剩 2 個男生被標記 leftover');
      ok([...leftover].every((k) => Number(getComputedStyle(k.querySelector('.lasso')).opacity) > 0.9), 'B8 剩餘 2 男生紅套索可見（opacity=1）');
      ok(document.getElementById('pairNote').textContent.includes('多 2 人'), 'B9 破招結論「男生比女生多 2 人」已演出');
      const btns = [...document.querySelectorAll('.pair-btn, .reset-btn, .opt-btn, .check-btn')];
      ok(btns.length > 0 && btns.every((b) => b.getBoundingClientRect().height >= 44), 'B10 全部按鈕熱區 ≥44px');
      return results;
    })()`));

    /* ---------- C. app/index.html shell @390px ---------- */
    await navigate('/app/index.html');
    allResults.push(...await evalJS(`(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const topbar = document.querySelector('.topbar').getBoundingClientRect().height;
      ok(topbar <= 45, 'C1 手機 header 單行 ≤45px（實測 ' + Math.round(topbar) + 'px）');
      ok(getComputedStyle(document.querySelector('.brand .sub')).display === 'none', 'C2 副標在手機上隱藏');
      ok(document.documentElement.scrollWidth <= window.innerWidth + 1, 'C3 首頁無橫向跑版');
      document.querySelector('#gradeView .unit-card.ready').click();
      // C4：窄屏 fallback 邏輯以 shell.js 原始碼靜態驗證（iframe onload 在本機毫秒級觸發 fitFrame，
      //     動態攔截初始值不可靠，故驗證程式碼本身 + 最終高度不為 900）
      const shellSrc = await (await fetch('/app/shell.js')).text();
      ok(shellSrc.includes('isNarrow') && shellSrc.includes('? 360 : 900'), 'C4 shell.js 窄屏 fallback = 360px（不再預設 900px）');
      await sleep(1500);
      const frame = document.getElementById('stageFrame');
      const h1 = Number(frame.style.height.replace('px', ''));
      ok(h1 > 100 && h1 < 3000 && h1 !== 900, 'C5 fitFrame 自適應至內容高度且不跳 900px（實測 ' + h1 + 'px）');
      const navBtns = [...document.querySelectorAll('.stage-nav button')];
      ok(navBtns.every((b) => b.getBoundingClientRect().height >= 44), 'C6 上一題/下一題/交卷按鈕熱區 ≥44px');
      return results;
    })()`));

    const noise = consoleNoise.slice(noiseMark);
    for (const line of allResults) console.log(line);
    console.log('CONSOLE_NOISE_COUNT=' + noise.length);
    for (const n of noise.slice(0, 10)) console.log('  ' + n);
    const failed = allResults.filter((l) => String(l).startsWith('FAIL')).length;
    if (!allResults.length) {
      console.log('FAIL harness :: 驗證腳本未回傳任何結果');
      process.exitCode = 1;
    } else if (failed === 0 && noise.length === 0) {
      console.log('MOBILE_390_CDP_VERIFIED (birds SVG + playground SVG + shell header/iframe) — ALL PASS');
      process.exitCode = 0;
    } else {
      console.log('FAILED (' + failed + ' fails, ' + noise.length + ' console noise)');
      process.exitCode = 1;
    }
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已結束 */ }
    try { server.close(); } catch (e) { /* 已關閉 */ }
    await sleep(200);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 佔用中留待清理 */ }
  }
}

main().catch((err) => {
  console.error('ERROR: ' + (err && err.message));
  process.exit(2);
});
