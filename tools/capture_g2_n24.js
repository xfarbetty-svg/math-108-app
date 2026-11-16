/**
 * tools/capture_g2_n24.js — 擷取 G2 N-2-4 5 題段考真題的 390px 實機截圖與 Sidecar
 */
'use strict';
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const argsPort = 9338;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到可用 Chrome/Edge');
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
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.addEventListener('open', () => resolve({ send }));
    ws.addEventListener('error', () => reject(new Error('WebSocket 失敗')));
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
  const outDir = path.join(process.cwd(), '_scratch/verify');
  fs.mkdirSync(outDir, { recursive: true });

  const u = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/units/G2/N-2-4.json'), 'utf8'));

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'g2-n24-cap-'));
  const proc = spawn(findChrome(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--remote-debugging-port=${argsPort}`,
    `--user-data-dir=${profile}`, '--window-size=390,844', 'about:blank'
  ], { stdio: 'ignore' });

  try {
    const target = await waitForTarget(argsPort, 20000);
    const ws = await connect(target.webSocketDebuggerUrl);
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true
    });

    let gitHead = 'unknown';
    try {
      gitHead = execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (_e) {}

    for (let idx = 0; idx < u.questions.length; idx++) {
      const q = u.questions[idx];
      const url = pathToFileURL(path.join(process.cwd(), 'app', q.component_path)).href;
      await ws.send('Page.navigate', { url });
      await sleep(500);

      const shot = await ws.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const buf = Buffer.from(shot.data, 'base64');
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

      const filename = `shot_g2_n24_q${idx + 1}.png`;
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, buf);
      console.log(`[PASS] Captured: ${q.id} -> ${filename} (${buf.length} bytes, SHA: ${sha256.slice(0, 10)})`);

      // 產出 Q1 作為通用 preview_390.png 與 sidecar
      if (idx === 0) {
        const previewPath = path.join(outDir, 'preview_390.png');
        const sidecarPath = path.join(outDir, 'preview_390.json');
        fs.writeFileSync(previewPath, buf);
        const sidecar = {
          image_path: previewPath,
          sha256,
          size_bytes: buf.length,
          width: 390,
          height: 844,
          git_head: gitHead,
          html_source: q.component_path,
          created_at: new Date().toISOString()
        };
        fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2), 'utf-8');
        console.log(`[PASS] preview_390.png & sidecar generated for ${q.id}`);
      }
    }
    console.log('ALL_N24_CAPTURED_SUCCESS');
  } finally {
    try { proc.kill(); } catch (e) { }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
