/**
 * tools/verify_s42_cdp.js — G4-S-4-2 CDP 實機渲染與互動驗證
 *  A. ?q=1..10 × Light/Dark × 390x844 / 1280x800：高度 <= 415px（含展開算理）、零橫向溢出、零內部捲軸、零劇透
 *  B. q-mode 隱藏頂部頁籤與三活動卡；Q1~Q10 各自專屬模組且點擊後狀態真實變化
 *  C. 概念模式：三活動切換、各自互動狀態變化、高度 <= 415px；全程零 console error
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9531 + (process.pid % 40);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }

async function waitTarget() {
  const end = Date.now() + 9000;
  while (Date.now() < end) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/list');
      const t = (await r.json()).find((x) => x.type === 'page');
      if (t && t.webSocketDebuggerUrl) return t;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('CDP target 逾時');
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const WS = globalThis.WebSocket || require('ws');
    const ws = new WS(url);
    let id = 0;
    const waiting = new Map();
    const errors = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(m.params || {}));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(JSON.stringify(m.params));
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    };
    ws.onerror = reject;
    ws.onopen = () => resolve({
      ws, errors,
      send: (method, params = {}) => new Promise((res) => {
        const i = ++id;
        waiting.set(i, res);
        ws.send(JSON.stringify({ id: i, method, params }));
      })
    });
  });
}

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });
  let c;
  try {
    const t = await waitTarget();
    c = await connect(t.webSocketDebuggerUrl);
    const send = c.send;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    const fail = [];
    const evalJs = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails) throw new Error(expr + ' -> ' + JSON.stringify(r.result.exceptionDetails));
      return r.result && r.result.result && r.result.result.value;
    };
    const waitApp = async () => {
      for (let i = 0; i < 100; i++) {
        try { if (await evalJs(`!!window.__S42_READY__`)) return; } catch (e) {}
        await sleep(100);
      }
      throw new Error('教具未就緒');
    };
    const nav = async (url, ms = 150) => {
      await send('Page.navigate', { url });
      await sleep(ms);
      await waitApp();
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'rotation_angle_g4_lab.html').replace(/\\/g, '/');
    const maxH = { light: 0, dark: 0, desktop: 0 };
    const seenModules = new Set();

    /* A. ?q=1..10 × Light/Dark × 390x844 */
    for (const theme of ['light', 'dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      for (let q = 1; q <= 10; q++) {
        await nav(base + '?q=' + q + '&theme=' + theme, 140);
        const m = await evalJs(`(() => {
          const app = document.getElementById('app');
          return {
            sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
            h: app.getBoundingClientRect().height, bodyH: document.body.getBoundingClientRect().height,
            innerScroll: app.scrollHeight - app.clientHeight,
            mode: window.__S42_MODE__, q: window.__S42_Q__, mod: window.__S42_MODULE__,
            tabsHidden: document.getElementById('tabs').hidden || getComputedStyle(document.getElementById('tabs')).display === 'none',
            actsHidden: ['act0','act1','act2'].every(id => document.getElementById(id).hidden),
            explainBefore: !!document.querySelector('.explain'),
            internalOpts: document.querySelectorAll('.opt,.option-btn,.shell-opt,.stem').length,
            points: document.querySelectorAll('[data-i]').length
          };
        })()`);
        if (m.sw > m.cw) fail.push(`q${q}/${theme}/390 橫向溢出 ${m.sw} > ${m.cw}`);
        if (m.h > 415) fail.push(`q${q}/${theme}/390 初始高度 ${m.h.toFixed(1)} > 415`);
        if (m.bodyH > 415) fail.push(`q${q}/${theme}/390 body 高度 ${m.bodyH.toFixed(1)} > 415`);
        if (m.innerScroll > 1) fail.push(`q${q}/${theme}/390 內部垂直捲軸 ${m.innerScroll}`);
        if (m.mode !== 'exam' || m.q !== q) fail.push(`q${q}/${theme} 模式/題號錯誤`);
        if (!m.tabsHidden || !m.actsHidden) fail.push(`q${q}/${theme} q-mode 未隱藏頁籤或活動卡`);
        if (m.explainBefore) fail.push(`q${q}/${theme} 初始畫面劇透 .explain`);
        if (m.internalOpts !== 0) fail.push(`q${q}/${theme} 教具私自重畫題幹或選項`);
        if (m.points < 1) fail.push(`q${q}/${theme} 缺少可操作按鈕`);
        seenModules.add(m.mod);
        maxH[theme] = Math.max(maxH[theme], m.h);

        const after = await evalJs(`(() => {
          document.querySelectorAll('[data-i]').forEach(b => b.dispatchEvent(new MouseEvent('click', { bubbles:true })));
          document.getElementById('qAct1').click();
          document.getElementById('rbtn').click();
          const app = document.getElementById('app');
          const stt = window.__S42_STATE__;
          return { h: app.getBoundingClientRect().height, inner: app.scrollHeight - app.clientHeight,
                   hasExplain: !!document.querySelector('.explain'),
                   step: stt && stt.step, shown: stt && stt.shown };
        })()`);
        if (!after.hasExplain || !after.shown || after.step !== 1) fail.push(`q${q}/${theme} 看算理／驗證互動未生效`);
        if (after.h > 415) fail.push(`q${q}/${theme}/390 展開算理後高度 ${after.h.toFixed(1)} > 415`);
        if (after.inner > 1) fail.push(`q${q}/${theme}/390 展開後內部捲軸 ${after.inner}`);
        maxH[theme] = Math.max(maxH[theme], after.h);
        if ((theme === 'light' && [1, 6, 9].includes(q)) || (theme === 'dark' && q === 2)) {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, `s42_q${q}_${theme}.png`), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    if (seenModules.size < 10) fail.push('真題互動模組種類不足：' + seenModules.size);

    /* A2. 1280x800 桌面 × Light/Dark */
    for (const theme of ['light', 'dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      for (let q = 1; q <= 10; q++) {
        await nav(base + '?q=' + q + '&theme=' + theme, 130);
        const dm = await evalJs(`(() => {
          document.getElementById('qAct1').click();
          document.getElementById('rbtn').click();
          const app = document.getElementById('app');
          return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
                   h: app.getBoundingClientRect().height, inner: app.scrollHeight - app.clientHeight };
        })()`);
        if (dm.sw > dm.cw) fail.push(`q${q}/${theme}/1280 橫向溢出 ${dm.sw} > ${dm.cw}`);
        if (dm.h > 415) fail.push(`q${q}/${theme}/1280 展開後高度 ${dm.h.toFixed(1)} > 415`);
        if (dm.inner > 1) fail.push(`q${q}/${theme}/1280 內部捲軸 ${dm.inner}`);
        maxH.desktop = Math.max(maxH.desktop, dm.h);
      }
    }

    /* B. 概念模式三活動（無 ?q=） */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?theme=light', 200);
    const cc = await evalJs(`(() => {
      const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles:true }));
      const tabs = document.querySelectorAll('#tabs .tab').length;
      const h0 = document.getElementById('app').getBoundingClientRect().height;
      click(document.querySelector('#act0 [data-i="9"]'));
      document.getElementById('c1Cmp').click();
      const e1 = document.querySelector('#act0 .explain');
      const c1 = e1 ? e1.textContent : '';
      const h1 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="1"]').click();
      click(document.querySelector('#act1 [data-i="0"]'));
      document.getElementById('c2Cmp').click();
      const e2 = document.querySelector('#act1 .explain');
      const c2 = e2 ? e2.textContent : '';
      const h2 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="2"]').click();
      click(document.querySelector('#act2 [data-i="0"]'));
      click(document.querySelector('#act2 [data-i="1"]'));
      document.getElementById('c3Cmp').click();
      const e3 = document.querySelector('#act2 .explain');
      const c3 = e3 ? e3.textContent : '';
      const h3 = document.getElementById('app').getBoundingClientRect().height;
      return { mode: window.__S42_MODE__, tabs, c1, c2, c3, h: Math.max(h0,h1,h2,h3),
               onlyOne: [0,1,2].filter(i => !document.getElementById('act'+i).hidden).length };
    })()`);
    if (cc.mode !== 'concept' || cc.tabs !== 3) fail.push('概念模式初始化失敗');
    if (cc.onlyOne !== 1) fail.push('概念模式一次顯示多於一個活動面板');
    if (!cc.c1.includes('180')) fail.push('活動一時針半圈未生效');
    if (!cc.c2.includes('北')) fail.push('活動二指南針方位未生效');
    if (!cc.c3.includes('45')) fail.push('活動三方向盤來回轉未生效');
    if (cc.h > 415) fail.push(`概念模式高度 ${cc.h.toFixed(1)} > 415`);
    const cs = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 's42_concept_light.png'), Buffer.from(cs.result.data, 'base64'));

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error ' + realErrors.length + ' 筆：' + realErrors[0].slice(0, 200));

    console.log(`MAX_HEIGHT light=${maxH.light.toFixed(1)} dark=${maxH.dark.toFixed(1)} desktop=${maxH.desktop.toFixed(1)}`);
    console.log(`MODULES ${seenModules.size}: ${[...seenModules].join(',')}`);
    if (fail.length) {
      console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- '));
      process.exit(1);
    }
    console.log('PASS verify_s42_cdp: Q1~Q10 × Light/Dark × 390x844/1280x800 高度≤415px、零溢出、零內部捲軸、零劇透、q-mode 隱藏活動卡、三活動與十題互動全綠');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    if (c && c.ws) c.ws.close();
    child.kill();
  }
})();
