// tests/ac_unit_s12.js - 驗證 S-1-2 形體操作 (堆疊與滾動) 題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(350);

// 1. 檢查題幹
const stem = document.getElementById('q-stem').textContent;
rec('UN-S12-01', stem.includes('往上疊高') || stem.includes('不容易倒'), '題幹成功載入堆疊破招題=' + stem.substring(0, 15));

// 2. 檢查物理堆疊台教具元件掛載
const bench = document.getElementById('bench');
const upgraded = bench && bench.shadowRoot !== null;
const state = bench ? bench.getState() : null;
rec('UN-S12-02', upgraded && state && state.status === 'STACK_STABLE', '物理堆疊台升級且初始狀態 STACK_STABLE');

// 3. 檢查 2x2 選項個數
const btns = document.querySelectorAll('.choice-btn');
rec('UN-S12-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 正方體)
btns[0].click();
await sleep(300);

// 5. 檢查詳解展開與破招口訣
const expCard = document.getElementById('exp-card');
const expFormula = document.getElementById('exp-formula').textContent;
rec('UN-S12-04', expCard.classList.contains('active') && expFormula.includes('平面 ＋ 平面 ＝ 穩固堆疊'), '答對後詳解展開且口訣正確');

// 6. 點擊下一題，測試第 2 題（球體底座滾落）
const btnNext = document.getElementById('btn-next');
btnNext.click();
await sleep(350);
const stem2 = document.getElementById('q-stem').textContent;
const state2 = bench.getState();
rec('UN-S12-05', stem2.includes('球體') && state2.status === 'ROLL_COLLAPSE', '第 2 題觸發球體底座滾落 ROLL_COLLAPSE');

// 7. 檢查零外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN-S12-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
