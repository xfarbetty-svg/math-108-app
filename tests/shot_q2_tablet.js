// tests/shot_q2_tablet.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(400);
const dots = document.querySelectorAll('.dot-item');
if (dots[1]) dots[1].click(); // 跳至 Q2 (8+5)
await sleep(400);
return ['PASS Q2-TABLET :: Q2 平板雙欄初始畫面'];
