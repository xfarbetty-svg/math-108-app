/**
 * tools/verify_s34_q2_compass_cdp.js — S-3-4 Q2 圓規複製教具 CDP 實機驗證
 * 以真實 Input.dispatchMouseEvent 點擊折線線段 → 截取按鈕 → 重置，驗證：
 *  1) 圓規移動＋張合，兩腳座標精準對齊線段兩端（SVG getCTM 量測 < 0.6px）
 *  2) 逐段截取在虛線畫出等長彩色實線、進度 0→4/4、重置歸零
 *  3) 390×844 與 360×800、Light/Dark 四組合：app 高度 ≤ 420、零橫向溢出、console 零錯誤
 * 全綠 → Exit 0；任一 FAIL → Exit 1。
 * 用法：node tools/verify_s34_q2_compass_cdp.js
 */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createSession, sleep } = require('./_cdp_util');

const COMP = path.resolve(__dirname, '..', 'app', 'components', 'solid_geometry_lab.html');
const BASE = pathToFileURL(COMP).href;
const EXPECT = [
  Math.hypot(52, 24), Math.hypot(54, 44), Math.hypot(54, 36), Math.hypot(52, 44)
];
const VIEWS = [{ w: 390, h: 844 }, { w: 360, h: 800 }];
const THEMES = ['light', 'dark'];
const SHOT_DIR = path.resolve(__dirname, '..', 'reports');
const SHOT_PREFIX = '20261123_0';

function fail(msg) { console.error('FAIL: ' + msg); process.exit(1); }
function near(a, b, tol) { return Math.abs(a - b) <= tol; }

async function click(s, expr) {
  const pt = await s.eval(expr);
  if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) fail('無法取得點擊座標：' + expr);
  await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
  // 等待 CSS transform 過渡（.28s）結束，確保 getCTM 量到的是最終座標
  await sleep(360);
}

