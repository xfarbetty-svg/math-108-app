/**
 * tools/verify_g2_concept_labs.js - G2 概念探索實驗室 CDP 自動化驗證骨架
 * 驗證核心指標：
 *   1. 390px 手機視口零橫向溢出 (scrollWidth <= 390)
 *   2. Console 0 報錯 (consoleAPICalled error + exceptionThrown)
 *   3. 四幕切換有效性 (依序點擊 .act-btn，panel 切換 active)
 *   4. 音訊接口完備 (typeof window.AudioManager === 'object')
 * 用法：
 *   node tools/verify_g2_concept_labs.js --unit g2_template_lab.html
 *   node tools/verify_g2_concept_labs.js            (掃描 app/components/ 全部 g2_*.html)
 * 通過輸出 [PASS] 並 exit 0；任何異常輸出 [FAIL] 並 exit 1。
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
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

/* --unit 參數解析：指定單檔或省略掃描全部 g2_*.html */
function resolveUnits() {
  const argIdx = process.argv.indexOf('--unit');
  let arg = argIdx !== -1 ? process.argv[argIdx + 1] : null;
  const compDir = path.join(process.cwd(), 'app', 'components');
  const all = fs.readdirSync(compDir).filter((f) => /^g2_.*\.html$/.test(f)).sort();
  if (!arg) {
    if (all.length === 0) throw new Error('app/components/ 下找不到任何 g2_*.html');
    return all;
  }
  /* 支援檔名或 unit code 兩種寫法 */
  const hit = all.find((f) => f === arg || f === arg + '.html' || f.startsWith(arg + '_') || f === arg.replace(/\.html$/, '') + '.html');
  if (hit) return [hit];
  throw new Error(`--unit "${arg}" 在 app/components/ 找不到對應 g2_*.html`);
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let fp = path.join(process.cwd(), req.url.replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) {}
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();
        const mime = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';
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
    const eventHandlers = new Map();

    ws.onopen = () => resolve({ send, on, close: () => ws.close() });
    ws.onerror = reject;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method && eventHandlers.has(msg.method)) {
        for (const handler of eventHandlers.get(msg.method)) handler(msg.params);
      }
    };

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function on(method, fn) {
      if (!eventHandlers.has(method)) eventHandlers.set(method, []);
      eventHandlers.get(method).push(fn);
    }
  });
}

const results = [];
function report(unit, checks) {
  results.push({ unit, checks });
}

async function main() {
  const units = resolveUnits();
  const chromePath = findChrome();
  const cdpPort = 9222 + Math.floor(Math.random() * 200);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-g2-labs-'));
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
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  };

  try {
    const target = await waitForTarget(cdpPort, 8000);
    const { send, on, close } = await connect(target.webSocketDebuggerUrl);

    /* Console 錯誤收集：error 型 console API + 未捕捉例外 */
    let consoleErrors = [];
    on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const text = params.args.map((a) => (a.value !== undefined ? a.value : a.description)).join(' ');
        consoleErrors.push(text);
      }
    });
    on('Runtime.exceptionThrown', (params) => {
      const d = params.exceptionDetails;
      consoleErrors.push(d.text || (d.exception && d.exception.description) || 'unknown exception');
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      console.log(`\n=== [${i + 1}/${units.length}] 檢驗 G2 概念實驗室 (${unit}) ===`);
      consoleErrors = [];

      await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/${unit}` });
      await new Promise((r) => setTimeout(r, 700));

      /* 指標 1：390px 視口零橫向溢出 */
      const scrollW = await evaluate('document.documentElement.scrollWidth');
      if (scrollW > 390) throw new Error(`${unit} 390px 視口橫向溢出：scrollWidth=${scrollW}`);
      console.log(`[PASS] 390px 視口零橫向溢出 (scrollWidth=${scrollW})`);

      /* 指標 4（前置檢查）：音訊接口完備 */
      const audioType = await evaluate(`typeof window.AudioManager`);
      if (audioType !== 'object') throw new Error(`${unit} window.AudioManager 未載入 (typeof=${audioType})`);
      const hasPlay = await evaluate(`typeof window.AudioManager.play === 'function'`);
      if (!hasPlay) throw new Error(`${unit} window.AudioManager.play 不存在`);
      console.log(`[PASS] 音訊接口完備 (AudioManager.play 可呼叫)`);

      /* 指標 2：四幕切換有效性 — 真實點擊 .act-btn 而非直呼 switchAct */
      const btnCount = await evaluate(`document.querySelectorAll('.act-btn').length`);
      if (btnCount < 4) throw new Error(`${unit} .act-btn 數量不足 (${btnCount} < 4)`);
      for (let act = 1; act <= 4; act++) {
        /* 先回 Act 1 確保切換是「真實發生」的 */
        await evaluate(`document.querySelectorAll('.act-btn')[0].click()`);
        await new Promise((r) => setTimeout(r, 60));
        await evaluate(`document.querySelectorAll('.act-btn')[${act - 1}].click()`);
        await new Promise((r) => setTimeout(r, 120));
        const tabActive = await evaluate(`document.getElementById("tab-act${act}").classList.contains("active")`);
        const panelVisible = await evaluate(`
          !document.getElementById("act-${act}-view").classList.contains("hidden") &&
          document.getElementById("act-${act}-view").offsetParent !== null
        `);
        const othersHidden = await evaluate(`
          [1,2,3,4].filter(n => n !== ${act}).every(n =>
            document.getElementById("act-" + n + "-view").classList.contains("hidden"))
        `);
        if (!tabActive || !panelVisible || !othersHidden) {
          throw new Error(`${unit} Act ${act} 切換失敗 (tabActive=${tabActive}, panelVisible=${panelVisible}, othersHidden=${othersHidden})`);
        }
        console.log(`[PASS] Act ${act} 切換有效`);
      }

      /* 教具高度硬閘：逐幕切換至可見狀態後實測 stage 高度（隱藏 panel rect 恆為 0，不可信） */
      const maxStage = await evaluate(`
        (async () => {
          let max = 0;
          for (let n = 1; n <= 4; n++) {
            document.querySelectorAll('.act-btn')[n - 1].click();
            await new Promise(r => setTimeout(r, 80));
            document.querySelectorAll("#act-" + n + "-view .stage").forEach(s => {
              max = Math.max(max, s.getBoundingClientRect().height);
            });
          }
          document.querySelectorAll('.act-btn')[0].click();
          await new Promise(r => setTimeout(r, 80));
          return max;
        })()
      `);
      if (maxStage > 420) throw new Error(`${unit} 教具高度超標：${maxStage.toFixed(1)}px > 420px`);
      console.log(`[PASS] 教具高度閘門 (max stage=${maxStage ? maxStage.toFixed(0) : 0}px <= 420px)`);

      /* 指標 3：Console 0 報錯 */
      if (consoleErrors.length > 0) throw new Error(`${unit} Console 錯誤 ${consoleErrors.length} 筆: ` + consoleErrors.join('; '));
      console.log(`[PASS] Console 0 報錯`);

      report(unit, { overflow: false, audio: true, acts: 4, stage: maxStage, consoleErrors: 0 });
    }

    close();
    cleanup();
    console.log(`\n========================================`);
    console.log(`G2 CONCEPT LABS VERIFIED — ALL PASS (Exit 0)`);
    console.log(`已驗證 ${results.length} 套：${results.map((r) => r.unit).join(', ')}`);
    console.log(`========================================`);
    process.exit(0);
  } catch (err) {
    console.error(`[FAIL]`, err.message);
    cleanup();
    process.exit(1);
  }
}

main();
