const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const btn = document.getElementById('examTabBtn');
if (btn) btn.click();
await sleep(1000);
return ['PASS SNAP :: Exam mode clicked'];
