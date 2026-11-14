/**
 * tools/verify_n312.js
 * 驗證 G3-N-3-12 長度（毫米） 資料契約與數學真值
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/units/G3/N-3-12.json');
if (!fs.existsSync(jsonPath)) {
  console.error('FAIL: N-3-12.json does not exist');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let errors = [];

// 1. 基本結構
if (data.code !== 'N-3-12') errors.push(`code should be N-3-12, got ${data.code}`);
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
  if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${prefix} choices should have exactly 4 items`);
  if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index >= 4) {
    errors.push(`${prefix} answer_index invalid: ${q.answer_index}`);
  }
  if (!q.answer_raw) errors.push(`${prefix} missing answer_raw`);
  if (q.choices && q.choices[q.answer_index] !== q.answer_raw) {
    errors.push(`${prefix} choices[answer_index] ('${q.choices[q.answer_index]}') !== answer_raw ('${q.answer_raw}')`);
  }
  if (!q.component_path || !q.component_path.includes('millimeter_ruler_lab.html')) {
    errors.push(`${prefix} component_path invalid: ${q.component_path}`);
  }
  if (!q.explanation || !q.explanation.concept || !q.explanation.steps || !q.explanation.trap) {
    errors.push(`${prefix} missing explanation fields (concept, steps, trap)`);
  }
});

// 3. 數學真值校驗
// Q1: 數學課本的厚度（約 8 毫米）
if (data.questions[0].answer_index !== 1) errors.push('Q01 answer_index should be 1');
// Q2: 1 公分等於 10 毫米，70 毫米也就是 7 公分
if (data.questions[1].answer_index !== 1) errors.push('Q02 answer_index should be 1');
// Q3: 86 毫米 = 8 公分 6 毫米
if (data.questions[2].answer_index !== 0) errors.push('Q03 answer_index should be 0');
// Q4: 6 公分 3 毫米 = 63 毫米
if (data.questions[3].answer_index !== 1) errors.push('Q04 answer_index should be 1');
// Q5: 4 公分 7 毫米（也就是 47 毫米）
if (data.questions[4].answer_index !== 0) errors.push('Q05 answer_index should be 0');
// Q6: 8cm 4mm - 3cm = 5cm 4mm
if (data.questions[5].answer_index !== 2) errors.push('Q06 answer_index should be 2');
// Q7: 6 公分 7 毫米 ＞ 60 毫米
if (data.questions[6].answer_index !== 2) errors.push('Q07 answer_index should be 2');
// Q8: 69 毫米 ＋ 8 公分 5 毫米 ＝ 15 公分 4 毫米
if (data.questions[7].answer_index !== 1) errors.push('Q08 answer_index should be 1');
// Q9: 9 公分 3 毫米 － 1 公分 5 毫米 ＝ 7 公分 8 毫米
if (data.questions[8].answer_index !== 1) errors.push('Q09 answer_index should be 1');
// Q10: 32 - 13 = 19 毫米 = 1 公分 9 毫米
if (data.questions[9].answer_index !== 0) errors.push('Q10 answer_index should be 0');

if (errors.length > 0) {
  console.error('FAIL: verify_n312 found errors:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log('PASS: G3-N-3-12 (長度「毫米」) 資料契約與 10 題數學真值全綠通過！');
  process.exit(0);
}
