/**
 * tools/verify_s34.js — G3-S-3-4 幾何形體操作 題庫契約與數學真值驗證
 * 4 題 100% 真實段考題（S-3-4 兩題 + N-3-1 積木圖形跨域兩題），符合 4～10 題彈性真題規範。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const jsonPath = path.join(__dirname, '../data/units/G3/S-3-4.json');
const errors = [];
if (!fs.existsSync(jsonPath)) { console.error('FAIL: S-3-4.json 不存在'); process.exit(1); }
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
if (data.code !== 'S-3-4') errors.push('code 應為 S-3-4，實際 ' + data.code);
if (data.grade !== 3) errors.push('grade 應為 3');
if (data.question_count !== 4) errors.push('question_count 應為 4，實際 ' + data.question_count);
if (!Array.isArray(data.questions) || data.questions.length !== 4) errors.push('題數應為 4，實際 ' + (data.questions || []).length);
const ANSWERS = [0,0,1,1];
data.questions.forEach((q, i) => {
  const tag = 'Q' + String(i + 1).padStart(2, '0');
  if (q.id !== 'G3-S-3-4-' + tag) errors.push(tag + ' id 錯誤：' + q.id);
  if (!q.stem || !q.stem.trim()) errors.push(tag + ' 缺 stem');
  if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(tag + ' choices 需 4 選項');
  if (typeof q.answer_index !== 'number' || q.answer_index < 0 || q.answer_index > 3) errors.push(tag + ' answer_index 越界');
  if (!q.answer_raw || q.choices[q.answer_index] !== q.answer_raw) errors.push(tag + ' answer_raw 與 choices[answer_index] 不一致');
  if (ANSWERS[i] !== q.answer_index) errors.push(tag + ' 正解索引應為 ' + ANSWERS[i] + '，實際 ' + q.answer_index);
  if (q.fallback_height !== 420) errors.push(tag + ' fallback_height 應為 420');
  if (!q.source_paper || !q.source_paper.trim()) errors.push(tag + ' 缺真實 source_paper');
  if (!q.exam_source || !q.exam_source.trim()) errors.push(tag + ' 缺 exam_source');
  if (!q.explanation || !q.explanation.concept || !Array.isArray(q.explanation.steps) || !q.explanation.steps.length || !q.explanation.trap) errors.push(tag + ' 詳解缺 concept/steps/trap');
  const expectedPath = 'components/solid_geometry_lab.html?q=' + (i + 1);
  if (q.component_path !== expectedPath) errors.push(tag + ' component_path 應為 ' + expectedPath + '，實際 ' + q.component_path);
  const abs = path.join(__dirname, '..', 'app', q.component_path.split('?')[0]);
  if (!fs.existsSync(abs)) errors.push(tag + ' 教具實體檔不存在：' + q.component_path);
});

// 超綱防偽：題庫與教具不得出現五年級立體（三角錐／三角柱／四角柱）
const raw = fs.readFileSync(jsonPath, 'utf8');
const compAbs = path.join(__dirname, '..', 'app', 'components/solid_geometry_lab.html');
const comp = fs.existsSync(compAbs) ? fs.readFileSync(compAbs, 'utf8') : '';
['三角錐', '三角柱', '四角柱', '五年級'].forEach((bad) => {
  if (raw.includes(bad)) errors.push('題庫殘留超綱關鍵字：' + bad);
  if (comp.includes(bad)) errors.push('教具殘留超綱畫面：' + bad);
});
// 浮動 Q 徽章會把手機頂部分頁擠出螢幕，必須移除
if (comp.includes('q-badge')) errors.push('教具仍有浮動 q-badge（會造成頂部切字）');
if (errors.length) {
  console.error('FAIL verify_s-3-4:');
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}
console.log('PASS: G3-S-3-4 幾何形體操作 4 題真題契約、正解真值、零超綱、零浮動徽章、fallback/?q= 全綠');
process.exit(0);
