/**
 * tools/verify_r31_r32_d31_dual_cdp.js
 * R-3-1 / R-3-2 / D-3-1 第二階段統一修復 — 雙視口真實點擊回歸
 *
 * 390×844（手機零溢出）＋ 1280×800（桌面置中無左偏留白），
 * 每題 × 每視口：導航 ?q=1..10 → 斷言題號/專屬關鍵字/舊模板字眼消失 →
 * 以 Input.dispatchMouseEvent 真實點擊互動元件 → 斷言 DOM 狀態改變 → 截圖。
 *
 * 用法：node tools/verify_r31_r32_d31_dual_cdp.js
 * 全綠 → Exit 0；任一 FAIL → Exit 1。
 */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createSession } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const SHOT_DIR = path.join(ROOT, '_scratch', 'verify_20261123_009');
const VIEWS = [
  { tag: 'mobile', w: 390, h: 844, centered: false },
  { tag: 'desktop', w: 1280, h: 800, centered: true }
];

const UNITS = [
  {
    code: 'R-3-1', file: 'multiplication_division_lab.html', kind: 'card',
    oldWords: ['互逆家族', '天平移項', '驗算偵探', '魔術箱'],
    keys: ['200 × 3', '知道除數和商', '85 × 4', '21÷●', '11÷☆＝1', '÷5', '320', '525', '12 ÷ 6', '16、7、112']
  },
  {
    code: 'R-3-2', file: 'pattern_reasoning_lab.html', kind: 'card', interactiveFrom: 5,
    oldWords: ['跳跳蛙', '火柴棒', '找規律', '🏆 挑戰'],
    keys: ['7215', '6/11', '50×8', '380÷2', '柳丁', '22', '作品貼膠帶', '梯形桌', '長方形桌', '竹籤排正方形']
  },
  {
    code: 'D-3-1', file: 'table_cross_lab.html', kind: 'table',
    oldWords: ['Act 1', 'Act 2', 'Act 3', 'Act 4', '歡迎來到二維表格'],
    keys: ['蜂蜜紅茶', '高鐵票價表', '集集線', '班車時刻表', '北迴線', '三年九班', '班級借書', '粽太郎', '社團人數', '高雄→臺南']
  }
];

function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

async function realClick(s, expr, label) {
  const pt = await s.eval(expr);
  if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) fail(label + ' 無法取得點擊座標');
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
  await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  return pt;
}

async function measure(s, view) {
  return s.eval(`(() => {
    const de = document.documentElement;
    const root = document.getElementById('app') || document.getElementById('app-container') || document.body;
    const r = root.getBoundingClientRect();
    return {
      height: Math.round(r.height),
      width: Math.round(r.width),
      left: Math.round(r.left),
      right: Math.round(window.innerWidth - r.right),
      innerWidth: window.innerWidth,
      overflowX: de.scrollWidth > de.clientWidth + 2,
      bodyText: document.body.innerText || '',
      sceneText: (document.getElementById('q-scene') || {}).textContent || '',
      badge: (document.getElementById('q-badge') || {}).textContent || '',
      errs: (window.__cdpErrs || []).slice()
    };
  })()`);
}

