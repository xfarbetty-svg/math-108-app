// tests/ac_unit_d11.js - 驗證 D-1-1 統計與分類 (分類抽屜與正字計數台) 題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(350);

// 1. 檢查題幹
const stem = document.getElementById('q-stem').textContent;
rec('UN-D11-01', stem.includes('散落著很多不同形狀') || stem.includes('分類裝進不同抽屜'), '題幹成功載入分類不重不漏題=' + stem.substring(0, 15));

// 2. 檢查分類教具元件掛載
const sorter = document.getElementById('sorter');
const upgraded = sorter && sorter.shadowRoot !== null;
const state = sorter ? sorter.getState() : null;
rec('UN-D11-02', upgraded && state && state.currentView === 'tally', '分類計數台升級且初始視圖 tally');

// 3. 檢查 2x2 選項個數
const btns = document.querySelectorAll('.choice-btn');
rec('UN-D11-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 依照形狀分類裝進不同抽屜)
btns[0].click();
await sleep(400);

// 5. 檢查詳解展開與破招口訣
const expCard = document.getElementById('exp-card');
const expFormula = document.getElementById('exp-formula').textContent;
const stateAfter = sorter.getState();
rec('UN-D11-04', expCard.classList.contains('active') && expFormula.includes('分類入庫 ＋ 逐一歸納 ＝ 不重不漏') && stateAfter.sorted === true, '答對後詳解展開且自動全分類完畢');

// 6. 點擊下一題，測試第 2 題（正字 5 劃五進位）
const btnNext = document.getElementById('btn-next');
btnNext.click();
await sleep(350);
const stem2 = document.getElementById('q-stem').textContent;
const state2 = sorter.getState();
rec('UN-D11-05', stem2.includes('完整的「正」字') && state2.totals['圓形'] === 5, '第 2 題載入圓形 5 個正字劃記');

// 7. 檢查零外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN-D11-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
