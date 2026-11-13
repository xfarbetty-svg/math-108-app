/**
 * tools/verify_r11_r12.js — G1-R-1-1 ＆ G1-R-1-2 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：R-1-1.json 5 題 / R-1-2.json 3 題欄位完整、教具檔案存在且算理與真卷一致、
 *     curriculum.json R-1-1 / R-1-2 = ready ＋ question_count ＋ verified_source、零外部依賴（純向量無遠端請求）。
 *  B. CDP 實機（390×844 手機視窗）：逐題開啟教具 ?q=N，
 *     實機操作（右盤拿蘋果／兩邊同減 3 顆開神秘箱／算式卡試放天平／松鼠合起來／比大小傾斜／
 *     180° 翻轉珠串／天平左右交換／湊十往上數 10、11）→ 全部斷言通過、
 *     390px 單屏高度 ≤ 450、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_r11_r12.js [--port=9471]
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
  return a ? Number(a.split('=')[1]) : 9471;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const u11 = JSON.parse(fs.readFileSync('data/units/G1/R-1-1.json', 'utf8'));
const u12 = JSON.parse(fs.readFileSync('data/units/G1/R-1-2.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

/* R-1-1：五題真題（任務卡指定：忠孝 114-1 期末／獅湖 114-2 期中／內湖 114-2 期末） */
const EXPECT11 = [
  { comp: 'math_balance_scale.html?q=1', exprs: ['5 ＝ 5', '5 ≠ 4', '等號'], h: 450 },
  { comp: 'math_balance_scale.html?q=2', exprs: ['□ ＋ 3 ＝ 8', '8 － 3 ＝ 5', '神秘箱'], h: 450 },
  { comp: 'math_balance_scale.html?q=3', exprs: ['11 － 7', '13 － 9', '12 － 7', '15 － 8'], h: 450 },
  { comp: 'math_balance_scale.html?q=4', exprs: ['5 ＋ 4 ＝ 9', '又跑來 4 隻', '松鼠'], h: 450 },
  { comp: 'math_balance_scale.html?q=5', exprs: ['8 ＋ 4 ○ 7 ＋ 6', '12 ＜ 13', '＜'], h: 450 }
];
/* R-1-2：三題（忠孝 114-1 期末 ＋ 108 課綱核心演示） */
const EXPECT12 = [
  { comp: 'commutative_bead_bar.html?q=1', exprs: ['3 ＋ 5 ＝ 8', '5 ＋ 3 ＝ 8', '180° 翻轉', '兩把尺'], h: 470 },
  { comp: 'commutative_bead_bar.html?q=2', exprs: ['4 ＋ 6 ＝ 6 ＋ 4', '左右交換'], h: 450 },
  { comp: 'commutative_bead_bar.html?q=3', exprs: ['2 ＋ 9', '9 ＋ 2 ＝ 11', '10、11'], h: 440 }
];

sok(u11.questions.length === 5, 'R-1-1 題庫 = 5 題真題（實際 ' + u11.questions.length + '）');
sok(u11.question_count === 5, 'R-1-1 question_count = 5');
sok(u12.questions.length === 3, 'R-1-2 題庫 = 3 題真題（實際 ' + u12.questions.length + '）');
sok(u12.question_count === 3, 'R-1-2 question_count = 3');

