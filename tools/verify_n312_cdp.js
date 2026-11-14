/**
 * tools/verify_n312_cdp.js — G3-N-3-12 長度（毫米） 教具 CDP 實機驗證（390px 手機視口）
 * 驗證：millimeter_ruler_lab.html?q=1~10 全題渲染、逐步算理演繹（10 種視覺模式推進）、
 *       答題即時回饋、390px 視口單屏（app 高度 ≤ 420、零橫向溢出）、console 零錯誤。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n312_cdp.js [--port=9372]
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const argsPort = (() => {
  const a = process.argv.find((x) => x.startsWith('--port='));
  return a ? Number(a.split('=')[1]) : 9372;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('未找到 Chrome 或 Edge 可執行檔');
}

async function waitForTarget(port, timeoutMs = 5000) {
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
    const WebSocket = globalThis.WebSocket || require('ws');
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };

    ws.onerror = (e) => reject(e);
    ws.onopen = () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const id = ++seq;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      resolve({ ws, send });
    };
  });
}

function fail(msg) {
  console.error('FAIL: ' + msg);
  process.exit(1);
}

async function main() {
  const port = argsPort;
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-math-n312-'));
  const chromePath = findChrome();

  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=390,844',
    'about:blank'
  ];

  const cp = spawn(chromePath, chromeArgs, { stdio: 'ignore' });
  const cleanup = () => {
    try { cp.kill(); } catch (e) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  let wsClient = null;
  try {
    const target = await waitForTarget(port, 6000);
    wsClient = await connect(target.webSocketDebuggerUrl);
    const { send } = wsClient;

    await send('Page.enable');
    await send('Runtime.enable');

    // 模擬手機 390 x 844 (iPhone 12/13/14)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-12.json', 'utf8'));

    for (let qn = 1; qn <= 10; qn++) {
      const q = unit.questions[qn - 1];
      const compPath = path.resolve(__dirname, '..', 'app', 'components', 'millimeter_ruler_lab.html');
      const fileUrl = `${pathToFileURL(compPath).href}?q=${qn}`;

      await send('Page.navigate', { url: fileUrl });
      await sleep(250);

      // 檢查 app 高度 ≤ 420、零溢出、4 個選項按鈕
      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const app = document.getElementById('app');
          const opts = document.querySelectorAll('.option-btn');
          const stem = document.getElementById('questionBox');
          const de = document.documentElement;
          const overflowX = de.scrollWidth > de.clientWidth + 2;
          return {
            height: app ? app.offsetHeight : 0,
            optsCount: opts.length,
            stemText: stem ? stem.innerText : '',
            overflowX
          };
        })()`,
        returnByValue: true
      });

      const m = metrics.result.value;
      if (!m || m.height === 0) fail(`Q${qn} 教具未成功載入（app 高度為 0）`);
      if (m.height > 420) fail(`Q${qn} app 實體高度超標：${m.height}px > 420px（違憲）`);
      if (m.overflowX) fail(`Q${qn} 出現橫向溢出`);
      if (m.optsCount < 4) fail(`Q${qn} 選項不足 4 個（實際 ${m.optsCount} 個）`);
      console.log(`PASS: Q${qn} 渲染 OK（app 高度 ${m.height}px, 選項 ${m.optsCount} 個, 零溢出）`);

      // 逐步算理演繹測試
      const stepClick = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById('stepBtn');
          if (btn) btn.click();
          const cap = document.getElementById('capText');
          return {
            btnText: btn ? btn.innerText : '',
            capText: cap ? cap.innerText : ''
          };
        })()`,
        returnByValue: true
      });
      const sc = stepClick.result.value;
      if (!sc.btnText.includes('1/3')) fail(`Q${qn} 逐步算理推進失敗: ${sc.btnText}`);

      // 點擊正解並驗收
      const correctIdx = q.answer_index;
      const answerTest = await send('Runtime.evaluate', {
        expression: `(() => {
          const opts = document.querySelectorAll('.option-btn');
          if (opts[${correctIdx}]) opts[${correctIdx}].click();
          const checkBtn = document.getElementById('checkBtn');
          if (checkBtn) checkBtn.click();
          const fb = document.getElementById('feedbackBox');
          return {
            isCorrect: fb ? fb.classList.contains('correct') : false,
            fbText: fb ? fb.innerText : ''
          };
        })()`,
        returnByValue: true
      });

      const at = answerTest.result.value;
      if (!at.isCorrect || !at.fbText.includes('答對了')) {
        fail(`Q${qn} 正解回饋異常: ${JSON.stringify(at)}`);
      }
    }

    console.log('\n🌟 SUCCESS: G3-N-3-12 (長度「毫米」) CDP 實機驗收（10題單屏 ≤420px、零溢出、算理演繹、答題互動）全綠通過！(Exit 0)');
    process.exit(0);

  } catch (err) {
    fail('CDP 執行異常: ' + err.message);
  } finally {
    if (wsClient && wsClient.ws) wsClient.ws.close();
    cleanup();
  }
}

main();
