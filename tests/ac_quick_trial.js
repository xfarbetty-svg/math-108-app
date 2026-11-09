/* tests/ac_quick_trial.js — 驗證 quick_trial.html 6 題體驗頁面 */
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(300);

const hasVisual = document.getElementById('visualWindow') !== null;
rec('QT-01', hasVisual, '主視窗已渲染');

const dotsCount = document.querySelectorAll('.nav-dot').length;
rec('QT-02', dotsCount === 6, '頂部 6 顆導航圓點全部生成 (count=' + dotsCount + ')');

const choices = document.querySelectorAll('.choice-btn');
rec('QT-03', choices.length === 4, '2x2 選項按鈕恰 4 個');

// 點選第 1 題正解 (index 0)
choices[0].click();
await sleep(500);

const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
rec('QT-04', drawerOpen, '點選選項後算理解析抽屜展開');

const btnNext = document.getElementById('btnNext');
rec('QT-05', btnNext.style.display !== 'none', '下一題按鈕亮起');

// 換到下一題
btnNext.click();
await sleep(300);
const curBadge = document.getElementById('unitBadge').textContent;
rec('QT-06', curBadge.includes('2/6'), '順利進入第 2 題: ' + curBadge);

return out;
