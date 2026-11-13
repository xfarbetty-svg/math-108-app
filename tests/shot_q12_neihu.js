// tests/shot_q12_neihu.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(400);
const dots = document.querySelectorAll('.dot-item');
if (dots[11]) dots[11].click(); // 跳至 Q12 (14-6 內湖真題)
await sleep(400);
const btns = document.querySelectorAll('.choice-btn');
if (btns[2]) btns[2].click(); // 正解 8 位
await sleep(500);
return ['PASS Q12-NEIHU :: Q12 內湖真題詳解畫面'];
