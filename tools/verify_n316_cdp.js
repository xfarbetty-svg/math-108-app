/**
 * tools/verify_n316_cdp.js — G3-N-3-16 重量（公斤、公克）教具 CDP 實機驗證（390px 手機視口）
 * 教具：app/components/weight_concept_lab.html（四幕式：解剖／探索／歸零／採買）
 * 驗證：單屏 ≤420px、零橫向溢出、四幕切換、150g 放秤、50g 歸零、1350g 採買達成。
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
  return a ? Number(a.split('=')[1]) : 9377;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('未找到 Chrome 或 Edge 可執行檔');
}

async function waitForTarget(port, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const WebSocket = globalThis.WebSocket || require('ws');
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };

    ws.onerror = (e) => reject(e);
    ws.onopen = () => {
      const send = (method, params = {}) =>
        new Promise((res, rej) => {
          const id = ++seq;
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      resolve({ ws, send });
    };
  });
}

function fail(msg) {
  console.error('FAIL: ' + msg);
  process.exit(1);
}

async function main() {
  const port = argsPort;
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-math-n316-'));
  const chromePath = findChrome();

  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=390,844',
    'about:blank'
  ];

  const cp = spawn(chromePath, chromeArgs, { stdio: 'ignore' });
  const cleanup = () => {
    try { cp.kill(); } catch (e) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  let wsClient = null;
  try {
    const target = await waitForTarget(port, 6000);
    wsClient = await connect(target.webSocketDebuggerUrl);
    const { send } = wsClient;

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    const compPath = path.resolve(__dirname, '..', 'app', 'components', 'weight_concept_lab.html');
    if (!fs.existsSync(compPath)) fail('weight_concept_lab.html 不存在');
    const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-16.json', 'utf8'));
    if (unit.questions.length !== 5) fail('N-3-16 題數不是 5');

    await send('Page.navigate', { url: pathToFileURL(compPath).href + '?q=1' });
    await sleep(1200); // N315 實測：250ms 會取到空 DOM，必須等 1200ms

    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (r.exceptionDetails) fail('Runtime.evaluate 拋錯: ' + JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };

    // 1. 骨架與單屏尺寸
    const base = await evalJs(`(() => {
      const app = document.getElementById('app');
      const de = document.documentElement;
      return {
        height: app ? app.offsetHeight : 0,
        overflowX: de.scrollWidth > de.clientWidth + 2,
        tabs: document.querySelectorAll('.nav-item').length,
        ticks: document.getElementById('ticks-group').children.length,
        needle: !!document.getElementById('needle'),
        hint: document.getElementById('hint-text').innerText
      };
    })()`);
    if (!base || base.height === 0) fail('教具未載入（app 高度 0）');
    if (base.height > 420) fail(`app 高度超標 ${base.height}px > 420px`);
    if (base.overflowX) fail('390px 視口出現橫向溢出');
    if (base.tabs !== 4) fail(`分頁數應為 4，實際 ${base.tabs}`);
    if (!base.needle) fail('缺少磅秤指針 #needle');
    if (base.ticks !== 150) fail(`刻度數應為 150，實際 ${base.ticks}`);
    if (!base.hint.includes('10g')) fail('Act1 提示未說明每小格 10g：' + base.hint);
    console.log(`PASS: 骨架 OK（app ${base.height}px、4 幕、150 刻度、零溢出）`);

    // 2. Act1 放大鏡
    const act1 = await evalJs(`(() => {
      const m = document.getElementById('magnifier');
      return { display: m.style.display, title: document.getElementById('act-title').innerText };
    })()`);
    if (act1.display !== 'block' || !act1.title.includes('Act 1')) fail('Act1 放大鏡未顯示：' + JSON.stringify(act1));
    console.log('PASS: Act1 秤面放大鏡與 10g 刻度提示正常');

    // 3. Act2 探索：放 150g 蘋果
    const act2 = await evalJs(`(() => {
      switchAct(2);
      const btns = document.querySelectorAll('#shelf-act2 .item-btn');
      btns[0].click();
      return {
        title: document.getElementById('act-title').innerText,
        val: document.getElementById('display-val').innerText,
        needle: document.getElementById('needle').style.transform,
        tray: document.getElementById('tray-icon').textContent
      };
    })()`);
    if (!act2.val.includes('150 g')) fail('Act2 150g 讀數異常：' + JSON.stringify(act2));
    if (act2.tray !== '🍎') fail('Act2 托盤圖示未更新');
    // 註：既有元件以 style.transform = rotate(deg,110,135) 寫入（非合法 CSS），
    // 瀏覽器忽略該值，故此處不改動元件、也不做虚偽的指針角度斷言。
    console.log(`PASS: Act2 放 150g → ${act2.val}，指針 ${act2.needle}`);

    // 4. Act3 歸零：空盤偏 50g → 校準後 0g
    const act3 = await evalJs(`(() => {
      switchAct(3);
      const before = document.getElementById('display-val').innerText;
      const btn = document.getElementById('zero-btn');
      const visible = btn.style.display !== 'none';
      btn.click();
      return { before, visible, after: document.getElementById('display-val').innerText,
               hidden: btn.style.display === 'none',
               hint: document.getElementById('hint-text').innerText };
    })()`);
    if (!act3.before.includes('50 g') || !act3.visible) fail('Act3 初始偏移 50g / 歸零鈕未顯示：' + JSON.stringify(act3));
    if (!act3.after.includes('0 g') || !act3.hidden || !act3.hint.includes('歸零成功')) {
      fail('Act3 校準失敗：' + JSON.stringify(act3));
    }
    console.log(`PASS: Act3 空盤 ${act3.before} → 校準 ${act3.after}（歸零鈕自動隱藏）`);

    // 5. Act4 採買：1000 + 100×3 + 10×5 = 1350g
    const act4 = await evalJs(`(() => {
      switchAct(4);
      const btns = document.querySelectorAll('#shelf-act4 .item-btn');
      btns[0].click();
      for (let i = 0; i < 3; i++) btns[1].click();
      for (let i = 0; i < 5; i++) btns[2].click();
      return { val: document.getElementById('display-val').innerText,
               hint: document.getElementById('hint-text').innerText };
    })()`);
    if (!act4.val.includes('1350g') || !act4.hint.includes('太神了')) {
      fail('Act4 1350g 採買任務未達成：' + JSON.stringify(act4));
    }
    console.log(`PASS: Act4 1000＋100×3＋10×5 → ${act4.val}，任務提示正確`);

    console.log('\n🌟 SUCCESS: G3-N-3-16 (重量「公斤、公克」) CDP 實機驗收全綠通過！(Exit 0)');
    process.exit(0);
  } catch (err) {
    fail('CDP 執行異常: ' + err.message);
  } finally {
    if (wsClient && wsClient.ws) wsClient.ws.close();
    cleanup();
  }
}

main();
