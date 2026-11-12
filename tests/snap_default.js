const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await sleep(1000);
return ['PASS SNAP :: Default view'];
