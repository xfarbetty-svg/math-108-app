/**
 * tools/verify_s12.js — G1-S-1-2 形體的操作 單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：S-1-2.json 5 題真題欄位完整、5 題皆掛 solid_shape_lab.html?q=N、
 *     教具含五模式互動掛鉤、curriculum.json S-1-2 = ready / question_count 5 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 S-1-2 ready 卡 → 逐題導航 5 題，
 *     每題 iframe 教具掛載正確、實機操作（滾動/堆高、蓋印、點數積木＋X-Ray、拼圖卡旋轉、火車點亮）
 *     → result success 反饋、console 雜訊 = 0、手機 390px 單屏高度 ≤ 450px。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_s12.js [--port=9452]
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
  return a ? Number(a.split('=')[1]) : 9452;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- A. 靜態 SSOT 契約 ---------------- */
const staticResults = [];
const sok = (c, m) => staticResults.push((c ? 'PASS ' : 'FAIL ') + '[static] ' + m);

const unit = JSON.parse(fs.readFileSync('data/units/G1/S-1-2.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 5, 'S-1-2 題庫 = 5 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 5, 'S-1-2 question_count = 5');
sok(unit.curriculum_code === 'S-1-2' && unit.grade === 1, '單元代碼 G1-S-1-2 正確');
const EXPECTED = [
  { ready: '#btnRoll', exprs: ['btnRoll', 'btnStack', '滾動測試', '堆高測試'] },
  { ready: '#stampRow .chip[data-kind="cyl"]', exprs: ['stamps', 'stamp-pop', '圓柱'] },
  { ready: '#blkTop', exprs: ['isoSvg', 'hiddenFace', 'X-Ray', '已點數'] },
  { ready: '#btnRotA', exprs: ['cardA', 'cardB', 'targetRect', '斜邊對斜邊'] },
  { ready: '.shape-btn[data-shape="circle"]', exprs: ['trainSvg', 'data-shape="circle"', 'data-shape="rect"', 'data-shape="sq"', 'data-shape="tri"'] }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(!!q.title && q.title.length > 4, `Q${i + 1} 標題完整 → ${q.title}`);
  sok(!!q.exam_source && q.exam_source.length > 4, `Q${i + 1} 真題來源 → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === 4, `Q${i + 1} 選項數 = 4`);
  sok(q.answer_index === 0, `Q${i + 1} answer_index = 0`);
  sok(!!q.answer_raw && q.answer_raw.length > 5, `Q${i + 1} answer_raw 完整`);
  sok(q.fallback_height >= 360 && q.fallback_height <= 460, `Q${i + 1} fallback_height 在單屏範圍 → ${q.fallback_height}`);
  sok(!!q.stem && q.stem.length > 10, `Q${i + 1} 題幹完整`);
  sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${i + 1} 算理解析（concept/steps/trap）完整`);
  sok(q.component_path === 'components/solid_shape_lab.html?q=' + (i + 1), `Q${i + 1} 掛載核心教具 ?q=${i + 1} → ${q.component_path}`);
  const p = 'app/' + q.component_path.split('?')[0];
  const html = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  sok(fs.existsSync(p), `Q${i + 1} 教具檔案存在 → ${p}`);
  e.exprs.forEach((ex) => sok(html.includes(ex), `Q${i + 1} 教具互動掛鉤存在 → ${ex}`));
  sok(html.includes('source-tag') || html.includes('qSource'), `Q${i + 1} 教具掛真題來源幽靈字`);
});
const meta = curriculum.grades[0].units.find((u) => u.code === 'S-1-2');
sok(!!meta, 'curriculum.json 有 S-1-2 條目');
sok(meta && meta.status === 'ready', 'S-1-2 status = ready');
sok(meta && meta.question_count === 5, 'S-1-2 question_count = 5');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期'), 'S-1-2 verified_source 已掛真題來源');

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 's12-verify-'));
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
    // 手機 390px 單屏模擬（One-Screen 憲法量測基準）
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });
    await sleep(800); // 等 init() fetch curriculum.json

    const body = `(async () => {
      const results = [];
      const ok = (c, m) => results.push((c ? 'PASS ' : 'FAIL ') + m);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const READY = ${JSON.stringify(EXPECTED.map((e) => e.ready))};
      const tap = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })); // SVG <g> 無 .click()

      // 1. G1 單元列表：S-1-2 變 ready
      let cards = [], s12 = null;
      for (let t = 0; t < 30; t++) {
        cards = [...document.querySelectorAll('#gradeView .unit-card')];
        s12 = cards.find((c) => c.dataset.code === 'S-1-2');
        if (s12 && !s12.disabled) break;
        await sleep(200);
      }
      results.push('DEBUG cards=' + cards.length + ' [' + cards.map((c) => c.dataset.code).join(',') + ']');
      ok(!!s12 && !s12.disabled, 'S-1-2 卡片為 ready 且可點擊');
      ok(s12.querySelector('.hint').textContent.includes('5 題真題'), 'S-1-2 卡片顯示「5 題真題」');

      // 2. 開啟 S-1-2 測驗舞台
      s12.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 S-1-2 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 5 題', '題號顯示「第 1 / 5 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('形體的操作'), '真題來源顯示形體的操作 → ' + src0);

      // 3. 逐題：iframe 掛載 solid_shape_lab?q=N → 實機操作
      const frame = document.getElementById('stageFrame');
      const heights = [];
      for (let i = 0; i < 5; i++) {
        let doc = null, tries = 0;
        while (tries++ < 40) {
          try {
            doc = frame.contentDocument;
            if (doc && doc.readyState === 'complete' && doc.querySelector(READY[i])) break;
          } catch (_err) { /* 跨域瞬間 */ }
          await sleep(150);
        }
        ok(!!doc && !!doc.querySelector(READY[i]), '第 ' + (i + 1) + ' 題教具 iframe 載入完成');
        ok(frame.getAttribute('src').includes('solid_shape_lab.html?q=' + (i + 1)), '第 ' + (i + 1) + ' 題掛載 solid_shape_lab.html?q=' + (i + 1) + ' → src=' + frame.getAttribute('src'));
        const app = doc.querySelector('#app');
        const h = app ? Math.ceil(app.getBoundingClientRect().height) : 9999;
        heights.push(h);
        ok(h <= 450, '第 ' + (i + 1) + ' 題教具單屏高度 ≤ 450px → 實際 ' + h + 'px');

        if (i === 0) {
          // Q1 滾動與堆高：皮球滾下坡 → 木積木堆高穩 → 圓柱橫放/立放切換
          doc.getElementById('chipBall').click();
          doc.getElementById('btnRoll').click();
          await sleep(1000);
          const t1 = doc.getElementById('obBall').style.transform;
          ok(t1.includes('89px'), '第 1 題實機互動：皮球滾下坡到地面 → ' + t1);
          ok(doc.getElementById('note1').textContent.includes('滾下坡'), '第 1 題即時反饋：球體最會滾動');
          doc.getElementById('chipCube').click();
          doc.getElementById('btnStack').click();
          await sleep(900);
          ok(doc.getElementById('stCube').style.opacity === '1', '第 1 題實機互動：木積木疊上平台');
          ok(doc.getElementById('note1').textContent.includes('堆高'), '第 1 題即時反饋：正方體最容易堆高');
          doc.getElementById('chipCyl').click();
          ok(!!doc.getElementById('btnCylFlip'), '第 1 題實機互動：選圓柱出現橫放/立放切換');
          doc.getElementById('btnCylFlip').click();
          ok(doc.getElementById('obCylS').style.display !== 'none', '第 1 題實機互動：切換成圓柱立放');
        } else if (i === 1) {
          // Q2 蓋印描描看：圓柱印章 → 三角柱印章 → 擦乾淨
          doc.querySelector('#stampRow .chip[data-kind="cyl"]').click();
          await sleep(250);
          ok(doc.querySelectorAll('#stamps .stamped').length === 1, '第 2 題實機互動：圓柱蓋印 → 紙上出現 1 個印');
          ok(doc.getElementById('note2').textContent.includes('圓形'), '第 2 題即時反饋：圓柱底面 → 圓形');
          doc.querySelector('#stampRow .chip[data-kind="tri"]').click();
          await sleep(250);
          ok(doc.querySelectorAll('#stamps .stamped').length === 2, '第 2 題實機互動：三角柱蓋印 → 紙上出現第 2 個印');
          ok(doc.getElementById('note2').textContent.includes('三角形'), '第 2 題即時反饋：三角柱底面 → 三角形');
          doc.getElementById('btnClear').click();
          ok(doc.querySelectorAll('#stamps .stamped').length === 0, '第 2 題實機互動：擦乾淨 → 印章全數清除');
        } else if (i === 2) {
          // Q3 積木點數：點 2 塊 → 計數 2/4 → X-Ray → 點滿 4 塊
          tap(doc.getElementById('blkBottom'));
          tap(doc.getElementById('blkTop'));
          await sleep(100);
          ok(doc.getElementById('blkBottom').classList.contains('lit'), '第 3 題實機互動：積木點亮金光');
          ok(doc.getElementById('countChip').textContent.includes('2 / 4'), '第 3 題即時計數：已點數 2 / 4 → ' + doc.getElementById('countChip').textContent.trim());
          doc.getElementById('btnXray').click();
          await sleep(300);
          ok(doc.getElementById('isoSvg').classList.contains('xray'), '第 3 題實機互動：X-Ray 光透開啟');
          ok(Number(getComputedStyle(doc.getElementById('hiddenFace')).opacity) > 0, '第 3 題即時反饋：被壓住的底面虛線浮現');
          tap(doc.getElementById('blkRight'));
          tap(doc.getElementById('blkLeft'));
          await sleep(100);
          ok(doc.getElementById('countChip').textContent.includes('4 / 4'), '第 3 題即時計數：已點數 4 / 4');
          ok(doc.getElementById('note3').textContent.includes('4 個正方體積木'), '第 3 題即時反饋：城堡一共 4 個積木');
        } else if (i === 3) {
          // Q4 拼圖卡：ㄅ 1→2、ㄆ 2→3→0 → 斜邊對斜邊拼成長方形
          const t0 = doc.getElementById('cardA').style.transform;
          ok(t0.includes('rotate(90deg)'), '第 4 題教具：ㄅ 初始 90° 待轉正 → ' + t0);
          doc.getElementById('btnRotA').click();
          await sleep(150);
          ok(doc.getElementById('note4').textContent.includes('還沒'), '第 4 題即時反饋：只轉ㄅ還拼不起來');
          doc.getElementById('btnRotB').click();
          doc.getElementById('btnRotB').click();
          await sleep(1100);
          ok(doc.getElementById('targetRect').classList.contains('done'), '第 4 題實機互動：兩片拼合 → 目標長方形亮金');
          ok(doc.getElementById('cardA').style.transform.includes('scale(2)'), '第 4 題實機互動：圖卡飛入目標框放大拼合');
          ok(doc.getElementById('note4').textContent.includes('長方形'), '第 4 題即時反饋：斜邊對斜邊拼成長方形');
        } else {
          // Q5 幾何火車：點圓形 → 4 個亮起；點正方形 → 3 個亮起
          doc.querySelector('.shape-btn[data-shape="circle"]').click();
          await sleep(150);
          ok(doc.querySelectorAll('#stage5 .sh.hl').length === 4, '第 5 題實機互動：點圓形 → 4 個車輪一起發亮');
          ok(doc.getElementById('note5').textContent.includes('4 個'), '第 5 題即時統計：圓形 4 個');
          doc.querySelector('.shape-btn[data-shape="sq"]').click();
          await sleep(150);
          ok(doc.querySelectorAll('#stage5 .sh.hl').length === 3, '第 5 題實機互動：點正方形 → 3 個車窗發亮');
          ok(doc.getElementById('note5').textContent.includes('3 個'), '第 5 題即時統計：正方形 3 個');
        }

        // 每題都實機答題：選正解 → 檢查 → success 反饋
        const opts = doc.querySelectorAll('#opts' + (i + 1) + ' .opt-btn');
        opts[0].click();
        await sleep(60);
        doc.getElementById('check' + (i + 1)).click();
        await sleep(80);
        ok(doc.getElementById('result' + (i + 1)).classList.contains('success'), '第 ' + (i + 1) + ' 題答題 → success 反饋');

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
      ok(rv.includes('S-1-2') && rv.includes('期'), '結算標頭掛單元與真題來源');

      return results.concat(['HEIGHTS=' + heights.join(',')]);
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
      console.log('S12_CDP_VERIFIED (static SSOT + 5 real questions × solid_shape_lab interactions + full flow) — ALL PASS');
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
