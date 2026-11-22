/**
 * tools/verify_n317_cdp.js — G3-N-3-17 時間（日、時、分、秒）教具 CDP 實機驗證（390×844 手機視口）
 * 教具：app/components/time_concept_lab.html（四幕式＋?q=1..10 題目連動）
 * 驗證：單屏 ≤420px、零橫向溢出、1–12 數字、60 刻度、4 幕切換、60 秒進 1 分、
 *       10 題逐題時刻連動、Dark 模式 theme-token 高對比、Light/Dark 截圖輸出。
 * 所有檢查呼叫教具真實函式與真實按鈕事件；任一失敗 Exit 1。
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
  const shotDir = path.resolve(__dirname, '..', '_scratch', 'fix_n317');
  fs.mkdirSync(shotDir, { recursive: true });

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
    if (unit.questions.length !== 10 || unit.question_count !== 10) fail('N-3-17 題數不是完整 10 題');

    const compUrl = pathToFileURL(compPath).href;
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (r.exceptionDetails) fail('Runtime.evaluate 拋錯: ' + JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };

    await send('Page.navigate', { url: compUrl + '?q=1' });
    await sleep(1000);

    // 1. 骨架與單屏尺寸（含 1–12 數字）
    const base = await evalJs(`(() => {
      const de = document.documentElement;
      return {
        height: document.body.offsetHeight,
        overflowX: de.scrollWidth > de.clientWidth + 2,
        tabs: document.querySelectorAll('.nav-item').length,
        ticks: document.getElementById('ticks').children.length,
        nums: document.getElementById('numbers').children.length,
        hour: !!document.getElementById('hand-hour'),
        min: !!document.getElementById('hand-min'),
        sec: !!document.getElementById('hand-sec'),
        display: document.getElementById('digital-display').innerText,
        banner: document.getElementById('q-banner').innerText
      };
    })()`);
    if (!base || base.height === 0) fail('教具未載入（body 高度 0）');
    if (base.height > 420) fail(`app 高度超標 ${base.height}px > 420px`);
    if (base.overflowX) fail('390px 視口出現橫向溢出');
    if (base.tabs !== 4) fail(`分頁數應為 4，實際 ${base.tabs}`);
    if (base.ticks !== 60) fail(`鐘面刻度數應為 60，實際 ${base.ticks}`);
    if (base.nums !== 12) fail(`鐘面 1–12 數字數應為 12，實際 ${base.nums}`);
    if (!base.hour || !base.min || !base.sec) fail('缺少時／分／秒指針');
    if (base.display !== '10:00:00') fail('?q=1 初始數位時刻應為 10:00:00，實際 ' + base.display);
    if (!base.banner.startsWith('Q01')) fail('?q=1 題目橫幅未連動：' + base.banner);
    console.log(`PASS: 骨架 OK（body ${base.height}px、4 幕、60 刻度、12 數字、零溢出、Q01/10:00:00）`);

    // 2. Act1 秒針：真 tickSec() ×60 → 60 秒進 1 分；自動按鈕可啟動／停止
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
      return { one, sixty, running, stopped };
    })()`);
    if (act1.one !== '10:00:01') fail('Act1 走 1 秒失敗：' + JSON.stringify(act1));
    if (act1.sixty !== '10:01:00') fail('Act1 滿 60 秒未進 1 分：' + JSON.stringify(act1));
    if (!act1.running.includes('暫停') || !act1.stopped.includes('60秒')) {
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
      return { initial, plus15, plus60 };
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
      return { pm2, cursor, pm830 };
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

    // 6. ?q=1..10 逐題巡檢：題目橫幅、對應時刻、時針聯動角度
    const EXPECT = [
      { q: 1,  time: '10:00:00', hDeg: 300 },
      { q: 2,  time: '10:00:00', hDeg: 300 },
      { q: 3,  time: '03:15:00', hDeg: 97.5 },
      { q: 4,  time: '09:00:00', hDeg: 270 },
      { q: 5,  time: '00:06:18', hDeg: 3 },
      { q: 6,  time: '17:28:00', hDeg: 164 },
      { q: 7,  time: '00:03:20', hDeg: 1.5 },
      { q: 8,  time: '09:20:00', hDeg: 280 },
      { q: 9,  time: '07:50:00', hDeg: 235 },
      { q: 10, time: '13:30:00', hDeg: 45 }
    ];
    for (const exp of EXPECT) {
      await send('Page.navigate', { url: compUrl + '?q=' + exp.q });
      await sleep(320);
      const got = await evalJs(`(() => {
        const d = document.getElementById('digital-display').innerText;
        const b = document.getElementById('q-banner').innerText;
        const a = document.getElementById('q-action').innerText;
        const hourTransform = document.getElementById('hand-hour').style.transform;
        const nums = document.getElementById('numbers').children.length;
        const ticks = document.getElementById('ticks').children.length;
        const hgt = document.body.offsetHeight;
        const de = document.documentElement;
        return { d, b, a, hourTransform, nums, ticks, hgt, overflowX: de.scrollWidth > de.clientWidth + 2 };
      })()`);
      if (got.d !== exp.time) fail(`?q=${exp.q} 時刻應為 ${exp.time}，實際 ${got.d}`);
      if (!got.b.startsWith('Q' + String(exp.q).padStart(2, '0'))) fail(`?q=${exp.q} 橫幅未連動：${got.b}`);
      if (got.nums !== 12 || got.ticks !== 60) fail(`?q=${exp.q} 刻度/數字數異常：${JSON.stringify(got)}`);
      if (got.hgt > 420 || got.overflowX) fail(`?q=${exp.q} 版面超標/溢出：${JSON.stringify(got)}`);
      const m = got.hourTransform.match(/rotate\(([-\d.]+)deg/);
      if (!m || Math.abs(Number(m[1]) - exp.hDeg) > 0.6) {
        fail(`?q=${exp.q} 時針角度應 ${exp.hDeg}°，實際 ${got.hourTransform}`);
      }
    }
    console.log('PASS: ?q=1..10 十題逐題時刻、時針聯動角度、題目橫幅與單屏版面全綠');

    // 6b. Q06 真實按鈕：24 時制對照；Q09 倒推；Q10 經過時間
    await send('Page.navigate', { url: compUrl + '?q=6' });
    await sleep(320);
    const q6 = await evalJs(`(() => {
      document.getElementById('q-action').click();
      return { d: document.getElementById('digital-display').innerText, r: document.getElementById('q-result').innerText };
    })()`);
    if (q6.d !== '17:28:00') fail('Q06 對照 24 時制失敗：' + JSON.stringify(q6));
    await send('Page.navigate', { url: compUrl + '?q=9' });
    await sleep(320);
    const q9 = await evalJs(`(() => {
      document.getElementById('q-action').click();
      return document.getElementById('digital-display').innerText;
    })()`);
    if (q9 !== '07:35:00') fail('Q09 7:50 倒推 15 分應為 07:35，實際 ' + q9);
    await send('Page.navigate', { url: compUrl + '?q=10' });
    await sleep(320);
    const q10 = await evalJs(`(() => {
      document.getElementById('q-action').click();
      return document.getElementById('digital-display').innerText;
    })()`);
    if (q10 !== '21:00:00') fail('Q10 13:30+7:30 應為 21:00，實際 ' + q10);
    console.log('PASS: Q06 24時制／Q09 倒推／Q10 經過時間 真實按鈕事件全綠');

    // 7. Dark 模式 theme-token 高對比計算樣式檢查
    await send('Page.navigate', { url: compUrl + '?q=6' });
    await sleep(320);
    const dark = await evalJs(`(() => {
      document.documentElement.dataset.theme = 'dark';
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        theme: document.documentElement.dataset.theme,
        bodyBg: cs('body').backgroundColor,
        face: cs('.clock-face').fill,
        num: cs('.cnum').fill,
        tickMajor: cs('.tick.major').stroke,
        hour: cs('#hand-hour').stroke,
        min: cs('#hand-min').stroke,
        sec: cs('#hand-sec').stroke
      };
    })()`);
    const EXPECT_DARK = {
      bodyBg: 'rgb(22, 27, 38)', face: 'rgb(31, 39, 54)', num: 'rgb(226, 232, 240)',
      tickMajor: 'rgb(203, 213, 225)', hour: 'rgb(242, 232, 213)',
      min: 'rgb(111, 211, 199)', sec: 'rgb(255, 154, 107)'
    };
    Object.keys(EXPECT_DARK).forEach((k) => {
      if (dark[k] !== EXPECT_DARK[k]) fail(`Dark ${k} 應為 ${EXPECT_DARK[k]}，實際 ${dark[k]}`);
    });
    console.log(`PASS: Dark 模式 theme tokens 高對比（指針 ${dark.hour}/${dark.min}/${dark.sec}）`);

    // 8. Light / Dark 390×844 截圖（Q06 鐘面，供 Hy4 Flash 目視複審）
    await evalJs(`(() => { document.documentElement.dataset.theme = 'light'; document.getElementById('q-action').click(); return true; })()`);
    await sleep(400);
    const lightPng = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(shotDir, '20261122_n317_light_q06.png'), Buffer.from(lightPng.data, 'base64'));
    await evalJs(`(() => { document.documentElement.dataset.theme = 'dark'; return true; })()`);
    await sleep(400);
    const darkPng = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(shotDir, '20261122_n317_dark_q06.png'), Buffer.from(darkPng.data, 'base64'));
    console.log('PASS: 390×844 Light/Dark 截圖已輸出至 _scratch/fix_n317/');

    console.log('\n🌟 SUCCESS: G3-N-3-17 (時間「日、時、分、秒」) 完整 10 題 CDP 實機驗收全綠通過！(Exit 0)');
    process.exit(0);
  } catch (err) {
    fail('CDP 執行異常: ' + err.message);
  } finally {
    if (wsClient && wsClient.ws) wsClient.ws.close();
    cleanup();
  }
}

main();
