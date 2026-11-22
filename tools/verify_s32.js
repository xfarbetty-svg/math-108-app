/**
 * tools/verify_s-3-2.js — G3-S-3-2 正方形和長方形 題庫契約與數學真值驗證
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const jsonPath = path.join(__dirname, '../data/units/G3/S-3-2.json');
const errors = [];
if (!fs.existsSync(jsonPath)) { console.error('FAIL: S-3-2.json 不存在'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (data.code !== 'S-3-2') errors.push('code 應為 S-3-2，實際 ' + data.code);
if (data.grade !== 3) errors.push('grade 應為 3');
if (data.question_count !== 10) errors.push('question_count 應為 10，實際 ' + data.question_count);
if (!Array.isArray(data.questions) || data.questions.length !== 10) errors.push('題數應為 10，實際 ' + (data.questions || []).length);
const ANSWERS = [2,0,1,1,1,2,2,0,2,0];
data.questions.forEach((q, i) => {
  const tag = 'Q' + String(i + 1).padStart(2, '0');
  if (q.id !== 'G3-S-3-2-' + tag) errors.push(tag + ' id 錯誤：' + q.id);
  if (!q.stem || !q.stem.trim()) errors.push(tag + ' 缺 stem');
  if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(tag + ' choices 需 4 選項');
  if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index > 3) errors.push(tag + ' answer_index 越界');
  if (!q.answer_raw || q.choices[q.answer_index] !== q.answer_raw) errors.push(tag + ' answer_raw 與 choices[answer_index] 不一致');
  if (ANSWERS[i] !== q.answer_index) errors.push(tag + ' 正解索引應為 ' + ANSWERS[i] + '，實際 ' + q.answer_index);
  if (q.fallback_height !== 420) errors.push(tag + ' fallback_height 應為 420');
  if (!q.source_paper || !q.source_paper.trim()) errors.push(tag + ' 缺真實 source_paper');
  if (!q.exam_source || !q.exam_source.trim()) errors.push(tag + ' 缺 exam_source');
  if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps) || !q.explanation.steps.length || !q.explanation.trap) errors.push(tag + ' 詳解缺 concept/steps/trap');
  const expectedPath = 'components/square_rectangle_lab.html?q=' + (i + 1);
  if (q.component_path !== expectedPath) errors.push(tag + ' component_path 應為 ' + expectedPath + '，實際 ' + q.component_path);
  const abs = path.join(__dirname, '..', 'app', q.component_path.split('?')[0]);
  if (!fs.existsSync(abs)) errors.push(tag + ' 教具實體檔不存在：' + q.component_path);
});
// 防劇透硬閘門：教具原始碼不得出現直接揭曉答案的字串
const compAbs = path.join(__dirname, '..', 'app', 'components/square_rectangle_lab.html');
if (fs.existsSync(compAbs)) {
  const src = fs.readFileSync(compAbs, 'utf8');
  ['正確答案', '答案是', '正解：', '解答：'].forEach((bad) => {
    if (src.includes(bad)) errors.push('教具含劇透字串：' + bad);
  });
}
if (errors.length) {
  console.error('FAIL verify_s-3-2:');
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log('PASS: G3-S-3-2 正方形和長方形 10 題契約、正解真值、trap/fallback/?q= 全綠');
process.exit(0);
