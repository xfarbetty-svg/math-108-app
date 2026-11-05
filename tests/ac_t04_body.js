/* tests/ac_t04_body.js — T-04 調試台驗收本體（由 tools/ac_run.js 注入真實 file:// 頁面執行）
 * 需分別以 --viewport=390x900（手機）與 --viewport=1200x900（寬螢幕）各跑一次：
 *   AC-04-2 只能在真實 390 視口驗證；AC-04-3 只能在 >=768 舞台驗證。
 */
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const skip = (id, why) => out.push('SKIP ' + id + ' :: ' + why);
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (w) => $('widthBtns').querySelector('[data-w="' + w + '"]').click();
const cols = () => getComputedStyle($('cards')).gridTemplateColumns.split(' ').filter(Boolean).length;
const WIDE = window.innerWidth >= 700;

await sleep(400);

/* 元件是否真正升級（customElements + Shadow DOM） */
const upgraded = ['tfLeft', 'tfRight', 'diff', 'beam'].every((id) => $(id).shadowRoot !== null);
rec('T04-00', upgraded, '四顆元件皆完成 customElements 升級=' + upgraded);

/* AC-04-3 三端雙欄（僅寬螢幕視口可驗） */
if (WIDE) {
  pick(768); await sleep(260);
  const c768 = cols();
  const w768 = $('stage').getBoundingClientRect().width;
  pick(960); await sleep(260);
  const c960 = cols();
  const w960 = $('stage').getBoundingClientRect().width;
  rec('AC-04-3', c768 === 2 && c960 === 2,
    '768:cols=' + c768 + '(w=' + w768.toFixed(0) + ') 960:cols=' + c960 + '(w=' + w960.toFixed(0) + ')');
} else {
  skip('AC-04-3', 'viewport=' + window.innerWidth + ' < 700，改由寬螢幕視口那一輪驗證');
}

/* AC-04-2 390 舞台無橫向滾動 */
if (!WIDE) {
  pick(390); await sleep(260);
  const sw = document.documentElement.scrollWidth;
  const stageW = $('stage').getBoundingClientRect().width;
  rec('AC-04-2', sw <= 390 && stageW <= 390,
    'scrollWidth=' + sw + ' stageW=' + stageW.toFixed(0) + ' viewport=' + window.innerWidth);
  /* AC-04-6 / TCK-02：390px 下左盒右盒必須同一列並排，不得換行堆疊 */
  const lb = $('tfLeft').getBoundingClientRect();
  const rb = $('tfRight').getBoundingClientRect();
  rec('AC-04-6', Math.abs(lb.top - rb.top) < 2 && lb.right <= rb.left + 0.5 &&
    lb.width <= 186 && rb.width <= 186,
    'left=[' + lb.left.toFixed(0) + ',' + lb.top.toFixed(0) + ' w=' + lb.width.toFixed(0) +
    '] right=[' + rb.left.toFixed(0) + ',' + rb.top.toFixed(0) + ' w=' + rb.width.toFixed(0) + '] sameRow=' +
    (Math.abs(lb.top - rb.top) < 2));
} else {
  skip('AC-04-2', 'viewport=' + window.innerWidth + '，改由 390 視口那一輪驗證');
}

/* 情境一：湊十 9+4（拋物線飛補由 T-04 編排） */
pick(WIDE ? 960 : 390); await sleep(200);
$('resetAll').click();
await sleep(120);
document.querySelector('[data-scene="ten"]').click();
await sleep(1200);
rec('T04-01', $('tfLeft').value === 10 && $('tfRight').value === 3,
  '左盒=' + $('tfLeft').value + '(expect 10) 右盒=' + $('tfRight').value + '(expect 3)');

/* TCK-03：分解樹三步全亮 + 節點文字 + 分支線座標鎖死 */
const branchCoords = Array.from($('treeSvg').querySelectorAll('.branch'))
  .map((n) => [n.getAttribute('x1'), n.getAttribute('y1'), n.getAttribute('x2'), n.getAttribute('y2')].join(','));
