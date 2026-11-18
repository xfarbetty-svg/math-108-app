const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];
const browser = CHROME_CANDIDATES.find(p => fs.existsSync(p));
const port = 9333;
const targetHtml = path.resolve('app/components/g3_n39_mimi_lesson.html').replace(/\\/g, '/');
const targetUrl = 'file:///' + targetHtml;
const userDataDir = path.join(process.env.TEMP || 'C:\\TEMP', 'cdp_mimi_' + Date.now());

const proc = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=390,844',
  targetUrl
]);

async function run() {
  await new Promise(r => setTimeout(r, 1200));
  let page = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      page = list.find(t => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) break;
    } catch(e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  if (!page) {
    proc.kill();
    throw new Error('無法取得頁面 target');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(res => { ws.onopen = res; });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pending.has(m.id)) {
      const resolver = pending.get(m.id);
      pending.delete(m.id);
      resolver(m.result);
    }
  };
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    pending.set(curId, res);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.enable');
  await new Promise(r => setTimeout(r, 1500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outDir = path.resolve('reports/previews');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'g3_n39_mimi_preview.png');
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('SCREENSHOT_SAVED:', outPath);

  ws.close();
  proc.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  proc.kill();
  process.exit(1);
});