function checkUnit(unit, expect, tag) {
  unit.questions.forEach((q, i) => {
    const e = expect[i];
    sok(q.component_path.includes(e.comp), `${tag} Q${i + 1} 教具掛載 ?q=${i + 1} → ${q.component_path}`);
    sok(q.answer_index === 0, `${tag} Q${i + 1} answer_index = 0`);
    sok(!!q.answer_raw && q.answer_raw.length > 3, `${tag} Q${i + 1} answer_raw 完整`);
    sok(Array.isArray(q.choices) && q.choices.length >= 3, `${tag} Q${i + 1} 選項 ≥ 3（實際 ${Array.isArray(q.choices) ? q.choices.length : '無'}）`);
    sok(q.fallback_height >= 360 && q.fallback_height <= 520, `${tag} Q${i + 1} fallback_height 單屏範圍 → ${q.fallback_height}`);
    sok(!!q.stem && q.stem.length > 10, `${tag} Q${i + 1} 題幹完整`);
    sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `${tag} Q${i + 1} 算理解析（concept/steps/trap）完整`);
    const p = 'app/' + q.component_path.split('?')[0];
    const html = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    sok(fs.existsSync(p), `${tag} Q${i + 1} 教具檔案存在 → ${p}`);
    sok(html.includes('source-tag'), `${tag} Q${i + 1} 教具掛真題來源幽靈字`);
    sok(!/https?:\/\/(?!www\.w3\.org)/.test(html), `${tag} Q${i + 1} 零外部遠端依賴（僅允許 SVG 命名空間）`);
    e.exprs.forEach((ex) => sok(html.includes(ex), `${tag} Q${i + 1} 教具算理對齊真卷 → ${ex}`));
  });
}
checkUnit(u11, EXPECT11, 'R-1-1');
checkUnit(u12, EXPECT12, 'R-1-2');

[['R-1-1', u11], ['R-1-2', u12]].forEach(([code, unit]) => {
  const meta = curriculum.grades[0].units.find((x) => x.code === code);
  sok(!!meta, `curriculum.json 有 ${code} 條目`);
  sok(meta && meta.status === 'ready', `${code} status = ready`);
  sok(meta && meta.question_count === unit.questions.length, `${code} question_count 同步 = ${unit.questions.length}`);
  sok(meta && !!meta.verified_source && meta.verified_source.length > 5, `${code} verified_source 已掛真題來源`);
});

if (staticResults.some((l) => l.startsWith('FAIL'))) {
  for (const l of staticResults) console.log(l);
  console.log('FAILED (static contract)');
  process.exit(1);
}

/* ---------------- B. CDP 實機驗證（390×844 手機視窗） ---------------- */
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

