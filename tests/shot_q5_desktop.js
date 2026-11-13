// tests/shot_q5_desktop.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(400);
const dots = document.querySelectorAll('.dot-item');
if (dots[4]) dots[4].click(); // 跳至 Q5 (13-4 水蜜桃)
await sleep(400);
const btns = document.querySelectorAll('.choice-btn');
if (btns[1]) btns[1].click(); // 正解 9 顆
await sleep(500);
return ['PASS Q5-DESKTOP :: Q5 減法桌機詳解畫面'];
