/**
 * tools/verify_g2_n211_n212_cdp.js
 * G2-N-2-11 & G2-N-2-12 雙單元 10 道段考真題教具 CDP 實機測量驗證（390px 手機視口）
 * 驗證：每個考題組件 390×844 視口下
 *   ① 高 ≤ 420px
 *   ② 零橫向溢出
 *   ③ 零 console 報錯
 *   ④ 選項數量正確 (4 個)
 *   ⑤ 防劇透審查：未作答前 #banner 為空且無劇透
 *   ⑥ window.check() 正解 ok=true，錯解 ok=false
 * 全部通過 → Exit 0；任一 FAIL → Exit 1
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
  return a ? Number(a.split('=')[1]) : 9347;
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
  const u1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-11.json'), 'utf8'));
  const u2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-12.json'), 'utf8'));
  const allQuestions = [...u1.questions, ...u2.questions];

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2n211-n212-cdp-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });

  let ws;
  let consoleErrors = [];
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

    for (const q of allQuestions) {
      consoleErrors = [];
      const url = pathToFileURL(path.join(process.cwd(), 'app', q.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(350);

      const snap = await ws.send('Runtime.evaluate', {
        expression: `(() => ({
          wrapH: Math.round(document.querySelector('.wrap').getBoundingClientRect().height),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          opts: document.querySelectorAll('.opt-btn').length,
          hasCheck: typeof window.check === 'function',
          hasBtn: !!document.querySelector('.check-btn'),
          hasQ: !!(window.__q && window.__q.id && (typeof window.__q.answer === 'number' || typeof window.__q.correct_index === 'number'))
        }))()`,
        returnByValue: true
      });
      const s = snap.result.value;
      if (consoleErrors.length) fail(`${q.id} 頁面載入報錯 → ${consoleErrors[0]}`);
      if (!s.hasCheck) fail(`${q.id} 未暴露 window.check()`);
      if (!s.hasQ) fail(`${q.id} 未暴露 window.__q（id/answer 契約不全）`);
      if (s.opts !== q.choices.length) fail(`${q.id} 選項數不符（實際 ${s.opts}，期望 ${q.choices.length}）`);
      if (s.overflowX) fail(`${q.id} 390px 視口橫向溢出`);
      if (s.wrapH > 420) fail(`${q.id} 組件高 ${s.wrapH}px 超過上限 420px`);
      console.log(`PASS: ${q.id} 版面 OK（實測高 ${s.wrapH}px / 選項 ${s.opts} / 零溢出零報錯）`);

      // 防劇透審查：未作答前 #banner 不得顯示任何解析文字
      const spoiler = await ws.send('Runtime.evaluate', {
        expression: `document.getElementById('banner').className + '|' + document.getElementById('banner').textContent.trim()`,
        returnByValue: true
      });
      if (!/^result-banner\|$/.test(spoiler.result.value)) fail(`${q.id} 未作答前 #banner 已洩漏內容 → ${spoiler.result.value}`);

      // 動態互動：點選錯誤選項 → check → fail banner；點選正解 → check → success banner
      const wrongIdx = (q.answer_index + 1) % q.choices.length;
      const wrong = await ws.send('Runtime.evaluate', {
        expression: `(function(){ document.querySelectorAll('.opt-btn')[${wrongIdx}].click(); return window.check(); })()`,
        returnByValue: true
      });
      if (wrong.result.value.ok !== false) fail(`${q.id} 錯解未回傳 fail`);

      const correct = await ws.send('Runtime.evaluate', {
        expression: `(function(){ document.querySelectorAll('.opt-btn')[${q.answer_index}].click(); return window.check(); })()`,
        returnByValue: true
      });
      if (correct.result.value.ok !== true) fail(`${q.id} 正解未回傳 success`);
      console.log(`PASS: ${q.id} 動態邏輯 OK（錯解判定 fail / 正解判定 success）`);
    }

    console.log(`\n🎉 全部 10 題 CDP 實機測量與邏輯判定全數 PASS！`);
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) {}
    try { proc.kill('SIGKILL'); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
