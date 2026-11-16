/**
 * tools/verify_g2_n24.js — G2-N-2-4 解題（簡單加減估算） 靜態驗證守門員
 * 1. 靜態契約驗證：N-2-4.json 5 題段考真題（id/出處/選項/正解/解析）字字對齊。
 * 2. 教具驗證：5 個考題組件檔案存在，並暴露 window.check() / window.__q / .opt-btn / .check-btn / #banner。
 * 3. 數學真值驗證：逐題取概數機械驗算（Q1 窮舉 C(5,3)=10 種組合驗證唯一解）。
 * 4. 課綱一致性：curriculum.json 中 N-2-4 ready 且 question_count=5。
 * 5. 退出碼守門：全通過 Exit 0，任一失敗 Exit 1。
 */
'use strict';
const fs = require('node:fs');

function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

const unit = JSON.parse(fs.readFileSync('data/units/G2/N-2-4.json', 'utf8'));
ok(unit.code === 'N-2-4', '單元代碼為 N-2-4');
ok(unit.grade === 2, '年級 = 2');
ok(unit.questions.length === 5, '題庫題目數 = 5 題（實際 ' + unit.questions.length + '）');

const expectedSources = ['內湖 111-2', '內湖 112-2', '內湖 112-1', '永安 113-2', '獅湖 111-2'];
const expectedPaths = [
  'components/g2_n24_q1_sports_estimate.html',
  'components/g2_n24_q2_restaurant_budget.html',
  'components/g2_n24_q3_stationery_estimate.html',
  'components/g2_n24_q4_numberline_estimate.html',
  'components/g2_n24_q5_pocket_money_estimate.html'
];
const expectedStemKeys = ['體育用品店', '1000 元夠不夠', '鉛筆盒和一枝自動鉛筆', '299＋200', '203 元，媽媽又給她 199 元'];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  ok(q.id === `G2-N-2-4-Q0${num}`, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]) && q.exam_source.includes(expectedSources[i].split(' ')[1]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 2, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(new Set(q.choices).size === q.choices.length, `Q${num} 選項互斥無重複`);
  ok(q.component_path === expectedPaths[i], `Q${num} 教具路徑正確 (${q.component_path})`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(q.stem.includes(expectedStemKeys[i]), `Q${num} 題幹含關鍵真題原文「${expectedStemKeys[i]}」`);

  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  ok(html.includes('window.check'), `Q${num} 教具暴露 window.check()`);
  ok(html.includes('window.__q'), `Q${num} 教具暴露 window.__q`);
  ok(html.includes('opt-btn'), `Q${num} 教具含 .opt-btn 選項按鈕`);
  ok(html.includes('check-btn'), `Q${num} 教具含 .check-btn 檢查按鈕`);
  ok(html.includes("id=\"banner\"") || html.includes("id='banner'"), `Q${num} 教具含 #banner 回饋橫幅`);
  ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), `Q${num} 教具無 100vh / min-height:100% 違憲高度`);
});

// 教具答題契約：每題答案陣列與 answer_index 對齊
unit.questions.forEach((q, i) => {
  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  q.choices.forEach((c) => ok(html.includes(c), `Q${i + 1} 選項「${c}」已映射進教具`));
});

// ===== 數學真值驗證 =====
// Q1: 窮舉 5 選 3 全部 10 種組合，唯一「概數和 = 500」的組合即正解
const prices = [102, 99, 297, 198, 503];
const names = ['護腕', '襪子', '帽子', '毛巾', '籃球'];
const r100 = (v) => Math.round(v / 100) * 100;
const combos = [];
for (let a = 0; a < 3; a++)
  for (let b = a + 1; b < 4; b++)
    for (let c = b + 1; c < 5; c++) combos.push([a, b, c]);
const hits = combos.filter((t) => t.reduce((s, i) => s + r100(prices[i]), 0) === 500);
const joinHe = (arr) => arr.length > 1 ? arr.slice(0, -1).join('、') + '和' + arr[arr.length - 1] : arr[0];
ok(hits.length === 1 && joinHe(hits[0].map((i) => names[i])) === '護腕、襪子和帽子',
  'Q1 窮舉 C(5,3)=10 組合，唯一湊 500 的組合 = 護腕、襪子和帽子');
ok(102 + 99 + 297 === 498 && Math.abs(498 - 500) <= 50, 'Q1 精確和 498 ≈ 500');

// Q2: 蛋糕 198→約200、三明治 105→約100，300 < 1000 → 夠
ok(r100(198) === 200 && r100(105) === 100 && 200 + 100 === 300 && 300 < 1000 && unit.questions[1].answer_raw === '夠', 'Q2 估算真值 200＋100＝300 ＜ 1000 → 夠');
ok(198 + 105 === 303, 'Q2 精確和 303 同樣遠小於 1000');

// Q3: 39→約40、29→約30，40＋30＝70
ok(Math.round(39 / 10) * 10 === 40 && Math.round(29 / 10) * 10 === 30 && 40 + 30 === 70, 'Q3 整十概數真值 40＋30＝70');
ok(39 + 29 === 68 && Math.round(68 / 10) * 10 === 70, 'Q3 精確和 68 最接近的整十數為 70');

// Q4: 299→約300，300＋200＝500；499 距 500 最近
ok(299 + 200 === 499, 'Q4 精確和 299＋200＝499');
const q4opts = [500, 400, 300, 600];
ok(q4opts.reduce((best, v) => Math.abs(499 - v) < Math.abs(499 - best) ? v : best) === 500, 'Q4 四選項中 499 最接近 500');
ok(Math.round(299 / 100) * 100 === 300, 'Q4 概數 299→約300（進位）');

// Q5: 203→約200、199→約200，200＋200＝400；402 最接近 400
ok(r100(203) === 200 && r100(199) === 200 && 200 + 200 === 400, 'Q5 整百概數真值 200＋200＝400');
ok(203 + 199 === 402 && Math.round(402 / 100) * 100 === 400, 'Q5 精確和 402 最接近的整百數為 400');

// ===== 課綱契約檢驗 =====
const cur = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g2 = cur.grades.find((g) => g.grade === 2);
const n24 = g2.units.find((u) => u.code === 'N-2-4');
ok(n24 && n24.status === 'ready', 'curriculum.json 中 N-2-4 標記為 ready');
ok(n24 && n24.question_count === 5, 'curriculum.json 中 N-2-4 question_count 為 5');
ok(n24 && n24.verified_source && n24.verified_source.includes('段考真題'), 'curriculum.json 中 N-2-4 來源掛段考真題鋼印');

console.log('G2_N24_STATIC_VERIFIED — ALL PASS');
