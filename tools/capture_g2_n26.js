/**
 * tools/capture_g2_n26.js - 一鍵產出 G2 N-2-6 (5題) 的 390px 實機截圖
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
const argsPort = 9334;
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
  const outDir = path.join(process.cwd(), '_scratch', 'verify');
  fs.mkdirSync(outDir, { recursive: true });
  const unit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-6.json'), 'utf8'));

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2n26-cap-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(argsPort, 15000);
    const ws = await connect(target.webSocketDebuggerUrl);
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    for (let i = 0; i < unit.questions.length; i++) {
      const q = unit.questions[i];
      const url = pathToFileURL(path.join(process.cwd(), 'app', q.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const shot = await ws.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const fname = `shot_g2_n_2_6_q0${i+1}.png`;
      const fpath = path.join(outDir, fname);
      fs.writeFileSync(fpath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${fname} (${fs.statSync(fpath).size} bytes)`);
    }
  } finally {
    try { proc.kill(); } catch (e) { }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
