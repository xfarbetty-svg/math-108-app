/**
 * tests/verify_g3_n39_theater_cdp.js — G3 N-3-9 劇場 CDP 實機驗證
 * 參考 tests/verify_concept_hub_cdp.js 的原生 Node.js CDP 架構。
 */
'use strict';
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCENE_PATH = 'app/scenes/g3_n39_theater/index.html';
const SHOT_PATH = path.join(ROOT, 'reports', 'screenshots', 'theater_n39_cdp.png');
const VIEWPORT = { width: 390, height: 844 };
const MAX_STAGE_HEIGHT = 420;
const ACT_VIDEOS = [1, 2, 3, 4].map((n) => `video/mimi_n39_act${n}.mp4`);

const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath;
      try {
        urlPath = decodeURIComponent(req.url.split('?')[0]);
      } catch (e) {
        res.writeHead(400);
        res.end('400');
        return;
      }
      // favicon 404 會被 Chrome 記為 console error，直接回 204  silence
      if (urlPath === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
      }
      const rel = urlPath === '/' ? SCENE_PATH : urlPath.replace(/^\/+/, '');
      const fp = path.resolve(ROOT, rel);
      if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) {
        res.writeHead(403);
        res.end('403');
        return;
      }
      fs.stat(fp, (statErr, stat) => {
        if (statErr || !stat.isFile()) {
          res.writeHead(404);
          res.end('404');
          return;
        }
        fs.readFile(fp, (err, buf) => {
          if (err) {
            res.writeHead(500);
            res.end('500');
            return;
          }
          const ext = path.extname(fp).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
            'Accept-Ranges': 'bytes'
          });
          res.end(buf);
        });
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function waitForTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* 等待 Chrome 啟動 */ }
    await sleep(150);
  }
  throw new Error('等待 CDP target 逾時');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = new Map();

    function send(method, params) {
      const id = ++seq;
      return new Promise((res, rej) => {
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    }

    function onEvent(method, fn) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    }

    ws.addEventListener('open', () => resolve({ send, onEvent }));
    ws.addEventListener('error', () => reject(new Error('WebSocket 連線失敗')));
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
        return;
      }
      if (msg.method) {
        for (const fn of listeners.get(msg.method) || []) {
          try { fn(msg.params || {}); } catch (e) { /* 監聽器不影響主流程 */ }
        }
      }
    });
  });
}

function killChromeTree(proc) {
  if (!proc || !proc.pid) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    } catch (e) { /* 已結束或其他錯誤，改走 kill */ }
  }
  try { proc.kill('SIGKILL'); } catch (e) { /* 已結束 */ }
}

