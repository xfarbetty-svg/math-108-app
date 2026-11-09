// tests/ac_unit_r11.js - 驗證 R-1-1 算式與符號題卡頁面
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(300);

// 1. 檢查題幹
const stem = document.getElementById('questionStem').textContent;
rec('UR11-01', stem.includes('天平'), '題幹成功載入天平題=' + stem.substring(0, 15));

// 2. 檢查天平教具掛載與初值
const beam = document.getElementById('beamComponent');
const upgraded = beam && beam.shadowRoot !== null;
rec('UR11-02', upgraded && beam.getAttribute('left-weight') === '5', '天平成功升級且 left-weight=5');

// 3. 檢查 2x2 選項
const btns = document.querySelectorAll('.choice-btn');
rec('UR11-03', btns.length === 4, '選項個數為 4=' + btns.length);

// 4. 點選正確答案 (第 2 個，index 1 -> 3個)
btns[1].click();
await sleep(300);

// 5. 檢查詳解展開與天平配平聯動
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const formula = document.getElementById('formulaTag').textContent;
const rightW = beam.getAttribute('right-weight');
rec('UR11-04', drawerOpen && formula === '5 = 2 + 3' && rightW === '5', '答對後天平右側自動配平為 5 且公式正確');

// 6. 檢查無外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('UR11-05', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
