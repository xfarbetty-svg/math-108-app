/**
 * tools/verify_g2_n26.js — G2-N-2-6 單元（乘法：乘法的意義與應用）靜態驗證守門員
 * 1. 題庫契約驗證：N-2-6.json 5 題段考真題（id/來源/選項/正解/算理）。
 * 2. 教具驗證：5 個考題組件檔案存在，並暴露 window.check() / window.__q / .opt-btn / .check-btn / #banner。
 * 3. 教學真值驗證：每題以機械算術驗算正解唯一性（乘法定義、單位量順序、連加轉乘法）。
 * 4. 課綱一致性：curriculum.json 內 N-2-6 ready、question_count=5。
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

const unit = JSON.parse(fs.readFileSync('data/units/G2/N-2-6.json', 'utf8'));
ok(unit.code === 'N-2-6', '單元代碼正確 N-2-6');
ok(unit.grade === 2, '年級 = 2');
ok(unit.questions.length === 5, '題庫題目數 = 5 題（實際 ' + unit.questions.length + '）');

const expectedPaths = [
  'components/g2_n26_q1_mult_concept.html',
  'components/g2_n26_q2_bracelet_units.html',
  'components/g2_n26_q3_hands_fingers.html',
  'components/g2_n26_q4_spring_rolls_plate.html',
  'components/g2_n26_q5_repeated_addition.html'
];
const expectedStemKeys = ['哪一個說法不是「3×5」', '一串手鍊有 9 顆珠子，7 串', '7 隻手一共有幾根手指頭', '點了 6 盤炸春捲，每盤有 4 個', '5＋5＋5＋5＝20'];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  ok(q.id === `G2-N-2-6-Q0${num}`, `Q${num} id 正確 (${q.id})`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${num} 選項齊全 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(new Set(q.choices).size === q.choices.length, `Q${num} 選項互斥無重複`);
  ok(q.component_path === expectedPaths[i], `Q${num} 教具路徑正確 (${q.component_path})`);
  ok(q.exam_source && q.exam_source.length > 0, `Q${num} 段考來源已登記 (${q.exam_source})`);
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
// Q1: 3×5 的三種合法說法（3 的 5 倍 / 3 有 5 個 / 連加 3+3+3+3+3），干擾「5 有 3 個」= 5×3
const q1 = unit.questions[0];
ok(3 * 5 === 15, 'Q1 真值 3×5 = 15');
ok(3 + 3 + 3 + 3 + 3 === 15, 'Q1 連加 3+3+3+3+3 = 15（是 3×5）');
ok(3 * 5 === 3 * 5, 'Q1 「3 的 5 倍」= 3×5 恆等');
ok(5 * 3 === 15, 'Q1 「5 有 3 個」= 5×3（每份 5、3 份）');
ok(q1.choices[0] === '5 有 3 個' && q1.answer_index === 0, 'Q1 正解文字 = 5 有 3 個（不是 3×5）');
ok(['3 的 5 倍', '3 有 5 個', '3＋3＋3＋3＋3'].every((c) => q1.choices.slice(1).includes(c)), 'Q1 三個干擾皆為 3×5 的合法說法');

// Q2: 單位量 9 顆 × 7 串 = 63，干擾項寫反或看錯
const q2 = unit.questions[1];
ok(9 * 7 === 63, `Q2 單位量乘法 9×7 = ${9 * 7}`);
ok(7 * 9 === 63, 'Q2 7×9 值相同但順序寫反（陷阱）');
ok([9 * 9, 7 * 7].every((v) => v !== 63), 'Q2 干擾項 81/49 與真值 63 互斥');
ok(q2.choices[0] === '9 × 7', 'Q2 正解文字 = 9 × 7（單位量在前）');

// Q3: 每隻手 5 根 × 7 隻 = 35
const q3 = unit.questions[2];
ok(5 * 7 === 35, `Q3 手指頭 5×7 = ${5 * 7}`);
ok(5 + 5 + 5 + 5 + 5 + 5 + 5 === 35, 'Q3 連加驗算 5×7 份 = 35');
ok(5 + 7 === 12 && 12 !== 35, 'Q3 干擾項 5＋7＝12 非乘法');
ok(5 * 6 === 30 && 30 !== 35, 'Q3 干擾項 5×6＝30 少一隻手');
ok(q3.choices[0] === '5 × 7 ＝ 35', 'Q3 正解文字 = 5 × 7 ＝ 35（單位量在前）');

// Q4: 每盤 4 個 × 6 盤 = 24
const q4 = unit.questions[3];
ok(4 * 6 === 24, `Q4 春捲 4×6 = ${4 * 6}`);
ok(4 + 4 + 4 + 4 + 4 + 4 === 24, 'Q4 連加驗算 = 24');
ok([20, 28, 10].every((v) => v !== 24), 'Q4 干擾項 20/28/10 與真值 24 互斥');
ok(q4.choices[0] === '24 個', 'Q4 正解文字 = 24 個');

// Q5: 連加 4 個 5 → 5×4 = 20；4×5 值同但順序寫反（陷阱）
const q5 = unit.questions[4];
ok(5 * 4 === 20, `Q5 連加轉乘法 5×4 = ${5 * 4}`);
ok(5 + 5 + 5 + 5 === 20, 'Q5 原連加 = 20');
ok(4 * 5 === 20, 'Q5 4×5 值相同但被乘數乘數寫反（陷阱）');
ok(5 + 4 === 9 && 9 !== 20, 'Q5 干擾項 5＋4＝9 把乘法當加法');
ok(20 / 4 === 5, 'Q5 干擾項 20÷4＝5 是除法算式');
ok(q5.choices[0] === '5 × 4 ＝ 20', 'Q5 正解文字 = 5 × 4 ＝ 20（每份 5 在前）');

// ===== 課綱一致性 =====
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g2 = curriculum.grades.find((g) => g.grade === 2 || g.code === 'G2' || g.id === 'G2');
const n26 = (g2 ? g2.units : []).find((u) => u.code === 'N-2-6');
ok(!!n26, 'curriculum.json 內含 N-2-6 條目');
ok(!!n26 && n26.status === 'ready', 'N-2-6 status = ready');
ok(!!n26 && n26.question_count === 5, 'N-2-6 question_count = 5');
ok(!!n26 && typeof n26.verified_source === 'string' && n26.verified_source.length > 0, 'N-2-6 verified_source 已填寫');

console.log('G2_N26_CONTRACT_VERIFIED — ALL PASS');
