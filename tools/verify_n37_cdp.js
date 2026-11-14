/**
 * tools/verify_n37_cdp.js — G3-N-3-7 兩步驟應用問題教具 CDP 實機驗證（390px 手機視口）
 * 驗證：two_step_problem_lab.html?q=1~10 全題渲染、逐步算理演繹（10 種視覺模式推進）、
 *       答題即時回饋、390px 視口單屏（app 高度 ≤ 420、零橫向溢出）、console 零錯誤。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n37_cdp.js [--port=9367]
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
  return a ? Number(a.split('=')[1]) : 9367;
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

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}

// 每題算理演繹完成後，SVG 內必須揭示的關鍵 token（數字或字串）
const revealTokens = [
  ['240 枝'], ['每人分到 9 顆'], ['250 － 209 ＝ 41'], ['40 × 4 ＝ 160'], ['104 ÷ 4 ＝ 26'],
  ['32 × 2 ＝ 64'], ['36 ÷ 6 ＝ 6'], ['20 － 18 ＝ 2'], ['900 ÷ 6 ＝ 150'], ['100 × 3 ＝ 300']
];

async function main() {
  const unit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G3/N-3-7.json'), 'utf8'));
  const htmlPath = path.join(process.cwd(), 'app/components/two_step_problem_lab.html');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n37-cdp-'));
  const chrome = findChrome();
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });

  let ws;
  const consoleErrors = [];
  try {
    const target = await waitForTarget(argsPort, 20000);
    ws = await connect(target.webSocketDebuggerUrl);
    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push('[console.error] ' + msg.params.args.map((a) => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push('[exception] ' + (msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text));
      }
    });
    await ws.send('Runtime.enable');
    // 390px 手機視口模擬
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    for (const q of unit.questions) {
      const qn = Number(q.component_path.split('q=')[1]);
      const url = pathToFileURL(htmlPath).href + `?q=${qn}`;
      await ws.send('Page.enable');
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const snap = await ws.send('Runtime.evaluate', {
        expression: `(() => ({
          qText: document.getElementById('qText').innerText,
          nodes: document.querySelectorAll('#drawLayer *').length,
          cap: document.getElementById('stepCap').innerText,
          appH: Math.round(document.getElementById('app').getBoundingClientRect().height),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          opts: document.querySelectorAll('.opt-btn').length
        }))()`,
        returnByValue: true
      });
      const s = snap.result.value;
      if (!s.qText || s.qText === '載入中...') fail(`Q${qn} 題幹未渲染`);
      if (s.nodes < 5) fail(`Q${qn} 教具 SVG 未渲染（節點數 ${s.nodes}）`);
      if (s.opts < 3) fail(`Q${qn} 選項按鈕不足（${s.opts} 個）`);
      if (s.overflowX) fail(`Q${qn} 390px 視口橫向溢出`);
      if (s.appH > 420) fail(`Q${qn} app 高度 ${s.appH}px 超過單屏上限 420px`);
      console.log(`PASS: Q${qn} 渲染 OK（app 高度 ${s.appH}px，選項 ${s.opts} 個，零溢出）`);

      // 逐步算理演繹：連按至最終步，檢核步驟說明推進與最終揭示
      const total = await ws.send('Runtime.evaluate', {
        expression: `totalSteps()`, returnByValue: true
      });
      const caps = [];
      for (let i = 0; i < total.result.value; i++) {
        await ws.send('Runtime.evaluate', { expression: `nextStep()` });
        await sleep(80);
        const c = await ws.send('Runtime.evaluate', {
          expression: `document.getElementById('stepCap').innerText`, returnByValue: true
        });
        caps.push(c.result.value);
      }
      if (caps.some(c => !c || c.includes('按「一步一步看算理」'))) fail(`Q${qn} 算理步驟說明未逐推進（${caps.join(' | ')}）`);
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
          const btn = [...document.querySelectorAll('.opt-btn')].find(b => b.innerText === ${correct});
          if (!btn) return { found: false };
          btn.click();
          checkAnswer();
          const fb = document.getElementById('feedback');
          return { found: true, cls: fb.className, txt: fb.innerText };
        })()`,
        returnByValue: true
      });
      const a = ansCheck.result.value;
      if (!a.found) fail(`Q${qn} 找不到正解選項按鈕（${q.answer_raw}）`);
      if (!a.cls.includes('success')) fail(`Q${qn} 正解未觸發綠色成功回饋（class=${a.cls}）`);
      console.log(`PASS: Q${qn} 答題回饋 OK（${a.txt}）`);
    }

    if (consoleErrors.length > 0) {
      fail(`瀏覽器 console 有 ${consoleErrors.length} 個錯誤：\n` + consoleErrors.slice(0, 10).join('\n'));
    }
    console.log('N37_CDP_VERIFIED — ALL PASS');
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 已關閉 */ }
    try { proc.kill(); } catch (e) { /* 已關閉 */ }
  }
}

main().catch((e) => {
  console.error('FAIL: ' + e.message);
  process.exit(1);
});
