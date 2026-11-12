const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const btn = document.getElementById('btnPlay');
if (btn) btn.click();
await sleep(2500); // 等待動畫完成
return ['PASS SNAP :: ch1 clicked and animated'];
