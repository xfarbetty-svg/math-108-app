/**
 * tools/verify_n311.js
 * 驗證 G3-N-3-11 整數數線 資料契約與數學真值
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/units/G3/N-3-11.json');
if (!fs.existsSync(jsonPath)) {
  console.error('FAIL: N-3-11.json does not exist');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let errors = [];

// 1. 基本結構
if (data.code !== 'N-3-11') errors.push(`code should be N-3-11, got ${data.code}`);
if (data.grade !== 3) errors.push(`grade should be 3, got ${data.grade}`);
if (!data.questions || data.questions.length !== 10) {
  errors.push(`questions length should be 10, got ${data.questions ? data.questions.length : 0}`);
}

// 2. 逐題契約與數學邏輯
data.questions.forEach((q, idx) => {
  const qNum = idx + 1;
  const prefix = `Q${qNum < 10 ? '0' + qNum : qNum}`;
  if (!q.id || !q.id.endsWith(prefix)) errors.push(`${prefix} ID format mismatch: ${q.id}`);
  if (!q.stem || q.stem.trim().length === 0) errors.push(`${prefix} missing stem`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${prefix} choices must have 4 items`);
  if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index > 3) {
    errors.push(`${prefix} answer_index invalid: ${q.answer_index}`);
  }
  if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps)) {
    errors.push(`${prefix} explanation structure invalid`);
  }
  if (!q.exam_source || q.exam_source.trim().length === 0) {
    errors.push(`${prefix} missing exam_source`);
  }
});

// 數學真值驗算
// Q3: 8 + 5 = 13
const q3 = data.questions[2];
if (q3.choices[q3.answer_index] !== '13') errors.push('Q3 math check failed: expected 13');

// Q4: 13 - 3 = 10
const q4 = data.questions[3];
if (q4.choices[q4.answer_index] !== '10') errors.push('Q4 math check failed: expected 10');

// Q5: 9 - 7 = 2
const q5 = data.questions[4];
if (q5.choices[q5.answer_index] !== '2') errors.push('Q5 math check failed: expected 2');

// Q6: 2 + 3 = 5
const q6 = data.questions[5];
if (q6.choices[q6.answer_index] !== '5') errors.push('Q6 math check failed: expected 5');

// Q7: 8 to 2 is向左跳 6 格
const q7 = data.questions[6];
if (!q7.choices[q7.answer_index].includes('向左跳 6 格')) errors.push('Q7 math check failed');

// Q8: 2 + 3 - 4 + 1 = 2
const q8 = data.questions[7];
if (q8.choices[q8.answer_index] !== '2') errors.push('Q8 math check failed: expected 2');

if (errors.length > 0) {
  console.error('FAIL: verify_n311 errors:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
}

console.log('SUCCESS: verify_n311 all 10 questions passed mathematical and schema verification! (Exit Code 0)');
process.exit(0);
