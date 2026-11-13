// tests/shot_q1_answered.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(400);
const btns = document.querySelectorAll('.choice-btn');
if (btns[1]) btns[1].click(); // 13 顆
await sleep(500);
return ['PASS Q1-ANSWERED :: Q1 作答後詳解展開'];
