/**
 * tools/verify_g3_contract_240.js — G3 全 24 單元題庫契約硬閘門
 * 檔名為歷史沿用；題數以 data/curriculum.json 的 question_count 為 SSOT dynamic 推導。
 * 現況：23 單元 × 10 題 + S-3-4 × 4 題＝234 題（4～10 題彈性真題規範）。
 * 檢查：題數與課綱宣告一致、4 選項、answer_raw 與 choices[answer_index] 一致、教具實體檔存在、id 與題幹完整。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const U = path.join(ROOT, 'data/units/G3');
const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const g3 = curriculum.grades.find((g) => g.grade === 3);
if (!g3) { console.error('FAIL: curriculum 缺 grade 3'); process.exit(1); }
const errors = [];
const files = fs.readdirSync(U).filter((f) => /\.json$/i.test(f)).sort();
if (files.length !== 24) errors.push('G3 題庫檔數應為 24，實際 ' + files.length);
let total = 0;
let choiceTotal = 0;
for (const file of files) {
  const code = file.replace(/\.json$/i, '');
  const data = JSON.parse(fs.readFileSync(path.join(U, file), 'utf8'));
  const declared = (g3.units.find((u) => u.code === code) || {}).question_count;
  const qs = Array.isArray(data.questions) ? data.questions : [];
  total += qs.length;
  if (!Number.isInteger(declared) || declared < 4 || declared > 10 ||
      data.question_count !== declared || qs.length !== declared) {
    errors.push(code + ' 題數不一致：課綱宣告=' + declared + ' JSON=' + data.question_count + ' 實際=' + qs.length);
  }
  qs.forEach((q, i) => {
    const tag = code + '-Q' + String(i + 1).padStart(2, '0');
    if (q.id !== 'G3-' + tag) errors.push(tag + ' id 錯誤：' + q.id);
    if (!q.stem || !q.stem.trim()) errors.push(tag + ' 缺 stem');
    if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(tag + ' 選項數不等於 4');
    else choiceTotal++;
    if (!Number.isInteger(q.answer_index) || q.answer_index < 0 || q.answer_index > 3) errors.push(tag + ' answer_index 越界');
    else if (q.choices[q.answer_index] !== q.answer_raw) errors.push(tag + ' 答案不一致：' + q.choices[q.answer_index] + ' ≠ ' + q.answer_raw);
    const cp = typeof q.component_path === 'string' ? q.component_path.split('?')[0] : '';
    const abs = path.join(ROOT, 'app', cp);
    if (!cp || !fs.existsSync(abs)) errors.push(tag + ' 教具缺件：' + q.component_path);
  });
}
const expectedTotal = g3.units.reduce((sum, u) => sum + (u.question_count || 0), 0);
if (total !== expectedTotal) errors.push('總題數應為 ' + expectedTotal + '（課綱 SSOT），實際 ' + total);
if (choiceTotal !== expectedTotal) errors.push('4 選項題數應為 ' + expectedTotal + '，實際 ' + choiceTotal);
if (errors.length) {
  console.error('FAIL verify_g3_contract_240：');
  errors.slice(0, 40).forEach((e) => console.error(' - ' + e));
  console.error(' 錯誤總數：' + errors.length);
  process.exit(1);
}
console.log('PASS: G3 24 單元 / ' + total + ' 題 / ' + choiceTotal + ' 題四選項 / 零答案不一致 / 零教具缺件');
process.exit(0);
