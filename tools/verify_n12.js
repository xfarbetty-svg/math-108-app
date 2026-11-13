/**
 * tools/verify_n12.js — G1-N-1-2 單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：N-1-2.json 4 題真題欄位完整、4 個教具檔案存在、
 *     curriculum.json N-1-2 = ready / question_count 4 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 N-1-2 ready 卡 → 逐題導航 4 題，
 *     每題 iframe 教具掛載正確、實際點擊正解選項＋檢查 → success banner、
 *     交卷結算 4 題回顧、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n12.js [--port=9445]
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
  return a ? Number(a.split('=')[1]) : 9445;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const unit = JSON.parse(fs.readFileSync('data/units/G1/N-1-2.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 4, 'N-1-2 題庫 = 4 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 4, 'N-1-2 question_count = 4');
const EXPECTED = [
  { title: '盤子裡的披薩', comp: 'pizza_combine_demo.html', ans: 0 },
  { title: '樹上的小鳥', comp: 'birds_on_tree_demo.html', ans: 1 },
  { title: '操場比一比', comp: 'playground_compare_demo.html', ans: 2 },
  { title: '小雯的 0 片餅乾', comp: 'cookie_zero_demo.html', ans: 0 }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes('114-1 期末'), `Q${i + 1} 真題來源掛忠孝 114-1 期末 → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === 4, `Q${i + 1} 4 個算式選項`);
  sok(q.answer_index === e.ans, `Q${i + 1} answer_index = ${e.ans}`);
  sok(!!q.stem && q.stem.length > 10, `Q${i + 1} 題幹完整`);
  sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${i + 1} 算理解析（concept/steps/trap）完整`);
  const p = 'app/' + q.component_path;
  sok(fs.existsSync(p) && q.component_path.includes(e.comp), `Q${i + 1} 教具檔案存在 → ${p}`);
  sok(fs.readFileSync(p, 'utf8').includes('source-tag'), `Q${i + 1} 教具掛真題來源幽靈字`);
});
const meta = curriculum.grades[0].units.find((u) => u.code === 'N-1-2');
sok(!!meta, 'curriculum.json 有 N-1-2 條目');
sok(meta && meta.status === 'ready', 'N-1-2 status = ready');
sok(meta && meta.question_count === 4, 'N-1-2 question_count = 4');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期末'), 'N-1-2 verified_source 已掛真題來源');

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n12-verify-'));
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

      // 1. G1 單元列表：N-1-1 與 N-1-2 皆 ready
      const cards = [...document.querySelectorAll('#gradeView .unit-card')];
      ok(cards.length === 11, 'G1 單元卡片 = 11（實際 ' + cards.length + '）');
      const n12 = cards.find((c) => c.dataset.code === 'N-1-2');
      ok(!!n12 && !n12.disabled, 'N-1-2 卡片為 ready 且可點擊');
      ok(n12.querySelector('.hint').textContent.includes('4 題真題'), 'N-1-2 卡片顯示「4 題真題」');

      // 2. 開啟 N-1-2 測驗舞台
      n12.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 N-1-2 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 4 題', '題號顯示「第 1 / 4 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('114-1 期末'), '真題來源顯示忠孝 114-1 期末 → ' + src0);

      // 3. 逐題：iframe 掛載正確教具 → 實機互動 → 點正解 → success
      const frame = document.getElementById('stageFrame');
      for (let i = 0; i < 4; i++) {
        const e = expected[i];
        // 等 iframe 載完（readyState complete + 4 顆選項按鈕）
        let doc = null, tries = 0;
        while (tries++ < 40) {
          try {
            doc = frame.contentDocument;
            if (doc && doc.readyState === 'complete' && doc.querySelectorAll('.opt-btn').length === 4) break;
          } catch (_err) { /* 跨域瞬間 */ }
          await sleep(150);
        }
        ok(!!doc && doc.querySelectorAll('.opt-btn').length === 4, '第 ' + (i + 1) + ' 題教具 iframe 載入完成（4 顆選項）');
        ok(frame.getAttribute('src').includes(e.comp), '第 ' + (i + 1) + ' 題掛載教具 ' + e.comp + ' → src=' + frame.getAttribute('src'));

        // 實機互動：點第一個可點教具元素（pizza slice / bird / kid / cookie）
        const vis = doc.querySelector('.slice-item,.bird-slot,.kid,.cookie-item');
        if (vis) { vis.click(); await sleep(80); ok(vis.classList.contains('counted') || vis.classList.contains('leftover'), '第 ' + (i + 1) + ' 題教具實機互動（點擊點數）生效'); }

        // 點正解選項 → 檢查 → success banner
        doc.querySelectorAll('.opt-btn')[e.ans].click();
        await sleep(60);
        ok(doc.querySelector('.opt-btn.active') === doc.querySelectorAll('.opt-btn')[e.ans], '第 ' + (i + 1) + ' 題正解選項高亮（index ' + e.ans + '）');
        doc.querySelector('.check-btn').click();
        await sleep(80);
        const banner = doc.querySelector('.result-banner');
        ok(banner.classList.contains('success'), '第 ' + (i + 1) + ' 題檢查 → success banner「' + banner.innerText.slice(0, 24) + '…」');

        // 導航下一題
        if (i < 3) {
          document.getElementById('btnNext').click();
          await sleep(600);
          ok(num.textContent === '第 ' + (i + 2) + ' / 4 題', '導航 → 題號「第 ' + (i + 2) + ' / 4 題」→ 實際「' + num.textContent + '」');
        }
      }

      // 4. 交卷結算
      document.getElementById('btnFinish').click();
      await sleep(150);
      ok(document.getElementById('resultView').style.display === 'block', '交卷結算顯示');
      ok(document.querySelectorAll('#resultView .result-item').length === 4, '結算 4 題回顧（正解＋算理）');
      const rv = document.getElementById('resultView').textContent;
      ok(rv.includes('G1-N-1-2') && rv.includes('期末'), '結算標頭掛單元與真題來源');

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
      console.log('N12_CDP_VERIFIED (static SSOT + 4 real questions × interactive demos + full flow) — ALL PASS');
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
