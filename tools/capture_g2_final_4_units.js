/**
 * tools/capture_g2_final_4_units.js
 * 一鍵產出 G2-R-2-2, R-2-3, R-2-4, D-2-1 四大單元 (20題) 的 390px 實機截圖供 035 視覺審查
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
const argsPort = 9363;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到可用的 Chrome/Edge');
}

async function waitForTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) { }
    await sleep(150);
  }
  throw new Error('等待 CDP target 超時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.addEventListener('open', () => resolve({ send }));
    ws.addEventListener('error', () => reject(new Error('WebSocket 連線失敗')));
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    });
    function send(method, params) {
      const id = ++seq;
      return new Promise((res, rej) => {
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }
  });
}

async function main() {
  const outDir = path.join(process.cwd(), 'reports', 'previews', 'g2_final_4');
  fs.mkdirSync(outDir, { recursive: true });

  const chromePath = findChrome();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp_cap_final4_'));
  const proc = spawn(chromePath, [
    `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(argsPort, 20000);
    const ws = await connect(target.webSocketDebuggerUrl);

    await ws.send('Runtime.enable');
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const items = [
      // R-2-2 (Q01~Q05)
      { id: 'g2_r22_q01', path: 'app/components/g2_r22_q01.html' },
      { id: 'g2_r22_q02', path: 'app/components/g2_r22_q02.html' },
      { id: 'g2_r22_q03', path: 'app/components/g2_r22_q03.html' },
      { id: 'g2_r22_q04', path: 'app/components/g2_r22_q04.html' },
      { id: 'g2_r22_q05', path: 'app/components/g2_r22_q05.html' },
      // R-2-3 (Q06~Q10)
      { id: 'g2_r23_q06', path: 'app/components/g2_r23_q06.html' },
      { id: 'g2_r23_q07', path: 'app/components/g2_r23_q07.html' },
      { id: 'g2_r23_q08', path: 'app/components/g2_r23_q08.html' },
      { id: 'g2_r23_q09', path: 'app/components/g2_r23_q09.html' },
      { id: 'g2_r23_q10', path: 'app/components/g2_r23_q10.html' },
      // R-2-4 (Q01~Q05)
      { id: 'g2_r24_q01', path: 'app/components/g2_r24_q01.html' },
      { id: 'g2_r24_q02', path: 'app/components/g2_r24_q02.html' },
      { id: 'g2_r24_q03', path: 'app/components/g2_r24_q03.html' },
      { id: 'g2_r24_q04', path: 'app/components/g2_r24_q04.html' },
      { id: 'g2_r24_q05', path: 'app/components/g2_r24_q05.html' },
      // D-2-1 (Q06~Q10)
      { id: 'g2_d21_q06', path: 'app/components/g2_d21_q06.html' },
      { id: 'g2_d21_q07', path: 'app/components/g2_d21_q07.html' },
      { id: 'g2_d21_q08', path: 'app/components/g2_d21_q08.html' },
      { id: 'g2_d21_q09', path: 'app/components/g2_d21_q09.html' },
      { id: 'g2_d21_q10', path: 'app/components/g2_d21_q10.html' },
    ];

    for (const item of items) {
      const fullPath = path.join(process.cwd(), item.path);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ 檔案不存在跳過: ${item.path}`);
        continue;
      }
      const url = pathToFileURL(fullPath).href;
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const shot = await ws.send('Page.captureScreenshot', { format: 'png' });
      const dest = path.join(outDir, `${item.id}.png`);
      fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
      console.log(`✅ 截圖已儲存: ${dest}`);
    }
  } finally {
    try { proc.kill(); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