const treeOk = window.__t04.treeStep === 3 &&
  $('tnA').textContent === '9 ＋ 4' && $('tnC').textContent === '9 ＋ 1 ＝ 10' &&
  $('tnD').textContent === '10 ＋ 3 ＝ 13' &&
  branchCoords.length === 2 && branchCoords[0] === '150,30,108,64' && branchCoords[1] === '150,30,192,64' &&
  $('treeSvg').classList.contains('step3');
rec('T04-05', treeOk,
  'treeStep=' + window.__t04.treeStep + ' tnA=' + $('tnA').textContent + ' tnC=' + $('tnC').textContent +
  ' tnD=' + $('tnD').textContent + ' branches=' + branchCoords.join(' | '));

/* TCK-03：拋物線飛行 250~350ms 且控制點非零（真的走拋物線，不是直線瞬移） */
rec('T04-06',
  window.__t04.flightMs >= 250 && window.__t04.flightMs <= 350 &&
  window.__t04.flightDy !== 0 && window.__t04.flightCount >= 1,
  'flightMs=' + window.__t04.flightMs + '(250~350) controlDy=' + window.__t04.flightDy +
  ' flights=' + window.__t04.flightCount);

/* 情境二：比較 8 vs 5 */
document.querySelector('[data-scene="diff"]').click();
await sleep(200);
const box = $('diff').shadowRoot.querySelector('.diff-box');
const bw = box ? box.getBBox().width : 0;
rec('T04-02', $('diff').top === 8 && $('diff').bottom === 5 && bw > 0,
  'top=' + $('diff').top + ' bottom=' + $('diff').bottom + ' 金框寬=' + bw.toFixed(1));

/* 情境三：天平 5 = 2+3 */
document.querySelector('[data-scene="balance"]').click();
await sleep(1400);
const f1 = $('beam').shadowRoot.querySelector('.formula').textContent;
const f2 = $('beam').shadowRoot.querySelector('.formula.reverse').textContent;
rec('T04-03', f1 === '5 ＝ 2 ＋ 3' && f2 === '2 ＋ 3 ＝ 5' && $('beam').balanced,
  'f1=' + f1 + ' | f2=' + f2 + ' | balanced=' + $('beam').balanced);

/* AC-04-4 事件日誌：三種事件皆出現且上限恰 20 筆 */
$('resetAll').click();
await sleep(150);
const log = $('log');
for (let i = 0; i < 14; i++) { $('tfPlus').click(); await sleep(20); }
for (let i = 0; i < 6; i++) {
  $('diffTop').value = String(6 + (i % 4));
  $('diffTop').dispatchEvent(new Event('input'));
  await sleep(30);
}
for (let i = 0; i < 4; i++) {
  $('beamLeft').value = String(3 + i);
  $('beamLeft').dispatchEvent(new Event('input'));
  await sleep(160);
}
await sleep(200);
const logText = log.textContent;
const hasTen = logText.includes('ten-frame:');
const hasDiff = logText.includes('diff:');
const hasBalance = logText.includes('balance:');
rec('AC-04-4', log.children.length === 20 && hasTen && hasDiff && hasBalance,
  'entries=' + log.children.length + '(expect 20) ten=' + hasTen + ' diff=' + hasDiff + ' balance=' + hasBalance);

/* AC-04-5 無外部資源（頁面內自檢） */
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map((n) => n.src || n.href)
  .filter((u) => /^https?:/i.test(u));
rec('AC-04-5', ext.length === 0, '外部資源數=' + ext.length + (ext.length ? ' -> ' + ext.join(',') : ''));

/* 全部重設：元件回預設、日誌先清空（reset 自身事件仍會入帳，屬預期） */
$('resetAll').click();
await sleep(120);
rec('T04-04', $('tfLeft').value === 0 && $('beam').left === 5 && $('beam').right === 2 && log.children.length <= 8,
  '左盒=' + $('tfLeft').value + ' 天平=' + $('beam').left + 'v' + $('beam').right +
  ' 重設後日誌=' + log.children.length + ' 筆(<=8)');

return out;
