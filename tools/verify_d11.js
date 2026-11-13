/**
 * tools/verify_d11.js — G1-D-1-1 簡單分類單元 CDP 實機驗證閘門（本地 HTTP + 真實 Chrome/Edge）
 * 驗證：
 *  A. 靜態 SSOT 契約：D-1-1.json 4 題真題欄位完整、教具檔案存在且算理與真卷一致、
 *     curriculum.json D-1-1 = ready / question_count 4 / verified_source 有值。
 *  B. CDP 實機：index.html 開 G1 → 點 D-1-1 ready 卡 → 逐題導航 4 題，
 *     每題 iframe 教具掛載正確、實機操作教具（正字畫記／皇冠最受歡迎／虛線比較／動物差額／分類籃）
 *     → success 反饋、單屏高度 ≤ 460px、console 雜訊 = 0。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_d11.js [--port=9471]
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

const unit = JSON.parse(fs.readFileSync('data/units/G1/D-1-1.json', 'utf8'));
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));

sok(unit.questions.length === 4, 'D-1-1 題庫 = 4 題真題（實際 ' + unit.questions.length + '）');
sok(unit.question_count === 4, 'D-1-1 question_count = 4');
// 與任務卡 task_g1_d11_data.md 指定真卷逐題核對的期望值
const EXPECTED = [
  { title: '四月天氣', comp: 'tally_sorting_board.html', choices: 4,
    exprs: ['正', '晴天 5 天', '陰天 3 天', '雨天 2 天'] },
  { title: '最受歡迎的自製玩具', comp: 'tally_sorting_board.html', choices: 4,
    exprs: ['紙飛機', '龍捲風', '7 － 3 ＝ 4'] },
  { title: '小動物票選大會', comp: 'tally_sorting_board.html', choices: 4,
    exprs: ['小狗', '兔子', '8 － 3 ＝ 5'] },
  { title: '水果與文具分類籃', comp: 'tally_sorting_board.html', choices: 4,
    exprs: ['水果籃', '文具盒', '蘋果', '鉛筆'] }
];
unit.questions.forEach((q, i) => {
  const e = EXPECTED[i];
  sok(q.title.includes(e.title), `Q${i + 1} 標題含「${e.title}」→ ${q.title}`);
  sok(q.exam_source.includes('期末') || q.exam_source.includes('期中'), `Q${i + 1} 真題來源掛真實試卷 → ${q.exam_source}`);
  sok(Array.isArray(q.choices) && q.choices.length === e.choices, `Q${i + 1} 選項數 = ${e.choices}（實際 ${Array.isArray(q.choices) ? q.choices.length : '無'}）`);
  sok(q.answer_index === 0, `Q${i + 1} answer_index = 0`);
  sok(!!q.answer_raw && q.answer_raw.length > 5, `Q${i + 1} answer_raw 完整`);
  sok(q.fallback_height >= 360 && q.fallback_height <= 520, `Q${i + 1} fallback_height 在單屏範圍 → ${q.fallback_height}`);
  sok(!!q.stem && q.stem.length > 10, `Q${i + 1} 題幹完整`);
  sok(!!q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${i + 1} 算理解析（concept/steps/trap）完整`);
  const p = 'app/' + q.component_path.split('?')[0];
  const html = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  sok(fs.existsSync(p) && q.component_path.includes(e.comp), `Q${i + 1} 教具檔案存在 → ${p}`);
  sok(html.includes('source-tag'), `Q${i + 1} 教具掛真題來源幽靈字`);
  e.exprs.forEach((ex) => sok(html.includes(ex), `Q${i + 1} 教具算理對齊真卷 → ${ex}`));
});
sok(!/https?:\/\/(?!127\.0\.0\.1|localhost)/.test(fs.readFileSync('app/components/tally_sorting_board.html', 'utf8')), '教具零外部遠端依賴（無 http(s) 外連）');
const meta = curriculum.grades[0].units.find((u) => u.code === 'D-1-1');
sok(!!meta, 'curriculum.json 有 D-1-1 條目');
sok(meta && meta.status === 'ready', 'D-1-1 status = ready');
sok(meta && meta.question_count === 4, 'D-1-1 question_count = 4');
sok(meta && !!meta.verified_source && meta.verified_source.includes('期末'), 'D-1-1 verified_source 已掛真題來源');

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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'd11-verify-'));
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

      // 1. G1 單元列表：D-1-1 變 ready
      let cards = [], d11 = null;
      for (let t = 0; t < 30; t++) {
        cards = [...document.querySelectorAll('#gradeView .unit-card')];
        d11 = cards.find((c) => c.dataset.code === 'D-1-1');
        if (d11 && !d11.disabled) break;
        await sleep(200);
      }
      results.push('DEBUG cards=' + cards.length + ' [' + cards.map((c) => c.dataset.code).join(',') + ']');
      ok(!!d11 && !d11.disabled, 'D-1-1 卡片為 ready 且可點擊');
      ok(d11.querySelector('.hint').textContent.includes('4 題真題'), 'D-1-1 卡片顯示「4 題真題」');

      // 2. 開啟 D-1-1 測驗舞台
      d11.click();
      await sleep(900);
      ok(document.getElementById('stageView').style.display === 'block', '點擊 D-1-1 後測驗舞台顯示');
      const num = document.getElementById('progressNum');
      ok(num.textContent === '第 1 / 4 題', '題號顯示「第 1 / 4 題」→ 實際「' + num.textContent + '」');
      const src0 = document.getElementById('progressSource').textContent;
      ok(src0.includes('期末'), '真題來源顯示期末試卷 → ' + src0);

      // 3. 逐題：iframe 掛載正確教具 → 實機操作
      const frame = document.getElementById('stageFrame');
      const READY_SELECTOR = ['#skySvg', '#crownBtn', '#cardDog', '#it-apple'];
      for (let i = 0; i < 4; i++) {
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
        ok(doc.querySelector('#mode' + (i + 1)).classList.contains('on'), '第 ' + (i + 1) + ' 題 URL 參數 q=' + (i + 1) + ' 切到對應模式');
        const h = doc.body.scrollHeight;
        ok(h <= 460, '第 ' + (i + 1) + ' 題單屏高度 ≤ 460px（390px 手機免滑動）→ ' + h + 'px');

        if (i === 0) {
          // Q1 天氣「正」字畫記：點 5 晴 → 3 陰 → 2 雨，逐筆劃出正字與表格累計
          const icons = [...doc.querySelectorAll('#skySvg .w-ico')];
          ok(icons.length === 10, '第 1 題教具：10 個天氣圖示 → ' + icons.length);
          ok(icons.filter((x) => x.classList.contains('sun')).length === 5, '第 1 題教具：晴天圖示 5 個');
          ok(icons.filter((x) => x.classList.contains('cloud')).length === 3, '第 1 題教具：陰天圖示 3 個');
          ok(icons.filter((x) => x.classList.contains('rain')).length === 2, '第 1 題教具：雨天圖示 2 個');
          ok(doc.querySelectorAll('#tallySunSvg .ts.on').length === 0, '第 1 題教具：初始正字畫記全空白');
          const tap = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          for (const g of icons.filter((x) => x.classList.contains('sun'))) { tap(g); await sleep(40); }
          ok(doc.querySelectorAll('#tallySunSvg .ts.on').length === 5, '第 1 題實機互動：晴天點滿 5 劃 → 完整「正」字');
          ok(doc.getElementById('cnt-sun').textContent === '5 天', '第 1 題即時累計：晴天 5 天 → ' + doc.getElementById('cnt-sun').textContent);
          for (const g of icons.filter((x) => x.classList.contains('cloud'))) { tap(g); await sleep(30); }
          ok(doc.querySelectorAll('#tallyCloudSvg .ts.on').length === 3, '第 1 題實機互動：陰天畫 3 劃');
          for (const g of icons.filter((x) => x.classList.contains('rain'))) { tap(g); await sleep(30); }
          ok(doc.querySelectorAll('#tallyRainSvg .ts.on').length === 2, '第 1 題實機互動：雨天畫 2 劃');
          ok(doc.getElementById('note1').textContent.includes('晴天 5 天') && doc.getElementById('note1').textContent.includes('陰天 3 天') && doc.getElementById('note1').textContent.includes('雨天 2 天'), '第 1 題即時反饋：統計完成報讀');
          ok(doc.getElementById('box1').classList.contains('good'), '第 1 題完成綠光框');
          doc.getElementById('reset1').click();
          await sleep(100);
          ok(doc.getElementById('cnt-sun').textContent === '0 天' && doc.querySelectorAll('#tallySunSvg .ts.on').length === 0, '第 1 題重來：畫記清空歸零');
        } else if (i === 1) {
          // Q2 玩具票選長條圖：皇冠最受歡迎 → 虛線比較 7 － 3 ＝ 4
          const cols = doc.querySelectorAll('#barArea .bcol');
          ok(cols.length === 5, '第 2 題教具：5 條玩具直條 → ' + cols.length);
          ok(!cols[4].classList.contains('crowned'), '第 2 題教具：紙飛機初始無皇冠');
          doc.getElementById('crownBtn').click();
          await sleep(150);
          ok(cols[4].classList.contains('crowned'), '第 2 題實機互動：紙飛機直條戴金色皇冠（最受歡迎 7 票）');
          ok(doc.getElementById('note2').textContent.includes('紙飛機 7 票'), '第 2 題即時反饋：最受歡迎＝紙飛機 7 票');
          ok(!doc.getElementById('barArea').classList.contains('compare'), '第 2 題教具：初始無比較虛線');
          doc.getElementById('vsBtn').click();
          await sleep(150);
          ok(doc.getElementById('barArea').classList.contains('compare'), '第 2 題實機互動：虛線對齊比較亮起');
          ok(doc.getElementById('note2').textContent.includes('7 － 3 ＝ 4'), '第 2 題即時反饋：7 － 3 ＝ 4，多 4 人');
          doc.getElementById('reset2').click();
          await sleep(100);
          ok(!cols[4].classList.contains('crowned') && !doc.getElementById('barArea').classList.contains('compare'), '第 2 題重來：皇冠與虛線復原');
        } else if (i === 2) {
          // Q3 動物票選：點小狗(最多8) + 兔子(最少3) → 8 － 3 ＝ 5
          const cards = doc.querySelectorAll('#animalRow .animal-card');
          ok(cards.length === 4, '第 3 題教具：4 張動物票選卡 → ' + cards.length);
          ok(!cards[2].classList.contains('sel'), '第 3 題教具：初始無選取');
          doc.getElementById('cardDog').click();
          await sleep(100);
          ok(doc.getElementById('cardDog').classList.contains('sel'), '第 3 題實機互動：點小狗（最多票 8）高亮');
          doc.getElementById('cardRabbit').click();
          await sleep(100);
          ok(doc.getElementById('cardRabbit').classList.contains('sel'), '第 3 題實機互動：再點兔子（最少票 3）高亮');
          ok(doc.getElementById('note3').textContent.includes('8 － 3 ＝ 5') && doc.getElementById('note3').textContent.includes('相差 5 票'), '第 3 題即時反饋：8 － 3 ＝ 5 相差 5 票');
          doc.getElementById('reset3').click();
          await sleep(100);
          ok(!doc.getElementById('cardDog').classList.contains('sel'), '第 3 題重來：取消選取');
        } else {
          // Q4 分類籃：點 6 樣物品 → 水果 3 個、文具 3 個
          const items = doc.querySelectorAll('#shelf .shelf-item');
          ok(items.length === 6, '第 4 題教具：6 樣桌上物品 → ' + items.length);
          ok(doc.getElementById('fruitCount').textContent === '0 個' && doc.getElementById('toolCount').textContent === '0 個', '第 4 題教具：兩籃初始 0 個');
          for (const it of items) { it.click(); await sleep(40); }
          ok(doc.getElementById('fruitCount').textContent === '3 個', '第 4 題實機互動：水果籃累計 3 個 → ' + doc.getElementById('fruitCount').textContent);
          ok(doc.getElementById('toolCount').textContent === '3 個', '第 4 題實機互動：文具盒累計 3 個 → ' + doc.getElementById('toolCount').textContent);
          ok(doc.querySelectorAll('#slotFruit .mini').length === 3 && doc.querySelectorAll('#slotTool .mini').length === 3, '第 4 題實機互動：物品飛入籃中各 3 個');
          ok(doc.getElementById('note4').textContent.includes('水果 3 個') && doc.getElementById('note4').textContent.includes('文具 3 個'), '第 4 題即時反饋：分類完成報讀');
          doc.getElementById('reset4').click();
          await sleep(100);
          ok(doc.getElementById('fruitCount').textContent === '0 個', '第 4 題重來：全部倒回桌上');
        }

        // 每題都實機答題：選正解 → 檢查 → success 反饋
        const opts = doc.querySelectorAll('.opt-btn');
        opts[0].click();
        await sleep(60);
        doc.querySelector('.check-btn').click();
        await sleep(80);
        ok(doc.querySelector('.result.success') !== null, '第 ' + (i + 1) + ' 題答題 → success 反饋');

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
      ok(rv.includes('G1-D-1-1') && rv.includes('期末'), '結算標頭掛單元與真題來源');

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
      console.log('D11_CDP_VERIFIED (static SSOT + 4 real questions × interactive tally/chart/sorting demos + full flow) — ALL PASS');
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
