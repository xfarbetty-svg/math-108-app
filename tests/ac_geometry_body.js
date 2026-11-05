/* tests/ac_geometry_body.js — 幾何實測（視覺數值是否真的落地，而非只過事件測試） */
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (n) => Math.round(n * 10) / 10;

await sleep(300);
const tf = $('tfLeft');
tf.value = 9;
await sleep(60);

const sr = tf.shadowRoot;
const slot = sr.querySelector('.slot').getBoundingClientRect();
const dot = sr.querySelector('.dot').getBoundingClientRect();
const cells = Array.from(sr.querySelectorAll('.cell')).map((c) => c.getBoundingClientRect());
const frame = sr.querySelector('.frame').getBoundingClientRect();
const slots = Array.from(sr.querySelectorAll('.slot')).map((s) => s.getBoundingClientRect());
const gridGap = slots[1].left - slots[0].right;
const rowGap = slots[5].top - slots[0].bottom;
const dotX = Array.from(sr.querySelectorAll('.dot')).map((d) => r1(d.getBoundingClientRect().left));

rec('GEO-01', Math.abs(slot.width - 30) < 0.6 && Math.abs(slot.height - 30) < 0.6,
  'slot=' + r1(slot.width) + 'x' + r1(slot.height) + ' (spec 30x30)');
rec('GEO-02', Math.abs(dot.width - 24) < 0.6 && Math.abs(dot.height - 24) < 0.6,
  'dot=' + r1(dot.width) + 'x' + r1(dot.height) + ' (spec 24)');
rec('GEO-03', Math.abs(gridGap - 3) < 0.6 && Math.abs(rowGap - 3) < 0.6 &&
  Math.abs(cells[0].width - 33) < 0.6 && cells[1].left >= cells[0].right - 0.01,
  'slotColGap=' + r1(gridGap) + ' slotRowGap=' + r1(rowGap) +
  ' hit=' + r1(cells[0].width) + '(spec 33 pitch，相鄰不重疊)');
rec('GEO-04', Math.abs(frame.width - (5 * 33 + 8 + 4)) < 1.5,
  'frameW=' + r1(frame.width) + ' (expect 5*33+8padding+4border=177)');
rec('GEO-05', sr.querySelectorAll('.dot').length === 9 && new Set(dotX).size === 5,
  'dots=' + sr.querySelectorAll('.dot').length + ' distinctX=' + new Set(dotX).size + '(9 顆=第一排5+第二排4，x 只會有 5 種)');

/* 雙軌差值：圓片直徑與軌距 */
const d = $('diff');
await sleep(60);
const dsr = d.shadowRoot;
const coins = Array.from(dsr.querySelectorAll('.coin.top'));
const c0 = coins[0].getBoundingClientRect();
const stepX = coins[1].getBoundingClientRect().left - c0.left;
const topY = coins[0].getBoundingClientRect().top;
const botY = dsr.querySelector('.coin.bottom').getBoundingClientRect().top;
/* TCK-06：以外部公式反推渲染後的圓片直徑與步距 */
const STEP = (320 - 2 * 28) / 9;
const R = Math.min(16, Math.max(10, STEP / 2 - 2));
const sc = dsr.querySelector('svg').getBoundingClientRect().width / 320;
rec('GEO-06',
  Math.abs(c0.width - 2 * R * sc) < 0.8 && Math.abs(stepX - STEP * sc) < 0.8 &&
  Math.abs(c0.width - c0.height) < 0.6 && stepX > c0.width,
  'coin=' + r1(c0.width) + 'x' + r1(c0.height) + '(expect ' + r1(2 * R * sc) + ') stepX=' +
  r1(stepX) + '(expect ' + r1(STEP * sc) + ') trackGap=' + r1(botY - topY) + ' scale=' + r1(sc));

/* 天平：支點與槓桿幾何 */
const b = $('beam');
b.setAttribute('left-weight', '5');
b.setAttribute('right-weight', '5');
await sleep(80);
const bsr = b.shadowRoot;
const lever = bsr.querySelector('.lever').getBBox();
const fulcrum = bsr.querySelector('.fulcrum').getBBox();
const svg = bsr.querySelector('svg').getBoundingClientRect();
const scale = svg.width / 340;
rec('GEO-07', Math.abs(lever.width - 240) < 0.6 && Math.abs(lever.height - 8) < 0.6 &&
  Math.abs(fulcrum.width - 40) < 0.6 && Math.abs(fulcrum.height - 70) < 0.6,
  'lever=' + r1(lever.width) + 'x' + r1(lever.height) + ' fulcrum=' + r1(fulcrum.width) + 'x' + r1(fulcrum.height) +
  ' renderScale=' + r1(scale) + ' svgW=' + r1(svg.width));

return out;
