/**
 * tools/verify_d41_cdp.js — G4-D-4-1 CDP 實機渲染與互動驗證
 *  A. ?q=1..10 × Light/Dark × 390x844 / 1280x800：高度 <= 415px（含展開算理）、零橫向溢出、零內部捲軸、零劇透
 *  B. q-mode 隱藏頂部頁籤與三活動卡；Q1~Q10 各自專屬模組且點擊後狀態真實變化
 *  C. 概念模式：三活動切換、各自互動狀態變化、高度 <= 415px；全程零 console error
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9451 + (process.pid % 40);
const httpPort = port + 1;
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

function startStaticServer() {
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
    '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml' };
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(file));
    } catch (e) { res.writeHead(404); res.end('NOT FOUND'); }
  });
  return new Promise((resolve) => server.listen(httpPort, '127.0.0.1', () => resolve(server)));
}

(async () => {
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });
  let c, server;
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
    const waitApp = async (url) => {
      for (let i = 0; i < 40; i++) {
        try { if (await evalJs(`!!document.getElementById('app')`)) return; } catch (e) {}
        await sleep(100);
      }
      throw new Error('教具未就緒：' + url);
    };
    const nav = async (url, ms = 180) => {
      await send('Page.navigate', { url });
      await sleep(ms);
      await waitApp(url);
    };
    const base = 'file:///' + path.join(root, 'app', 'components', 'charts_g4_lab.html').replace(/\\/g, '/');
    const maxH = { light:0, dark:0, desktop:0 };
    const seenModules = new Set();

    /* A. ?q=1..10 × Light/Dark × 390x844 */
    for (const theme of ['light', 'dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true });
      for (let q = 1; q <= 10; q++) {
        await nav(base + '?q=' + q + '&theme=' + theme, 150);
        const m = await evalJs(`(() => {
          const app = document.getElementById('app');
          return {
            sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
            h: app.getBoundingClientRect().height, bodyH: document.body.getBoundingClientRect().height,
            innerScroll: app.scrollHeight - app.clientHeight,
            mode: window.__D41_MODE__, q: window.__D41_Q__, mod: window.__D41_MODULE__,
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
        if (q === 4) {
          const q4Check = await evalJs(`(() => {
            const svg = document.querySelector('svg.chart');
            const t = svg ? svg.textContent : '';
            return { hasTicks: t.includes('100') && t.includes('600'), spoiler: t.includes('350 碗') || t.includes('450 碗') };
          })()`);
          if (!q4Check.hasTicks) fail.push(`q4/${theme} 缺少 100~600 刻度格線`);
          if (q4Check.spoiler) fail.push(`q4/${theme} 作答前圖形直接暴露答案數值`);
        }
        if (q === 7) {
          const q7Check = await evalJs(`(() => {
            const svg = document.querySelector('svg.chart');
            const t = svg ? svg.textContent : '';
            return { hasAxis: t.includes('10') && t.includes('40') && t.includes('人'), bars: document.querySelectorAll('svg.chart rect.bar').length, spoiler: t.includes('180') || t.includes('34') };
          })()`);
          if (!q7Check.hasAxis || q7Check.bars !== 6) fail.push(`q7/${theme} 缺少完整六條長條圖與 0~40 刻度`);
          if (q7Check.spoiler) fail.push(`q7/${theme} 作答前直接印出數值或總和`);
        }
        if (q === 9) {
          const q9Check = await evalJs(`(() => {
            const svg = document.querySelector('svg.chart');
            const t = svg ? svg.textContent : '';
            return t.includes('有 ～') && t.includes('無 ～') && t.includes('標題') && t.includes('單位') && t.includes('類別');
          })()`);
          if (!q9Check) fail.push(`q9/${theme} 缺少「有 ～ vs 無 ～」或「標題/單位/類別」對比`);
        }
        seenModules.add(m.mod);
        maxH[theme] = Math.max(maxH[theme], m.h);

        const after = await evalJs(`(() => {
          document.querySelectorAll('[data-i]').forEach(b => b.dispatchEvent(new MouseEvent('click', { bubbles:true })));
          const a1 = document.getElementById('qAct1'); if (a1) a1.click();
          document.getElementById('rbtn').click();
          const app = document.getElementById('app');
          return { h: app.getBoundingClientRect().height, inner: app.scrollHeight - app.clientHeight,
                   hasExplain: !!document.querySelector('.explain'),
                   step: window.__D41_STATE__ && window.__D41_STATE__.step,
                   shown: window.__D41_STATE__ && window.__D41_STATE__.shown };
        })()`);
        if (!after.hasExplain || !after.shown || after.step !== 1) fail.push(`q${q}/${theme} 看算理／報讀互動未生效`);
        if (after.h > 415) fail.push(`q${q}/${theme}/390 展開算理後高度 ${after.h.toFixed(1)} > 415`);
        if (after.inner > 1) fail.push(`q${q}/${theme}/390 展開後內部捲軸 ${after.inner}`);
        maxH[theme] = Math.max(maxH[theme], after.h);
        if ((theme === 'light' && [1,3,4,9].includes(q)) || (theme === 'dark' && q === 7)) {
          const s = await send('Page.captureScreenshot', { format:'png' });
          fs.writeFileSync(path.join(out, `d41_q${q}_${theme}.png`), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    if (seenModules.size < 8) fail.push('真題互動模組種類不足：' + seenModules.size);

    /* A2. 1280x800 桌面 × Light/Dark */
    for (const theme of ['light','dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width:1280, height:800, deviceScaleFactor:1, mobile:false });
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
    await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true });
    await nav(base + '?theme=light', 210);
    const cc = await evalJs(`(() => {
      const tabs = document.querySelectorAll('#tabs .tab').length;
      const h0 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('#act0 [data-i="1"]').dispatchEvent(new MouseEvent('click', { bubbles:true }));
      document.getElementById('c1Cmp').click();
      const c1 = document.getElementById('c1Msg').textContent;
      const h1 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="1"]').click();
      const act1Svg = document.querySelector('#act1 svg.chart');
      const act1Text = act1Svg ? act1Svg.textContent : '';
      const act1Wave = act1Svg ? act1Svg.querySelector('path.wave')?.getAttribute('d') || '' : '';
      const act1Shot = { hasZero: act1Text.includes('0'), has18: act1Text.includes('18'), hasUnit: act1Text.includes('℃'), waveOnY: act1Wave.startsWith('M38 ') };
      document.querySelector('#act1 [data-i="3"]').dispatchEvent(new MouseEvent('click', { bubbles:true }));
      document.getElementById('c2Break').click();
      const c2 = document.getElementById('c2Msg').textContent;
      const h2 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="2"]').click();
      document.getElementById('c3Slope').click();
      const c3 = document.getElementById('c3Msg').textContent;
      const h3 = document.getElementById('app').getBoundingClientRect().height;
      return { mode: window.__D41_MODE__, tabs, c1, c2, c3, act1Shot, h: Math.max(h0,h1,h2,h3),
               onlyOne: [0,1,2].filter(i => !document.getElementById('act'+i).hidden).length };
    })()`);
    if (cc.mode !== 'concept' || cc.tabs !== 3) fail.push('概念模式初始化失敗');
    if (cc.onlyOne !== 1) fail.push('概念模式一次顯示多於一個活動面板');
    if (!cc.c1.includes('番茄')) fail.push('活動一比一比未生效');
    if (!cc.c2.includes('～')) fail.push('活動二波浪開關未生效');
    if (!cc.act1Shot.hasZero || !cc.act1Shot.has18 || !cc.act1Shot.hasUnit || !cc.act1Shot.waveOnY) fail.push('活動二波浪未置於縱軸 0~18 或缺 ℃: ' + JSON.stringify(cc.act1Shot));
    if (!cc.c3.includes('甲')) fail.push('活動三斜率比較未生效');
    if (cc.h > 415) fail.push(`概念模式高度 ${cc.h.toFixed(1)} > 415`);
    await evalJs(`document.querySelector('.tab[data-act="1"]').click()`);
    await sleep(100);
    const cs1 = await send('Page.captureScreenshot', { format:'png' });
    fs.writeFileSync(path.join(out, 'd41_concept_act1_light.png'), Buffer.from(cs1.result.data, 'base64'));
    await evalJs(`document.querySelector('.tab[data-act="0"]').click()`);
    await sleep(100);
    const cs = await send('Page.captureScreenshot', { format:'png' });
    fs.writeFileSync(path.join(out, 'd41_concept_light.png'), Buffer.from(cs.result.data, 'base64'));

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error ' + realErrors.length + ' 筆：' + realErrors[0].slice(0,200));

    console.log(`MAX_HEIGHT light=${maxH.light.toFixed(1)} dark=${maxH.dark.toFixed(1)} desktop=${maxH.desktop.toFixed(1)}`);
    console.log(`MODULES ${seenModules.size}: ${[...seenModules].join(',')}`);
    if (fail.length) {
      console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- '));
      process.exit(1);
    }
    console.log('PASS verify_d41_cdp: Q1~Q10 × Light/Dark × 390x844/1280x800 高度≤415px、零溢出、零內部捲軸、零劇透、q-mode 隱藏活動卡、三活動與十題互動全綠');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    if (c && c.ws) c.ws.close();
    if (server) server.close();
    child.kill();
  }
})();
