// tests/ac_unit_n13.js - 驗證 N-1-3 正式單元題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(300);

// 1. 檢查題幹
const stem = document.getElementById('questionStem').textContent;
rec('U13-01', stem.includes('牛奶糖'), '題幹成功載入牛奶糖題=' + stem.substring(0, 15));

// 2. 檢查幽靈題源字
const src = document.getElementById('questionSource').textContent;
rec('U13-02', src.includes('段考真題'), '11px 題源顯示正常=' + src);

// 3. 檢查 2x2 選項
const btns = document.querySelectorAll('.choice-btn');
rec('U13-03', btns.length === 4, '選項按鈕數為 4=' + btns.length);

// 4. 檢查十格陣升級與初值
const fL = document.getElementById('frameLeft');
const fR = document.getElementById('frameRight');
const lUp = fL && fL.shadowRoot !== null;
const rUp = fR && fR.shadowRoot !== null;
rec('U13-04', lUp && rUp && fL.value === 9 && fR.value === 4, '十格陣升級且初始值為 9 與 4');

// 5. 點選第 2 個選項 (index 1 -> 13顆)
btns[1].click();
await sleep(400);

// 6. 檢查破招詳解是否展開
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const s3 = document.getElementById('step3').textContent;
rec('U13-05', drawerOpen && s3.includes('9 ＋ 1 ＝ 10'), '答題後詳解展開且分解樹正確');

// 7. 檢查無外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('U13-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
