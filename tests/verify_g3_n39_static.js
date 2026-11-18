/**
 * tests/verify_g3_n39_static.js — G3-N-3-9 咪咪果凍盒 v2.0 五幕靜態打樣驗收
 *
 * v2.0 分鏡契約：
 *   S01 直覺的陷阱：兩盤果凍（3 + 7）＋算式 3/12 + 7/12 = ? ＋小夥伴 10/24 迷思氣泡
 *   S02 建立基準：12 格盒裝入 3 顆，標註 3 個 1/12 盒＝3/12 盒
 *   S03 動態累加：續放 7 顆至 10 顆，4~10 點數軌跡
 *   S04 痛擊迷思：12 格實物 vs 24 格虛構巨盒（紅叉＋裂痕）
 *   S05 算理大成：3/12 + 7/12 = 10/12 盒 ✅＋金牌口訣「盒子沒變大，分母就不動！」
 *
 * 執行：node tests/verify_g3_n39_static.js [--headed]
 * 依賴：npm i（puppeteer-core，复用系統已安裝的 Chrome / Edge）
 * 回傳：全數 PASS → process.exit(0)；任一 FAIL → process.exit(1)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const PAGE_FILE = path.join(ROOT, 'app', 'components', 'g3_n39_static_preview.html');
const OUT_DIR = path.join(ROOT, 'reports', 'previews');
const MIN_BYTES = 30 * 1024;
const EXPECTED_VERSION = '2.0';

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
    tag: '直覺的陷阱',
    title: '直覺的陷阱',
    pose: 'confused',
    poseLabel: '困惑',
    badge: '？',
    speech: '有同學說答案是 10/24 盒……嗯？真的是這樣嗎？我們拿盒子裝裝看！',
    check: (p) => [
      ['S01 算式為 3/12 + 7/12 = ?', p.equation.join(',') === '312,712' && p.qmark === true],
      ['S01 左盤恰好 3 顆果凍', p.leftPlateJellies === 3],
      ['S01 右盤恰好 7 顆果凍', p.rightPlateJellies === 7],
      ['S01 左右兩盤共 2 個盤子', p.plateCards === 2],
      ['S01 小夥伴搶答氣泡出現 10/24', p.peerFrac === '1024' && p.myth === '1024'],
      ['S01 小夥伴台詞含「我知道」與 3＋7＝10', /我知道/.test(p.peerText) && /3＋7＝10/.test(p.peerText)]
    ]
  },
  {
    shot: 2,
    file: 'g3_n39_s02.png',
    tag: '建立基準',
    title: '12 格果凍盒出場',
    pose: 'point',
    poseLabel: '指盒',
    badge: '👈',
    speech: '看！這是一個 12 格的果凍盒，放進 3 顆，就是 3 個十二分之一，也就是十二分之三盒。',
    check: (p) => [
      ['S02 果凍盒為 12 格（4 欄 x 3 列）', p.cellCount === 12 && p.boxCols === 4 && p.boxRows === 3],
      ['S02 果凍盒填充 3 顆', p.jellyCount === 3],
      ['S02 盒內 3 格標示 1/12', p.unitLabels === 3],
      ['S02 標註含「3 個 1/12 盒」', /3個/.test(p.unitNote) && p.unitNoteFracs.join(',') === '112,312'],
      ['S02 標註含「也就是 3/12 盒」', /也就是/.test(p.unitNote) && p.unitNoteFracs.includes('312')],
      ['S02 尚未出現點數標記', p.countLabels.length === 0]
    ]
  },
  {
    shot: 3,
    file: 'g3_n39_s03.png',
    tag: '動態累加',
    title: '一顆一顆放進去',
    pose: 'count',
    poseLabel: '數數',
    badge: '🔢',
    speech: '現在把另外 7 顆也放進同一個盒子裡……一顆、兩顆……加上原來的，一共放了 10 顆！',
    check: (p) => [
      ['S03 果凍盒仍為 12 格', p.cellCount === 12],
      ['S03 果凍盒累積至 10 顆', p.jellyCount === 10],
      ['S03 點數標記恰好 7 個', p.countLabels.length === 7],
      ['S03 點數標記為 4,5,6,7,8,9,10', p.countLabels.join(',') === '4,5,6,7,8,9,10'],
      ['S03 點數軌跡連線存在', p.countPath === true],
      ['S03 圖例含「10 顆」', /10顆/.test(p.legend)]
    ]
  },
  {
    shot: 4,
    file: 'g3_n39_s04.png',
    tag: '痛擊迷思',
    title: '桌上的盒子根本沒有變成 24 格呀！',
    pose: 'eureka',
    poseLabel: '頓悟',
    badge: '💡',
    speech: '你看！裝完 10 顆，盒子還是眼前這個 12 格的盒子，根本沒有變成 24 格呀！分母是盒子的規格，絕對不能相加！',
    check: (p) => [
      ['S04 真實盒為 12 格並裝 10 顆', p.realCells === 12 && p.realJellies === 10],
      ['S04 虛構巨盒為 24 格並裝 10 顆', p.fakeCells === 24 && p.fakeJellies === 10],
      ['S04 虛構 24 格盒打上紅叉', p.fakeX === true && p.crossStroke === 'rgb(232, 39, 12)'],
      ['S04 虛構巨盒出現 3 道裂痕', p.cracks === 3],
      ['S04 規格標籤為 12 格／24 格', p.realChip === '12格' && p.fakeChip === '24格'],
      ['S04 圖說含「真實」與「虛構」', /真實/.test(p.realLabel + p.fakeLabel) && /虛構/.test(p.fakeLabel)],
      ['S04 真實盒未被紅叉標記', p.realHasCross === false],
      ['S04 醒目標題命中任務卡原文', /桌上的盒子根本沒有變成\s*24\s*格呀！/.test(p.title)]
    ]
  },
  {
    shot: 5,
    file: 'g3_n39_s05.png',
    tag: '算理大成',
    title: '拍板定案',
    pose: 'cheer',
    poseLabel: '歡呼',
    badge: '🎉',
    speech: '所以是 10 個十二分之一，一共是十二分之十盒！記住喔：盒子沒變大，分母就不動！',
    check: (p) => [
      ['S05 果凍盒 12 格裝滿 10 顆', p.cellCount === 12 && p.jellyCount === 10],
      ['S05 定案算式含 3/12、7/12、(3+7)/12、10/12', p.equation.join(',') === '312,712,3+712,1012'],
      ['S05 答案為 10/12 盒', p.resultFrac === '1012' && p.resultUnit === '盒'],
      ['S05 正確勾選標記存在', p.checkOk === true],
      ['S05 金牌口訣「盒子沒變大，分母就不動！」', /盒子沒變大，分母就不動！/.test(p.plaque)],
      ['S05 10 顆果凍發出金色光暈', p.goldGlow === true],
      ['S05 勝利彩帶（confetti）存在', p.confetti === true]
    ]
  }
];

const FORBIDDEN_WORDS = ['披薩', '蛋糕', '圓盤', '草莓派'];

/* DOM 探針統一去空白，預期字串比照辦理 */
const squash = (s) => String(s).replace(/\s+/g, '');

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
    const rect = (s) => { const el = q(s); return el ? el.getBoundingClientRect() : null; };
    const stage = q('#stage');
    const left = q('.left-pane');
    const right = q('.right-pane');
    const slot = q('#board-slot');
    const stageRect = stage.getBoundingClientRect();
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const mimi = q('#mimi');
    const real = q('[data-compare="real"]');
    const fake = q('[data-compare="fake"]');
    const fakeX = q('.fake-x');
    const crossLine = fakeX ? fakeX.querySelector('line') : null;
    const countPath = q('.count-path');

    return {
      version: window.__N39_VERSION__,
      shot: window.__N39_SHOT__,
      tagText: txt(q('#shot-tag-text')),
      title: txt(q('#board-title')),
      speech: txt(q('#speech-text')),
      pose: stage.getAttribute('data-pose'),
      portraitPose: q('#portrait').getAttribute('data-pose'),
      poseLabel: txt(q('#pose-label')),
      badge: txt(q('#pose-badge')),
      mimiSrc: mimi ? mimi.getAttribute('src') : null,
      mimiLoaded: !!mimi && mimi.complete && mimi.naturalWidth > 0,
      allImgs: qa('img').map((i) => i.getAttribute('src')),
      equation: qa('#equation .frac').map((f) => f.textContent.replace(/\s+/g, '')),
      qmark: !!q('.equation .qmark'),
      plateCards: qa('[data-plate]').length,
      leftPlateJellies: qa('[data-plate="left"] [data-jelly]').length,
      rightPlateJellies: qa('[data-plate="right"] [data-jelly]').length,
      peerFrac: txt(q('.peer-bubble .frac')),
      peerText: txt(q('.peer-bubble')),
      myth: q('.peer-bubble') ? q('.peer-bubble').getAttribute('data-myth') : null,
      cellCount: qa('#jelly-box [data-cell]').length,
      jellyCount: qa('#jelly-box [data-jelly]').length,
      boxCols: q('#jelly-box') ? Number(q('#jelly-box').getAttribute('data-cols')) : 0,
      boxRows: q('#jelly-box') ? Number(q('#jelly-box').getAttribute('data-rows')) : 0,
      unitLabels: qa('#jelly-box .unit-label').length,
      unitNote: txt(q('.unit-note')),
      unitNoteFracs: qa('.unit-note .frac').map((f) => f.textContent.replace(/\s+/g, '')),
      countLabels: qa('.count-label').map((c) => txt(c.querySelector('text'))),
      countPath: !!countPath,
      legend: txt(q('.count-legend')),
      realCells: real ? real.querySelectorAll('[data-cell]').length : 0,
      realJellies: real ? real.querySelectorAll('[data-jelly]').length : 0,
      realChip: real ? txt(real.querySelector('.spec-chip')) : '',
      realLabel: real ? txt(real.querySelector('figcaption')) : '',
      realHasCross: real ? !!real.querySelector('.fake-x') : false,
      fakeCells: fake ? fake.querySelectorAll('[data-cell]').length : 0,
      fakeJellies: fake ? fake.querySelectorAll('[data-jelly]').length : 0,
      fakeChip: fake ? txt(fake.querySelector('.spec-chip')) : '',
      fakeLabel: fake ? txt(fake.querySelector('figcaption')) : '',
      fakeX: !!fakeX,
      crossStroke: crossLine ? getComputedStyle(crossLine).stroke : null,
      cracks: qa('.cracks [data-crack]').length,
      resultFrac: txt(q('.equation .result .frac')),
      resultUnit: txt(q('.equation .result .unit')),
      checkOk: !!q('.check-ok'),
      plaque: txt(q('.gold-plaque')),
      goldGlow: (() => {
        const j = q('#jelly-box .jelly-body');
        return j ? getComputedStyle(j).filter !== 'none' : false;
      })(),
      confetti: !!q('.confetti'),
      forbiddenHit: ['披薩', '蛋糕', '圓盤', '草莓派'].filter((w) => document.body.innerText.indexOf(w) > -1),
      stageW: Math.round(stageRect.width),
      stageH: Math.round(stageRect.height),
      stageRatio: stageRect.width / stageRect.height,
      leftRatio: leftRect.width / stageRect.width,
      rightRatio: rightRect.width / stageRect.width,
      stageScrollOverflow: stage.scrollHeight - stage.clientHeight,
      slotOverflow: slot.scrollHeight - slot.clientHeight,
      leftFits: q('#portrait').getBoundingClientRect().bottom <= leftRect.bottom + 1,
      rightFits: slotRect.bottom <= rightRect.bottom + 1,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
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
        () => window.__N39_READY__ === true &&
          window.__N39_SHOT__ === Number(new URLSearchParams(location.search).get('shot')) &&
          (window.__N39_IMG_ERROR__ === true || (document.getElementById('mimi') && document.getElementById('mimi').naturalWidth > 0)),
        { timeout: 15000 }
      );
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

      const p = await probeShot(page);
      const n = spec.shot;

      // ---- v2.0 通用契約 ----
      if (p.version === EXPECTED_VERSION) pass(`S0${n} 打樣版本為 v2.0`);
      else fail(`S0${n} 打樣版本`, String(p.version));

      if (p.shot === n) pass(`S0${n} 載入幕次正確`);
      else fail(`S0${n} 載入幕次`, String(p.shot));

      if (p.tagText === spec.tag) pass(`S0${n} 幕次標籤為「${spec.tag}」`);
      else fail(`S0${n} 幕次標籤`, p.tagText);

      if (p.title === squash(spec.title)) pass(`S0${n} 黑板標題為「${spec.title}」`);
      else fail(`S0${n} 黑板標題`, p.title);

      if (p.speech === squash(spec.speech)) pass(`S0${n} 咪咪台詞 100% 對齊 v2.0`);
      else fail(`S0${n} 咪咪台詞`, p.speech);

      if (p.pose === spec.pose && p.portraitPose === spec.pose) pass(`S0${n} 咪咪姿態切換為 ${spec.poseLabel}`);
      else fail(`S0${n} 咪咪姿態`, `stage=${p.pose} portrait=${p.portraitPose}`);

      if (p.poseLabel === spec.poseLabel) pass(`S0${n} 姿態標籤為「${spec.poseLabel}」`);
      else fail(`S0${n} 姿態標籤`, p.poseLabel);

      if (p.badge === spec.badge) pass(`S0${n} 情緒徽章為 ${spec.badge}`);
      else fail(`S0${n} 情緒徽章`, p.badge);

      if (p.mimiSrc && /assets\/characters\/g3_mimi\/mimi_.*\.png/.test(p.mimiSrc)) pass(`S0${n} 立繪來源為 036 g3_mimi 貼圖`);
      else fail(`S0${n} 立繪來源異常`, String(p.mimiSrc));

      if (p.mimiLoaded) pass(`S0${n} 咪咪立繪已載入（naturalWidth > 0）`);
      else fail(`S0${n} 咪咪立繪載入失敗`, String(p.mimiSrc));

      const allMimi = p.allImgs.length > 0 && p.allImgs.every((s) => s === null || /assets\/characters\/g3_mimi\//.test(s));
      if (allMimi) pass(`S0${n} 全頁立繪皆來自 g3_mimi`);
      else fail(`S0${n} 立繪來源混雜`, JSON.stringify(p.allImgs));

      if (p.forbiddenHit.length === 0) pass(`S0${n} 無披薩／蛋糕／圓盤字樣`);
      else fail(`S0${n} 出現禁用道具字樣`, p.forbiddenHit.join('|'));

      if (p.overflowX <= 1) pass(`S0${n} 無水平溢出`);
      else fail(`S0${n} 水平溢出`, `${p.overflowX}px`);

      if (Math.abs(p.stageRatio - 16 / 9) < 0.01) pass(`S0${n} 主視窗 16:9（${p.stageW}x${p.stageH}）`);
      else fail(`S0${n} 主視窗非 16:9`, `${p.stageW}x${p.stageH} ratio=${p.stageRatio.toFixed(3)}`);

      if (Math.abs(p.leftRatio - 0.48) < 0.012 && Math.abs(p.rightRatio - 0.52) < 0.012) {
        pass(`S0${n} 左右嚴格 48:52（${(p.leftRatio * 100).toFixed(1)}% : ${(p.rightRatio * 100).toFixed(1)}%）`);
      } else {
        fail(`S0${n} 左右比例`, `${(p.leftRatio * 100).toFixed(1)}% : ${(p.rightRatio * 100).toFixed(1)}%`);
      }

      if (p.stageScrollOverflow <= 1) pass(`S0${n} 主視窗無垂直溢出`);
      else fail(`S0${n} 主視窗垂直溢出`, `${p.stageScrollOverflow}px`);

      if (p.slotOverflow <= 1) pass(`S0${n} 右側黑板內容完整入框`);
      else fail(`S0${n} 右側黑板內容溢出`, `${p.slotOverflow}px`);

      if (p.leftFits) pass(`S0${n} 咪咪立繪完整入框`);
      else fail(`S0${n} 咪咪立繪超出左欄`, 'portrait bottom > pane bottom');

      if (p.rightFits) pass(`S0${n} 黑板內容未超出右欄`);
      else fail(`S0${n} 黑板內容超出右欄`, 'board-slot bottom > pane bottom');

      // ---- 各幕專屬契約 ----
      spec.check(p).forEach(([name, ok]) => (ok ? pass(name) : fail(name, JSON.stringify(p))));

      // ---- 執行環境零錯誤 ----
      if (pageErrors.length === 0) pass(`S0${n} 無 JavaScript 錯誤`);
      else fail(`S0${n} JavaScript 錯誤`, pageErrors.join(' | '));

      if (consoleErrors.length === 0) pass(`S0${n} 無 console error`);
      else fail(`S0${n} console error`, consoleErrors.join(' | '));

      if (requestFailures.length === 0) pass(`S0${n} 資源載入零失敗`);
      else fail(`S0${n} 資源載入失敗`, requestFailures.join(' | '));

      // ---- 截圖：只拍 16:9 打樣主視窗 ----
      const outPath = path.join(OUT_DIR, spec.file);
      const stage = await page.$('#stage');
      assert(stage, '找不到 #stage');
      const box = await stage.boundingBox();
      assert(box && box.width > 800, `Shot ${n} stage 尺寸異常：${JSON.stringify(box)}`);
      await stage.screenshot({ path: outPath, type: 'png' });
      const size = fs.existsSync(outPath) ? fs.statSync(outPath).size : 0;
      if (size > MIN_BYTES) pass(`S0${n} 截圖 ${spec.file} 已產出（${(size / 1024).toFixed(1)}KB）`);
      else fail(`S0${n} 截圖不足 30KB`, `${spec.file} = ${size}B`);
    }
  } catch (err) {
    fail('執行例外', err && err.stack ? err.stack.split('\n')[0] : String(err));
    console.error(err);
  } finally {
    await browser.close();
  }

  console.log('\n===== G3-N-3-9 咪咪果凍盒 v2.0 靜態打樣驗收 =====');
  results.forEach((r) => console.log(r));
  console.log(`\n合計 ${results.length} 項：PASS ${results.length - failures.length} / FAIL ${failures.length}`);
  console.log(`截圖目錄：${OUT_DIR}`);

  if (failures.length > 0) {
    console.error(`\n[FAIL] ${failures.length} 項未通過：\n - ${failures.join('\n - ')}`);
    process.exit(1);
  }
  console.log('\n[PASS] v2.0 五幕靜態打樣與截圖全部通過。');
  process.exit(0);
})().catch((err) => {
  console.error('[FATAL]', err && err.stack ? err.stack : err);
  process.exit(1);
});
