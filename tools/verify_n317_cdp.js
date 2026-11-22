/**
 * tools/verify_n317_cdp.js — G3-N-3-17 時間（日、時、分、秒）教具 CDP 實機驗證（390px 手機視口）
 * 教具：app/components/time_concept_lab.html（四幕式：秒感／齒輪／24小時／經過時間）
 * 驗證：單屏 ≤420px、零橫向溢出、四幕切換、60 秒進 1 分、時分進位、14:00/20:30 設定、
 *       電影 10:45 + 90 分 = 12:15。全部呼叫教具真實函式與真實按鈕事件。
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
  return a ? Number(a.split('=')[1]) : 9397;
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
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-math-n317-'));
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

    const compPath = path.resolve(__dirname, '..', 'app', 'components', 'time_concept_lab.html');
    if (!fs.existsSync(compPath)) fail('time_concept_lab.html 不存在');
    const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-17.json', 'utf8'));
    if (unit.questions.length !== 5) fail('N-3-17 題數不是 5');

    await send('Page.navigate', { url: pathToFileURL(compPath).href + '?q=1' });
    await sleep(1200);

    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (r.exceptionDetails) fail('Runtime.evaluate 拋錯: ' + JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };

    // 1. 骨架與單屏尺寸
    const base = await evalJs(`(() => {
      const de = document.documentElement;
      return {
        height: document.body.offsetHeight,
        overflowX: de.scrollWidth > de.clientWidth + 2,
        tabs: document.querySelectorAll('.nav-item').length,
        ticks: document.getElementById('ticks').children.length,
        hour: !!document.getElementById('hand-hour'),
        min: !!document.getElementById('hand-min'),
        sec: !!document.getElementById('hand-sec'),
        display: document.getElementById('digital-display').innerText
      };
    })()`);
    if (!base || base.height === 0) fail('教具未載入（body 高度 0）');
    if (base.height > 420) fail(`app 高度超標 ${base.height}px > 420px`);
    if (base.overflowX) fail('390px 視口出現橫向溢出');
    if (base.tabs !== 4) fail(`分頁數應為 4，實際 ${base.tabs}`);
    if (base.ticks !== 60) fail(`鐘面刻度數應為 60，實際 ${base.ticks}`);
    if (!base.hour || !base.min || !base.sec) fail('缺少時／分／秒指針');
    if (base.display !== '10:00:00') fail('初始數位時刻應為 10:00:00，實際 ' + base.display);
    console.log(`PASS: 骨架 OK（body ${base.height}px、4 幕、60 刻度、零溢出、10:00:00）`);

    // 2. Act1 秒針：real tickSec() ×60 → 60 秒進 1 分；自動按鈕可啟動／停止
    const act1 = await evalJs(`(() => {
      tickSec();
      const one = document.getElementById('digital-display').innerText;
      for (let i = 0; i < 59; i++) tickSec();
      const sixty = document.getElementById('digital-display').innerText;
      const btn = document.getElementById('auto-btn');
      btn.click();
      const running = btn.innerText;
      btn.click();
      const stopped = btn.innerText;
      return { one, sixty, running, stopped, title: document.getElementById('act-title').innerText };
    })()`);
    if (act1.one !== '10:00:01') fail('Act1 走 1 秒失敗：' + JSON.stringify(act1));
    if (act1.sixty !== '10:01:00') fail('Act1 滿 60 秒未進 1 分：' + JSON.stringify(act1));
    if (!act1.running.includes('暫停') || !act1.stopped.includes('連續走60秒')) {
      fail('Act1 連續走 60 秒按鈕無法啟動／停止：' + JSON.stringify(act1));
    }
    console.log(`PASS: Act1 秒針 1 小格→1 秒；60 秒進位 ${act1.sixty}；連續鍵狀態正常`);

    // 3. Act2 齒輪連動：addTime(15) / addTime(60)
    const act2 = await evalJs(`(() => {
      switchAct(2);
      const initial = document.getElementById('digital-display').innerText;
      addTime(15);
      const plus15 = document.getElementById('digital-display').innerText;
      addTime(60);
      const plus60 = document.getElementById('digital-display').innerText;
      return { initial, plus15, plus60, title: document.getElementById('act-title').innerText };
    })()`);
    if (act2.initial !== '09:00:00' || act2.plus15 !== '09:15:00' || act2.plus60 !== '10:15:00') {
      fail('Act2 時分進位計算異常：' + JSON.stringify(act2));
    }
    console.log(`PASS: Act2 09:00 → +15 分 ${act2.plus15} → +60 分 ${act2.plus60}`);

    // 4. Act3 24 小時制：真實按鈕 click 設定 14:00 / 20:30
    const act3 = await evalJs(`(() => {
      switchAct(3);
      const btns = document.querySelectorAll('#act3 button');
      btns[1].click();
      const pm2 = document.getElementById('digital-display').innerText;
      const cursor = document.getElementById('time-cursor').style.left;
      btns[2].click();
      const pm830 = document.getElementById('digital-display').innerText;
      return { pm2, cursor, pm830, title: document.getElementById('act-title').innerText };
    })()`);
    if (act3.pm2 !== '14:00:00' || act3.pm830 !== '20:30:00') {
      fail('Act3 24 小時制按鈕設定異常：' + JSON.stringify(act3));
    }
    if (!act3.cursor.includes('%')) fail('Act3 時間軸游標未更新：' + JSON.stringify(act3));
    console.log(`PASS: Act3 下午 2 時→${act3.pm2}；晚上 8 時半→${act3.pm830}；游標 ${act3.cursor}`);

    // 5. Act4 經過時間：playMovie() 非同步 6×15 分 = 90 分 → 12:15
    await evalJs(`(() => { switchAct(4); playMovie(); return true; })()`);
    await sleep(2300);
    const act4 = await evalJs(`(() => ({
      display: document.getElementById('digital-display').innerText,
      result: document.getElementById('movie-result').innerText
    }))()`);
    if (act4.display !== '12:15:00' || !act4.result.includes('12:15')) {
      fail('Act4 10:45 + 90 分應為 12:15：' + JSON.stringify(act4));
    }
    console.log(`PASS: Act4 電影 10:45 + 90 分 → ${act4.display}（${act4.result}）`);

    console.log('\n🌟 SUCCESS: G3-N-3-17 (時間「日、時、分、秒」) CDP 實機驗收全綠通過！(Exit 0)');
    process.exit(0);
  } catch (err) {
    fail('CDP 執行異常: ' + err.message);
  } finally {
    if (wsClient && wsClient.ws) wsClient.ws.close();
    cleanup();
  }
}

main();
