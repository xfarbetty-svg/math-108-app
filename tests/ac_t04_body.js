/* tests/ac_t04_body.js — T-04 調試台驗收本體（由 tools/ac_run.js 注入真實 file:// 頁面執行） */
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (w) => $('widthBtns').querySelector('[data-w="' + w + '"]').click();
const cols = () => getComputedStyle($('cards')).gridTemplateColumns.split(' ').filter(Boolean).length;

await sleep(400);

/* 元件是否真正升級（customElements + Shadow DOM） */
const upgraded = ['tfLeft', 'tfRight', 'diff', 'beam'].every((id) => $(id).shadowRoot !== null);
rec('T04-00', upgraded, '四顆元件皆完成 customElements 升級=' + upgraded);

/* AC-04-3 三端雙欄 */
pick(768); await sleep(260);
const c768 = cols();
const w768 = $('stage').getBoundingClientRect().width;
pick(960); await sleep(260);
const c960 = cols();
const w960 = $('stage').getBoundingClientRect().width;
rec('AC-04-3', c768 === 2 && c960 === 2,
  '768:cols=' + c768 + '(w=' + w768.toFixed(0) + ') 960:cols=' + c960 + '(w=' + w960.toFixed(0) + ')');

/* AC-04-2 390 舞台無橫向滾動 */
pick(390); await sleep(260);
const sw = document.documentElement.scrollWidth;
const stageW = $('stage').getBoundingClientRect().width;
rec('AC-04-2', sw <= 390 && stageW <= 390,
  'scrollWidth=' + sw + ' stageW=' + stageW.toFixed(0) + ' viewport=' + window.innerWidth);

/* 情境一：湊十 9+4（拋物線飛補由 T-04 編排） */
pick(960); await sleep(200);
$('resetAll').click();
await sleep(120);
document.querySelector('[data-scene="ten"]').click();
await sleep(1200);
rec('T04-01', $('tfLeft').value === 10 && $('tfRight').value === 3,
  '左盒=' + $('tfLeft').value + '(expect 10) 右盒=' + $('tfRight').value + '(expect 3)');

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

/* 全部重設 */
$('resetAll').click();
await sleep(150);
rec('T04-04', log.children.length === 0 && $('tfLeft').value === 0 && $('beam').left === 5 && $('beam').right === 2,
  'log清空=' + (log.children.length === 0) + ' 左盒=' + $('tfLeft').value +
  ' 天平=' + $('beam').left + 'v' + $('beam').right);

return out;
