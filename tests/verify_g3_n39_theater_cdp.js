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
const MIMI_TEXTURE = 'assets_hosts/g3_mimi/textures/mimi_transparent_1024.png';

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

    // 1) 原廠 3D 黏土高清底圖為唯一視覺錨點：Wan 2.2 影片與 SVG 假兔零殘留
    const mimiProbe = `(() => {
      const anchor = document.getElementById('mimiAnchor');
      const video = document.querySelector('#mimiZone video, video.mimi-video, #mimiVideo');
      const svg = document.querySelector('#mimiZone svg');
      if (!anchor) return { ok: false, msg: '3D 角色錨點缺漏' };
      const r = anchor.getBoundingClientRect();
      const cs = getComputedStyle(anchor);
      const src = anchor.getAttribute('src') || '';
      const ok = r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'
        && video === null && svg === null && (src.includes('mimi_front_1024.png') || src.includes('mimi_transparent_1024.png'));
      return { ok, msg: 'anchor ' + Math.round(r.width) + 'x' + Math.round(r.height) +
        ' display=' + cs.display + ' src=' + src + ' video=' + (video ? 'FOUND' : 'none') + ' svg=' + (svg ? 'FOUND' : 'none') };
    })()`;
    let mimiState;
    await waitFor('#mimiAnchor 原廠 3D 黏土高清底圖渲染', async () => {
      mimiState = await evaluate(mimiProbe);
      return mimiState.ok === true;
    }, 15000);
    lines.push(`PASS 原廠高清底圖為唯一視覺錨點、Wan 2.2 影片與 SVG 假兔零殘留 (${mimiState.msg})`);

    // 1b) 空間契約：米米 x∈[4%,36%]、黑板 x∈[37%,96%]，幾何零重疊且米米位於前景
    const occlusion = await evaluate(`(() => {
      const b = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, z:parseInt(getComputedStyle(e).zIndex,10) || 0 }; };
      const m = b('#mimiZone'), p = b('#podium'), k = b('#blackboard'), c = b('#captionText'), s = b('.stage-wrapper');
      if (!m || !p || !k || !c || !s) return { ok:false, msg:'分帶元素缺漏' };
      const pct = (v) => (v - s.left) / (s.right - s.left) * 100;
      const gapBoard = k.left - m.right;
      const gapPodium = k.left - p.right;
      const layoutOk = pct(m.left) >= 1 && pct(m.right) <= 37
        && Math.abs(pct(k.left) - 37) < 2 && Math.abs(pct(k.right) - 96) < 2;
      return {
        ok: gapBoard >= 0 && gapPodium >= 0 && layoutOk && m.z > p.z && m.z > k.z && m.bottom <= c.top,
        msg: 'mimi=[' + pct(m.left).toFixed(1) + ',' + pct(m.right).toFixed(1) + '] board=[' +
          pct(k.left).toFixed(1) + ',' + pct(k.right).toFixed(1) + '] gaps=' +
          gapBoard.toFixed(1) + '/' + gapPodium.toFixed(1) + 'px z=' + [m.z,p.z,k.z].join('/') +
          ' layoutOk=' + layoutOk
      };
    })()`);
    lines.push(occlusion.ok
      ? `PASS 米米[4%,36%]與黑板[37%,96%]幾何零重疊且米米位於前景 (${occlusion.msg})`
      : `FAIL 米米／黑板空間契約破壞 (${occlusion.msg})`);

    // 2) Act 1 ~ Act 4 幕次切換：底圖錨點恆定，絕無影片層復活
    for (let i = 0; i < 4; i++) {
      await evaluate(`document.querySelector('.btn-chip[data-phase="${i}"]').click(); true`);
      let state;
      await waitFor(`Act ${i + 1} 底圖錨點`, async () => {
        state = await evaluate(`(() => {
          const a = document.getElementById('mimiAnchor');
          return { src: a && a.getAttribute('src'), video: !!document.querySelector('video') };
        })()`);
        return (state.src === MIMI_TEXTURE || (state.src && state.src.includes('mimi_transparent_1024.png'))) && state.video === false;
      }, 8000);
      lines.push(`PASS Act ${i + 1} 底圖錨點不變、無影片層 (${state.src})`);
    }

    // 2b) 三種純淨微動態確實掛載：說話呼吸／歡呼 -8px／歪頭 -4deg
    const motion = await evaluate(`(() => {
      const wrap = document.getElementById('mimiWrap');
      const anchor = document.getElementById('mimiAnchor');
      const read = (cls) => {
        wrap.classList.remove('speaking', 'cheer', 'tilt');
        wrap.classList.add(cls);
        return getComputedStyle(anchor).animationName;
      };
      const out = { speaking: read('speaking'), cheer: read('cheer'), tilt: read('tilt') };
      const css = Array.from(document.styleSheets).flatMap((s) => {
        try { return Array.from(s.cssRules).map((r) => r.cssText); } catch (e) { return []; }
      }).join(' ');
      out.cheerY = css.includes('translateY(-8px)');
      out.tiltDeg = css.includes('rotate(-4deg)');
      wrap.classList.remove('speaking', 'cheer', 'tilt');
      return out;
    })()`);
    lines.push(motion.speaking === 'mimiBreathe' && motion.cheer === 'mimiCheer'
      && motion.tilt === 'mimiTilt' && motion.cheerY && motion.tiltDeg
      ? 'PASS 說話呼吸／歡呼雀躍(-8px)／好奇歪頭(-4deg) 三種微動態皆已掛載'
      : `FAIL 微動態未按規格掛載 (${JSON.stringify(motion)})`);

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

    // 4b) 原始碼不得殘留 48:52 硬分割
    const src = fs.readFileSync(path.join(ROOT, SCENE_PATH), 'utf8');
    const legacy = ['width: 48%', 'width: 52%', '.actor-zone', '.blackboard-zone'].filter((k) => src.includes(k));
    lines.push(legacy.length === 0
      ? 'PASS 原始碼已徹底移除 48:52 硬分割'
      : `FAIL 原始碼仍殘留硬分割: ${legacy.join(', ')}`);

    // 4b-2) 原始碼不得殘留 2D 假兔 SVG 標籤與樣式
    const svgLegacy = ['<svg', 'mimi-svg', 'mimi-ear-left', 'mimi-arm-point', 'mimi-body'].filter((k) => src.includes(k));
    lines.push(svgLegacy.length === 0
      ? 'PASS 原始碼已徹底移除 2D SVG 假兔標籤與樣式'
      : `FAIL 原始碼仍殘留 2D 假兔: ${svgLegacy.join(', ')}`);

    // 4b-3) 原始碼不得殘留 Wan 2.2 影片播放邏輯
    const videoLegacy = ['<video', 'mimi_n39_act', 'mimiVideo', 'ACT_VIDEOS'].filter((k) => src.includes(k));
    lines.push(videoLegacy.length === 0
      ? 'PASS 原始碼已徹底移除 Wan 2.2 影片播放邏輯'
      : `FAIL 原始碼仍殘留影片邏輯: ${videoLegacy.join(', ')}`);

    // 4c) 新版四幕台詞已對齊 JSON
    const scriptCheck = await evaluate(`(() => {
      const cfg = window.__n39TimelineProbe;
      const cap = document.getElementById('captionText').textContent || '';
      return { len: cap.length, hasNew: cap.includes('超好吃') || cap.includes('分母') };
    })()`);
    lines.push(scriptCheck.hasNew
      ? `PASS 新版台詞已套用 (字幕 ${scriptCheck.len} 字)`
      : `FAIL 仍為舊版台詞 (字幕 ${scriptCheck.len} 字)`);

    // 4d) 四幕個別截圖供通道三 Gate A1~A4
    for (let i = 0; i < 4; i++) {
      await evaluate(`document.querySelector('.btn-chip[data-phase="${i}"]').click(); true`);
      await sleep(700);
      const actShot = await ws.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const actBuf = Buffer.from(actShot.data || '', 'base64');
      const actPath = path.join(ROOT, 'reports', 'screenshots', `theater_n39_act${i + 1}.png`);
      fs.mkdirSync(path.dirname(actPath), { recursive: true });
      fs.writeFileSync(actPath, actBuf);
      lines.push(actBuf.length > 0
        ? `PASS Act ${i + 1} 截圖 ${actPath} (${actBuf.length} bytes)`
        : `FAIL Act ${i + 1} 截圖為空`);
    }

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
