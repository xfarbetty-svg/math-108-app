/**
 * tools/verify_n317.js
 * 驗證 G3-N-3-17 時間（「日」、「時」、「分」、「秒」） 資料契約與數學真值（完整 10 題）
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

// 1. 基本結構（完整 10 題 SSOT）
if (data.code !== 'N-3-17') errors.push(`code should be N-3-17, got ${data.code}`);
if (data.grade !== 3) errors.push(`grade should be 3, got ${data.grade}`);
if (data.question_count !== 10) errors.push(`question_count should be 10, got ${data.question_count}`);
if (!data.questions || data.questions.length !== 10) {
  errors.push(`questions length should be 10, got ${data.questions ? data.questions.length : 0}`);
}
if (!data.verified_source || !data.verified_source.includes('段考')) {
  errors.push('missing verified_source from real exam paper');
}

// 2. 逐題契約與數學邏輯
data.questions.forEach((q, idx) => {
  const qNum = idx + 1;
  const prefix = `Q${qNum < 10 ? '0' + qNum : qNum}`;
  if (!q.id || !q.id.endsWith(prefix)) errors.push(`${prefix} ID format mismatch: ${q.id}`);
  if (!q.exam_source || q.exam_source.trim().length === 0) errors.push(`${prefix} missing exam_source`);
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

// 3. 數學真值校驗（Q01/Q04/Q07 保留原 3 題；其餘 7 題為 111-2期中／112-2期末 段考真題）
const ANSWERS = [1, 1, 2, 2, 1, 1, 1, 1, 1, 0];
const RAW = [
  '60秒 (1分鐘)', '② ╳ 錯誤', '③ ＝', '54 小時', '② 378 秒',
  '(1)17 時 28 分　(2)下午 2 點 25 分　(3)0 分 1 秒', '200 秒',
  '② 上午 11 時 45 分', '② 上午 7 時 35 分', '(1)7 小時 30 分　(2)5 盤'
];
ANSWERS.forEach((ans, i) => {
  const q = data.questions[i];
  if (!q) return;
  if (q.answer_index !== ans) {
    errors.push(`Q${String(i + 1).padStart(2, '0')} answer_index should be ${ans}, got ${q.answer_index}`);
  }
  if (q.answer_raw !== RAW[i]) {
    errors.push(`Q${String(i + 1).padStart(2, '0')} answer_raw should be ${RAW[i]}, got ${q.answer_raw}`);
  }
});

// 4. 誘答迷思契約：保留題 Q07 必須含「100 進位」選項；其餘真題迷思写在各題 trap
const MISCONCEPTION = {
  6: '100'    // Q07 320 秒（3 分當 300 秒，誤用 100 進位）
};
Object.keys(MISCONCEPTION).forEach((k) => {
  const q = data.questions[Number(k)];
  if (q && !q.choices.some((c) => c.includes(MISCONCEPTION[k]))) {
    errors.push(`Q${String(Number(k) + 1).padStart(2, '0')} 缺少「誤用 100 進位」迷思誘答選項`);
  }
});

// 4b. 真題來源契約：Q01/Q04/Q07 保留原 3 題，其餘 7 題須為真實內湖段考卷（禁假出處）
[0, 3, 6].forEach((i) => {
  if (!data.questions[i] || !data.questions[i].exam_source.includes('陽明')) {
    errors.push(`Q${String(i + 1).padStart(2, '0')} 應為保留原真題（陽明 113-2 期中）`);
  }
});
[1, 2, 4, 5, 7, 8, 9].forEach((i) => {
  if (!data.questions[i] || !data.questions[i].exam_source.includes('臺北市內湖國小')) {
    errors.push(`Q${String(i + 1).padStart(2, '0')} 應為內湖真實段考題，實際 ${data.questions[i] ? data.questions[i].exam_source : '缺題'}`);
  }
});

// 5. 課綱帳實一致
const curriculum = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/curriculum.json'), 'utf8'));
const declared = curriculum.grades.flatMap((g) => g.units).find((u) => u.code === 'N-3-17');
if (!declared || declared.question_count !== 10) {
  errors.push('curriculum.json N-3-17 question_count 應為 10');
} else if (declared.question_count !== data.question_count) {
  errors.push('curriculum.json 與 N-3-17.json 題數帳實不符');
}

if (errors.length > 0) {
  console.error('FAIL: verify_n317 errors:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log('PASS: G3-N-3-17 (時間「日、時、分、秒」) 完整 10 題資料契約、數學真值、100 進位迷思誘答與課綱帳實全綠通過！');
  process.exit(0);
}