async function main() {
  const { server, port: httpPort } = await startServer();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'theater-n39-verify-'));
  const chrome = findChrome();
  const cdpPort = 9500 + (process.pid % 300);
  const pageUrl = `http://127.0.0.1:${httpPort}/${SCENE_PATH}`;
  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--autoplay-policy=no-user-gesture-required',
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`, 'about:blank'
  ], { stdio: 'ignore' });

  const lines = [];
  let allOk = false;

  try {
    const target = await waitForTarget(cdpPort, 20000);
    const ws = await connect(target.webSocketDebuggerUrl);

    const consoleErrors = [];
    ws.onEvent('Runtime.consoleAPICalled', (p) => {
      if (p.type !== 'error') return;
      const text = (p.args || []).map((a) => a.value || a.description || a.preview?.description || '').join(' ');
      consoleErrors.push(`console.error: ${text}`);
    });
    ws.onEvent('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails || {};
      consoleErrors.push(`exception: ${d.text || ''} ${d.exception?.description || ''}`.trim());
    });
    ws.onEvent('Log.entryAdded', (p) => {
      const e = p.entry || {};
      if (e.level === 'error') consoleErrors.push(`log.error: ${e.text || ''}`);
    });

    const evaluate = async (expression) => {
      const r = await ws.send('Runtime.evaluate', {
        expression, awaitPromise: true, returnByValue: true
      });
      if (r.exceptionDetails) {
        throw new Error(`Runtime.evaluate 例外: ${r.exceptionDetails.text || ''} ${r.exceptionDetails.exception?.description || ''}`);
      }
      return r.result && r.result.value;
    };

    const waitFor = async (label, predicate, timeoutMs = 10000) => {
      const deadline = Date.now() + timeoutMs;
      let last;
      while (Date.now() < deadline) {
        last = await predicate();
        if (last === true) return;
        await sleep(150);
      }
      throw new Error(`${label} 逾時 (last=${JSON.stringify(last)})`);
    };

    await ws.send('Runtime.enable');
    await ws.send('Log.enable');
    await ws.send('Page.enable');
    await ws.send('Emulation.setDeviceMetricsOverride', {
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1,
      mobile: true
    });
    await ws.send('Page.navigate', { url: pageUrl });
    await waitFor('頁面載入', async () => (await evaluate('document.readyState')) === 'complete', 15000);
    lines.push('PASS 靜態伺服器與 390x844 視口導航成功');

    // 1) #mimiVideo 存在且正常渲染
    const videoProbe = `(() => {
      const v = document.getElementById('mimiVideo');
      if (!v) return { ok: false, msg: '#mimiVideo 不存在' };
      const r = v.getBoundingClientRect();
      const cs = getComputedStyle(v);
      const ok = v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2 && !v.error &&
        r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      return { ok, msg: 'readyState=' + v.readyState + ' size=' + v.videoWidth + 'x' + v.videoHeight +
        ' rect=' + Math.round(r.width) + 'x' + Math.round(r.height) +
        ' display=' + cs.display + ' error=' + (v.error ? v.error.code : 'none') };
    })()`;
    let videoState;
    await waitFor('#mimiVideo 渲染', async () => {
      videoState = await evaluate(videoProbe);
      return videoState.ok === true;
    }, 15000);
    lines.push(`PASS #mimiVideo 存在且正常渲染 (${videoState.msg})`);

    // 2) Act 1 ~ Act 4 幕次切換，src 依序切換
    for (let i = 0; i < ACT_VIDEOS.length; i++) {
      const expected = ACT_VIDEOS[i];
      await evaluate(`document.querySelector('.btn-chip[data-phase="${i}"]').click(); true`);
      let actual;
      await waitFor(`Act ${i + 1} src`, async () => {
        actual = await evaluate(`document.getElementById('mimiVideo').getAttribute('src')`);
        return actual === expected;
      }, 8000);
      lines.push(`PASS Act ${i + 1} 切換 src = ${actual}`);
    }

    // 3) 尺寸：舞台 <= 420px，手機總高 <= 740px 且零橫向溢出
    const metrics = await evaluate(`(() => {
      const s = document.querySelector('.stage-wrapper');
      if (!s) return { missing: true };
      const r = s.getBoundingClientRect();
      const body = document.body;
      const bodyCs = getComputedStyle(body);
      const contentBottom = Math.max(
        ...Array.from(body.children, (el) => el.getBoundingClientRect().bottom),
        0
      ) + parseFloat(bodyCs.paddingBottom || '0');
      return {
        stage: Math.round(r.height * 100) / 100,
        page: document.documentElement.scrollHeight,
        body: body.scrollHeight,
        contentBottom: Math.round(contentBottom * 100) / 100,
        vw: window.innerWidth,
        vh: window.innerHeight,
        overflowX: Math.max(document.documentElement.scrollWidth, body.scrollWidth) > window.innerWidth
      };
    })()`);
    if (metrics.missing) {
      lines.push('FAIL .stage-wrapper 不存在');
    } else {
      lines.push(metrics.stage <= MAX_STAGE_HEIGHT
        ? `PASS .stage-wrapper 高度 ${metrics.stage}px <= ${MAX_STAGE_HEIGHT}px`
        : `FAIL .stage-wrapper 高度 ${metrics.stage}px > ${MAX_STAGE_HEIGHT}px`);
      lines.push(metrics.contentBottom <= metrics.vh && metrics.page <= metrics.vh
        ? `PASS 手機內容底部 ${metrics.contentBottom}px <= ${metrics.vh}px 視口，無需捲動 (一屏入眼)`
        : `FAIL 內容底部 ${metrics.contentBottom}px 或總高 ${metrics.page}px 超出 ${metrics.vh}px 視口`);
      lines.push(!metrics.overflowX
        ? 'PASS 390px 視口零橫向溢出'
        : `FAIL 390px 視口橫向溢出 (viewport=${metrics.vw}px)`);
    }

    // 4) Console 零 Error
    lines.push(consoleErrors.length === 0
      ? 'PASS Console 零 Error'
      : `FAIL Console 錯誤 ${consoleErrors.length} 筆: ${consoleErrors.slice(0, 5).join(' | ')}`);

    // 5) 截圖存檔
    const shot = await ws.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false
    });
    fs.mkdirSync(path.dirname(SHOT_PATH), { recursive: true });
    const buf = Buffer.from(shot.data || '', 'base64');
    fs.writeFileSync(SHOT_PATH, buf);
    lines.push(buf.length > 0
      ? `PASS 截圖存檔 ${SHOT_PATH} (${buf.length} bytes)`
      : 'FAIL 截圖檔案為空');

    console.log('=== G3 N-3-9 劇場 CDP 實機驗證結果 ===');
    for (const line of lines) console.log(line);
    allOk = lines.every((l) => l.startsWith('PASS'));
  } finally {
    killChromeTree(proc);
    try {
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
    } catch (e) { /* 已關閉 */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 已移除 */ }
  }

  if (!allOk) process.exit(1);
  console.log('ALL PASS (Exit Code 0)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
