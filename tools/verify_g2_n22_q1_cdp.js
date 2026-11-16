/**
 * tools/verify_g2_n22_q1_cdp.js — G2-N-2-2-Q01 彩帶線段圖真題教具 CDP 實機驗證（390px 手機視口）
 * 驗證：① 390×844 視口下元件高 ≤ 420px ② 零橫向溢出 ③ 零 console 報錯
 *       ④ 題幹原文逐字 ⑤ 線段圖 58:32 比例 ⑥ 選項 4 枚與 .sel 高亮
 *       ⑦ window.check() 正解 ok=true + success banner + 直式揭曉；錯解 fail + 引導提示
 *       ⑧ window.__q 契約 { id:'G2-N-2-2-Q01', answer:1 }
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_g2_n22_q1_cdp.js [--port=9337]
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
  return a ? Number(a.split('=')[1]) : 9337;
})();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TARGET = 'app/components/g2_n22_q1_tape_ribbon_demo.html';
const QID = 'G2-N-2-2-Q01';
const STEM_SNIPPET = '彩帶有 90 公分，布置布告欄用掉一些後，還剩下 58 公分，布置布告欄用掉幾公分的彩帶？';

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
  if (!fs.existsSync(path.join(process.cwd(), TARGET))) fail(`找不到組件檔 ${TARGET}`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2n22q1-cdp-'));
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

    const url = pathToFileURL(path.join(process.cwd(), TARGET)).href;
    await ws.send('Page.navigate', { url });
    await sleep(400);

    const snap = await ws.send('Runtime.evaluate', {
      expression: `(() => {
        const svg = document.querySelector('.tape-svg');
        const rects = svg ? [...svg.querySelectorAll('rect')] : [];
        const green = rects.find(r => r.getAttribute('width') === '219.1');
        const cut = rects.find(r => r.getAttribute('width') === '120.9');
        return {
          wrapH: Math.round(document.querySelector('.wrap').getBoundingClientRect().height),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
          opts: document.querySelectorAll('.opt-btn').length,
          hasCheck: typeof window.check === 'function',
          hasBtn: !!document.querySelector('.check-btn'),
          hasAudio: !!document.querySelector('script[src$="audio_manager.js"]'),
          q: window.__q || null,
          stemOk: document.body.textContent.includes(${JSON.stringify(STEM_SNIPPET)}),
          tapeOk: !!svg && !!green && !!cut,
          labels: svg ? svg.textContent : '',
          vqShownInit: document.getElementById('vq').classList.contains('show')
        };
      })()`,
      returnByValue: true
    });
    const s = snap.result.value;
    if (consoleErrors.length) fail(`頁面載入報錯 → ${consoleErrors[0]}`);
    if (!s.hasCheck) fail('未暴露 window.check()');
    if (!s.hasBtn) fail('缺少 .check-btn');
    if (!s.hasAudio) fail('未引入 ../js/audio_manager.js');
    if (!s.q || s.q.id !== QID || s.q.answer !== 1) fail(`window.__q 契約不符 → ${JSON.stringify(s.q)}`);
    if (s.opts !== 4) fail(`選項數不符（實際 ${s.opts}，期望 4）`);
    if (!s.stemOk) fail('題幹原文不符');
    if (s.overflowX) fail('390px 視口橫向溢出');
    if (s.wrapH > 420) fail(`元件高 ${s.wrapH}px 超過上限 420px`);
    if (!s.tapeOk) fail('線段圖 rect 缺失（58:32 兩段）');
    for (const label of ['原長 90 公分', '剩下 58 公分', '用掉', '？', '公分']) {
      if (!s.labels.includes(label)) fail(`線段圖缺標註「${label}」`);
    }
    if (s.vqShownInit) fail('未作答前直式解析已外洩（違反防劇透）');
    console.log(`PASS: 靜態版面（高 ${s.wrapH}px / 選項 4 / 線段 58:32 / 零溢出零報錯 / 防劇透 OK）`);

    // 動態互動：錯解 → fail banner；正解 → success banner + 直式揭曉
    const wrong = await ws.send('Runtime.evaluate', {
      expression: `(function(){ document.querySelectorAll('.opt-btn')[0].click(); return window.check(); })()`,
      returnByValue: true
    });
    if (wrong.result.value.ok !== false) fail('錯解未回傳 fail');
    await sleep(80);
    const b1 = await ws.send('Runtime.evaluate', { expression: `document.getElementById('banner').className`, returnByValue: true });
    if (!String(b1.result.value).includes('fail')) fail('錯解未顯示 fail banner');
    const b1text = await ws.send('Runtime.evaluate', { expression: `document.getElementById('banner').textContent`, returnByValue: true });
    if (!String(b1text.result.value).includes('再想想看')) fail('錯解提示文字不符');
    if (consoleErrors.length) fail('互動階段報錯 → ' + consoleErrors[0]);
    console.log('PASS: 錯解回饋（fail banner + 引導提示）');

    const right = await ws.send('Runtime.evaluate', {
      expression: `(function(){ document.querySelectorAll('.opt-btn')[1].click(); return window.check(); })()`,
      returnByValue: true
    });
    if (right.result.value.ok !== true) fail('正解未回傳 ok');
    await sleep(80);
    const post = await ws.send('Runtime.evaluate', {
      expression: `(() => {
        const vq = document.getElementById('vq');
        const sel = document.querySelector('.opt-btn.sel');
        return {
          bannerCls: document.getElementById('banner').className,
          bannerText: document.getElementById('banner').textContent,
          vqShown: vq.classList.contains('show'),
          vqH: Math.round(vq.getBoundingClientRect().height),
          totalH: Math.round(document.querySelector('.wrap').getBoundingClientRect().height),
          overflowX2: document.documentElement.scrollWidth > window.innerWidth + 1,
          selText: sel ? sel.textContent : '',
          marks: [...vq.querySelectorAll('.mk')].map(m => m.textContent),
          strikes: vq.querySelectorAll('.dg.strike').length,
          res: [...vq.querySelectorAll('.res')].map(m => m.textContent)
        };
      })()`,
      returnByValue: true
    });
    const p = post.result.value;
    if (!p.bannerCls.includes('success')) fail('正解未顯示 success banner');
    if (!p.bannerText.includes('32')) fail('正解橫幅未含答案 32');
    if (!p.vqShown) fail('正解後直式退位算式未展開');
    if (p.strikes !== 2) fail(`直式劃掉位數不符（實際 ${p.strikes}，期望 2）`);
    if (p.marks.join(',') !== '8,10') fail(`借位標記不符（實際 ${p.marks.join(',')}，期望 8,10）`);
    if (p.res.join(',') !== '3,2') fail(`直式結果不符（實際 ${p.res.join(',')}，期望 3,2）`);
    if (p.selText !== '32 公分') fail(`正解選項未高亮（實際 ${p.selText}）`);
    if (p.overflowX2) fail('揭曉後 390px 視口橫向溢出');
    if (p.totalH > 740) fail(`揭曉後總高 ${p.totalH}px 超過 740px 單屏上限`);
    console.log(`PASS: 正解互動（success banner + 直式 90−58=32 揭曉 / 揭曉後總高 ${p.totalH}px / 零溢出）`);
    console.log(`INFO: vq 高 ${p.vqH}px`);
  } finally {
    try { if (ws) await ws.send('Browser.close'); } catch (e) { /* 忽略 */ }
    proc.kill();
  }
  console.log('G2_N22_Q1_CDP_VERIFIED — ALL PASS');
}
main().catch(() => process.exit(process.exitCode || 1));
