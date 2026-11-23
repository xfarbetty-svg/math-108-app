/**
 * tools/verify_r32_interactive_cdp.js
 * ---------------------------------------------------------------
 * 可復用「動態推導教具」雙視口 × 雙模式 CDP 實機門禁。
 * 起點：G3 R-3-2 Q05～Q10（2026-11-23）。G4 同類題型複用步驟：
 *   1) 教具引入 app/js/r32_pattern_engine.js 並呼叫 PatternEngine.mount()。
 *   2) 於下方 SPECS 增加一筆 { q, kind, shape, mode, plus, minus, ... }。
 *   3) 若為全新元件，改 COMPONENT 常數即可；其餘斷言邏輯完全共用。
 *
 * 四道硬斷言（每題 × 每視口 × 每模式）：
 *   ① DOM 數量確實遞增／遞減（dataset.count 與 SVG 形狀數同步變化）
 *   ② 無純黑填充元素（fill / computed background 皆不得為 #000 / black / rgb(0,0,0)）
 *   ③ 控制按鈕與上方提示／狀態／圖形 BoundingBox 零重疊，且按鈕上緣距狀態列 ≥12px
 *   ④ 零橫向溢出（scrollWidth ≤ clientWidth + 2）、零 JS 錯誤、無「揭示下一項／答案」劇透
 * 截圖輸出：_scratch/r32_interactive/YYYYMMDD_NNN_Qnn_<view>_<theme>.png
 * 全綠 → Exit 0；任一 FAIL → Exit 1。
 */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createSession } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const COMPONENT = 'app/components/pattern_reasoning_lab.html';
const SHOT_DIR = path.join(ROOT, '_scratch', 'r32_interactive');
const SEQ = '010';
const VIEWS = [
  { tag: 'mobile', w: 390, h: 844 },
  { tag: 'desktop', w: 1280, h: 800 }
];
const THEMES = ['light', 'dark'];

// G4 複用：僅需擴充此表（mode: 'stepper' 為增減控制器；'beans' 為分類標記控制器）
const SPECS = [
  { q: 5,  kind: 'oranges',   shape: '.iv-orange',                   mode: 'stepper', plus: '.iv-btn-plus',  minus: '.iv-btn-minus',  delta: 1 },
  { q: 6,  kind: 'beans',     shape: '.iv-bean[data-marked="1"]',    mode: 'beans',   plus: '.iv-btn-even',  minus: '.iv-btn-reset',  markAfterPlus: 7, markAfterMinus: 0 },
  { q: 7,  kind: 'tape',      shape: '.iv-paper',                    mode: 'stepper', plus: '.iv-btn-plus',  minus: '.iv-btn-minus',  delta: 1 },
  { q: 8,  kind: 'trapezoid', shape: '.iv-table',                    mode: 'stepper', plus: '.iv-btn-plus',  minus: '.iv-btn-minus',  delta: 1 },
  { q: 9,  kind: 'recttable', shape: '.iv-table',                    mode: 'stepper', plus: '.iv-btn-plus',  minus: '.iv-btn-minus',  delta: 1 },
  { q: 10, kind: 'sticks',    shape: '.iv-square',                   mode: 'stepper', plus: '.iv-btn-plus',  minus: '.iv-btn-minus',  delta: 1 }
];

const LEAK_WORDS = ['點卡片：揭示下一項', '揭示下一項', '答案：', '正確答案'];

function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
function overlap(a, b) {
  return !!(a && b && a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5);
}
function rectOf(id) { return document.getElementById(id); }

async function realClick(s, selector, label) {
  const pt = await s.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) fail(label + ' 找不到可點擊按鈕：' + selector);
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
  await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
}

async function measure(s, spec) {
  return s.eval(`(() => {
    const de = document.documentElement;
    const host = document.getElementById('q-scene');
    const wrap = host.querySelector('.iv-wrap');
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
      return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; };
    const black = [];
    host.querySelectorAll('[fill]').forEach((el) => {
      const f = String(el.getAttribute('fill') || '').trim().toLowerCase();
      if (['#000','#000000','black','rgb(0,0,0)','rgba(0,0,0,1)'].includes(f)) black.push(el.tagName + ':' + f);
    });
    host.querySelectorAll('*').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width <= 0 || b.height <= 0) return;
      const bg = getComputedStyle(el).backgroundColor || '';
      if (bg === 'rgb(0, 0, 0)') black.push('bg:' + (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className));
    });
    const st = host.querySelector('#iv-status');
    const ctl = host.querySelector('.iv-controls');
    return {
      hasWrap: !!wrap,
      kind: wrap ? wrap.dataset.kind : null,
      count: wrap ? parseInt(wrap.dataset.count, 10) : NaN,
      shapes: host.querySelectorAll(${JSON.stringify(spec.shape)}).length,
      hasSvg: !!host.querySelector('#iv-svg svg'),
      statusText: st ? st.textContent : '',
      badge: (document.getElementById('q-badge') || {}).textContent || '',
      bodyText: document.body.innerText || '',
      rects: {
        status: r(st),
        hint: r(host.querySelector('.iv-hint')),
        svg: r(host.querySelector('#iv-svg svg')),
        controls: r(ctl),
        buttons: [...host.querySelectorAll('.iv-btn')].map(r)
      },
      bodyH: Math.round(document.body.getBoundingClientRect().height),
      overflowX: de.scrollWidth > de.clientWidth + 2,
      scrollW: de.scrollWidth, clientW: de.clientWidth,
      black,
      errs: (window.__cdpErrs || []).slice()
    };
  })()`);
}

