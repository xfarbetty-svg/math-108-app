/**
 * tools/verify_n14.js — G1-N-1-4 錢幣解題單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：N-1-4.json 5 題真題欄位完整、5 個教具檔案存在且金額算式與真卷一致、
 *     curriculum.json N-1-4 = ready / question_count 5 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 N-1-4 ready 卡 → 逐題導航 5 題，
 *     每題 iframe 教具掛載正確、實機操作教具（拿出 6 個 10 元／湊 46 元／點數兩皮夾／補 15 元／換錢數數）
 *     → success 反饋、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n14.js [--port=9447]
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
  return a ? Number(a.split('=')[1]) : 9447;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const unit = JSON.parse(fs.readFileSync('data/units/G1/N-1-4.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 5, 'N-1-4 題庫 = 5 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 5, 'N-1-4 question_count = 5');
// 與任務卡 task_g1_n14_coins.md 指定三份真卷逐題核對的期望值
const EXPECTED = [
  { title: '大雄買杯子蛋糕', comp: 'coin_cake_pay_demo.html', choices: 4,
    exprs: ['TARGET = 58', 'COIN_COUNT = 8'] },
  { title: '早餐剛好 46 元', comp: 'exact_change_breakfast_demo.html', choices: 4,
    exprs: ['TARGET = 46'] },
  { title: '小光和小日', comp: 'wallet_compare_demo.html', choices: 4,
    exprs: ['tens: 4, ones: 3, total: 43', 'tens: 3, ones: 8, total: 38'] },
  { title: '珍珠買早餐', comp: 'coin_supplement_demo.html', choices: 4,
    exprs: ['HAVE = 45, TARGET = 60'] },
  { title: '換錢大作戰', comp: 'coin_exchange_demo.html', choices: 4,
    exprs: ['outCount: 5', 'outCount: 2'] }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes('期末'), `Q${i + 1} 真題來源掛期末試卷 → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === e.choices, `Q${i + 1} 選項數 = ${e.choices}（實際 ${Array.isArray(q.choices) ? q.choices.length : '無'}）`);
  sok(q.answer_index === 0, `Q${i + 1} answer_index = 0`);
  sok(!!q.answer_raw && q.answer_raw.length > 5, `Q${i + 1} answer_raw 完整`);
  sok(q.fallback_height >= 360 && q.fallback_height <= 500, `Q${i + 1} fallback_height 在單屏範圍 → ${q.fallback_height}`);
  sok(!!q.stem && q.stem.length > 10, `Q${i + 1} 題幹完整`);
  sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${i + 1} 算理解析（concept/steps/trap）完整`);
  const p = 'app/' + q.component_path;
  const html = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  sok(fs.existsSync(p) && q.component_path.includes(e.comp), `Q${i + 1} 教具檔案存在 → ${p}`);
  sok(html.includes('source-tag'), `Q${i + 1} 教具掛真題來源幽靈字`);
  e.exprs.forEach((ex) => sok(html.includes(ex), `Q${i + 1} 教具金額算式對齊真卷 → ${ex}`));
});
const meta = curriculum.grades[0].units.find((u) => u.code === 'N-1-4');
sok(!!meta, 'curriculum.json 有 N-1-4 條目');
sok(meta && meta.status === 'ready', 'N-1-4 status = ready');
sok(meta && meta.question_count === 5, 'N-1-4 question_count = 5');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期末'), 'N-1-4 verified_source 已掛真題來源');

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n14-verify-'));
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
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const expected = ${JSON.stringify(EXPECTED)};

      // 1. G1 單元列表：N-1-4 變 ready
      let cards = [], n14 = null;
      for (let t = 0; t < 30; t++) {
        cards = [...document.querySelectorAll('#gradeView .unit-card')];
        n14 = cards.find((c) => c.dataset.code === 'N-1-4');
        if (n14 && !n14.disabled) break;
        await sleep(200);
      }
      results.push('DEBUG cards=' + cards.length + ' [' + cards.map((c) => c.dataset.code).join(',') + ']');
      ok(!!n14 && !n14.disabled, 'N-1-4 卡片為 ready 且可點擊');
      ok(n14.querySelector('.hint').textContent.includes('5 題真題'), 'N-1-4 卡片顯示「5 題真題」');

      // 2. 開啟 N-1-4 測驗舞台
      n14.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 N-1-4 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 5 題', '題號顯示「第 1 / 5 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('期末'), '真題來源顯示期末試卷 → ' + src0);

      // 3. 逐題：iframe 掛載正確教具 → 實機操作
      const frame = document.getElementById('stageFrame');
      const READY_SELECTOR = ['.btn-check', '#addTen', '.opt-btn', '#addTen', '#btn50'];
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
          // Q1 大雄買蛋糕：先拿 5 個 → 不夠；再拿 1 個湊 6 個 → 夠付找 2 元
          const coins = doc.querySelectorAll('#wallet .coin-item');
          ok(coins.length === 8, '第 1 題教具：錢包有 8 個 10 元（真卷原題）');
          for (let k = 0; k < 5; k++) { coins[k].click(); await sleep(40); }
          ok(doc.getElementById('feedback').textContent.includes('還差 8 元'), '第 1 題實機互動：拿 5 個＝50 元，即時反饋「還差 8 元，不夠付」');
          doc.querySelector('.btn-check').click();
          await sleep(80);
          ok(doc.getElementById('resultBanner').classList.contains('fail'), '第 1 題檢查：5 個不夠 → fail 提示');
          coins[5].click();
          await sleep(60);
          ok(doc.getElementById('feedback').textContent.includes('找 2 元'), '第 1 題實機互動：拿 6 個＝60 元，反饋「老闆會找 2 元」');
          doc.querySelector('.btn-check').click();
          await sleep(80);
          ok(doc.getElementById('resultBanner').classList.contains('success'), '第 1 題檢查 → success banner「最少答案！6 個 10 元」');
        } else if (i === 1) {
          // Q2 早餐 46 元：4 個 10 元＋6 個 1 元 → 剛好；拿回 1 個 1 元 → 差 1 元；再補回 → 剛好
          const addTen = doc.getElementById('addTen'), addOne = doc.getElementById('addOne');
          for (let k = 0; k < 4; k++) { addTen.click(); await sleep(30); }
          for (let k = 0; k < 6; k++) { addOne.click(); await sleep(30); }
          ok(doc.getElementById('totalAmt').textContent === '46', '第 2 題實機互動：托盤合計 46 元');
          ok(doc.getElementById('feedback').textContent.includes('剛好 46 元'), '第 2 題即時反饋：「剛好 46 元（4 個 10 元、6 個 1 元）」');
          const trayCoin = doc.querySelector('#tray .tray-coin');
          const lastOne = [...doc.querySelectorAll('#tray .tray-coin')].pop();
          lastOne.click();
          await sleep(60);
          ok(doc.getElementById('feedback').textContent.includes('還差 1 元'), '第 2 題實機互動：點托盤 1 元收回 → 反饋「還差 1 元」');
          addOne.click();
          await sleep(60);
          ok(doc.getElementById('feedback').textContent.includes('剛好 46 元'), '第 2 題實機互動：再補 1 個 1 元 → 重新剛好 46 元');
        } else if (i === 2) {
          // Q3 小光 vs 小日：逐顆點數兩個皮夾 → 統計 43 / 38 → 選「小光比較多」
          const cg = doc.querySelectorAll('#coinsXiaoguang .coin-item');
          const cr = doc.querySelectorAll('#coinsXiaori .coin-item');
          ok(cg.length === 7 && cr.length === 11, '第 3 題教具：小光 7 顆硬幣、小日 11 顆硬幣（真卷原題）');
          cg.forEach((c) => { c.click(); });
          await sleep(60);
          cr.forEach((c) => { c.click(); });
          await sleep(60);
          ok(doc.getElementById('tallyXiaoguang').textContent.includes('43 元'), '第 3 題實機互動：小光全部數完＝43 元');
          ok(doc.getElementById('tallyXiaori').textContent.includes('38 元'), '第 3 題實機互動：小日全部數完＝38 元');
          doc.querySelectorAll('.opt-btn')[0].click();
          await sleep(80);
          ok(doc.getElementById('resultBanner').classList.contains('success'), '第 3 題答題 → success 反饋「43＞38，小光比較多」');
        } else if (i === 3) {
          // Q4 珍珠補錢：補 1 個 10 元＋1 個 5 元 → 剛好 15 元、總額 60
          ok(doc.getElementById('formulaLine').textContent.includes('還差 15 元'), '第 4 題教具：初始 45 元，還差 15 元');
          doc.getElementById('addTen').click();
          await sleep(40);
          doc.getElementById('addFive').click();
          await sleep(60);
          ok(doc.getElementById('formulaLine').textContent.includes('＝ 60'), '第 4 題實機互動：45＋15＝60 顯示在算式列');
          ok(doc.getElementById('feedback').textContent.includes('剛好補了 15 元'), '第 4 題即時反饋：「剛好補了 15 元（1 個 10 元＋1 個 5 元）」');
        } else {
          // Q5 換錢：50→5 個 10 元、10→2 個 5 元，逐顆點數確認等值
          doc.getElementById('btn50').click();
          await sleep(600);
          const out50 = doc.querySelectorAll('#zone50 .out-coin');
          ok(out50.length === 5, '第 5 題實機互動：50 元換開 → 彈出 5 個 10 元');
          ok(doc.getElementById('eq50').textContent.includes('5 個 10 元'), '第 5 題等值式：50 元＝5 個 10 元');
          out50.forEach((c) => c.click());
          await sleep(80);
          ok(doc.querySelector('#zone50 .count-line').textContent.includes('剛好等於 50 元'), '第 5 題實機互動：點數 5 個 10 元＝50 元 ✓');
          doc.getElementById('btn10').click();
          await sleep(400);
          const out10 = doc.querySelectorAll('#zone10 .out-coin');
          ok(out10.length === 2, '第 5 題實機互動：10 元換開 → 彈出 2 個 5 元');
          out10.forEach((c) => c.click());
          await sleep(80);
          ok(doc.querySelector('#zone10 .count-line').textContent.includes('剛好等於 10 元'), '第 5 題實機互動：點數 2 個 5 元＝10 元 ✓');
        }

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
      ok(rv.includes('G1-N-1-4') && rv.includes('期末'), '結算標頭掛單元與真題來源');

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
      console.log('N14_CDP_VERIFIED (static SSOT + 5 real questions × interactive coin demos + full flow) — ALL PASS');
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
