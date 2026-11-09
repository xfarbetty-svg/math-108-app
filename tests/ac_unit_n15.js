// tests/ac_unit_n15.js - 驗證 N-1-5 長度比較 (碰壁基準牆與迴紋針卡尺鏈) 題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(350);

// 1. 檢查題幹
const stem = document.getElementById('q-stem').textContent;
rec('UN-N15-01', stem.includes('比較兩支鉛筆') || stem.includes('基準線'), '題幹成功載入長度比較破招題=' + stem.substring(0, 15));

// 2. 檢查卡尺教具元件掛載
const caliper = document.getElementById('caliper');
const upgraded = caliper && caliper.shadowRoot !== null;
const state = caliper ? caliper.getState() : null;
rec('UN-N15-02', upgraded && state && state.status === 'IDLE', '碰壁卡尺升級且初始狀態 IDLE');

// 3. 檢查 2x2 選項個數
const btns = document.querySelectorAll('.choice-btn');
rec('UN-N15-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 對齊同一個基準線)
btns[0].click();
await sleep(300);

// 5. 檢查詳解展開與破招口訣
const expCard = document.getElementById('exp-card');
const expFormula = document.getElementById('exp-formula').textContent;
rec('UN-N15-04', expCard.classList.contains('active') && expFormula.includes('起跑線對齊'), '答對後詳解展開且口訣正確');

// 6. 點擊下一題，測試第 2 題（個別單位無縫相扣）
const btnNext = document.getElementById('btn-next');
btnNext.click();
await sleep(350);
const stem2 = document.getElementById('q-stem').textContent;
const state2 = caliper.getState();
rec('UN-N15-05', stem2.includes('迴紋針') && state2.aligned === true && state2.unitCount === 3, '第 2 題載入迴紋針單位 unitCount=' + state2.unitCount);

// 7. 檢查零外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN-N15-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
