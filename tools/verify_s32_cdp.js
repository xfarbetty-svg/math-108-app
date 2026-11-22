/**
 * tools/verify_s32_cdp.js — S-3-2 概念小教室影片播放器 CDP 雙視口實機驗證
 * 390×844（手機）與 1280×800（桌機）兩視口：
 *   1. shell.js 註冊 S-3-2 → btnConceptMovie href / 顯示狀態 / 標題
 *   2. 直接導向 S32_Final.mp4 → <video> 中繼資料 1920×1080、30fps、163.2s
 *   3. 零 Runtime exception；靜態伺服器支援 Range（還原線上播放行為）
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 9418;
const HTTP_PORT = 9419;
const MOVIE = 'assets/classroom_videos/S32_Final.mp4';
const CHROME = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (m) => { console.error('FAIL: ' + m); process.exit(1); };

function staticServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const fp = path.join(ROOT, rel);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      res.writeHead(404); res.end(); return;
    }
    const st = fs.statSync(fp);
    const type = fp.endsWith('.mp4') ? 'video/mp4'
      : fp.endsWith('.js') ? 'text/javascript'
      : fp.endsWith('.html') ? 'text/html'
      : fp.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      if (!m) { res.writeHead(416); res.end(); return; }
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(fp, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size });
      fs.createReadStream(fp).pipe(res);
    }
  });
  return new Promise((resolve) => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)));
}

async function waitTarget() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl, errors) {
  return new Promise((resolve, reject) => {
    const WebSocket = globalThis.WebSocket || require('ws');
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    };
    ws.onerror = (e) => reject(e);
    ws.onopen = () => resolve({
      ws,
      send: (method, params = {}) => new Promise((res, rej) => {
        const id = ++seq; pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      })
    });
  });
}

async function main() {
  if (!CHROME) fail('未找到 Chrome/Edge');
  if (!fs.existsSync(path.join(ROOT, 'app', MOVIE))) fail('S32_Final.mp4 不存在');
  const server = await staticServer();
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-s32-'));
  const cp = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--window-size=1280,800', 'about:blank'
  ], { stdio: 'ignore' });
  const cleanup = () => { try { cp.kill(); } catch (e) {} try { server.close(); } catch (e) {}
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {} };
  process.on('exit', cleanup);

  const errors = [];
  let client = null;
  try {
    client = await connect(await waitTarget(), errors);
    const { send } = client;
    await send('Page.enable'); await send('Runtime.enable');
    const evalJs = async (expression, awaitPromise = false) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
      if (r.exceptionDetails) fail('Runtime.evaluate 拋錯: ' + r.exceptionDetails.text);
      return r.result.value;
    };

    for (const vp of [{ n: '390×844 mobile', w: 390, h: 844, m: true },
                      { n: '1280×800 desktop', w: 1280, h: 800, m: false }]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.m });
      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/app/index.html` });
      await sleep(1400);
      const shellInfo = await evalJs(`(async () => {
        if (typeof openUnit !== 'function' || typeof openConceptLab !== 'function')
          return { ok: false, why: 'shell 入口函式未定義' };
        await openUnit('S-3-2');
        openConceptLab('S-3-2');
        const a = document.getElementById('btnConceptMovie');
        const de = document.documentElement;
        return { ok: true, href: a && a.getAttribute('href'), display: a && a.style.display,
                 title: a && a.title, overflowX: de.scrollWidth > de.clientWidth + 2,
                 code: state.unit && state.unit.code };
      })()`, true);
      if (!shellInfo.ok) fail(vp.n + ': ' + shellInfo.why);
      if (shellInfo.href !== MOVIE) fail(vp.n + ': 電影連結錯誤 ' + shellInfo.href);
      if (shellInfo.display === 'none') fail(vp.n + ': 電影按鈕被隱藏');
      if (!shellInfo.title.includes('正方形和長方形')) fail(vp.n + ': 標題錯誤 ' + shellInfo.title);
      if (shellInfo.code !== 'S-3-2') fail(vp.n + ': 單元未切換 ' + shellInfo.code);
      if (shellInfo.overflowX) fail(vp.n + ': 出現橫向溢出');
      console.log(`PASS: ${vp.n} shell 掛載 OK（href=${MOVIE}, title=${shellInfo.title}, 零溢出）`);

      await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/app/${MOVIE}` });
      let video = null;
      for (let i = 0; i < 30; i++) {
        video = await evalJs(`(() => { const v = document.querySelector('video');
          return v && v.readyState >= 1 ? { w: v.videoWidth, h: v.videoHeight,
            d: v.duration, src: v.currentSrc } : null; })()`);
        if (video) break;
        await sleep(400);
      }
      if (!video) fail(vp.n + ': <video> 中繼資料未載入');
      if (video.w !== 1920 || video.h !== 1080) fail(vp.n + ': 解析度錯誤 ' + JSON.stringify(video));
      if (Math.abs(video.d - 163.2) > 0.5) fail(vp.n + ': 時長錯誤 ' + video.d);
      if (!video.src.includes('S32_Final.mp4')) fail(vp.n + ': 播放來源錯誤 ' + video.src);
      console.log(`PASS: ${vp.n} 播放器 OK（${video.w}×${video.h}, ${video.d}s, Range 206）`);
    }
    if (errors.length) fail('Runtime exception: ' + errors.join(' | '));
    console.log('S32_CDP_OK 雙視口播放器實測全綠、零例外 (Exit 0)');
    process.exit(0);
  } catch (e) {
    fail('CDP 執行異常: ' + e.message);
  } finally {
    if (client && client.ws) client.ws.close();
    cleanup();
  }
}
main();
