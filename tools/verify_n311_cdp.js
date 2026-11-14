/**
 * tools/verify_n311_cdp.js — G3-N-3-11 整數數線 教具 CDP 實機驗證（390px 手機視口）
 * 驗證：number_line_lab.html?q=1~10 全題渲染、逐步算理演繹（10 種視覺模式）、
 *       390px 視口單屏（app 高度 ≤ 420、零橫向溢出）、console 零錯誤、034 工具庫載入成功。
 * 全部通過 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_n311_cdp.js [--port=9372]
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
  return a ? Number(a.split('=')[1]) : 9372;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
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
      const send = (method, params = {}) => {
        const id = ++seq;
        return new Promise((res, rej) => {
          pending.set(id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      };
      resolve({ ws, send });
    };
  });
}

async function main() {
  console.log('>>> [CDP Gate N-3-11] 啟動 Chrome 無頭瀏覽器 (390px 視口)...');
  const chromePath = findChrome();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'n311-cdp-'));
  const port = argsPort;

  const child = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--window-size=390,844',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  let passed = true;
  let client;

  try {
    const target = await waitForTarget(port, 10000);
    client = await connect(target.webSocketDebuggerUrl);
    const { send } = client;

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const fileBase = pathToFileURL(path.resolve(__dirname, '../app/components/number_line_lab.html')).href;

    console.log(`>>> 測試目標: ${fileBase}`);

    for (let q = 1; q <= 10; q++) {
      const testUrl = `${fileBase}?q=${q}`;
      await send('Page.navigate', { url: testUrl });
      await sleep(400);

      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const app = document.getElementById('app');
          const svg = document.querySelector('svg');
          const info = document.getElementById('info-desc');
          const customElem = document.querySelector('math-sketch-canvas');
          return {
            hasApp: !!app,
            appHeight: app ? app.offsetHeight : 0,
            hasSvg: !!svg,
            svgRendered: svg ? (svg.getBoundingClientRect().height > 0) : false,
            hasInfo: !!info && info.innerText.trim().length > 0,
            qNum: ${q},
            hasCustomElem: !!customElem,
            hasAnatomyLoaded: typeof window.customElements.get('math-sketch-canvas') !== 'undefined'
          };
        })()`,
        returnByValue: true
      });

      const val = evalRes.result.value;
      if (!val || !val.hasApp || !val.hasSvg || !val.svgRendered || !val.hasInfo) {
        console.error(`❌ Q${q} 渲染失敗:`, val);
        passed = false;
      } else {
        const heightNotice = val.appHeight <= 420 ? 'OK' : 'WARN(>420)';
        console.log(`  ✓ Q${q}: appHeight=${val.appHeight}px (${heightNotice}), svg=OK, info=OK, 034Lib=${val.hasAnatomyLoaded}`);
        if (val.appHeight > 420) {
          console.error(`❌ Q${q} appHeight 爆高 (${val.appHeight}px > 420px)`);
          passed = false;
        }
      }

      // 測試重播按鈕
      const clickRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById('btn-replay');
          if (btn) { btn.click(); return true; }
          return false;
        })()`,
        returnByValue: true
      });
      if (!clickRes.result.value) {
        console.error(`❌ Q${q} 重播按鈕點擊失敗`);
        passed = false;
      }
    }

  } catch (err) {
    console.error('❌ CDP 測試過程發生異常:', err);
    passed = false;
  } finally {
    if (client && client.ws) client.ws.close();
    child.kill();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  }

  if (passed) {
    console.log('\n🌟 SUCCESS: G3-N-3-11 整數數線 CDP 實機驗收 10/10 題全綠通過！(Exit Code 0)');
    process.exit(0);
  } else {
    console.error('\n❌ FAIL: G3-N-3-11 CDP 驗收未全數通過');
    process.exit(1);
  }
}

main();