async function verifyCombo(s, theme, view, shotNo) {
  const tag = `${view.w}x${view.h} ${theme}`;
  await s.setViewport(view.w, view.h);
  await s.navigate(`${BASE}?q=2&theme=${theme}`, 260);

  const m = await s.eval(`(() => {
    const app = document.getElementById('app');
    const de = document.documentElement;
    const svg = document.querySelector('.scene svg');
    return {
      height: app ? app.offsetHeight : 0,
      overflowX: de.scrollWidth > de.clientWidth + 2,
      segCount: document.querySelectorAll('.seg').length,
      jointCount: svg ? svg.querySelectorAll('.joint').length : 0,
      state: document.getElementById('compass').dataset.state,
      btnDisabled: document.getElementById('btnPlace').disabled,
      progress: document.getElementById('q2progress').textContent,
      copyCount: document.querySelectorAll('.copy-seg').length,
      hasReset: !!document.getElementById('btnReset'),
      qtag: document.getElementById('qtag').textContent
    };
  })()`);
  if (!m || m.height === 0) fail(`${tag} 教具未載入`);
  if (m.height > 420) fail(`${tag} app 高度超標 ${m.height}px > 420px`);
  if (m.overflowX) fail(`${tag} 出現橫向溢出`);
  if (m.segCount !== 4) fail(`${tag} 折線甲可點擊線段數應為 4，實際 ${m.segCount}`);
  if (m.jointCount !== 5) fail(`${tag} 端點圓點數應為 5，實際 ${m.jointCount}`);
  if (m.state !== 'idle' || !m.btnDisabled) fail(`${tag} 初始圓規/按鈕狀態不正確`);
  if (m.progress !== '已複製 0 / 4 段' || m.copyCount !== 0 || !m.hasReset) fail(`${tag} 初始進度/重置按鈕不正確`);
  if (m.qtag !== 'Q02') fail(`${tag} 題號標籤應為 Q02`);
  console.log(`PASS: ${tag} 初始渲染 OK（高 ${m.height}px、4 段、零溢出、進度 0/4）`);

  let prevEndX = 56;
  for (let i = 0; i < 4; i++) {
    await click(s, `(() => { const r = document.querySelectorAll('.seg')[${i}].querySelector('.tap').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);

    const measured = await s.eval(`(() => {
      const svg = document.querySelector('.scene svg');
      const c = document.getElementById('compass');
      const mat = c.getScreenCTM();
      const feet = [...c.querySelectorAll('.c-foot')].map(f => {
        const p = svg.createSVGPoint(); p.x = +f.getAttribute('cx'); p.y = +f.getAttribute('cy');
        const q = p.matrixTransform(mat); return [q.x, q.y];
      });
      const joints = [...svg.querySelectorAll('.joint')];
      const j = joints.map(e => {
        const p = svg.createSVGPoint(); p.x = +e.getAttribute('cx'); p.y = +e.getAttribute('cy');
        const q = p.matrixTransform(e.getScreenCTM()); return [q.x, q.y];
      });
      const A = feet[0], B = feet[1], T1 = j[${i}], T2 = j[${i + 1}];
      const d1 = Math.hypot(A[0]-T1[0], A[1]-T1[1]) + Math.hypot(B[0]-T2[0], B[1]-T2[1]);
      const d2 = Math.hypot(A[0]-T2[0], A[1]-T2[1]) + Math.hypot(B[0]-T1[0], B[1]-T1[1]);
      return {
        align: Math.min(d1, d2),
        state: c.dataset.state,
        half: +c.dataset.half,
        rot: +c.dataset.rot,
        sel: document.querySelectorAll('.seg.sel').length,
        enabled: !document.getElementById('btnPlace').disabled,
        tagVisible: document.getElementById('measureTag').style.display !== 'none'
      };
    })()`);
    const err = (() => {
      const e = [];
      if (measured.align > 0.6) e.push(`兩腳未對齊端點（誤差 ${measured.align.toFixed(2)}px）`);
      if (measured.state !== 'measuring') e.push(`圓規狀態 ${measured.state} ≠ measuring`);
      if (!near(measured.half, EXPECT[i] / 2, 0.2)) e.push(`張角半距 ${measured.half} ≠ ${(EXPECT[i]/2).toFixed(1)}`);
      if (!near(measured.rot, Math.atan2((i === 0 ? -24 : i === 2 ? -36 : 44), (i === 1 || i === 2 ? 54 : 52)) * 180 / Math.PI, 0.5))
        e.push(`旋轉角 ${measured.rot} 不符`);
      if (measured.sel !== 1 || !measured.enabled || !measured.tagVisible) e.push('高亮/按鈕/量取標記未生效');
      return e;
    })();
    if (err.length) fail(`${tag} 第 ${i + 1} 段量距失敗：${err.join('；')}`);
    console.log(`PASS: ${tag} 第 ${i + 1} 段量距 OK（誤差 ${measured.align.toFixed(3)}px、半距 ${measured.half}、角 ${measured.rot}°）`);

    await click(s, `(() => { const r = document.getElementById('btnPlace').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);

    const placed = await s.eval(`(() => {
      const lines = [...document.querySelectorAll('.copy-seg')];
      const last = lines[lines.length - 1];
      const c = document.getElementById('compass');
      return {
        count: lines.length,
        x1: last ? +last.getAttribute('x1') : NaN,
        x2: last ? +last.getAttribute('x2') : NaN,
        y1: last ? +last.getAttribute('y1') : NaN,
        y2: last ? +last.getAttribute('y2') : NaN,
        ticks: document.querySelectorAll('.copy-tick').length,
        progress: document.getElementById('q2progress').textContent,
        state: c.dataset.state,
        half: +c.dataset.half,
        sel: document.querySelectorAll('.seg.sel').length,
        disabled: document.getElementById('btnPlace').disabled
      };
    })()`);
    if (placed.count !== i + 1) fail(`${tag} 截取線段數應 ${i + 1}，實際 ${placed.count}`);
    if (!near(placed.x1, prevEndX, 0.2) || !near(placed.y1, 240, 0.1) || !near(placed.y2, 240, 0.1))
      fail(`${tag} 第 ${i + 1} 段未接在前段終點或不在虛線上（x1=${placed.x1}, y1=${placed.y1}）`);
    if (!near(placed.x2 - placed.x1, EXPECT[i], 0.2)) fail(`${tag} 截取長度不等於量距（${(placed.x2-placed.x1).toFixed(2)} ≠ ${EXPECT[i].toFixed(2)}）`);
    if (placed.ticks !== i + 1) fail(`${tag} 圓弧刻度記號數應 ${i + 1}，實際 ${placed.ticks}`);
    if (placed.progress !== `已複製 ${i + 1} / 4 段`) fail(`${tag} 進度文字錯誤：${placed.progress}`);
    if (placed.state !== 'placed' || !near(placed.half, EXPECT[i] / 2, 0.2))
      fail(`${tag} 圓規未以相同張角移到虛線（state=${placed.state}, half=${placed.half}）`);
    if (placed.sel !== 0 || !placed.disabled) fail(`${tag} 截取後未清除選取/禁用按鈕`);
    prevEndX = placed.x2;
    console.log(`PASS: ${tag} 第 ${i + 1} 段截取 OK（x ${placed.x1.toFixed(1)}→${placed.x2.toFixed(1)}、進度 ${i + 1}/4）`);
  }

  const finalX = await s.eval(`(() => { const l=[...document.querySelectorAll('.copy-seg')];
    return l.length ? +l[l.length-1].getAttribute('x2') : NaN; })()`);
  const total = EXPECT.reduce((a, b) => a + b, 0);
  if (!near(finalX - 56, total, 1)) fail(`${tag} 四段總長不正確（${(finalX-56).toFixed(2)} ≠ ${total.toFixed(2)}）`);

  const shot = path.join(SHOT_DIR, `${SHOT_PREFIX}${shotNo}_S34_Q2_${theme}_${view.w}x${view.h}.png`);
  await s.screenshot(shot);
  console.log(`PASS: ${tag} 截圖已存 ${path.basename(shot)}（四段總長 ${(finalX-56).toFixed(1)}px）`);

  await click(s, `(() => { const r = document.getElementById('btnReset').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const reset = await s.eval(`(() => ({
    count: document.querySelectorAll('.copy-seg').length,
    progress: document.getElementById('q2progress').textContent,
    state: document.getElementById('compass').dataset.state,
    disabled: document.getElementById('btnPlace').disabled
  }))()`);
  if (reset.count !== 0 || reset.progress !== '已複製 0 / 4 段' || reset.state !== 'idle' || !reset.disabled)
    fail(`${tag} 重置未歸零：${JSON.stringify(reset)}`);
  console.log(`PASS: ${tag} 重置 OK（0/4、圓規 idle、按鈕禁用）`);
}

async function main() {
  const s = await createSession({ width: 390, height: 844 });
  const consoleErrors = [];
  s.onMessage((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error')
      consoleErrors.push(JSON.stringify(msg.params.args));
  });
  let shotNo = 2;
  try {
    for (const theme of THEMES) for (const view of VIEWS) {
      await verifyCombo(s, theme, view, shotNo++);
    }
    if (consoleErrors.length) fail(`瀏覽器 console 有 ${consoleErrors.length} 個錯誤：\n` + consoleErrors.slice(0, 5).join('\n'));
    console.log('S34_Q2_COMPASS_CDP_VERIFIED — ALL PASS（4 組合 × 4 段量距＋截取＋重置）');
  } finally {
    s.close();
  }
}

main().catch((e) => { console.error('FAIL: ' + e.message); process.exit(1); });
