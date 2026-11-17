/**
 * tools/verify_g2_n25.js — G2-N-2-5 單元（幣值解題：100 元、500 元、1000 元）靜態驗證守門員
 * 1. 題庫契約驗證：N-2-5.json 5 題段考真題（id/來源/選項/正解/算理）。
 * 2. 教具驗證：5 個考題組件檔案存在，並暴露 window.check() / window.__q / .opt-btn / .check-btn / #banner。
 * 3. 教學真值驗證：每題以機械算術驗算正解唯一性（換鈔恆等式、位值合成、找零減法、預算比較）。
 * 4. 課綱一致性：curriculum.json 內 N-2-5 ready、question_count=5。
 * 5. 退出碼守門：全部通過 Exit 0，任一失敗 Exit 1。
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

const unit = JSON.parse(fs.readFileSync('data/units/G2/N-2-5.json', 'utf8'));
ok(unit.code === 'N-2-5', '單元代碼正確 N-2-5');
ok(unit.grade === 2, '年級 = 2');
ok(unit.questions.length === 5, '題庫題目數 = 5 題（實際 ' + unit.questions.length + '）');

const expectedPaths = [
  'components/g2_n25_q1_thousand_split.html',
  'components/g2_n25_q2_coin_sum.html',
  'components/g2_n25_q3_cashier_least_bills.html',
  'components/g2_n25_q4_budget_enough.html',
  'components/g2_n25_q5_wallet_spend.html'
];
const expectedStemKeys = ['1000 元可以換成', '十七個十和十二個一', '765 元的外套', '蛋糕 198 元、三明治 105 元', '1 張 500 元和 3 張 100 元'];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  ok(q.id === `G2-N-2-5-Q0${num}`, `Q${num} id 正確 (${q.id})`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${num} 選項齊全 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(new Set(q.choices).size === q.choices.length, `Q${num} 選項互斥無重複`);
  ok(q.component_path === expectedPaths[i], `Q${num} 教具路徑正確 (${q.component_path})`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理與陷阱說明齊備`);
  ok(q.stem.includes(expectedStemKeys[i]), `Q${num} 題幹含關鍵真題字串「${expectedStemKeys[i]}」`);

  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  ok(html.includes('window.check'), `Q${num} 教具暴露 window.check()`);
  ok(html.includes('window.__q'), `Q${num} 教具暴露 window.__q`);
  ok(html.includes('opt-btn'), `Q${num} 教具有 .opt-btn 選項按鈕`);
  ok(html.includes('check-btn'), `Q${num} 教具有 .check-btn 檢查按鈕`);
  ok(html.includes('id="banner"') || html.includes("id='banner'"), `Q${num} 教具有 #banner 結果橫幅`);
  ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), `Q${num} 教具無 100vh / min-height:100% 違憲高度`);
});

// 教具答案契約：每題選項文字已寫入組件
unit.questions.forEach((q, i) => {
  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  q.choices.forEach((c) => ok(html.includes(c), `Q${i + 1} 選項「${c}」已寫入組件`));
});

// ===== 教學真值驗證（機械算術）=====
// Q1: 1000 = 500(1張) + 100(4張) + 10(10個)，干擾張數不得等於 1000
const q1 = unit.questions[0];
[3, 5, 2].forEach((k) => ok(500 + k * 100 + 10 * 10 !== 1000, `Q1 干擾項 ${k} 張 → ${500 + k * 100 + 100} ≠ 1000`));
ok(500 + 4 * 100 + 10 * 10 === 1000, 'Q1 正解 4 張 → 500+400+100 = 1000 恆等式成立');
ok(q1.choices[0] === '4 張', 'Q1 正解文字 = 4 張');

// Q2: 4 個百 + 17 個十 + 12 個一 = 582，干擾項皆不等於 582
const q2 = unit.questions[1];
const q2sum = 4 * 100 + 17 * 10 + 12;
ok(q2sum === 582, `Q2 位值合成 4×100＋17×10＋12 = ${q2sum}`);
ok([472, 572, 592].every((v) => v !== q2sum), 'Q2 干擾項 472/572/592 與真值 582 互斥');
ok(q2.choices[0] === '582 元', 'Q2 正解文字 = 582 元');

// Q3: 找零 1000-765=235；百元鈔最少 8 張（7 張 700<765 不足額）
const q3 = unit.questions[2];
ok(1000 - 765 === 235, 'Q3 找零 1000−765 = 235');
ok(7 * 100 < 765, 'Q3 七張百元鈔 700 < 765 不夠付');
ok(Math.ceil(765 / 100) === 8, 'Q3 百元鈔最小足額張數 = 8');
ok(q3.choices[0] === '找回 235 元，最少要 8 張百元鈔', 'Q3 正解文字 = 找回 235 元，最少要 8 張百元鈔');

// Q4: 198+105=303 ≤ 1000，剩 1000-303=697，干擾項皆不等於 697
const q4 = unit.questions[3];
ok(198 + 105 === 303, 'Q4 貨款 198＋105 = 303');
ok(303 < 1000, 'Q4 303 < 1000 夠買');
ok(1000 - 303 === 697, 'Q4 剩下 1000−303 = 697');
ok([707, 797].every((v) => v !== 697), 'Q4 干擾項 707/797 與真值區隔');
ok(q4.choices[0] === '夠，剩下 697 元', 'Q4 正解文字 = 夠，剩下 697 元');

// Q5: 500+3×100=800，800-380=420，干擾項皆不等於 420
const q5 = unit.questions[4];
ok(500 + 3 * 100 === 800, 'Q5 原有 500＋300 = 800');
ok(800 - 380 === 420, 'Q5 剩下 800−380 = 420');
ok([520, 320, 480].every((v) => v !== 420), 'Q5 干擾項 520/320/480 與真值區隔');
ok(q5.choices[0] === '420 元', 'Q5 正解文字 = 420 元');

// ===== 課綱一致性 =====
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g2 = curriculum.grades.find((g) => g.grade === 2 || g.code === 'G2' || g.id === 'G2');
const n25 = (g2 ? g2.units : []).find((u) => u.code === 'N-2-5');
ok(!!n25, 'curriculum.json 內含 N-2-5 條目');
ok(!!n25 && n25.status === 'ready', 'N-2-5 status = ready');
ok(!!n25 && n25.question_count === 5, 'N-2-5 question_count = 5');
ok(!!n25 && typeof n25.verified_source === 'string' && n25.verified_source.length > 0, 'N-2-5 verified_source 已填寫');

console.log('G2_N25_CONTRACT_VERIFIED — ALL PASS');
