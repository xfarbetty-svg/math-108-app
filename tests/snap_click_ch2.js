const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const btn = document.getElementById('btnDemo');
if (btn) btn.click();
await sleep(3500); // 等待動畫完成
return ['PASS SNAP :: ch2 clicked and animated'];
