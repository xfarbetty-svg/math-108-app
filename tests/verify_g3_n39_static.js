/**
 * tests/verify_g3_n39_static.js — G3-N-3-9 咪咪果凍盒 5 幕靜態打樣截圖驗收（階段一）
 *
 * 驗收項目：
 *   1. 載入 app/components/g3_n39_static_preview.html?shot=1 ~ 5（Puppeteer + 本機 Chrome/Edge）
 *   2. 每幕截圖至 reports/previews/g3_n39_s01.png ~ s05.png（> 20KB）
 *   3. 每幕零 JS 錯誤、零資源載入失敗（含咪咪立繪）
 *   4. 唯一道具防線：果凍盒恰好 12 格，填充數 3/10/10/10/10，無披薩蛋糕字樣
 *   5. 文圖一致性：各幕分數與提示文字逐項比對
 *
 * 執行：node tests/verify_g3_n39_static.js [--headed]
 * 依賴：npm i（puppeteer-core，复用系統已安裝的 Chrome / Edge，不額外下載 Chromium）
 * 回傳：全數 PASS → process.exit(0)；任一 FAIL → process.exit(1)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const PAGE_FILE = path.join(ROOT, 'app', 'components', 'g3_n39_static_preview.html');
const OUT_DIR = path.join(ROOT, 'reports', 'previews');
const MIN_BYTES = 20 * 1024;

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

const SHOTS = [
  {
    shot: 1,
    file: 'g3_n39_s01.png',
    filled: 3,
    title: '情境導入',
    check: (probe) => [
      ['Shot01 標題為情境導入', probe.tagText === '情境導入'],
      ['Shot01 字幕含 3/12', probe.captions.some((t) => /這是一盒的/.test(t))],
      ['Shot01 果凍盒 3 格有果凍', probe.jellyCount === 3 && probe.cellCount === 12]
    ]
  },
  {
    shot: 2,
    file: 'g3_n39_s02.png',
    filled: 10,
    title: '問題提出',
    check: (probe) => [
      ['Shot02 算式為 3/12 + 7/12 = ?', JSON.stringify(probe.equation) === JSON.stringify(['312', '712']) && probe.qmark],
      ['Shot02 果凍盒共 10 格有果凍', probe.jellyCount === 10 && probe.cellCount === 12],
      ['Shot02 字幕說明 10 格', probe.captions.some((t) => /10 格/.test(t))]
    ]
  },
  {
    shot: 3,
    file: 'g3_n39_s03.png',
    filled: 10,
    title: '陷阱警示',
    check: (probe) => [
      ['Shot03 出現錯誤答案 10/24', probe.trapFrac === '1024'],
      ['Shot03 出現大紅叉', probe.trapX === true],
      ['Shot03 提示「盒子沒有變成 24 格呀！」', probe.trapNote === '盒子沒有變成24格呀！'],
      ['Shot03 果凍盒仍為 12 格（非 24 格）', probe.jellyCount === 10 && probe.cellCount === 12]
    ]
  },
  {
    shot: 4,
    file: 'g3_n39_s04.png',
    filled: 10,
    title: '算理拆解',
    check: (probe) => [
      ['Shot04 12 格全部標示 1/12', probe.unitLabels === 12],
      ['Shot04 算理列為 3+7=10 個 1/12', probe.mathFracs.length === 3 && probe.mathFracs.every((f) => f === '112') && probe.mathCounts.join(',') === '3,7,10'],
      ['Shot04 單位提示卡存在', probe.hint === true],
      ['Shot04 果凍盒 12 格邊框發光（金色）', probe.glowStroke === true]
    ]
  },
  {
    shot: 5,
    file: 'g3_n39_s05.png',
    filled: 10,
    title: '正確解答',
    check: (probe) => [
      ['Shot05 解答為 10/12 盒', probe.resultFrac === '1012' && probe.resultUnit === '盒'],
      ['Shot05 算式為 3/12 + 7/12 = 10/12', probe.equation.join(',') === '312,712,1012' && probe.resultFrac === '1012'],
      ['Shot05 10 顆果凍金色光暈', probe.jellyCount === 10 && probe.goldGlow === true],
      ['Shot05 勝利彩帶存在', probe.ribbon === true]
    ]
  }
];

const FORBIDDEN_WORDS = ['披薩', '蛋糕', '圓盤', '草莓派'];

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome / Edge，請確認 CHROME_CANDIDATES 路徑');
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function probeShot(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const qa = (s) => Array.from(document.querySelectorAll(s));
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, '') : '');
    const box = q('#jelly-box');
    const layout = (() => {
      const p = q('.board-zone');
      return p ? p.getBoundingClientRect().width : 0;
    })();
    return {
      shot: window.__N39_SHOT__,
      cellCount: qa('#jelly-box [data-cell]').length,
      jellyCount: qa('#jelly-box [data-jelly]').length,
      viewBox: box ? box.getAttribute('viewBox') : null,
      primaryImg: q('#mimi') ? q('#mimi').getAttribute('src') : null,
      primaryImgLoaded: (() => { const im = q('#mimi'); return !!im && im.complete && im.naturalWidth > 0; })(),
      allImgs: qa('img').map((i) => i.getAttribute('src')),
      tagText: txt(q('#shot-tag-text')),
      title: txt(q('#board-title')),
      captions: qa('.caption').map((el) => el.textContent.replace(/\s+/g, ' ').trim()),
      speech: txt(q('#speech-text')),
      equation: qa('.equation .frac').map((f) => f.textContent.replace(/\s+/g, '')),
      qmark: !!q('.equation .qmark'),
      trapFrac: txt(q('.trap-card .frac')),
      trapNote: txt(q('.trap-note')),
      trapX: !!q('.trap-x'),
      unitLabels: qa('#jelly-box .unit-label').length,
      mathFracs: qa('.math-line .frac').map((f) => f.textContent.replace(/\s+/g, '')),
      mathCounts: qa('.math-line .cnt').map((c) => c.textContent.replace(/個/g, '').replace(/\s+/g, '')),
      hint: !!q('.hint-card'),
      ribbon: !!q('.ribbon'),
      resultFrac: txt(q('.equation .result .frac')),
      resultUnit: txt(q('.equation .result .unit')),
      glowStroke: (() => {
        const g = q('#jelly-box .glass');
        if (!g) return false;
        return getComputedStyle(g).stroke === 'rgb(255, 201, 77)';
      })(),
      goldGlow: (() => {
        const j = q('#jelly-box .jelly-body');
        return j ? getComputedStyle(j).filter !== 'none' : false;
      })(),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      boardWidth: Math.round(layout)
    };
  });
}

(async () => {
  const puppeteer = require('puppeteer-core');
  const results = [];
  const failures = [];
  const pass = (name) => results.push(`PASS ${name}`);
  const fail = (name, detail) => { results.push(`FAIL ${name} :: ${detail}`); failures.push(name); };

  assert(fs.existsSync(PAGE_FILE), `找不到打樣頁：${PAGE_FILE}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--allow-file-access-from-files', '--hide-scrollbars']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1360, height: 900, deviceScaleFactor: 2 });

    const pageErrors = [];
    const consoleErrors = [];
    const requestFailures = [];
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', (r) => requestFailures.push(`${r.url()} :: ${r.failure() && r.failure().errorText}`));

    const pageURL = pathToFileURL(PAGE_FILE).href;

    for (const spec of SHOTS) {
      pageErrors.length = 0; consoleErrors.length = 0; requestFailures.length = 0;

      await page.goto(`${pageURL}?shot=${spec.shot}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(
        () => window.__N39_READY__ === true && window.__N39_SHOT__ === Number(new URLSearchParams(location.search).get('shot')) &&
          (window.__N39_IMG_ERROR__ === true || (document.getElementById('mimi') && document.getElementById('mimi').naturalWidth > 0)),
        { timeout: 15000 }
      );
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

      const probe = await probeShot(page);
      const checks = spec.check(probe);
      checks.forEach(([name, ok]) => (ok ? pass(`S0${spec.shot} ${name}`) : fail(`S0${spec.shot} ${name}`, JSON.stringify(probe))));

      // ---- 唯一道具與文圖防線 ----
      if (probe.cellCount === 12 && probe.jellyCount === spec.filled) pass(`S0${spec.shot} 12 格果凍盒契約（filled=${spec.filled}）`);
      else fail(`S0${spec.shot} 12 格果凍盒契約`, `cellCount=${probe.cellCount}, jellyCount=${probe.jellyCount}`);

      if (probe.viewBox === '0 0 440 330') pass(`S0${spec.shot} 果凍盒為 4x3 長方形（viewBox 440x330）`);
      else fail(`S0${spec.shot} 果凍盒比例`, String(probe.viewBox));

      const noForbidden = FORBIDDEN_WORDS.every((w) => !probe.speech.includes(w) && probe.captions.join('').indexOf(w) === -1);
      if (noForbidden) pass(`S0${spec.shot} 無披薩／蛋糕／圓盤字樣`);
      else fail(`S0${spec.shot} 出現禁用道具字樣`, probe.captions.join('|'));

      const allMimi = probe.allImgs.length > 0 && probe.allImgs.every((s) => s === null || /assets\/characters\/g3_mimi\//.test(s));
      if (allMimi) pass(`S0${spec.shot} 立繪來源皆為 036 g3_mimi 貼圖`);
      else fail(`S0${spec.shot} 立繪來源異常`, JSON.stringify(probe.allImgs));

      if (probe.primaryImg && probe.primaryImg.indexOf('mimi_') > -1 && probe.primaryImg.indexOf('.png') > -1 && probe.primaryImgLoaded) {
        pass(`S0${spec.shot} 咪咪立繪已載入（naturalWidth > 0）`);
      } else {
        fail(`S0${spec.shot} 咪咪立繪載入失敗`, `${probe.primaryImg} loaded=${probe.primaryImgLoaded}`);
      }

      if (probe.overflowX <= 1) pass(`S0${spec.shot} 無水平溢出`);
      else fail(`S0${spec.shot} 水平溢出`, `${probe.overflowX}px`);

      if (pageErrors.length === 0) pass(`S0${spec.shot} 無 JavaScript 錯誤`);
      else fail(`S0${spec.shot} JavaScript 錯誤`, pageErrors.join(' | '));

      if (consoleErrors.length === 0) pass(`S0${spec.shot} 無 console error`);
      else fail(`S0${spec.shot} console error`, consoleErrors.join(' | '));

      if (requestFailures.length === 0) pass(`S0${spec.shot} 資源載入零失敗`);
      else fail(`S0${spec.shot} 資源載入失敗`, requestFailures.join(' | '));

      // ---- 截圖：只拍 16:9 打樣主視窗 ----
      const outPath = path.join(OUT_DIR, spec.file);
      const stage = await page.$('#stage');
      assert(stage, '找不到 #stage');
      const box = await stage.boundingBox();
      assert(box && box.width > 800, `Shot ${spec.shot} stage 尺寸異常：${JSON.stringify(box)}`);
      const ratio = box.width / box.height;
      if (Math.abs(ratio - 16 / 9) < 0.02) pass(`S0${spec.shot} 主視窗 16:9（${Math.round(box.width)}x${Math.round(box.height)}）`);
      else fail(`S0${spec.shot} 主視窗非 16:9`, `${box.width}x${box.height} ratio=${ratio.toFixed(3)}`);

      await stage.screenshot({ path: outPath, type: 'png' });
      const size = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;
      if (size > MIN_BYTES) pass(`S0${spec.shot} 截圖 ${spec.file} 已產出（${(size / 1024).toFixed(1)}KB）`);
      else fail(`S0${spec.shot} 截圖不足 20KB`, `${spec.file} = ${size}B`);
    }
  } catch (err) {
    fail('執行例外', err && err.stack ? err.stack.split('\n')[0] : String(err));
    console.error(err);
  } finally {
    await browser.close();
  }

  console.log('\n===== G3-N-3-9 咪咪果凍盒 靜態打樣截圖驗收 =====');
  results.forEach((r) => console.log(r));
  console.log(`\n合計 ${results.length} 項：PASS ${results.length - failures.length} / FAIL ${failures.length}`);
  console.log(`截圖目錄：${OUT_DIR}`);

  if (failures.length > 0) {
    console.error(`\n[FAIL] ${failures.length} 項未通過：\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\n[PASS] 5 幕靜態打樣與截圖全部通過。');
  process.exit(0);
})().catch((err) => {
  console.error('[FATAL]', err && err.stack ? err.stack : err);
  process.exit(1);
});
