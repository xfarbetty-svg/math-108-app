/**
 * tools/verify_s34_dual_viewport_cdp.js — S-3-4 Q01~Q04 雙視口（390×844 / 1280×800）× Light/Dark CDP 實機驗證
 * 驗證：零橫向溢出、教具高度 ≤420、寬螢幕置中放大（680px）、Q02 步驟引導與截取、Q03 進位按鈕、Q4 等角 3D 積木。
 * 用法：node tools/verify_s34_dual_viewport_cdp.js
 */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createSession, sleep } = require('./_cdp_util');

const BASE = pathToFileURL(path.resolve(__dirname, '..', 'app', 'components', 'solid_geometry_lab.html')).href;
const VIEWS = [{ w: 390, h: 844 }, { w: 1280, h: 800 }];
const THEMES = ['light', 'dark'];
const SHOTS = path.resolve(__dirname, '..', 'reports');
function fail(m) { console.error('FAIL: ' + m); process.exit(1); }
async function click(s, expr) {
  const p = await s.eval(expr);
  if (!p || !Number.isFinite(p.x)) fail('點擊座標無效：' + expr);
  await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(340);
}
const centerExpr = `(() => { const a = document.getElementById('app').getBoundingClientRect();
  return { left:a.left, width:a.width, height:a.height,
    overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    qtag:document.getElementById('qtag').textContent }; })()`;

async function main() {
  const s = await createSession({ width: 390, height: 844 });
  const errs = [];
  s.onMessage((m) => { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(JSON.stringify(m.params.args)); });
  let shot = 1;
  try {
    for (const view of VIEWS) for (const theme of THEMES) {
      const tag = `${view.w}x${view.h} ${theme}`;
      await s.setViewport(view.w, view.h);
      for (let q = 1; q <= 4; q++) {
        await s.navigate(`${BASE}?q=${q}&theme=${theme}`, 220);
        const m = await s.eval(centerExpr);
        const expectW = view.w > 520 ? 680 : 390;
        if (m.height > 420 || m.height < 300) fail(`${tag} Q0${q} 教具高度異常 ${m.height}`);
        if (m.overflow) fail(`${tag} Q0${q} 橫向溢出`);
        if (m.qtag !== 'Q0' + q) fail(`${tag} Q0${q} 題號標籤錯誤 ${m.qtag}`);
        if (Math.abs(m.width - expectW) > 3) fail(`${tag} Q0${q} 寬度 ${m.width} ≠ ${expectW}`);
        const expectLeft = (view.w - expectW) / 2;
        if (Math.abs(m.left - expectLeft) > 3) fail(`${tag} Q0${q} 未置中：left=${m.left}，應 ${expectLeft}`);
        if (q === 1 && await s.eval(`document.querySelectorAll('.hit[data-kind="stick"]').length`) < 15)
          fail(`${tag} Q01 木棍未渲染`);
        if (q === 4) {
          const blocks = await s.eval(`document.querySelectorAll('.iso-top').length`);
          if (blocks !== 20) fail(`${tag} Q04 等角 3D 積木數應 20，實際 ${blocks}`);
          if (view.w === 1280) await s.screenshot(path.join(SHOTS, `20261123_${String(shot++).padStart(3, '0')}_S34_DUAL_${theme}_1280x800.png`));
        }
        if (q === 3) {
          const pre = await s.eval(`(() => ({ blocks:document.querySelectorAll('.iso-top').length,
            btn:!!document.getElementById('btnCarry'), note:getComputedStyle(document.querySelector('.result-note')).display,
            carried:document.getElementById('sceneSvg').classList.contains('carried') }))()`);
          if (pre.blocks !== 31 || !pre.btn || pre.note !== 'none' || pre.carried) fail(`${tag} Q03 初始 3D/進位按鈕/防劇透異常：${JSON.stringify(pre)}`);
          await click(s, `(() => { const r = document.getElementById('btnCarry').getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; })()`);
          const post = await s.eval(`(() => ({ carried:document.getElementById('sceneSvg').classList.contains('carried'),
            note:getComputedStyle(document.querySelector('.result-note')).display,
            rod:getComputedStyle(document.querySelector('.new-rod')).display,
            take:getComputedStyle(document.querySelector('.take-group')).display,
            disabled:document.getElementById('btnCarry').disabled }))()`);
          if (!post.carried || post.note === 'none' || post.rod === 'none' || post.take !== 'none' || !post.disabled)
            fail(`${tag} Q03 進位互動失敗：${JSON.stringify(post)}`);
        }
        if (q === 2) {
          const init = await s.eval(`(() => ({ labels:document.querySelectorAll('.seg-label').length,
            active:document.querySelector('.seg-label.active')?.dataset.guide,
            tip:getComputedStyle(document.getElementById('q2GuideTip')).display,
            tipText:document.getElementById('q2GuideText').textContent }))()`);
          if (init.labels !== 4 || init.active !== '0' || init.tip === 'none' || !init.tipText.includes('①'))
            fail(`${tag} Q02 初始引導異常：${JSON.stringify(init)}`);
          await click(s, `(() => { const r = document.querySelectorAll('.seg')[0].querySelector('.tap').getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; })()`);
          const measured = await s.eval(`(() => ({ state:document.getElementById('compass').dataset.state,
            pulse:document.getElementById('btnPlace').classList.contains('guide-pulse'),
            tip:getComputedStyle(document.getElementById('q2GuideTip')).display }))()`);
          if (measured.state !== 'measuring' || !measured.pulse || measured.tip !== 'none')
            fail(`${tag} Q02 量距後按鈕脈衝引導失敗：${JSON.stringify(measured)}`);
          await click(s, `(() => { const r = document.getElementById('btnPlace').getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; })()`);
          const guided = await s.eval(`(() => ({ active:document.querySelector('.seg-label.active')?.dataset.guide,
            tipText:document.getElementById('q2GuideText').textContent, count:document.querySelectorAll('.copy-seg').length }))()`);
          if (guided.active !== '1' || !guided.tipText.includes('②') || guided.count !== 1)
            fail(`${tag} Q02 截取後未自動引導第②段：${JSON.stringify(guided)}`);
        }
      }
      console.log(`PASS: ${tag} Q01~Q04 渲染／置中／互動全綠`);
    }
    if (errs.length) fail(`browser console 錯誤 ${errs.length} 筆：${errs.slice(0, 3).join('\n')}`);
    console.log('S34_DUAL_VIEWPORT_CDP_VERIFIED — ALL PASS');
  } finally { s.close(); }
}
main().catch((e) => { console.error('FAIL: ' + e.message); process.exit(1); });
