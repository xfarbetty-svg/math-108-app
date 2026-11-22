/**
 * tools/verify_n317.js
 * 驗證 G3-N-3-17 時間（「日」、「時」、「分」、「秒」） 資料契約與數學真值
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/units/G3/N-3-17.json');
if (!fs.existsSync(jsonPath)) {
  console.error('FAIL: N-3-17.json does not exist');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let errors = [];

// 1. 基本結構（真題 5 題，SSOT）
if (data.code !== 'N-3-17') errors.push(`code should be N-3-17, got ${data.code}`);
if (data.grade !== 3) errors.push(`grade should be 3, got ${data.grade}`);
if (!data.questions || data.questions.length !== 5) {
  errors.push(`questions length should be 5, got ${data.questions ? data.questions.length : 0}`);
}
if (!data.verified_source || !data.verified_source.includes('段考')) {
  errors.push('missing verified_source from real exam paper');
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
  if (!q.component_path || !q.component_path.includes('time_concept_lab.html')) {
    errors.push(`${prefix} component_path invalid: ${q.component_path}`);
  }
  if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps) || q.explanation.steps.length === 0) {
    errors.push(`${prefix} missing explanation fields`);
  }
});

// 3. 數學真值校驗（SSOT 答案索引 1/0/1/2/1）
const ANSWERS = [1, 0, 1, 2, 1];
const RAW = ['60秒 (1分鐘)', '下午 3 時 40 分', '45 分鐘', '54 小時', '下午 1:00'];
ANSWERS.forEach((ans, i) => {
  if (data.questions[i].answer_index !== ans) {
    errors.push(`Q0${i + 1} answer_index should be ${ans}, got ${data.questions[i].answer_index}`);
  }
  if (data.questions[i].answer_raw !== RAW[i]) {
    errors.push(`Q0${i + 1} answer_raw should be ${RAW[i]}, got ${data.questions[i].answer_raw}`);
  }
});

if (errors.length > 0) {
  console.error('FAIL: verify_n317 errors:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log('PASS: G3-N-3-17 (時間「日、時、分、秒」) 資料契約與 5 題數學真值全綠通過！');
  process.exit(0);
}
