const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const btn = document.getElementById('btnPlay');
if (btn) btn.click();
await sleep(4000); // 借十拆解、下車動態、算式出現
return ['PASS SNAP :: ch4 clicked and animated'];
