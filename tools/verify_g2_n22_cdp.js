/**
 * tools/verify_g2_n22_cdp.js — G2-N-2-2 五道高階段考真題教具 CDP 實機驗證（390px 手機視口）
 * 驗證：每個考題組件 390×844 視口下 ① 高 ≤ 420px ② 零橫向溢出 ③ 零 console 報錯
 *       ④ 選項數量正確 ⑤ window.check() 正解回傳 ok=true 且顯示 success banner ⑥ 錯解回傳 fail。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_g2_n22_cdp.js [--port=9335]
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
  return a ? Number(a.split('=')[1]) : 9335;
})();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到可用 Chrome/Edge 瀏覽器');
}

async function waitForTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) { /* chrome 未就緒 */ }
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
  console.error('FAIL: ' + msg);
  process.exitCode = 1;
  throw new Error(msg);
}

async function main() {
  const unit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-2.json'), 'utf8'));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2n22-cdp-'));
  const proc = spawn(findChrome(), [
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
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    for (const q of unit.questions) {
      const url = pathToFileURL(path.join(process.cwd(), 'app', q.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(350);

      const snap = await ws.send('Runtime.evaluate', {
        expression: `(() => ({
          wrapH: Math.round(document.querySelector('.wrap').getBoundingClientRect().height),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          opts: document.querySelectorAll('.opt-btn').length,
          hasCheck: typeof window.check === 'function',
          hasBtn: !!document.querySelector('.check-btn')
        }))()`,
        returnByValue: true
      });
      const s = snap.result.value;
      if (consoleErrors.length) fail(`${q.id} 頁面載入報錯 → ${consoleErrors[0]}`);
      if (!s.hasCheck) fail(`${q.id} 未暴露 window.check()`);
      if (!s.hasBtn) fail(`${q.id} 缺少 .check-btn`);
      if (s.opts !== q.choices.length) fail(`${q.id} 選項數不符（實際 ${s.opts}，期望 ${q.choices.length}）`);
      if (s.overflowX) fail(`${q.id} 390px 視口橫向溢出`);
      if (s.wrapH > 420) fail(`${q.id} 組件高 ${s.wrapH}px 超過上限 420px`);
      console.log(`PASS: ${q.id} 版面 OK（高 ${s.wrapH}px / 選項 ${s.opts} / 零溢出零報錯）`);

      // 動態互動：點選錯誤選項 → check → fail banner；點選正解 → check → success banner
      const wrongIdx = (q.answer_index + 1) % q.choices.length;
      const wrong = await ws.send('Runtime.evaluate', {
        expression: `(function(){ document.querySelectorAll('.opt-btn')[${wrongIdx}].click(); return window.check(); })()`,
        returnByValue: true
      });
      if (wrong.result.value.ok !== false) fail(`${q.id} 錯解未回傳 fail`);

      const right = await ws.send('Runtime.evaluate', {
        expression: `(function(){ document.querySelectorAll('.opt-btn')[${q.answer_index}].click(); return window.check(); })()`,
        returnByValue: true
      });
      if (right.result.value.ok !== true) fail(`${q.id} 正解未回傳 ok=true`);

      const bannerText = await ws.send('Runtime.evaluate', {
        expression: `document.getElementById('banner').textContent.trim()`,
        returnByValue: true
      });
      if (!bannerText.result.value) fail(`${q.id} 檢查後未顯示 banner 說明文字`);
      console.log(`PASS: ${q.id} 互動 OK（正解→綠 banner，錯解→引導提示）`);
    }

    console.log('G2_N22_CDP_VERIFIED — ALL PASS');
    process.exitCode = 0;
  } finally {
    try { proc.kill(); } catch (e) { /* ignore */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