async function verifyOne(s, unit, view, q) {
  const tag = `${unit.code} Q${String(q).padStart(2, '0')} ${view.tag}`;
  const base = pathToFileURL(path.join(ROOT, 'app', 'components', unit.file)).href;
  await s.navigate(`${base}?q=${q}&theme=light`, 200);

  const m = await measure(s, view);
  if (!m || m.height <= 0) fail(`${tag} 教具未載入`);
  if (m.height > 420) fail(`${tag} 高度超標 ${m.height}px > 420px`);
  if (m.overflowX) fail(`${tag} 橫向溢出（scrollWidth ${m.width} / 視口 ${m.innerWidth}）`);
  if (m.errs.length) fail(`${tag} JS 錯誤：${m.errs.join(' | ')}`);
  if (m.badge !== 'Q' + String(q).padStart(2, '0')) fail(`${tag} 題號標籤 ${m.badge} 不符`);
  if (!m.sceneText.includes(unit.keys[q - 1])) fail(`${tag} 場景缺少專屬關鍵字「${unit.keys[q - 1]}」`);
  const leaked = unit.oldWords.filter((w) => m.bodyText.includes(w));
  if (leaked.length) fail(`${tag} 舊模板字眼外洩：${leaked.join('、')}`);

  if (view.centered) {
    if (!near(m.left, m.right, 13)) fail(`${tag} 桌面未置中（左 ${m.left}px / 右 ${m.right}px）`);
  }

  let before, after, stepBefore, stepAfter, hiCount = 0;
  const interactive = unit.code === 'R-3-2' && unit.interactiveFrom && q >= unit.interactiveFrom;
  if (interactive) {
    // Q05–Q10 已改掛 PatternEngine 動態推導教具：舊 iv-card 劇透按鈕不存在，
    // 改點擊真正的 ➕ 控制器並斷言 count / 狀態文字 / ivStep 三者連動。
    const state = await s.eval(`(() => {
      const b = document.getElementById('q-scene');
      const h = b.querySelector('.iv-wrap');
      const o = b.querySelector('#iv-status');
      return { has: !!h && !!o, count: h ? h.dataset.count : null,
               text: o ? o.textContent : '', step: b.dataset.ivStep };
    })()`);
    if (!state.has || !state.text) fail(`${tag} 動態推導容器或狀態列不存在`);
    before = state.text; stepBefore = state.step;
    await realClick(s, `(() => { const r = document.querySelector('#q-scene .iv-btn-plus').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`, tag);
    const post = await s.eval(`(() => {
      const b = document.getElementById('q-scene');
      return { text: b.querySelector('#iv-status').textContent, step: b.dataset.ivStep,
               count: b.querySelector('.iv-wrap').dataset.count };
    })()`);
    after = post.text; stepAfter = post.step;
    if (post.count === state.count) fail(`${tag} 點擊＋後 DOM 數量未改變（${state.count}）`);
  } else if (unit.kind === 'card') {
    const state = await s.eval(`(() => {
      const b = document.getElementById('q-scene');
      const c = b.querySelector('.iv-card');
      const o = b.querySelector('#iv-out');
      return { hasCard: !!c, text: o ? o.textContent : '', step: b.dataset.ivStep };
    })()`);
    if (!state.hasCard || !state.text) fail(`${tag} 互動卡片或輸出不存在`);
    before = state.text; stepBefore = state.step;
    await realClick(s, `(() => { const r = document.querySelector('#q-scene .iv-card').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`, tag);
    after = await s.eval(`document.querySelector('#q-scene #iv-out').textContent`);
    stepAfter = await s.eval(`document.getElementById('q-scene').dataset.ivStep`);
  } else {
    const state = await s.eval(`(() => {
      const b = document.getElementById('q-scene');
      const o = b.querySelector('#iv-out');
      return { cells: b.querySelectorAll('.qt td').length, text: o ? o.textContent : '', step: b.dataset.ivStep };
    })()`);
    if (!state.cells || !state.text) fail(`${tag} 表格或輸出不存在`);
    before = state.text; stepBefore = state.step;
    await realClick(s, `(() => { const r = document.querySelector('#q-scene .qt tbody tr td:nth-child(2)').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`, tag);
    const post = await s.eval(`(() => {
      const b = document.getElementById('q-scene');
      return { text: b.querySelector('#iv-out').textContent, step: b.dataset.ivStep,
               hi: b.querySelectorAll('.qt td.q-hi').length, sel: b.querySelectorAll('.qt td.q-sel').length };
    })()`);
    after = post.text; stepAfter = post.step; hiCount = post.hi;
    if (hiCount < 2) fail(`${tag} 表格十字高亮未生效（q-hi=${hiCount}）`);
    if (post.sel !== 1) fail(`${tag} 選取格標記未生效（q-sel=${post.sel}）`);
  }
  if (after === before) fail(`${tag} 點擊後輸出文字未改變（${before}）`);
  if (stepAfter === stepBefore) fail(`${tag} 點擊後狀態未改變（${stepBefore}）`);

  const shot = path.join(SHOT_DIR, `${unit.code.replace(/-/g, '')}_Q${String(q).padStart(2, '0')}_${view.tag}.png`);
  await s.screenshot(shot);
  console.log(`PASS: ${tag} 高${m.height}px 置中(${m.left}/${m.right}) ${view.centered ? '' : '零溢出 '}關鍵字「${unit.keys[q - 1]}」 點擊 ${before} ➜ ${after}`);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const s = await createSession({ width: 390, height: 844 });
  await s.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__cdpErrs=[];window.addEventListener('error',function(e){window.__cdpErrs.push(String(e.message));});"
  });
  try {
    let count = 0;
    for (const view of VIEWS) {
      await s.setViewport(view.w, view.h);
      for (const unit of UNITS) {
        for (let q = 1; q <= 10; q++) {
          await verifyOne(s, unit, view, q);
          count++;
        }
      }
    }
    console.log(`\nALL_GREEN: 3 單元 × 10 題 × 2 視口 = ${count} 組合，真實點擊與題組連動全數通過。`);
    console.log(`截圖目錄：${SHOT_DIR}`);
    s.close();
    process.exit(0);
  } catch (e) {
    console.error('FAIL: ' + (e && e.stack ? e.stack : e));
    s.close();
    process.exit(1);
  }
})();
