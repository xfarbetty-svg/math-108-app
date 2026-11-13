// tests/ac_unit_n13_master.js - 驗收 N-1-3 真實 5 題單元
const out = [];
const rec = (id, pass, info) => out.push((pass ? 'PASS ' : 'FAIL ') + id + ' :: ' + info);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(500);

// 1. 檢查 5 顆圓點進度條 (不多不少，只認真實 5 題)
const dots = document.querySelectorAll('.dot-item');
rec('M13-01', dots.length === 5, '真實 5 顆圓點生成=' + dots.length);

// 2. 檢查 Q1 內湖公車真題
const stem1 = document.getElementById('questionStem').textContent;
const src1 = document.getElementById('questionSource').textContent;
rec('M13-02', stem1.includes('公車裡原本有 21 個人'), 'Q1 題幹為內湖公車真題=' + stem1.substring(0, 15));
rec('M13-03', src1.includes('內湖'), 'Q1 出處為真實內湖國小=' + src1);

// 3. 檢查雙十格陣升級與初值
const fL = document.getElementById('frameLeft');
const fR = document.getElementById('frameRight');
rec('M13-04', fL && fR && fL.shadowRoot && fR.shadowRoot, '雙十格陣成功升級為 Web Component');

// 4. 點選正確答案 (index 2 -> 14 人)
const btns = document.querySelectorAll('.choice-btn');
rec('M13-05', btns.length === 4, '選項按鈕為 4 個');
btns[2].click();
await sleep(400);

// 5. 檢查詳解展開與算理分解
const drawerOpen = document.getElementById('explDrawer').classList.contains('open');
const s3 = document.getElementById('step3').textContent;
rec('M13-06', drawerOpen && s3.includes('14 個人'), 'Q1 詳解展開且分解步驟正確');

// 6. 點擊下一題按鈕切換到 Q2 (內湖存錢筒 42+8=50)
const btnNext = document.getElementById('btnNext');
if (btnNext) btnNext.click();
await sleep(300);
const stem2 = document.getElementById('questionStem').textContent;
rec('M13-07', stem2.includes('存錢筒裡原有 42 元'), '切換至 Q2 存錢筒真題=' + stem2.substring(0, 15));

// 7. 跳至 Q3 忠孝國小樹上小鳥題 (6+3=9)
if (dots[2]) dots[2].click();
await sleep(300);
const stem3 = document.getElementById('questionStem').textContent;
const src3 = document.getElementById('questionSource').textContent;
rec('M13-08', stem3.includes('樹上原來有 6 隻鳥'), 'Q3 為忠孝國小真題=' + stem3.substring(0, 15));
rec('M13-09', src3.includes('忠孝'), 'Q3 出處為真實忠孝國小=' + src3);

// 8. 檢查零外部依賴
const ext = Array.from(document.querySelectorAll('script[src],link[href],img[src]'))
  .map(n => n.src || n.href)
  .filter(u => /^https?:/i.test(u));
rec('M13-10', ext.length === 0, '零外部依賴 external=' + ext.length);

return out;
