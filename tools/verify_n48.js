/**
 * tools/verify_n48.js — G4-N-4-8 靜態契約閘門
 *  A. 題庫 JSON：10 題 / 4 選項 / 真實出處 / 正解索引 / concept+steps+trap / check 真值可驗
 *  B. 教具 HTML：雙模式 / theme-tokens / #btn-theme / 4 類數線視覺 / 零題幹選項 / __N48_SELFTEST__
 *  C. 註冊外套：shell.js 映射存在且 UNIT_CONCEPT_MOVIES 未被本單元改動
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

const jsonPath = path.join(root, 'data/units/G4/N-4-8.json');
const labPath = path.join(root, 'app/components/number_line_g4_lab.html');
const shellPath = path.join(root, 'app/shell.js');
const unit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const lab = fs.readFileSync(labPath, 'utf8');
const shell = fs.readFileSync(shellPath, 'utf8');

/* A. 題庫契約 */
ok(unit.curriculum_code === 'N-4-8', 'curriculum_code 非 N-4-8');
ok(unit.grade === 4, 'grade 非 4');
ok(unit.question_count === 10 && Array.isArray(unit.questions) && unit.questions.length === 10, '題數非 10');
const schools = new Set();
unit.questions.forEach((q, i) => {
  const n = i + 1;
  ok(q.id === 'G4-N-4-8-Q' + String(n).padStart(2, '0'), `Q${n} id 錯誤`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${n} 選項數非 4`);
  ok(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, `Q${n} answer_index 越界`);
  ok(typeof q.exam_source === 'string' && q.exam_source.length > 5, `Q${n} 缺真實出處`);
  const sm = String(q.exam_source || '').match(/^([^\s（(]+)/);
  if (sm) schools.add(sm[1]);
  ok(q.component === 'number_line_g4_lab', `Q${n} component 錯誤`);
  ok(q.component_path === `components/number_line_g4_lab.html?q=${n}`, `Q${n} component_path 錯誤`);
  ok(q.explanation && typeof q.explanation.concept === 'string' && q.explanation.concept.length > 5, `Q${n} 缺 concept`);
  ok(q.explanation && Array.isArray(q.explanation.steps) && q.explanation.steps.length === 3, `Q${n} steps 非 3 步`);
  ok(q.explanation && typeof q.explanation.trap === 'string' && q.explanation.trap.length > 5, `Q${n} 缺 trap`);
  ok(q.explanation && typeof q.explanation.check === 'string' && q.explanation.check.length > 0, `Q${n} 缺 check 真值式`);
  try {
    const v = Function('"use strict";return (' + q.explanation.check + ')')();
    ok(Number.isFinite(v), `Q${n} check 非有限數`);
  } catch (e) { fail.push(`Q${n} check 無法運算：${e.message}`); }
});
ok(schools.size >= 2, `跨校數不足：僅 ${schools.size} 校`);
const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
ok(!jsonRaw.includes('分之'), '題庫仍含「分之」國字寫法');
ok(!jsonRaw.includes('017') && !jsonRaw.includes('子由'), '題庫含禁止字樣');

/* B. 教具契約 */
ok(lab.includes('theme-tokens.css'), '教具未接入 theme-tokens.css');
ok(lab.includes('id="btn-theme"'), '教具缺 #btn-theme 切換鈕');
ok(lab.includes('THEME_CHANGE'), '教具缺 THEME_CHANGE 監聽');
['move', 'read', 'dist', 'dual'].forEach((type) => {
  ok(lab.includes(type + '('), `教具缺視覺類型：${type}`);
});
ok(lab.includes('__N48_SELFTEST__'), '缺解析引擎自檢掛載');
ok(!lab.includes('class="stem"') && !lab.includes('class="opts"'), '教具不可自帶題幹或選項');

/* C. 註冊外套契約 */
ok(shell.includes('"N-4-8": "components/number_line_g4_lab.html?mode=concept"'), 'shell.js 缺 N-4-8 概念映射');
ok(shell.includes('const UNIT_CONCEPT_MOVIES'), 'shell.js 缺 UNIT_CONCEPT_MOVIES');
ok(!/UNIT_CONCEPT_MOVIES[\s\S]{0,80}N-4-8/.test(shell), 'N-4-8 誤入 UNIT_CONCEPT_MOVIES');

if (fail.length) {
  console.error('FAIL verify_n48: ' + fail.length + ' 項未過\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log(`PASS verify_n48: 10 題契約（跨 ${schools.size} 校）、4 類數線教具、雙模式主題、註冊外套全綠`);
process.exit(0);