/* 每題實機互動腳本（在頁面內執行；prelude 由主流程注入） */
const PRELUDE = `
  const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
`;
const CASES = [
  { /* R-1-1 Q1 */
    url: '/app/components/math_balance_scale.html?q=1', ready: '#bal1Eq',
    body: `
      const eq = document.getElementById('bal1Eq');
      ok(eq.textContent.includes('5 ＝ 5'), 'Q1 初始等式 5 ＝ 5（天平水平）→ ' + eq.textContent);
      ok(document.getElementById('bal1PanR').dataset.count === '5', 'Q1 左右盤各 5 顆蘋果 → 右盤 count=' + document.getElementById('bal1PanR').dataset.count);
      document.getElementById('act1').click();
      await sleep(750);
      ok(eq.textContent.includes('5 ≠ 4'), 'Q1 實機互動：右盤拿走 1 顆 → 5 ≠ 4 → ' + eq.textContent);
      ok(document.getElementById('bal1Beam').getAttribute('transform').includes('-9'), 'Q1 天平向左傾斜（rotate -9）→ ' + document.getElementById('bal1Beam').getAttribute('transform'));
      ok(document.getElementById('bal1PanR').dataset.count === '4', 'Q1 右盤剩 4 顆');
      document.getElementById('reset1').click();
      await sleep(700);
      ok(document.getElementById('bal1Beam').getAttribute('transform').includes('rotate(0'), 'Q1 重來：放回蘋果天平回正');
      ok(document.getElementById('note1').textContent.includes('一樣多'), 'Q1 即時反饋破招：＝表示兩邊一樣多');
    `
  },
  { /* R-1-1 Q2 */
    url: '/app/components/math_balance_scale.html?q=2', ready: '#bal2Eq',
    body: `
      const eq = document.getElementById('bal2Eq');
      ok(document.getElementById('bal2PanR').dataset.count === '8', 'Q2 右盤 8 顆砝碼 → count=' + document.getElementById('bal2PanR').dataset.count);
      ok(eq.textContent.includes('□ ＋ 3 ＝ 8'), 'Q2 初始等式 □ ＋ 3 ＝ 8 → ' + eq.textContent);
      for (let k = 1; k <= 3; k++) {
        document.querySelector('#bal2PanR .take').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await sleep(900);
        ok(document.getElementById('bal2PanR').dataset.count === String(8 - k), 'Q2 實機互動：第 ' + k + ' 次兩邊同減 → 右盤剩 ' + (8 - k) + ' 顆');
        if (k < 3) ok(eq.textContent.includes('□ ＋ ' + (3 - k) + ' ＝ ' + (8 - k)), 'Q2 天平保持水平 □ ＋ ' + (3 - k) + ' ＝ ' + (8 - k));
      }
      await sleep(400);
      ok(eq.textContent.includes('8 － 3 ＝ 5'), 'Q2 神秘箱打開：□ ＝ 8 － 3 ＝ 5 → ' + eq.textContent);
      ok(!!document.querySelector('#bal2PanL .pop-in'), 'Q2 開箱動畫：箱內浮現 5 顆砝碼');
      ok(document.getElementById('box2').classList.contains('good'), 'Q2 平衡綠光亮起');
      ok(document.getElementById('note2').textContent.includes('8 － 3 ＝ 5'), 'Q2 即時反饋破招');
    `
  },
  { /* R-1-1 Q3 */
    url: '/app/components/math_balance_scale.html?q=3', ready: '#bal3Eq',
    body: `
      const chips = [...document.querySelectorAll('#mode3 .exp-chip')];
      ok(chips.length === 3, 'Q3 三張算式卡（12－7／13－9／15－8）');
      chips[0].click(); await sleep(700);
      const beam = document.getElementById('bal3Beam');
      ok(beam.getAttribute('transform').includes('9.00'), 'Q3 實機互動：12－7＝5 太重 → 天平向右沉');
      chips[2].click(); await sleep(700);
      ok(beam.getAttribute('transform').includes('9.00'), 'Q3 實機互動：15－8＝7 更重 → 天平仍向右沉');
      chips[1].click(); await sleep(700);
      ok(beam.getAttribute('transform').includes('rotate(0'), 'Q3 實機互動：13－9＝4 → 天平回正 ' + beam.getAttribute('transform'));
      ok(document.getElementById('box3').classList.contains('good'), 'Q3 平衡綠光亮起');
      ok(document.getElementById('bal3Eq').textContent.includes('13 － 9 ＝ 4'), 'Q3 等式連動 11－7＝4 ↔ 13－9＝4 → ' + document.getElementById('bal3Eq').textContent);
      ok(document.getElementById('note3').textContent.includes('答案相同'), 'Q3 即時反饋破招');
    `
  },
  { /* R-1-1 Q4 */
    url: '/app/components/math_balance_scale.html?q=4', ready: '#bal4Eq',
    body: `
      ok(document.getElementById('act4b').disabled, 'Q4 「合起來比一比」初始禁用（需先加松鼠）');
      ok(document.getElementById('bal4PanL').dataset.count === '5', 'Q4 左盤初始 5 隻松鼠');
      document.getElementById('act4a').click(); await sleep(700);
      ok(document.getElementById('bal4PanL').dataset.count === '9', 'Q4 實機互動：又跑來 4 隻 → 左盤 9 隻');
      ok(!document.getElementById('act4b').disabled, 'Q4 「合起來比一比」解鎖');
      document.getElementById('act4b').click(); await sleep(700);
      ok(document.getElementById('bal4PanR').dataset.count === '9', 'Q4 右盤放上 9 顆蘋果');
      ok(document.getElementById('bal4Eq').textContent.includes('5 ＋ 4 ＝ 9'), 'Q4 算式連動 5 ＋ 4 ＝ 9 → ' + document.getElementById('bal4Eq').textContent);
      ok(document.getElementById('box4').classList.contains('good'), 'Q4 天平水平綠光（9 隻 ＝ 9 顆）');
      ok(document.getElementById('note4').textContent.includes('加法'), 'Q4 即時反饋破招：合起來用加法');
    `
  },
  { /* R-1-1 Q5 */
    url: '/app/components/math_balance_scale.html?q=5', ready: '#bal5Eq',
    body: `
      ok(document.getElementById('bal5PanL').dataset.count === '12', 'Q5 左盤 8＋4＝12 顆');
      ok(document.getElementById('bal5PanR').dataset.count === '13', 'Q5 右盤 7＋6＝13 顆');
      const t0 = document.getElementById('bal5Beam').getAttribute('transform');
      ok(parseFloat(t0.split('(')[1]) > 5, 'Q5 天平向右沉（13 比較重）→ ' + t0);
      ok(document.getElementById('note5').textContent.includes('12 ＜ 13'), 'Q5 破招提示 12 ＜ 13');
      const opts = document.querySelectorAll('#opts5 .opt-btn');
      ok(opts[0].textContent === '＜', 'Q5 選項首項 ＜');
      opts[0].click(); await sleep(60);
      document.getElementById('check5').click(); await sleep(80);
      ok(document.getElementById('result5').classList.contains('success'), 'Q5 答題 → success 反饋');
    `
  },
  { /* R-1-2 Q1 */
    url: '/app/components/commutative_bead_bar.html?q=1', ready: '#bar1Eq',
    body: `
      ok(document.getElementById('bar1Eq').textContent.includes('3 ＋ 5 ＝ 8'), 'Q1 初始算式 3 ＋ 5 ＝ 8');
      ok(document.getElementById('segL').textContent.includes('紅珠 3 顆'), 'Q1 上排 3 紅 ＋ 5 藍');
      const bead0 = document.querySelector('#bar1G .cb circle[r="14"]');
      ok(bead0.getAttribute('fill') === '#ef5350', 'Q1 第 1 顆是紅珠');
      document.querySelector('#bar1G .cb').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await sleep(150);
      ok(document.querySelector('#bar1G .cb .bnum').getAttribute('opacity') === '1', 'Q1 實機互動：點珠數數蓋上 1 號牌');
      ok(document.getElementById('note1').textContent.includes('第 1 顆'), 'Q1 即時反饋：點著數');
      document.getElementById('flipBtn').click();
      await sleep(1400);
      ok(document.getElementById('bar1Eq').textContent.includes('5 ＋ 3 ＝ 8'), 'Q1 實機互動：180° 翻轉 → 5 ＋ 3 ＝ 8 → ' + document.getElementById('bar1Eq').textContent);
      ok(document.getElementById('segL').textContent.includes('藍珠 5 顆'), 'Q1 翻轉後變 5 藍在前');
      ok(document.querySelector('#bar1G .cb circle[r="14"]').getAttribute('fill') === '#42a5f5', 'Q1 翻轉後第 1 顆是藍珠');
      ok(!!document.getElementById('rulerA') && !!document.getElementById('rulerB'), 'Q1 雙向標尺 3＋5／5＋3 同時存在');
      ok(document.getElementById('rulers').classList.contains('glow'), 'Q1 標尺等長亮光');
      ok(document.getElementById('note1').textContent.includes('還是 8 顆'), 'Q1 即時反饋破招：順序換了總數不變');
    `
  },
  { /* R-1-2 Q2 */
    url: '/app/components/commutative_bead_bar.html?q=2', ready: '#bal2Eq',
    body: `
      ok(document.getElementById('bal2Eq').textContent.includes('4 ＋ 6 ＝ 6 ＋ 4'), 'Q2 初始等式 4 ＋ 6 ＝ 6 ＋ 4');
      ok(document.getElementById('bal2PanL').dataset.count === '10' && document.getElementById('bal2PanR').dataset.count === '10', 'Q2 左右盤各 10 顆砝碼');
      ok(document.getElementById('bal2Beam').getAttribute('transform').includes('rotate(0'), 'Q2 天平初始水平');
      document.getElementById('swapBtn').click();
      await sleep(500);
      ok(document.getElementById('bal2PanL').textContent.includes('6 ＋ 4'), 'Q2 實機互動：左右交換 → 左盤變 6＋4');
      ok(document.getElementById('bal2PanR').textContent.includes('4 ＋ 6'), 'Q2 右盤變 4＋6');
      ok(document.getElementById('bal2Beam').getAttribute('transform').includes('rotate(0'), 'Q2 交換後天平依舊水平');
      ok(document.getElementById('bal2Eq').textContent.includes('還是一樣重'), 'Q2 即時反饋：交換順序重量不變 → ' + document.getElementById('bal2Eq').textContent);
      ok(document.getElementById('box2').classList.contains('good'), 'Q2 平衡綠光亮起');
    `
  },
  { /* R-1-2 Q3 */
    url: '/app/components/commutative_bead_bar.html?q=3', ready: '#bar3Eq',
    body: `
      ok(document.getElementById('bar3Eq').textContent.includes('2 ＋ 9 ＝ ？'), 'Q3 初始算式 2 ＋ 9 ＝ ？');
      ok(document.getElementById('count3Btn').disabled, 'Q3 「往上數」初始禁用（需先交換）');
      document.getElementById('swap3Btn').click();
      await sleep(500);
      ok(document.getElementById('bar3Eq').textContent.includes('9 ＋ 2 ＝ ？'), 'Q3 實機互動：交換成 9 ＋ 2 → ' + document.getElementById('bar3Eq').textContent);
      ok(!document.getElementById('count3Btn').disabled, 'Q3 「從 9 往上數 2 個」解鎖');
      document.getElementById('count3Btn').click();
      await sleep(2100);
      const svg3 = document.getElementById('bar3Svg');
      ok(svg3.textContent.includes('10') && svg3.textContent.includes('11'), 'Q3 實機互動：往上數亮牌 10、11');
      ok(document.getElementById('bar3Eq').textContent.includes('9 ＋ 2 ＝ 11'), 'Q3 算式連動 9 ＋ 2 ＝ 11 → ' + document.getElementById('bar3Eq').textContent);
      ok(document.getElementById('box3').classList.contains('good'), 'Q3 綠光亮起');
      ok(document.getElementById('note3').textContent.includes('10、11'), 'Q3 即時反饋破招');
    `
  }
];

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'r11r12-verify-'));
  const chrome = findChrome();
  const base = `http://127.0.0.1:${httpPort}`;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844', base + '/'
  ], { stdio: 'ignore' });

  let ws;
  const consoleNoise = [];
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
    /* 強制 390×844 手機視窗（headless 視窗最小寬 500px，須以 Emulation 覆寫） */
    await ws.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

    const results = [];
    for (let i = 0; i < CASES.length; i++) {
      const c = CASES[i];
      await ws.send('Page.navigate', { url: base + c.url });
      /* 等頁面載入 + 就緒選擇器出現 */
      let ready = false;
      for (let t = 0; t < 40 && !ready; t++) {
        await sleep(150);
        try {
          const st = await ws.send('Runtime.evaluate', { expression: `document.readyState === 'complete' && !!document.querySelector('${c.ready}')`, returnByValue: true });
          ready = st.result.value === true;
        } catch (_e) { /* 導航瞬間 */ }
      }
      if (!ready) throw new Error('第 ' + (i + 1) + ' 題教具載入逾時：' + c.url);
      await sleep(300);
      const body = `(async () => {
        const results = [];
        ${PRELUDE}
        const h = document.body.scrollHeight;
        ok(h <= 450, '手機 390px 單屏內容高度 ≤ 450（無捲軸）→ 實際 ' + h + 'px');
        ${c.body}
        return results;
      })()`;
      const res = await ws.send('Runtime.evaluate', { expression: body, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error('第 ' + (i + 1) + ' 題驗證腳本拋錯: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails));
      }
      results.push('── 第 ' + (i + 1) + ' 題 ' + c.url + ' ──');
      results.push(...(res.result.value || []));
    }

    const all = staticResults.concat(results);
    for (const line of all) console.log(line);
    console.log('CONSOLE_NOISE_COUNT=' + consoleNoise.length);
    for (const n of consoleNoise.slice(0, 10)) console.log('  ' + n);
    const failed = all.filter((l) => String(l).startsWith('FAIL')).length;
    if (!results.length) {
      console.log('FAIL harness :: CDP 驗證腳本未回傳任何結果');
      process.exitCode = 1;
    } else if (failed === 0 && consoleNoise.length === 0) {
      console.log('R11_R12_CDP_VERIFIED (static SSOT + 8 real questions × interactive balance/bead demos + 390px one-screen) — ALL PASS');
      process.exitCode = 0;
    } else {
      console.log('FAILED (' + failed + ' fails, ' + consoleNoise.length + ' console noise)');
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
