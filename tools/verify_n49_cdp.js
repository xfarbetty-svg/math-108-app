/**
 * tools/verify_n49_cdp.js — G4-N-4-9 CDP 實機渲染與互動驗證
 *  A. 元件 ?q=1..10 × Light/Dark × 390x844 / 1280x800：高度 <= 415px（含展開算理後）、零橫向溢出、零劇透
 *  B. 觀念小教室 mode=concept：三活動切換、撥輪互動狀態變化
 *  C. 主入口 app/index.html → 四年級 → N-4-9 → 預設「🌱 概念探索」→ 保留語音導讀與算草稿 → 真題 Q1~Q10 全流程
 */
'use strict';
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'tools', '_scratch');
const port = 9449;
const httpPort = 9450;
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
      ws,
      errors,
      send: (method, params = {}) => new Promise((res) => {
        const i = ++id;
        waiting.set(i, res);
        ws.send(JSON.stringify({ id: i, method, params }));
      })
    });
  });
}

function startStaticServer() {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  const server = http.createServer((req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
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
    const nav = async (url, ms = 180) => { await send('Page.navigate', { url }); await sleep(ms); };
    const base = 'file:///' + path.join(root, 'app', 'components', 'length_km_g4_lab.html').replace(/\\/g, '/');
    const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-9.json'), 'utf8'));
    const maxH = { light: 0, dark: 0, desktop: 0 };
    const maxW = { light: 0, dark: 0, desktop: 0 };

    const expectedModules = {
      1: 'split_km_m', 2: 'join_km_m', 3: 'compare_pair', 4: 'compare_four',
      5: 'compare_pair', 6: 'col_borrow_sub', 7: 'div_bar_machine', 8: 'dec_mul_split',
      9: 'col_carry_add', 10: 'col_borrow_sub'
    };
    const seenModules = new Set();

    /* A. ?q=1..10 × Light/Dark × 390x844 */
    for (const theme of ['light', 'dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      for (let q = 1; q <= 10; q++) {
        await nav(base + '?q=' + q + '&theme=' + theme, 160);
        const m = await evalJs(`(() => {
          const app = document.getElementById('app');
          return {
            sw: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            h: app.getBoundingClientRect().height,
            bodyH: document.body.getBoundingClientRect().height,
            mode: window.__N49_MODE__,
            q: window.__N49_Q__,
            mod: window.__N49_MODULE__,
            tabsHidden: document.getElementById('tabs').hidden,
            explainBefore: !!document.querySelector('.explain'),
            internalOpts: document.querySelectorAll('.opt,.option-btn,.shell-opt').length
          };
        })()`);
        if (m.sw > m.cw) fail.push(`q${q}/${theme}/390 橫向溢出 scrollWidth=${m.sw} > clientWidth=${m.cw}`);
        if (m.h > 415) fail.push(`q${q}/${theme}/390 初始高度 ${m.h.toFixed(1)} > 415`);
        if (m.mode !== 'exam' || m.q !== q) fail.push(`q${q}/${theme} 模式/題號錯誤`);
        if (m.mod !== expectedModules[q]) fail.push(`q${q}/${theme} 互動模組不符：${m.mod} != ${expectedModules[q]}`);
        seenModules.add(m.mod);
        if (!m.tabsHidden) fail.push(`q${q}/${theme} 真題模式未隱藏活動頁籤`);
        if (m.explainBefore) fail.push(`q${q}/${theme} 初始畫面劇透 .explain`);
        if (m.internalOpts !== 0) fail.push(`q${q}/${theme} 教具私自重畫選項`);
        maxH[theme] = Math.max(maxH[theme], m.h);
        maxW[theme] = Math.max(maxW[theme], m.sw);

        /* 點擊題型專屬互動按鈕 + 「一步一步看算理」後高度仍須 <= 415px */
        const after = await evalJs(`(() => {
          const a1 = document.getElementById('qAct1');
          if (a1) a1.click();
          const a2 = document.getElementById('qAct2');
          if (a2) a2.click();
          const c0 = document.querySelector('[data-card="0"]');
          if (c0) c0.click();
          const cl = document.getElementById('cmpL');
          if (cl) cl.click();
          document.getElementById('rbtn').click();
          const app = document.getElementById('app');
          return { h: app.getBoundingClientRect().height, hasExplain: !!document.querySelector('.explain') };
        })()`);
        if (!after.hasExplain) fail.push(`q${q}/${theme} 點擊看算理未展開 .explain`);
        if (after.h > 415) fail.push(`q${q}/${theme}/390 展開算理後高度 ${after.h.toFixed(1)} > 415`);
        maxH[theme] = Math.max(maxH[theme], after.h);

        if ((theme === 'light' && [1, 4, 6, 7].includes(q)) || (theme === 'dark' && q === 9)) {
          const s = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(out, `n49_q${q}_${theme}.png`), Buffer.from(s.result.data, 'base64'));
        }
      }
    }
    if (seenModules.size < 6) fail.push('真題互動模組種類不足：' + seenModules.size);

    /* A2. 1280x800 桌面 × Light/Dark */
    for (const theme of ['light', 'dark']) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
      for (let q = 1; q <= 10; q++) {
        await nav(base + '?q=' + q + '&theme=' + theme, 130);
        const dm = await evalJs(`(() => {
          document.getElementById('rbtn').click();
          return {
            sw: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            h: document.getElementById('app').getBoundingClientRect().height
          };
        })()`);
        if (dm.sw > dm.cw) fail.push(`q${q}/${theme}/1280 橫向溢出 ${dm.sw} > ${dm.cw}`);
        if (dm.h > 415) fail.push(`q${q}/${theme}/1280 展開後高度 ${dm.h.toFixed(1)} > 415`);
        maxH.desktop = Math.max(maxH.desktop, dm.h);
        maxW.desktop = Math.max(maxW.desktop, dm.sw);
      }
    }

    /* B. 觀念小教室模式 ?mode=concept */
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav(base + '?mode=concept&theme=light', 200);
    const conceptCheck = await evalJs(`(() => {
      const tabs = document.querySelectorAll('#tabs .tab').length;
      const before = document.getElementById('c1Read').textContent;
      document.querySelector('[data-m="1500"]').click();
      const after = document.getElementById('c1Read').textContent;
      const h0 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="1"]').click();
      const act1Title = document.querySelector('#act1 .title').textContent;
      document.getElementById('c2BorrowBtn').click();
      const act1Msg = document.getElementById('c2Msg').textContent;
      const h1 = document.getElementById('app').getBoundingClientRect().height;
      document.querySelector('.tab[data-act="2"]').click();
      const act2Title = document.querySelector('#act2 .title').textContent;
      document.getElementById('c3Step1').click();
      document.getElementById('c3Step2').click();
      const hasLdiv = !!document.querySelector('#act2 .ldiv');
      const h2 = document.getElementById('app').getBoundingClientRect().height;
      return { mode: window.__N49_MODE__, tabs, before, after, act1Title, act1Msg, act2Title, hasLdiv, h: Math.max(h0, h1, h2) };
    })()`);
    if (conceptCheck.mode !== 'concept' || conceptCheck.tabs !== 3) fail.push('概念模式初始化失敗');
    if (conceptCheck.before === conceptCheck.after) fail.push('活動一地點按鈕點擊後數值未變動');
    if (!conceptCheck.act1Msg.includes('1000')) fail.push('活動二借位按鈕未生效');
    if (!conceptCheck.hasLdiv) fail.push('活動三長除法未展開');
    if (conceptCheck.h > 390) fail.push(`概念模式高度 ${conceptCheck.h.toFixed(1)} > 390`);
    const cs = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(out, 'n49_concept_light.png'), Buffer.from(cs.result.data, 'base64'));

    /* C. 主入口 app/index.html → 四年級 → N-4-9 → 預設概念探索 + 工具列 + Q1~Q10 全流程 */
    server = await startStaticServer();
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await nav('http://127.0.0.1:' + httpPort + '/app/index.html', 400);
    const gradeOk = await evalJs(`(() => {
      const b = [...document.querySelectorAll('.grade-btn')].find(x => x.textContent.includes('四年級'));
      if (b) { b.click(); return true; }
      return false;
    })()`);
    if (!gradeOk) fail.push('主入口找不到四年級');
    await sleep(250);
    const unitOk = await evalJs(`(() => {
      const c = [...document.querySelectorAll('.unit-card')].find(x => x.textContent.includes('N-4-9'));
      if (c) { c.click(); return true; }
      return false;
    })()`);
    if (!unitOk) fail.push('四年級找不到 N-4-9 單元卡');
    await sleep(450);

    const enter = await evalJs(`(() => {
      const btnConcept = document.getElementById('btnModeConcept');
      const btnSpeak = document.getElementById('btnSpeak');
      const btnScratch = document.getElementById('btnScratch') || [...document.querySelectorAll('button')].find(x => x.textContent.includes('算草稿'));
      const f = document.getElementById('conceptFrame');
      return {
        tabsDisp: getComputedStyle(document.getElementById('unitModeTabs')).display,
        conceptActive: btnConcept && btnConcept.classList.contains('active'),
        speakShown: btnSpeak && getComputedStyle(btnSpeak).display !== 'none',
        scratchShown: btnScratch && getComputedStyle(btnScratch).display !== 'none',
        src: f ? f.src : '',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    })()`);
    if (!/flex/.test(enter.tabsDisp) || !enter.conceptActive) fail.push('N-4-9 未預設開啟「🌱 概念探索」: ' + JSON.stringify(enter));
    if (!enter.speakShown || !enter.scratchShown) fail.push('N-4-9 缺少語音導讀或算草稿按鈕: ' + JSON.stringify(enter));
    if (!enter.src.includes('length_km_g4_lab.html?mode=concept')) fail.push('conceptFrame src 異常: ' + enter.src);
    if (enter.overflow) fail.push('主入口 390px 橫向溢出');

    await evalJs(`document.getElementById('btnModeExam').click()`);
    await sleep(300);
    for (let i = 1; i <= 10; i++) {
      const s = await evalJs(`({
        frame: document.getElementById('stageFrame').src,
        stem: document.getElementById('shellStem').textContent,
        opts: document.querySelectorAll('#shellOptions .shell-opt').length
      })`);
      if (!s.frame.includes('?q=' + i)) fail.push(`Q${i} iframe 題號錯誤：${s.frame}`);
      if (s.stem !== unit.questions[i - 1].stem) fail.push(`Q${i} 外殼題幹不符`);
      if (s.opts !== 4) fail.push(`Q${i} 外殼選項數=${s.opts}`);
      if (i < 10) {
        await evalJs(`document.getElementById('btnNext').click()`);
        await sleep(180);
      }
    }

    const realErrors = c.errors.filter((x) => !/serviceWorker|sw\.js|favicon/i.test(x));
    if (realErrors.length) fail.push('console error ' + realErrors.length + ' 筆：' + realErrors[0].slice(0, 200));

    console.log(`MAX_HEIGHT light=${maxH.light.toFixed(1)} dark=${maxH.dark.toFixed(1)} desktop=${maxH.desktop.toFixed(1)}`);
    console.log(`MAX_WIDTH  light=${maxW.light} dark=${maxW.dark} desktop=${maxW.desktop}`);
    if (fail.length) {
      console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- '));
      process.exit(1);
    }
    console.log('PASS verify_n49_cdp: 10題×Light/Dark 390x844/1280x800 高度≤415px、零溢出、零劇透、主入口預設概念探索+Q1~Q10全綠');
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
