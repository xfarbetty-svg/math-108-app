// tests/ac_unit_n11.js - 驗證 N-1-1 位值盒題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(300);

// 1. 檢查題幹
const stem = document.getElementById('questionStem').textContent;
rec('UN11-01', stem.includes('橘色十條'), '題幹成功載入十條題=' + stem.substring(0, 15));

// 2. 檢查位值盒教具掛載與初值
const pvb = document.getElementById('pvbComponent');
const upgraded = pvb && pvb.shadowRoot !== null;
const val = pvb.getValue ? pvb.getValue() : null;
rec('UN11-02', upgraded && val && val.tens === 3 && val.ones === 5 && val.total === 35, '位值盒升級且初始值為 35=' + JSON.stringify(val));

// 3. 檢查 2x2 選項
const btns = document.querySelectorAll('.choice-btn');
rec('UN11-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 35)
btns[0].click();
await sleep(300);

// 5. 檢查詳解展開與公式
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const formula = document.getElementById('formulaTag').textContent;
rec('UN11-04', drawerOpen && formula === '30 + 5 = 35', '答對後詳解展開且公式正確');

// 6. 測試滿十聚合觸發
pvb.setValue(0, 9);
pvb.addOne(); // 放入第 10 顆
await sleep(400); // 等待 320ms 聚合動畫完成
const afterVal = pvb.getValue();
rec('UN11-05', afterVal.tens === 1 && afterVal.ones === 0 && afterVal.total === 10, '滿十聚合成功轉化為 1 根十條=' + JSON.stringify(afterVal));

// 7. 檢查無外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN11-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
