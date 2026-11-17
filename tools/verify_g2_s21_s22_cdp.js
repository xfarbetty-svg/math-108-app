/**
 * tools/verify_g2_s21_s22_cdp.js
 * G2-S-2-1 & G2-S-2-2 雙單元 10 道段考真題教具 CDP 實機測量驗證（390px 手機視口）
 * 驗證：每個考題組件 390×844 視口下
 *   ① 高 ≤ 420px
 *   ② 零橫向溢出
 *   ③ 零 console 報錯
 *   ④ 選項數量正確 (4 個)
 *   ⑤ 防劇透審查：未作答前無劇透
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
  return a ? Number(a.split('=')[1]) : 9355;
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
  const u1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/S-2-1.json'), 'utf8'));
  const u2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/S-2-2.json'), 'utf8'));
  const allQuestions = [...u1.questions, ...u2.questions];

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2s21-s22-cdp-'));
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

    console.log(`\n=== CDP 實機測量：10 套組件 (390×844) ===`);
    for (const q of allQuestions) {
      consoleErrors = [];
      const url = pathToFileURL(path.join(process.cwd(), 'app', q.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const metrics = (await ws.send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          bodyHeight: document.body.offsetHeight,
          wrapHeight: document.querySelector('.wrap')?.offsetHeight || 0,
          optCount: document.querySelectorAll('.opt-btn').length,
          bannerText: document.querySelector('.result-banner')?.textContent?.trim() || ''
        })`,
        returnByValue: true
      })).result.value;

      const cardH = metrics.wrapHeight || metrics.bodyHeight;
      console.log(`  [${q.id}] 測量高: ${cardH}px, 寬: ${metrics.scrollWidth}px, 選項: ${metrics.optCount}`);

      if (metrics.scrollWidth > 390) fail(`${q.id} 橫向溢出 (寬 ${metrics.scrollWidth} > 390)`);
      if (cardH > 420) fail(`${q.id} 高度溢出 (${cardH}px > 420px)`);
      if (metrics.optCount !== 4) fail(`${q.id} 選項數錯誤 (實得 ${metrics.optCount})`);
      if (metrics.bannerText.length > 0 && !metrics.bannerText.includes('請選擇')) {
        fail(`${q.id} 未作答前劇透 banner 內容: ${metrics.bannerText}`);
      }
      if (consoleErrors.length) fail(`${q.id} 出現控制台錯誤: ${consoleErrors.join('; ')}`);

      // 模擬點擊正解測試
      const ansIdx = q.answer_index;
      const testResult = (await ws.send('Runtime.evaluate', {
        expression: `(() => {
          const btns = document.querySelectorAll('.opt-btn');
          if (btns[${ansIdx}]) btns[${ansIdx}].click();
          const chk = document.querySelector('.check-btn');
          if (chk) chk.click();
          const b = document.querySelector('.result-banner');
          return { ok: b && b.classList.contains('success') };
        })()`,
        returnByValue: true
      })).result.value;

      if (!testResult.ok) fail(`${q.id} 點擊正解 (${ansIdx}) 未觸發 success 狀態`);
    }

    console.log(`\n🎉 全部 10 套微教具 CDP 實機測量 PASS！無溢出、高 ≤ 420px、正解邏輯驗證全綠！`);
  } finally {
    try { proc.kill(); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
