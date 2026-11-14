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

  // 檢查選項文字是否受到 ① ② 污染
  q.choices.forEach((c, cIdx) => {
    if (c.startsWith('①') || c.startsWith('②') || c.startsWith('③') || c.startsWith('④')) {
      errors.push(`${prefix} choice ${cIdx} has number badge prefix: ${c}`);
    }
  });
});

// 檢查答案是否全部相同（防止死鎖）
const ansSet = new Set(data.questions.map(q => q.answer_index));
if (ansSet.size < 3) {
  errors.push(`answer_index diversity too low (only ${ansSet.size} unique options across 10 questions)`);
}

// 數學真值驗算
// Q3: 每一大格代表 5 個單位
const q3 = data.questions[2];
if (q3.choices[q3.answer_index] !== '5 個單位') errors.push('Q3 math check failed');

// Q4: 每一小格代表 1
const q4 = data.questions[3];
if (q4.choices[q4.answer_index] !== '1') errors.push('Q4 math check failed');

// Q5: 甲是 300，乙是 600
const q5 = data.questions[4];
if (!q5.choices[q5.answer_index].includes('300') || !q5.choices[q5.answer_index].includes('600')) errors.push('Q5 math check failed');

// Q6: 15 + 3 = 18
const q6 = data.questions[5];
if (q6.choices[q6.answer_index] !== '18') errors.push('Q6 math check failed');

// Q7: 31 - 24 = 7
const q7 = data.questions[6];
if (q7.choices[q7.answer_index] !== '7 個單位長') errors.push('Q7 math check failed');

// Q8: 18 + 9 = 27
const q8 = data.questions[7];
if (q8.choices[q8.answer_index] !== '27') errors.push('Q8 math check failed');

// Q9: 45 - 12 = 33
const q9 = data.questions[8];
if (q9.choices[q9.answer_index] !== '33') errors.push('Q9 math check failed');

// Q10: 250在200與300正中，480接近500
const q10 = data.questions[9];
if (!q10.choices[q10.answer_index].includes('正中間') || !q10.choices[q10.answer_index].includes('480')) errors.push('Q10 math check failed');

if (errors.length > 0) {
  console.error('FAIL: verify_n311 errors:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
}

console.log('SUCCESS: verify_n311 all 10 questions passed mathematical and schema verification! (Exit Code 0)');
process.exit(0);
