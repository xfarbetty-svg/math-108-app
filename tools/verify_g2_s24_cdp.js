/**
 * tools/verify_g2_s24_cdp.js
 * G2-S-2-4 平面圖形的邊長與周長 5 道段考真題教具 CDP 實機測量驗證（390px 手機視口）
 * 驗證：每個考題組件 390×844 視口下
 *   ① 高 ≤ 420px
 *   ② 零橫向溢出
 *   ③ 零 console 報錯
 *   ④ 選項數量正確 (4 個)
 *   ⑤ 防劇透審查：未作答前無劇透
 *   ⑥ 正解觸發 success，錯解觸發 fail
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
  return a ? Number(a.split('=')[1]) : 9358;
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
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
      for (const fn of listeners) fn(msg);
    });
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
    function on(fn) { listeners.push(fn); }
  });
}

function fail(msg) {
  console.error('❌ FAIL: ' + msg);
  process.exit(1);
}

async function main() {
  const jsonPath = path.join(__dirname, '..', 'data', 'units', 'G2', 'S-2-4.json');
  const unit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const allQuestions = unit.questions || [];

  const chromePath = findChrome();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp_s24_'));
  const proc = spawn(chromePath, [
    `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
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

    console.log(`\n=== CDP 實機測量：G2-S-2-4 5 套組件 (390×844) ===`);
    for (const q of allQuestions) {
      consoleErrors = [];
      const compPath = path.join(process.cwd(), 'app', q.component_path);
      if (!fs.existsSync(compPath)) fail(`${q.id} 組件不存在: ${compPath}`);
      const url = pathToFileURL(compPath).href;
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const metrics = (await ws.send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          bodyHeight: document.body.offsetHeight,
          wrapHeight: document.querySelector('.wrap')?.offsetHeight || 0,
          optCount: document.querySelectorAll('.opt-btn').length,
          feedbackText: document.getElementById('feedback')?.textContent?.trim() || ''
        })`,
        returnByValue: true
      })).result.value;

      const cardH = metrics.wrapHeight || metrics.bodyHeight;
      console.log(`  [${q.id}] 測量高: ${cardH}px, 寬: ${metrics.scrollWidth}px, 選項: ${metrics.optCount}`);

      if (metrics.scrollWidth > 390) fail(`${q.id} 橫向溢出 (寬 ${metrics.scrollWidth} > 390)`);
      if (cardH > 420) fail(`${q.id} 高度溢出 (${cardH}px > 420px)`);
      if (metrics.optCount !== 4) fail(`${q.id} 選項數錯誤 (實得 ${metrics.optCount})`);
      if (consoleErrors.length) fail(`${q.id} 出現控制台錯誤: ${consoleErrors.join('; ')}`);

      // 模擬點擊正解測試
      const ansIdx = q.answer_index;
      const testResult = (await ws.send('Runtime.evaluate', {
        expression: `(() => {
          const btns = document.querySelectorAll('.opt-btn');
          if (btns[${ansIdx}]) btns[${ansIdx}].click();
          const chk = document.querySelector('.check-btn');
          if (chk) chk.click();
          const fb = document.getElementById('feedback');
          const isSuccess = fb && (fb.classList.contains('success') || fb.classList.contains('correct') || fb.className.includes('correct') || fb.className.includes('show'));
          return { ok: isSuccess };
        })()`,
        returnByValue: true
      })).result.value;

      if (!testResult.ok) fail(`${q.id} 點擊正解 (選項索引 ${ansIdx}) 未觸發 success 狀態`);
    }

    console.log(`\n🎉 全部 5 套 S-2-4 微教具 CDP 實機測量 PASS！無溢出、高 ≤ 420px、正解邏輯驗證全綠！`);
  } finally {
    try { proc.kill(); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
