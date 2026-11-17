/**
 * tools/capture_g2_n211_n212.js
 * 一鍵產出 G2 N-2-11 (5題) 與 G2 N-2-12 (5題) 的 390px 實機截圖供視覺審查
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
const argsPort = 9348;
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
  const previewDir = path.join(process.cwd(), 'reports', 'previews');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  const u1 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-11.json'), 'utf8'));
  const u2 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-12.json'), 'utf8'));
  const allQuestions = [
    ...u1.questions.map((q, i) => ({ ...q, fname: `shot_g2_n211_q0${i+1}.png` })),
    ...u2.questions.map((q, i) => ({ ...q, fname: `shot_g2_n212_q${String(i + 6).padStart(2, '0')}.png` }))
  ];

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2n211n212-cap-'));
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

    for (const item of allQuestions) {
      const url = pathToFileURL(path.join(process.cwd(), 'app', item.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(400);

      const shot = await ws.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const fpath1 = path.join(outDir, item.fname);
      const fpath2 = path.join(previewDir, item.fname);
      const buf = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(fpath1, buf);
      fs.writeFileSync(fpath2, buf);
      console.log(`Saved screenshot: ${item.fname} (${buf.length} bytes)`);
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
