// tests/ac_unit_n12.js - 驗證 N-1-2 比較型減法題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(300);

// 1. 檢查題幹
const stem = document.getElementById('questionStem').textContent;
rec('U12-01', stem.includes('紅蘋果'), '題幹成功載入蘋果題=' + stem.substring(0, 15));

// 2. 檢查雙軌教具掛載與數值
const comp = document.getElementById('diffComponent');
const upgraded = comp && comp.shadowRoot !== null;
rec('U12-02', upgraded && comp.getAttribute('top-count') === '8', '雙軌教具成功升級且 top-count=8');

// 3. 檢查 2x2 選項
const btns = document.querySelectorAll('.choice-btn');
rec('U12-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 2 個，index 1 -> 3顆)
btns[1].click();
await sleep(300);

// 5. 檢查詳解展開與公式
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const formula = document.getElementById('formulaTag').textContent;
rec('U12-04', drawerOpen && formula === '8 - 5 = 3', '答題後詳解展開且公式為 8 - 5 = 3');

// 6. 檢查無外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('U12-05', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
