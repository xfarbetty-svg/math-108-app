const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const u1 = JSON.parse(fs.readFileSync('data/units/G2/N-2-9.json'));
const u2 = JSON.parse(fs.readFileSync('data/units/G2/N-2-10.json'));
const all = [...u1.questions, ...u2.questions];

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromePath = CHROME_CANDIDATES.find(p => fs.existsSync(p));
const proc = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9350', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:9350/json/list');
  const list = await res.json();
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0;
  const send = (method, params) => new Promise((resolve) => {
    const cur = ++id;
    const handler = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === cur) { ws.removeEventListener('message', handler); resolve(msg.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  for (const q of all) {
    const url = pathToFileURL(path.resolve('app', q.component_path)).href;
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 300));
    const r = await send('Runtime.evaluate', {
      expression: 'Math.round(document.querySelector(".wrap").getBoundingClientRect().height)',
      returnByValue: true
    });
    console.log(q.id, q.component_path, 'height:', r.result ? r.result.value : r);
  }
  await send('Browser.close');
  proc.kill();
}
run().catch(console.error);
