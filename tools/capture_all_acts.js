const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9346;
const targetHtml = path.resolve('app/components/g3_n39_mimi_lesson.html').replace(/\\/g, '/');
const targetUrl = 'file:///' + targetHtml;
const userDataDir = path.join(process.env.TEMP || 'C:\\TEMP', 'cdp_acts_' + Date.now());

const proc = spawn(CHROME, [
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
  if (!page) throw new Error('Target not found');

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
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 800));

  const outDir = path.resolve('reports/previews');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Cover
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act0_cover.png'), Buffer.from(shot.data, 'base64'));

  // 2. Act 1: 情境鋪陳
  await send('Runtime.evaluate', { expression: 'window.__mimiLesson.start(1)' });
  await new Promise(r => setTimeout(r, 1200));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act1_situation.png'), Buffer.from(shot.data, 'base64'));

  // 3. Act 2: 算理構念 (數到 10 塊)
  await send('Runtime.evaluate', { expression: 'window.__mimiLesson.goToAct(2)' });
  await new Promise(r => setTimeout(r, 2500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act2_concept.png'), Buffer.from(shot.data, 'base64'));

  // 4. Act 3: 算式抽象 (分母不變警告)
  await send('Runtime.evaluate', { expression: 'window.__mimiLesson.goToAct(3)' });
  await new Promise(r => setTimeout(r, 2500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act3_equation.png'), Buffer.from(shot.data, 'base64'));

  // 5. Act 4: 互動驗收 (選擇答案)
  await send('Runtime.evaluate', { expression: 'window.__mimiLesson.goToAct(4)' });
  await new Promise(r => setTimeout(r, 1200));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act4_quiz.png'), Buffer.from(shot.data, 'base64'));

  // 6. Act 4 答對反饋
  await send('Runtime.evaluate', { expression: 'window.__mimiLesson.pickAnswer(0)' });
  await new Promise(r => setTimeout(r, 1200));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'act4_correct.png'), Buffer.from(shot.data, 'base64'));

  console.log('ALL_ACTS_CAPTURED_PERFECTLY');
  ws.close();
  proc.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  proc.kill();
  process.exit(1);
});
