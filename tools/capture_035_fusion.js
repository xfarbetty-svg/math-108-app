/**
 * tools/capture_035_fusion.js
 * 截取 035 插圖與 028 純向量教具融合打樣效果 (390px 手機視口)
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
const argsPort = 9355;
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
        if (msg.error) rej(new Error(msg.error.message || 'CDP 錯誤'));
        else res(msg.result);
      }
    });
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
  });
}

async function main() {
  const chromePath = findChrome();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-035-fusion-'));
  const proc = spawn(chromePath, [
    `--remote-debugging-port=${argsPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tmpDir}`,
    'about:blank'
  ]);

  try {
    const target = await waitForTarget(argsPort, 8000);
    const { send } = await connect(target.webSocketDebuggerUrl);

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    const fileUrl = pathToFileURL(path.join(__dirname, '..', 'app', 'components', 'demo_035_fusion.html')).href;
    await send('Page.navigate', { url: fileUrl });
    await sleep(1500);

    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const buf = Buffer.from(shot.data, 'base64');

    const outDir = path.join(__dirname, '..', 'reports', 'previews');
    fs.makedirsSync ? fs.makedirsSync(outDir) : fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'shot_035_fusion_demo.png');
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${outPath} (${buf.length} bytes)`);

  } finally {
    proc.kill();
    await sleep(400);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
