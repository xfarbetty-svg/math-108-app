// tests/ac_unit_s11.js - 驗證 S-1-1 幾何形體旋轉投影儀題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(350);

// 1. 檢查題幹
const stem = document.getElementById('questionStem').textContent;
rec('UN-S11-01', stem.includes('轉了 45 度') || stem.includes('正方形'), '題幹成功載入旋轉破招題=' + stem.substring(0, 15));

// 2. 檢查旋轉教具元件掛載與初始值
const rot = document.getElementById('rotatorComponent');
const upgraded = rot && rot.shadowRoot !== null;
const shape = rot.getAttribute('shape');
const angle = rot.getAttribute('angle');
rec('UN-S11-02', upgraded && shape === 'square' && angle === '45', '投影儀升級且初始值 shape=' + shape + ' angle=' + angle);

// 3. 檢查 2x2 選項個數
const btns = document.querySelectorAll('.choice-btn');
rec('UN-S11-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 1 個，index 0 -> 依然是正方形)
btns[0].click();
await sleep(300);

// 5. 檢查詳解展開與破招口訣
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const formula = document.getElementById('formulaTag').textContent;
rec('UN-S11-04', drawerOpen && formula.includes('4 個直角 ＋ 4 條等邊 ＝ 正方形'), '答對後詳解展開且破招口訣正確');

// 6. 點擊下一題，測試第 2 題（圓柱拓印展開）
const btnNext = document.getElementById('btnNext');
btnNext.click();
await sleep(300);
const stem2 = document.getElementById('questionStem').textContent;
const shape2 = rot.getAttribute('shape');
rec('UN-S11-05', stem2.includes('圓柱體') && shape2 === 'cylinder-unfold', '成功切換至第 2 題圓柱拓印展開 shape=' + shape2);

// 7. 檢查無外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UN-S11-06', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
