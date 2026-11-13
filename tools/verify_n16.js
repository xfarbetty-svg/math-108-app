/**
 * tools/verify_n16.js — G1-N-1-6 日常時間用語單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：N-1-6.json 5 題真題欄位完整、5 個教具檔案存在且算理與真卷一致、
 *     curriculum.json N-1-6 = ready / question_count 5 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 N-1-6 ready 卡 → 逐題導航 5 題，
 *     每題 iframe 教具掛載正確、實機操作教具（認識指針／算理解密／經過 2 小時／撥長針一圈／日曆翻頁）
 *     → success 反饋、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n16.js [--port=9461]
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
  return a ? Number(a.split('=')[1]) : 9461;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const unit = JSON.parse(fs.readFileSync('data/units/G1/N-1-6.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 5, 'N-1-6 題庫 = 5 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 5, 'N-1-6 question_count = 5');
// 與任務卡 task_g1_n16_clock.md 指定三份真卷逐題核對的期望值
const EXPECTED = [
  { title: '整點鐘報讀', comp: 'clock_6_oclock_demo.html', choices: 3,
    exprs: ['短針', '長針', '6 點鐘'] },
  { title: '半點鐘報讀', comp: 'clock_10_half_demo.html', choices: 3,
    exprs: ['還沒到 11', '10 點半'] },
  { title: '經過 2 小時', comp: 'clock_elapsed_2h_demo.html', choices: 3,
    exprs: ['經過 1 小時', '8 ＋ 2 ＝ 10'] },
  { title: '長針走一圈', comp: 'broken_clock_detect_demo.html', choices: 3,
    exprs: ['一圈', '10 點鐘'] },
  { title: '日曆報讀', comp: 'calendar_yesterday_today_tomorrow_demo.html', choices: 3,
    exprs: ['昨天', '明天', '星期二', '星期四'] }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes('期末'), `Q${i + 1} 真題來源掛期末試卷 → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === e.choices, `Q${i + 1} 選項數 = ${e.choices}（實際 ${Array.isArray(q.choices) ? q.choices.length : '無'}）`);
  sok(q.answer_index === 0, `Q${i + 1} answer_index = 0`);
  sok(!!q.answer_raw && q.answer_raw.length > 5, `Q${i + 1} answer_raw 完整`);
  sok(q.fallback_height >= 360 && q.fallback_height <= 520, `Q${i + 1} fallback_height 在單屏範圍 → ${q.fallback_height}`);
  sok(!!q.stem && q.stem.length > 10, `Q${i + 1} 題幹完整`);
  sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${i + 1} 算理解析（concept/steps/trap）完整`);
  const p = 'app/' + q.component_path;
  const html = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  sok(fs.existsSync(p) && q.component_path.includes(e.comp), `Q${i + 1} 教具檔案存在 → ${p}`);
  sok(html.includes('source-tag'), `Q${i + 1} 教具掛真題來源幽靈字`);
  e.exprs.forEach((ex) => sok(html.includes(ex), `Q${i + 1} 教具算理對齊真卷 → ${ex}`));
});
const meta = curriculum.grades[0].units.find((u) => u.code === 'N-1-6');
sok(!!meta, 'curriculum.json 有 N-1-6 條目');
sok(meta && meta.status === 'ready', 'N-1-6 status = ready');
sok(meta && meta.question_count === 5, 'N-1-6 question_count = 5');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期末'), 'N-1-6 verified_source 已掛真題來源');

if (staticResults.some((l) => l.startsWith('FAIL'))) {
  for (const l of staticResults) console.log(l);
  console.log('FAILED (static contract)');
  process.exit(1);
}

/* ---------------- B. CDP 實機驗證 ---------------- */
function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
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

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n16-verify-'));
  const chrome = findChrome();
  const pageUrl = `http://127.0.0.1:${httpPort}/app/index.html`;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=1200,900', pageUrl
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
    await sleep(800); // 等 init() fetch curriculum.json

    const body = `(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const tap = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const expected = ${JSON.stringify(EXPECTED)};

      // 1. G1 單元列表：N-1-6 變 ready
      let cards = [], n16 = null;
      for (let t = 0; t < 30; t++) {
        cards = [...document.querySelectorAll('#gradeView .unit-card')];
        n16 = cards.find((c) => c.dataset.code === 'N-1-6');
        if (n16 && !n16.disabled) break;
        await sleep(200);
      }
      results.push('DEBUG cards=' + cards.length + ' [' + cards.map((c) => c.dataset.code).join(',') + ']');
      ok(!!n16 && !n16.disabled, 'N-1-6 卡片為 ready 且可點擊');
      ok(n16.querySelector('.hint').textContent.includes('5 題真題'), 'N-1-6 卡片顯示「5 題真題」');

      // 2. 開啟 N-1-6 測驗舞台
      n16.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 N-1-6 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 5 題', '題號顯示「第 1 / 5 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('期末'), '真題來源顯示期末試卷 → ' + src0);

      // 3. 逐題：iframe 掛載正確教具 → 實機操作
      const frame = document.getElementById('stageFrame');
      const READY_SELECTOR = ['#needleBtn', '#revealBtn', '#step1Btn', '#spinBtn', '#yesterdayBtn'];
      for (let i = 0; i < 5; i++) {
        const e = expected[i];
        let doc = null, tries = 0;
        while (tries++ < 40) {
          try {
            doc = frame.contentDocument;
            if (doc && doc.readyState === 'complete' && doc.querySelector(READY_SELECTOR[i])) break;
          } catch (_err) { /* 跨域瞬間 */ }
          await sleep(150);
        }
        ok(!!doc && !!doc.querySelector(READY_SELECTOR[i]), '第 ' + (i + 1) + ' 題教具 iframe 載入完成');
        ok(frame.getAttribute('src').includes(e.comp), '第 ' + (i + 1) + ' 題掛載教具 ' + e.comp + ' → src=' + frame.getAttribute('src'));

        if (i === 0) {
          // Q1 整點報讀：初始短針 180°（指 6）→ 認識指針高亮 → 短針進一格觀察 7 點整 → 重來
          const svg = doc.getElementById('clockSvg');
          const t0 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t0.includes('180'), '第 1 題教具：初始短針指 6（180°）→ ' + t0);
          doc.getElementById('needleBtn').click();
          await sleep(300);
          ok(svg.classList.contains('inspect'), '第 1 題實機互動：「認識指針」高亮短針／長針');
          ok(doc.getElementById('pairNote').textContent.includes('時針') && doc.getElementById('pairNote').textContent.includes('分針'), '第 1 題即時反饋：短針＝時針、長針＝分針');
          doc.getElementById('hourNext').click();
          await sleep(200);
          const t1 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t1.includes('210'), '第 1 題實機互動：短針進一格到 7（210°）→ ' + t1);
          ok(doc.getElementById('pairNote').textContent.includes('7 點整'), '第 1 題即時反饋：「長針指 12，短針指 7 就是 7 點整」');
          doc.getElementById('resetBtn').click();
          await sleep(150);
          ok(doc.getElementById('hourWrap').getAttribute('transform').includes('180'), '第 1 題重來：短針回到 6（180°）');
        } else if (i === 1) {
          // Q2 半點報讀：初始扇形指引隱藏 → 算理解密畫出 10→11 扇形
          const svg = doc.getElementById('clockSvg');
          ok(!svg.classList.contains('revealed'), '第 2 題教具：初始扇形指引線隱藏');
          const t0 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t0.includes('315'), '第 2 題教具：短針停在 10 和 11 正中間（315°）→ ' + t0);
          ok(doc.getElementById('minuteWrap').getAttribute('transform').includes('180'), '第 2 題教具：長針垂直朝下指 6（180°）');
          doc.getElementById('revealBtn').click();
          await sleep(700);
          ok(svg.classList.contains('revealed'), '第 2 題實機互動：算理解密扇形指引亮起');
          ok(doc.getElementById('pairNote').textContent.includes('還沒到 11') && doc.getElementById('pairNote').textContent.includes('10 點半'), '第 2 題即時反饋：「短針走過 10 還沒到 11，是 10 點半」');
        } else if (i === 2) {
          // Q3 經過 2 小時：8 點 → 經過 1 小時到 9 → 再過 1 小時到 10 → 算式 8 ＋ 2 ＝ 10
          const t0 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t0.includes('240'), '第 3 題教具：初始 8 點整（240°）→ ' + t0);
          ok(doc.getElementById('step2Btn').disabled, '第 3 題教具：「再過 1 小時」按鈕初始禁用（需先過 1 小時）');
          doc.getElementById('step1Btn').click();
          await sleep(1600);
          const t1 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t1.includes('270'), '第 3 題實機互動：長針轉一圈後短針 8 → 9（270°）→ ' + t1);
          ok(doc.getElementById('formulaLine').textContent.includes('8 ＋ 1 ＝ 9'), '第 3 題即時反饋：算式連動「8 ＋ 1 ＝ 9」');
          ok(!doc.getElementById('step2Btn').disabled, '第 3 題實機互動：「再過 1 小時」按鈕解鎖');
          doc.getElementById('step2Btn').click();
          await sleep(1600);
          const t2 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t2.includes('300'), '第 3 題實機互動：短針 9 → 10（300°）→ ' + t2);
          ok(doc.getElementById('formulaLine').textContent.includes('8 ＋ 2 ＝ 10'), '第 3 題即時反饋：算式連動「8 ＋ 2 ＝ 10，上午 10 點鐘！」');
        } else if (i === 3) {
          // Q4 長針走一圈：9 點 → 撥長針轉一圈 → 短針齒輪連動爬到 10 點
          const t0 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t0.includes('270'), '第 4 題教具：初始 9 點整（270°）→ ' + t0);
          ok(doc.getElementById('goalRing').getAttribute('opacity') === '0', '第 4 題教具：10 點目標格提示圈初始隱藏');
          doc.getElementById('spinBtn').click();
          await sleep(1900);
          const t1 = doc.getElementById('hourWrap').getAttribute('transform');
          ok(t1.includes('300'), '第 4 題實機互動：長針轉一圈、短針齒輪連動爬到 10（300°）→ ' + t1);
          ok(doc.getElementById('minuteWrap').getAttribute('transform').includes('360'), '第 4 題實機互動：長針完整走一圈（360°）');
          ok(doc.getElementById('badgeLine').textContent.includes('10 點鐘'), '第 4 題即時反饋：「一圈 60 分鐘＝1 小時，現在是 10 點鐘！」');
          ok(Number(doc.getElementById('goalRing').getAttribute('opacity')) > 0, '第 4 題實機互動：10 點目標格亮起');
        } else {
          // Q5 日曆翻頁：今天 20 日星期三 → 昨天翻頁 19 日星期二 → 明天翻頁 21 日星期四
          ok(doc.getElementById('calDate').textContent === '20' && doc.getElementById('calWeek').textContent === '星期三', '第 5 題教具：日曆初始 5 月 20 日星期三（今天）');
          doc.getElementById('yesterdayBtn').click();
          await sleep(1100);
          ok(doc.getElementById('calDate').textContent === '19' && doc.getElementById('calWeek').textContent === '星期二', '第 5 題實機互動：昨天翻頁 → 5 月 19 日星期二');
          ok(doc.getElementById('pairNote').textContent.includes('5 月 19 日'), '第 5 題即時反饋：「昨天是 5 月 19 日星期二」');
          doc.getElementById('tomorrowBtn').click();
          await sleep(1100);
          ok(doc.getElementById('calDate').textContent === '21' && doc.getElementById('calWeek').textContent === '星期四', '第 5 題實機互動：明天翻頁 → 5 月 21 日星期四');
          ok(doc.getElementById('pairNote').textContent.includes('5 月 21 日'), '第 5 題即時反饋：「明天是 5 月 21 日星期四」');
          doc.getElementById('todayBtn').click();
          await sleep(1100);
          ok(doc.getElementById('calDate').textContent === '20' && doc.getElementById('calWeek').textContent === '星期三', '第 5 題實機互動：回到今天 20 日星期三');
        }

        // 每題都實機答題：選正解 → 檢查 → success banner
        const opts = doc.querySelectorAll('.opt-btn');
        opts[0].click();
        await sleep(60);
        doc.querySelector('.check-btn').click();
        await sleep(80);
        ok(doc.getElementById('resultBanner').classList.contains('success'), '第 ' + (i + 1) + ' 題答題 → success 反饋');

        if (i < 4) {
          document.getElementById('btnNext').click();
          await sleep(600);
          ok(num.textContent === '第 ' + (i + 2) + ' / 5 題', '導航 → 題號「第 ' + (i + 2) + ' / 5 題」→ 實際「' + num.textContent + '」');
        }
      }

      // 4. 交卷結算
      document.getElementById('btnFinish').click();
      await sleep(150);
      ok(document.getElementById('resultView').style.display === 'block', '交卷結算顯示');
      ok(document.querySelectorAll('#resultView .result-item').length === 5, '結算 5 題回顧（正解＋算理）');
      const rv = document.getElementById('resultView').textContent;
      ok(rv.includes('G1-N-1-6') && rv.includes('期末'), '結算標頭掛單元與真題來源');

      return results;
    })()`;

    const res = await ws.send('Runtime.evaluate', { expression: body, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error('驗證腳本拋錯: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails));
    const results = staticResults.concat(res.result.value || []);
    for (const line of results) console.log(line);
    console.log('CONSOLE_NOISE_COUNT=' + consoleNoise.length);
    for (const n of consoleNoise.slice(0, 10)) console.log('  ' + n);
    const failed = results.filter((l) => String(l).startsWith('FAIL')).length;
    if (!res.result.value || !res.result.value.length) {
      console.log('FAIL harness :: CDP 驗證腳本未回傳任何結果');
      process.exitCode = 1;
    } else if (failed === 0 && consoleNoise.length === 0) {
      console.log('N16_CDP_VERIFIED (static SSOT + 5 real questions × interactive clock/calendar demos + full flow) — ALL PASS');
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
