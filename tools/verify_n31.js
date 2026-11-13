/**
 * tools/verify_n31.js — G3-N-3-1 一萬以內的數單元 CDP 實機驗證閘門（10 題完整版）
 * 驗證：
 *  A. 靜態 SSOT 契約：N-3-1.json 10 題真題、前 5 永安 / 後 5 內湖、
 *     curriculum.json N-3-1 = ready / question_count 10 / verified_source 含內湖。
 *  B. CDP 實機（390x844）：逐題導航 10 題，iframe 載入、單屏高度 ≤ 450px、答題 success 反饋、結算 10 題。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-1.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 10, 'N-3-1 題庫 = 10 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 10, 'N-3-1 question_count = 10');

const EXPECTED = [
  { q: 1, title: '5 個千和 3 個十', comp: '?q=1', choices: 2, source: '永安', exprs: ['blk1000', 'expandFormula'] },
  { q: 2, title: '2356', comp: '?q=2', choices: 4, source: '永安', exprs: ['digit-tile', 'liftDigit'] },
  { q: 3, title: '跳數', comp: '?q=3', choices: 4, source: '永安', exprs: ['car', 'fillCars'] },
  { q: 4, title: '八千零六', comp: '?q=4', choices: 4, source: '永安', exprs: ['word-btn', 'placeWord'] },
  { q: 5, title: '大小比', comp: '?q=5', choices: 4, source: '永安', exprs: ['cmp-num', 'cmpStep'] },
  { q: 6, title: '數字卡排排看', comp: '?q=6', choices: 4, source: '內湖', exprs: ['card-slot', 'arrangeCards'] },
  { q: 7, title: '錢幣的合起來', comp: '?q=7', choices: 4, source: '內湖', exprs: ['coin-area', 'sumCoins'] },
  { q: 8, title: '最大與最小數的差', comp: '?q=8', choices: 4, source: '內湖', exprs: ['diff-calc', 'calcDiff'] },
  { q: 9, title: '數的規律填空', comp: '?q=9', choices: 4, source: '內湖', exprs: ['rule-input', 'findRule'] },
  { q: 10, title: '位值組合與進位', comp: '?q=10', choices: 4, source: '內湖', exprs: ['carry-box', 'combineCarry'] }
];

unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  const idNum = (i + 1).toString().padStart(2, '0');
  sok(q.id === 'G3-N-3-1-Q' + idNum, `Q${i + 1} id = G3-N-3-1-Q${idNum}`);
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes(e.source), `Q${i + 1} 真題來源掛${e.source} → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === e.choices, `Q${i + 1} 選項數 = ${e.choices}`);
  sok(q.answer_index === 0, `Q${i + 1} answer_index = 0`);
  sok(q.fallback_height >= 360 && q.fallback_height <= 450, `Q${i + 1} fallback_height 合規 → ${q.fallback_height}`);
  const p = 'app/' + q.component_path;
  sok(fs.existsSync(p.split('?')[0]), `Q${i + 1} 教具檔案存在`);
  sok(q.component_path.includes(e.comp), `Q${i + 1} 教具模式參數正確 → ${q.component_path}`);
});

const html = fs.readFileSync('app/components/ten_thousand_lab.html', 'utf8');
EXPECTED.forEach((e) => {
  sok(html.includes(e.exprs[0]), `教具 q=${e.q} 模式關鍵結構 → ${e.exprs[0]}`);
  sok(html.includes(e.exprs[e.exprs.length - 1]), `教具 q=${e.q} 模式互動函式 → ${e.exprs[e.exprs.length - 1]}`);
});

const meta = curriculum.grades.find((g) => g.grade === 3).units.find((u) => u.code === 'N-3-1');
sok(meta && meta.status === 'ready', 'N-3-1 status = ready');
sok(meta && meta.question_count === 10, 'N-3-1 question_count = 10');
sok(meta && meta.verified_source.includes('內湖'), 'N-3-1 verified_source 已包含內湖國小');

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
      let fp = path.join(process.cwd(), urlPath === '/' ? 'app/index.html' : urlPath.replace(/^\//, ''));
      try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html'); } catch (_e) {}
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();
        const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
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
      const page = list.find((t) => t.type === 'page' && t.url.includes('/app/index.html'));
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) {}
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
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error))); else res(msg.result);
      } else if (msg.method) { for (const fn of listeners) fn(msg); }
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n31-verify-'));
  const chrome = findChrome();
  const pageUrl = `http://127.0.0.1:${httpPort}/app/index.html`;
  const proc = spawn(chrome, [
    '--headless=new', '--remote-debugging-port=' + argsPort,
    `--user-data-dir=${profile}`, '--window-size=390,844', pageUrl
  ], { stdio: 'ignore' });

  let ws;
  const consoleNoise = [];
  try {
    const target = await waitForTarget(argsPort, 20000);
    ws = await connect(target.webSocketDebuggerUrl);
    ws.on((msg) => {
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        consoleNoise.push('[console.' + msg.params.type + '] ' + msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });
    await ws.send('Page.enable');
    await ws.send('Runtime.enable');
    await sleep(2000);

    const body = `(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      let g3btn = [...document.querySelectorAll('#gradeNav .grade-btn')].find((b) => b.textContent.includes('三年級'));
      if (g3btn) g3btn.click();
      await sleep(800);

      let n31 = [...document.querySelectorAll('#gradeView .unit-card')].find((c) => c.dataset.code === 'N-3-1');
      ok(!!n31 && !n31.disabled, 'N-3-1 卡片可點擊');
      ok(n31.querySelector('.hint').textContent.includes('10 題真題'), '卡片顯示 10 題真題');

      n31.click();
      await sleep(1000);

      const num = document.getElementById('progressNum');
      const READY_SELECTOR = ['#expandBtn', '#selKBtn', '#arrowBtn', '#wKBtn', '#tab1Btn', '#sortBtn', '#coinBtn', '#diffBtn', '#ruleBtn', '#carryBtn'];

      for (let i = 0; i < 10; i++) {
        ok(num.textContent.includes('第 ' + (i + 1) + ' / 10 題'), '題號正確: ' + num.textContent);
        const src = document.getElementById('progressSource').textContent;
        ok(src.includes(i < 5 ? '永安' : '內湖'), '來源正確: ' + src);

        const frame = document.getElementById('stageFrame');
        let doc = null;
        for(let t=0; t<40; t++) {
          try { doc = frame.contentDocument; if(doc && doc.querySelector(READY_SELECTOR[i])) break; } catch(e){}
          await sleep(150);
        }
        ok(!!doc, '第 ' + (i+1) + ' 題 iframe 載入');

        const ch = doc.querySelector('.container').getBoundingClientRect().height;
        ok(ch <= 450, '第 ' + (i+1) + ' 題高度 ' + Math.round(ch) + 'px ≤ 450px');

        const opts = doc.querySelectorAll('.opt-btn');
        if (opts.length > 0) {
          opts[0].click();
          await sleep(100);
          doc.querySelector('.check-btn').click();
          await sleep(200);
          ok(doc.getElementById('resultBanner').classList.contains('success'), '第 ' + (i+1) + ' 題答題成功');
        }

        if (i < 9) {
          document.getElementById('btnNext').click();
          await sleep(800);
        }
      }

      document.getElementById('btnFinish').click();
      await sleep(300);
      ok(document.getElementById('resultView').style.display === 'block', '顯示結算頁');
      ok(document.querySelectorAll('#resultView .result-item').length === 10, '結算 10 題');

      return results;
    })()`;

    const res = await ws.send('Runtime.evaluate', { expression: body, awaitPromise: true, returnByValue: true });
    const results = staticResults.concat(res.result.value || []);
    for (const line of results) console.log(line);
    const failed = results.filter((l) => String(l).startsWith('FAIL')).length;
    if (failed === 0 && consoleNoise.length === 0) {
      console.log('N31_FULL_VERIFIED — ALL PASS');
      process.exitCode = 0;
    } else {
      console.log('FAILED :: FAIL=' + failed + ', NOISE=' + consoleNoise.length);
      process.exitCode = 1;
    }
  } catch (e) {
    console.log('FAIL harness :: ' + e.message);
    process.exitCode = 1;
  } finally {
    try { if (ws) await ws.send('Browser.close', {}); } catch (e) {}
    proc.kill();
    server.close();
  }
}

main();