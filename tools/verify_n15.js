/**
 * tools/verify_n15.js — G1-N-1-5 長度單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：N-1-5.json 5 題真題欄位完整、5 個教具檔案存在且長度算理與真卷一致、
 *     curriculum.json N-1-5 = ready / question_count 5 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 N-1-5 ready 卡 → 逐題導航 5 題，
 *     每題 iframe 教具掛載正確、實機操作教具（對齊基準線／拉直緞帶／展開剩繩／點數迴紋針／拼合積木）
 *     → success 反饋、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n15.js [--port=9451]
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
  return a ? Number(a.split('=')[1]) : 9451;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const unit = JSON.parse(fs.readFileSync('data/units/G1/N-1-5.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 5, 'N-1-5 題庫 = 5 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 5, 'N-1-5 question_count = 5');
// 與任務卡 task_g1_n15_length.md 指定兩份真卷逐題核對的期望值
const EXPECTED = [
  { title: '基準線對齊破招', comp: 'stationery_baseline_align_demo.html', choices: 3,
    exprs: ['對齊基準線', '紅鉛筆比較長'] },
  { title: '拉直破招', comp: 'curved_ribbon_stretch_demo.html', choices: 3,
    exprs: ['拉直緞帶', '紅緞帶比較長'] },
  { title: '腰圍', comp: 'rope_waist_measure_demo.html', choices: 3,
    exprs: ['剩下的繩子', '大熊的腰圍比較長'] },
  { title: '迴紋針', comp: 'paperclip_unit_measure_demo.html', choices: 4,
    exprs: ['6－4＝2', '長 2 個迴紋針'] },
  { title: '方格', comp: 'block_chain_add_demo.html', choices: 4,
    exprs: ['8 ＋ 3 ＝ 11', '11 個□'] }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes('期中'), `Q${i + 1} 真題來源掛期中試卷 → ${q.exam_source}`);
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
const meta = curriculum.grades[0].units.find((u) => u.code === 'N-1-5');
sok(!!meta, 'curriculum.json 有 N-1-5 條目');
sok(meta && meta.status === 'ready', 'N-1-5 status = ready');
sok(meta && meta.question_count === 5, 'N-1-5 question_count = 5');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期中'), 'N-1-5 verified_source 已掛真題來源');

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n15-verify-'));
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

      // 1. G1 單元列表：N-1-5 變 ready
      let cards = [], n15 = null;
      for (let t = 0; t < 30; t++) {
        cards = [...document.querySelectorAll('#gradeView .unit-card')];
        n15 = cards.find((c) => c.dataset.code === 'N-1-5');
        if (n15 && !n15.disabled) break;
        await sleep(200);
      }
      results.push('DEBUG cards=' + cards.length + ' [' + cards.map((c) => c.dataset.code).join(',') + ']');
      ok(!!n15 && !n15.disabled, 'N-1-5 卡片為 ready 且可點擊');
      ok(n15.querySelector('.hint').textContent.includes('5 題真題'), 'N-1-5 卡片顯示「5 題真題」');

      // 2. 開啟 N-1-5 測驗舞台
      n15.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 N-1-5 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 5 題', '題號顯示「第 1 / 5 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('期中'), '真題來源顯示期中試卷 → ' + src0);

      // 3. 逐題：iframe 掛載正確教具 → 實機操作
      const frame = document.getElementById('stageFrame');
      const READY_SELECTOR = ['#alignBtn', '#stretchBtn', '#expandBtn', '.clip-item', '#mergeBtn'];
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
          // Q1 基準線對齊：先驗初始未對齊（紅右端 270 < 綠右端 340），對齊後翻轉
          const svg = doc.getElementById('deskSvg');
          const redT0 = doc.getElementById('redWrap').getAttribute('transform');
          const greenT0 = doc.getElementById('greenWrap').getAttribute('transform');
          ok(!svg.classList.contains('aligned') && redT0 !== greenT0, '第 1 題教具：初始兩筆起點未對齊（紅 x=40／綠 x=150）');
          doc.getElementById('alignBtn').click();
          await sleep(1000);
          ok(svg.classList.contains('aligned'), '第 1 題實機互動：基準線亮起');
          const redT1 = doc.getElementById('redWrap').getAttribute('transform');
          const greenT1 = doc.getElementById('greenWrap').getAttribute('transform');
          ok(redT1 === 'translate(70 70)' && greenT1 === 'translate(70 150)', '第 1 題實機互動：兩筆左端平移到 x=70 對齊');
          ok(doc.getElementById('pairNote').textContent.includes('紅鉛筆比綠鉛筆長'), '第 1 題即時反饋：「對齊基準線後，紅鉛筆比綠鉛筆長！」');
        } else if (i === 1) {
          // Q2 彎曲緞帶拉直：拉直後路徑右端延伸至 x=410（超出藍緞帶 x=370）
          const d0 = doc.getElementById('redRibbon').getAttribute('d');
          doc.getElementById('stretchBtn').click();
          await sleep(1200);
          const d1 = doc.getElementById('redRibbon').getAttribute('d');
          ok(d0 !== d1 && d1.includes('410'), '第 2 題實機互動：紅緞帶從波浪動態拉直（尾端延伸到 x=410）');
          ok(doc.getElementById('pairNote').textContent.includes('更長'), '第 2 題即時反饋：「紅緞帶拉直後更長！」');
        } else if (i === 2) {
          // Q3 等長繩子量腰圍：展開剩下的繩子 → 剩 5 cm vs 18 cm 反推
          const svg = doc.getElementById('beltSvg');
          ok(!svg.classList.contains('expanded'), '第 3 題教具：初始剩餘繩段隱藏');
          doc.getElementById('expandBtn').click();
          await sleep(800);
          ok(svg.classList.contains('expanded'), '第 3 題實機互動：剩下的繩子展開');
          const note = doc.getElementById('pairNote').textContent;
          ok(note.includes('5 cm') && note.includes('18 cm'), '第 3 題即時反饋：大熊剩 5 cm（用掉多）／小兔剩 18 cm（用掉少）');
        } else if (i === 3) {
          // Q4 迴紋針個別單位：依序點數毛筆 6 個＋剪刀 4 個 → 6－4＝2
          const bClips = doc.querySelectorAll('#deskSvg .clip-item[data-row="brush"]');
          const sClips = doc.querySelectorAll('#deskSvg .clip-item[data-row="scissor"]');
          ok(bClips.length === 6 && sClips.length === 4, '第 4 題教具：毛筆 6 個迴紋針、剪刀 4 個迴紋針（真卷原題）');
          bClips.forEach((c) => tap(c));
          sClips.forEach((c) => tap(c));
          await sleep(100);
          const tally = doc.getElementById('tallyLine').textContent;
          ok(tally.includes('6－4＝2') && tally.includes('長 2 個迴紋針'), '第 4 題實機互動：12 個迴紋針依序標號後，算理「6－4＝2，長 2 個」');
          // 越序點數防呆：已標號的再點不重複計數
          tap(bClips[0]);
          await sleep(50);
          ok(doc.getElementById('tallyLine').textContent.includes('6－4＝2'), '第 4 題防呆：重複點擊不會破壞已完成的點數');
        } else {
          // Q5 方格積木拼合：8 綠＋3 橘 → 對接成一列 11 格 → 逐格點數 → 8 ＋ 3 ＝ 11
          const greens = doc.querySelectorAll('#greenGroup .blk');
          const oranges = doc.querySelectorAll('#orangeGroup .blk');
          ok(greens.length === 8 && oranges.length === 3, '第 5 題教具：彩色筆 8 個綠□、橡皮擦 3 個橘□（真卷原題）');
          doc.getElementById('mergeBtn').click();
          await sleep(1200);
          const oT = doc.getElementById('orangeGroup').getAttribute('transform');
          ok(oT.includes('360') && oT.includes('52'), '第 5 題實機互動：橘□列平移對接到綠□尾端（x=360, y=52）');
          [...greens, ...oranges].forEach((b) => tap(b));
          await sleep(100);
          ok(doc.querySelectorAll('#blockSvg .blk.counted').length === 11, '第 5 題實機互動：11 格積木逐格點數標號 1~11');
          ok(doc.getElementById('formulaLine').textContent.includes('11'), '第 5 題即時反饋：數完了！合起來和 11 個□一樣長');
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
      ok(rv.includes('G1-N-1-5') && rv.includes('期中'), '結算標頭掛單元與真題來源');

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
      console.log('N15_CDP_VERIFIED (static SSOT + 5 real questions × interactive length demos + full flow) — ALL PASS');
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
