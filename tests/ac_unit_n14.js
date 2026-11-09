// tests/ac_unit_n14.js - 驗證 N-1-4 解題 (毛玻璃遮罩數線反推儀) 題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(350);

// 1. 檢查題幹
const stem = document.getElementById('q-stem').textContent;
rec('UN-N14-01', stem.includes('(　) ＋ 5 ＝ 12') || stem.includes('逆向反推'), '題幹成功載入數線反推破招題=' + stem.substring(0, 15));

// 2. 檢查數線教具元件掛載
const numline = document.getElementById('numline');
const upgraded = numline && numline.shadowRoot !== null;
const state = numline ? numline.getState() : null;
rec('UN-N14-02', upgraded && state && state.status === 'MASKED', '毛玻璃數線升級且初始狀態 MASKED');

// 3. 檢查 2x2 選項個數
const btns = document.querySelectorAll('.choice-btn');
rec('UN-N14-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 12 - 5 = 7)
btns[0].click();
await sleep(600);

// 5. 檢查詳解展開與破招口訣
const expCard = document.getElementById('exp-card');
const expFormula = document.getElementById('exp-formula').textContent;
const stateAfter = numline.getState();
rec('UN-N14-04', expCard.classList.contains('active') && expFormula.includes('終點 12 － 跨越 5 ＝ 起點 7') && stateAfter.revealed === true, '答對後詳解展開且數線揭曉起點 7');

// 6. 點擊下一題，測試第 2 題（公車上車情境）
const btnNext = document.getElementById('btn-next');
btnNext.click();
await sleep(350);
const stem2 = document.getElementById('q-stem').textContent;
const state2 = numline.getState();
rec('UN-N14-05', stem2.includes('公車上') && state2.end === 11 && state2.jump === 4, '第 2 題載入公車情境 end=11, jump=4');

// 7. 檢查零外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN-N14-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
