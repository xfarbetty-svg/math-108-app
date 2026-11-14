/**
 * tools/verify_n310_cdp.js — G3-N-3-10 一位小數教具 CDP 實機驗證（390px 手機視口）
 * 驗證：decimal_place_lab.html?q=1~10 全題渲染、逐步算理演繹（10 種視覺模式推進）、
 *       答題即時回饋、390px 視口單屏（app 高度 ≤ 420、零橫向溢出）、console 零錯誤。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n310_cdp.js [--port=9370]
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
  return a ? Number(a.split('=')[1]) : 9370;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
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
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-math-n310-'));
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

  const proc = spawn(chromePath, chromeArgs, { stdio: 'ignore' });
  let ws;

  try {
    const target = await waitForTarget(port, 10000);
    const conn = await connect(target.webSocketDebuggerUrl);
    ws = conn;

    await ws.send('Page.enable');
    await ws.send('Runtime.enable');
    await ws.send('Log.enable');

    const consoleErrors = [];
    ws.ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          consoleErrors.push(JSON.stringify(msg.params.args));
        }
      } catch (e) { /* ignore parse error */ }
    });

    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-10.json', 'utf8'));
    const revealTokens = [
      ['十分位'],
      ['2.6'],
      ['6.3'],
      ['8'],
      ['1.7'],
      ['2.9'],
      ['4.8', '4.9'],
      ['0.7', '0.6', '＞'],
      ['2.5'],
      ['2.8', '2.2']
    ];

    for (let qn = 1; qn <= 10; qn++) {
      const q = unit.questions[qn - 1];
      const compPath = path.resolve(__dirname, '..', 'app', 'components', 'decimal_place_lab.html');
      const fileUrl = `${pathToFileURL(compPath).href}?q=${qn}`;

      await ws.send('Page.navigate', { url: fileUrl });
      await sleep(200);

      // 檢查 app 高度 ≤ 420、零溢出、4 個選項按鈕
      const metrics = await ws.send('Runtime.evaluate', {
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
      console.log(`PASS: Q${qn} 渲染 OK（app 高度 ${m.height}px，選項 ${m.optsCount} 個，零溢出）`);

      // 逐步算理演繹：推進各步並確認最終關鍵詞全部浮現
      const total = await ws.send('Runtime.evaluate', {
        expression: `QUESTIONS[currentQ - 1].total_steps`, returnByValue: true
      });
      const caps = [];
      for (let i = 0; i < total.result.value; i++) {
        await ws.send('Runtime.evaluate', { expression: `nextStep()` });
        await sleep(80);
        const c = await ws.send('Runtime.evaluate', {
          expression: `document.getElementById('capText').innerText`, returnByValue: true
        });
        caps.push(c.result.value);
      }
      if (caps.some(c => !c || c.includes('點擊「逐步算理」'))) fail(`Q${qn} 算理步驟說明未逐推進（${caps.join(' | ')}）`);
      const finalCheck = await ws.send('Runtime.evaluate', {
        expression: `document.getElementById('drawLayer').textContent`,
        returnByValue: true
      });
      const fc = finalCheck.result.value;
      const tokens = revealTokens[qn - 1] || [];
      const missing = tokens.filter(t => !fc.includes(t));
      if (missing.length > 0) fail(`Q${qn} 最終演繹未揭示關鍵結果（缺 ${missing.join('、')}）`);
      console.log(`PASS: Q${qn} 算理演繹 ${total.result.value} 步全揭示（揭示關鍵：${tokens.join(' + ')}）`);

      // 答題回饋：選正解 → 檢查答案 → 綠色成功橫幅
      const correct = JSON.stringify(q.answer_raw);
      const ansCheck = await ws.send('Runtime.evaluate', {
        expression: `(() => {
          const btn = [...document.querySelectorAll('.option-btn')].find(b => b.innerText.trim() === ${correct}.trim());
          if (!btn) return { found: false };
          btn.click();
          checkAnswer();
          const fb = document.getElementById('feedbackBox');
          return { found: true, cls: fb.className, txt: fb.innerText };
        })()`,
        returnByValue: true
      });
      const a = ansCheck.result.value;
      if (!a.found) fail(`Q${qn} 找不到正解選項按鈕（${q.answer_raw}）`);
      if (!a.cls.includes('correct')) fail(`Q${qn} 正解未觸發綠色成功回饋（class=${a.cls}）`);
      console.log(`PASS: Q${qn} 答題回饋 OK（${a.txt}）`);
    }

    if (consoleErrors.length > 0) {
      fail(`瀏覽器 console 有 ${consoleErrors.length} 個錯誤：\n` + consoleErrors.slice(0, 10).join('\n'));
    }
    console.log('N310_CDP_VERIFIED — ALL PASS');
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已關閉 */ }
  }
}

main().catch((e) => {
  console.error('FAIL: ' + e.message);
  process.exit(1);
});
