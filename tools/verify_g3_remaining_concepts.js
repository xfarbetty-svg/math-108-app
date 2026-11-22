/**
 * tools/verify_g3_remaining_concepts.js - 自動化驗證三年級 9 套剩餘概念小教室
 * (number_10000, vertical_calc, multiplication, division, division_vertical,
 *  mult_div_relation, two_step, estimation, number_line)
 * 檢驗 390px 手機視口零溢出、四大活動切換、Console 0 報錯
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

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let fp = path.join(process.cwd(), req.url.split('?')[0].replace(/^\//, ''));
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) fp = path.join(fp, 'index.html');
      } catch (_e) {}
      fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();
        const mime = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';
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
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const eventHandlers = new Map();

    ws.onopen = () => resolve({ send, on, close: () => ws.close() });
    ws.onerror = reject;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method && eventHandlers.has(msg.method)) {
        for (const handler of eventHandlers.get(msg.method)) handler(msg.params);
      }
    };

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function on(method, fn) {
      if (!eventHandlers.has(method)) eventHandlers.set(method, []);
      eventHandlers.get(method).push(fn);
    }
  });
}

const LABS = [
  { code: 'N-3-1', file: 'number_10000_concept_lab.html' },
  { code: 'N-3-2', file: 'vertical_calc_concept_lab.html' },
  { code: 'N-3-3', file: 'multiplication_concept_lab.html' },
  { code: 'N-3-4', file: 'division_concept_lab.html' },
  { code: 'N-3-5', file: 'division_vertical_concept_lab.html' },
  { code: 'N-3-6', file: 'mult_div_relation_concept_lab.html' },
  { code: 'N-3-7', file: 'two_step_concept_lab.html' },
  { code: 'N-3-8', file: 'estimation_concept_lab.html' },
  { code: 'N-3-11', file: 'number_line_concept_lab.html' },
  { code: 'N-3-16', file: 'weight_concept_lab.html' },
  { code: 'N-3-17', file: 'time_concept_lab.html' },
  { code: 'S-3-2', file: 'square_rectangle_lab.html' },
  { code: 'S-3-4', file: 'solid_geometry_lab.html' },
  { code: 'R-3-1', file: 'multiplication_division_lab.html' },
  { code: 'R-3-2', file: 'pattern_reasoning_lab.html' },
  { code: 'D-3-1', file: 'table_cross_lab.html' }
];

async function main() {
  const chromePath = findChrome();
  const cdpPort = 9222 + Math.floor(Math.random() * 200);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-g3-all-concepts-'));
  const { server, port: httpPort } = await startServer();

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    try { server.close(); } catch (e) {}
  };

  try {
    const target = await waitForTarget(cdpPort, 8000);
    const { send, on, close } = await connect(target.webSocketDebuggerUrl);

    let consoleErrors = [];
    on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const text = params.args.map((a) => (a.value !== undefined ? a.value : a.description)).join(' ');
        consoleErrors.push(text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    };

    for (let i = 0; i < LABS.length; i++) {
      const lab = LABS[i];
      console.log(`\n=== [${i + 1}/${LABS.length}] 檢驗 G3-${lab.code} (${lab.file}) ===`);
      consoleErrors = [];
      await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/${lab.file}` });
      await new Promise((r) => setTimeout(r, 600));

      const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
      if (overflow) throw new Error(`${lab.file} 手機 390px 橫向溢出！`);
      console.log(`PASS 390px 視口零橫向溢出`);

      // S-3-2 / S-3-4 已改版為「單題＋專屬按鈕／圓規」介面（無 switchAct/tab-act），
      // 改驗真實 API，避開 stale 的 switchAct 斷言。
      if (lab.file === 'square_rectangle_lab.html' || lab.file === 'solid_geometry_lab.html') {
        if (lab.file === 'solid_geometry_lab.html') {
          await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/app/components/solid_geometry_lab.html?q=2` });
          await new Promise((r) => setTimeout(r, 800));
          const q2 = await evaluate(`(() => {
            const seg = document.querySelectorAll('.seg');
            if (!seg.length) return { seg: 0 };
            seg[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return {
              seg: seg.length,
              state: document.getElementById('compass').dataset.state,
              enabled: !document.getElementById('btnPlace').disabled,
              qtag: document.getElementById('qtag').textContent,
              h: document.getElementById('app').offsetHeight
            };
          })()`);
          if (q2.seg !== 4 || q2.state !== 'measuring' || !q2.enabled || q2.qtag !== 'Q02' || q2.h > 420)
            throw new Error('solid_geometry_lab: Q2 圓規量距 API 異常 ' + JSON.stringify(q2));
          console.log('PASS S-3-4 Q2 圓規量距與按鈕啟用驗證通過');
        } else {
          const before = await evaluate(`(() => ({
            btn: !!document.getElementById('detectBtn'),
            h: document.getElementById('app').offsetHeight,
            qtag: document.getElementById('qtag').textContent,
            on: document.getElementById('scene').querySelector('svg').classList.contains('detect-on')
          }))()`);
          if (!before.btn || before.qtag !== 'Q01' || before.h > 420) throw new Error('square_rectangle_lab: Q01 渲染或高度異常 ' + JSON.stringify(before));
          await evaluate(`document.getElementById('detectBtn').click()`);
          const after = await evaluate(`document.getElementById('scene').querySelector('svg').classList.contains('detect-on')`);
          if (before.on === after) throw new Error('square_rectangle_lab: 三角板檢測按鈕未切換 detect-on');
          console.log('PASS S-3-2 Q01 三角板檢測按鈕切換驗證通過');
        }
        if (consoleErrors.length > 0) throw new Error(`${lab.file} Console 錯誤: ` + consoleErrors.join('; '));
        console.log(`PASS ${lab.file} 0 console errors`);
        continue;
      }

      for (let act = 1; act <= 4; act++) {
        await evaluate(`switchAct(${act})`);
        await new Promise((r) => setTimeout(r, 100));
        const activeTab = await evaluate(`document.getElementById("tab-act${act}").classList.contains("active")`);
        const activeView = await evaluate(`document.getElementById("act-${act}-view").style.display !== "none"`);
        if (!activeTab || !activeView) throw new Error(`${lab.file} 活動 ${act} 切換失敗`);
        console.log(`PASS Act ${act} 切換正常`);
      }

      // 針對具象教具深度點擊斷言
      if (lab.file === 'pattern_reasoning_lab.html') {
        await evaluate(`switchAct(1); frogJump();`);
        await new Promise((r) => setTimeout(r, 300));
        const frogMoved = await evaluate(`document.getElementById('frog').style.transform.includes('translate')`);
        const hasArc = await evaluate(`document.querySelectorAll('#frog-svg-layer path').length > 0`);
        if (!frogMoved || !hasArc) throw new Error('pattern_reasoning_lab: 青蛙跳躍或弧線生成失敗！');
        console.log('PASS R-3-2 跳跳蛙拋物線位移與弧線驗證通過');

        await evaluate(`switchAct(2); addSquare();`);
        const sqCount = await evaluate(`document.querySelectorAll('#match-group .match-square').length`);
        if (sqCount !== 2) throw new Error('pattern_reasoning_lab: 火柴棒拼排正方形數量未更新！');
        console.log('PASS R-3-2 火柴棒拼排正方形生成驗證通過');

        await evaluate(`switchAct(3);`);
        const cardCount = await evaluate(`document.querySelectorAll('#seq-container .num-card').length`);
        if (cardCount !== 5) throw new Error('pattern_reasoning_lab: Act 3 數列卡片空白或數量不對！');
        await evaluate(`revealDiff();`);
        const bubbleCount = await evaluate(`document.querySelectorAll('#diff-bubbles-container .diff-bubble').length`);
        if (bubbleCount === 0) throw new Error('pattern_reasoning_lab: 揭示規律差值氣泡未生成！');
        console.log('PASS R-3-2 Act 3 找規律數列卡片非空白與差值氣泡驗證通過');
      }

      if (consoleErrors.length > 0) throw new Error(`${lab.file} Console 錯誤: ` + consoleErrors.join('; '));
      console.log(`PASS ${lab.file} 0 console errors`);
    }

    close();
    cleanup();
    console.log(`\n========================================`);
    console.log(`ALL 9 G3 REMAINING CONCEPT LABS VERIFIED — PASS (Exit 0)`);
    console.log(`========================================`);
    process.exit(0);
  } catch (err) {
    console.error('[FAILED]', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