function assertLayout(m, tag) {
  if (!m.hasWrap || !m.hasSvg) fail(`${tag} 互動容器或 SVG 不存在`);
  if (m.bodyH > 420) fail(`${tag} 教具高度超標 ${m.bodyH}px > 420px`);
  if (m.overflowX) fail(`${tag} 橫向溢出 scrollW=${m.scrollW} / clientW=${m.clientW}`);
  if (m.errs.length) fail(`${tag} JS 錯誤：${m.errs.join(' | ')}`);
  if (m.black.length) fail(`${tag} 出現純黑填充：${m.black.join('、')}`);
  const leaked = LEAK_WORDS.filter((w) => m.bodyText.includes(w));
  if (leaked.length) fail(`${tag} 劇透字眼外洩：${leaked.join('、')}`);
  const R = m.rects;
  if (!R.status || !R.controls || R.buttons.length === 0) fail(`${tag} 狀態列或控制按鈕不存在`);
  R.buttons.forEach((b, i) => {
    if (!b || b.w <= 0 || b.h <= 0) fail(`${tag} 按鈕 ${i} 無有效 BoundingBox`);
    if (overlap(b, R.status)) fail(`${tag} 按鈕 ${i} 與狀態文字重疊`);
    if (overlap(b, R.hint)) fail(`${tag} 按鈕 ${i} 與上方提示文字重疊`);
    if (overlap(b, R.svg)) fail(`${tag} 按鈕 ${i} 與圖形重疊`);
    const gap = b.t - R.status.b;
    if (gap < 12) fail(`${tag} 按鈕 ${i} 與狀態文字間距 ${gap.toFixed(1)}px < 12px`);
  });
}

async function verifyOne(s, spec, view, theme, stamp) {
  const q = String(spec.q).padStart(2, '0');
  const tag = `R-3-2 Q${q} ${view.tag}/${theme}`;
  const url = pathToFileURL(path.join(ROOT, COMPONENT)).href + `?q=${spec.q}&theme=${theme}`;
  await s.navigate(url, 240);

  const before = await measure(s, spec);
  assertLayout(before, tag);
  if (before.badge !== 'Q' + q) fail(`${tag} 題號標籤 ${before.badge} 不符`);
  if (before.kind !== spec.kind) fail(`${tag} kind=${before.kind}，預期 ${spec.kind}`);
  if (before.count !== before.shapes) fail(`${tag} 初始數量不一致 count=${before.count} / shapes=${before.shapes}（${spec.shape}）`);

  if (spec.mode === 'stepper') {
    await realClick(s, '#q-scene ' + spec.plus, tag);
    const afterPlus = await measure(s, spec);
    assertLayout(afterPlus, tag);
    if (afterPlus.count !== before.count + spec.delta || afterPlus.shapes !== before.shapes + spec.delta) {
      fail(`${tag} 點＋後 DOM 未遞增：count ${before.count}→${afterPlus.count} / shapes ${before.shapes}→${afterPlus.shapes}`);
    }
    await realClick(s, '#q-scene ' + spec.minus, tag);
    const afterMinus = await measure(s, spec);
    if (afterMinus.count !== before.count || afterMinus.shapes !== before.shapes) {
      fail(`${tag} 點－後 DOM 未還原：count=${afterMinus.count} / shapes=${afterMinus.shapes}`);
    }
  } else {
    await realClick(s, '#q-scene ' + spec.plus, tag);
    const afterPlus = await measure(s, spec);
    assertLayout(afterPlus, tag);
    if (afterPlus.count !== spec.markAfterPlus || afterPlus.shapes !== spec.markAfterPlus) {
      fail(`${tag} 標記偶數後數量應為 ${spec.markAfterPlus}，實際 count=${afterPlus.count} / shapes=${afterPlus.shapes}`);
    }
    // 單顆點擊：取消一顆，數量減 1（DOM 確實反應）
    await realClick(s, '#q-scene .iv-bean[data-num="22"]', tag);
    const afterBean = await measure(s, spec);
    if (afterBean.count !== spec.markAfterPlus - 1) fail(`${tag} 單顆點擊未改變標記數：${afterBean.count}`);
    await realClick(s, '#q-scene ' + spec.minus, tag);
    const afterReset = await measure(s, spec);
    if (afterReset.count !== spec.markAfterMinus) fail(`${tag} 重置後數量應為 ${spec.markAfterMinus}，實際 ${afterReset.count}`);
  }

  const shot = path.join(SHOT_DIR, `${stamp}_${SEQ}_Q${q}_${view.tag}_${theme}.png`);
  await s.screenshot(shot);
  console.log(`PASS: ${tag} 高${before.bodyH}px 無溢出 無黑填充 間距>=12px 數量 ${before.count}→${before.shapes}+ 截圖 ${path.basename(shot)}`);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const d = new Date();
  const stamp = '' + d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const s = await createSession({ width: 390, height: 844 });
  await s.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__cdpErrs=[];window.addEventListener('error',function(e){window.__cdpErrs.push(String(e.message));});"
  });
  let total = 0;
  try {
    for (const view of VIEWS) {
      await s.setViewport(view.w, view.h);
      for (const theme of THEMES) {
        for (const spec of SPECS) {
          await verifyOne(s, spec, view, theme, stamp);
          total++;
        }
      }
    }
    console.log(`\nALL_GREEN: ${SPECS.length} 題 × ${VIEWS.length} 視口 × ${THEMES.length} 模式 = ${total} 組合，四道硬斷言全數通過。`);
    console.log(`截圖目錄：${SHOT_DIR}`);
    s.close();
    process.exit(0);
  } catch (e) {
    console.error('FAIL: ' + (e && e.stack ? e.stack : e));
    s.close();
    process.exit(1);
  }
})();

module.exports = { SPECS, VIEWS, THEMES, COMPONENT, SHOT_DIR };
