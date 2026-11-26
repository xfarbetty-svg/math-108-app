/**
 * tools/verify_r43.js — G4-R-4-3 靜態契約閘門
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

const jsonPath = path.join(root, 'data/units/G4/R-4-3.json');
const labPath = path.join(root, 'app/components/formula_g4_lab.html');
const shellPath = path.join(root, 'app/shell.js');
const unit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const lab = fs.readFileSync(labPath, 'utf8');
const shell = fs.readFileSync(shellPath, 'utf8');

ok(unit.curriculum_code === 'R-4-3', 'curriculum_code 非 R-4-3');
ok(unit.grade === 4, 'grade 非 4');
ok(unit.question_count === 10 && Array.isArray(unit.questions) && unit.questions.length === 10, '題數非 10');
const schools = new Set();
unit.questions.forEach((q, i) => {
  const n = i + 1;
  ok(q.id === 'G4-R-4-3-Q' + String(n).padStart(2, '0'), `Q${n} id 錯誤`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${n} 選項數非 4`);
  ok(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, `Q${n} answer_index 越界`);
  ok(typeof q.exam_source === 'string' && q.exam_source.length > 5, `Q${n} 缺真實出處`);
  const sm = String(q.exam_source || '').match(/^([^\s（(]+)/);
  if (sm) schools.add(sm[1]);
  ok(q.component === 'formula_g4_lab', `Q${n} component 錯誤`);
  ok(q.component_path === `components/formula_g4_lab.html?q=${n}`, `Q${n} component_path 錯誤`);
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

ok(lab.includes('theme-tokens.css'), '教具未接入 theme-tokens.css');
ok(lab.includes('id="btn-theme"'), '教具缺 #btn-theme 切換鈕');
ok(lab.includes('THEME_CHANGE'), '教具缺 THEME_CHANGE 監聽');
ok(lab.includes('__R43_SELFTEST__'), '缺解析引擎自檢掛載');
ok(!lab.includes('class="stem"') && !lab.includes('class="opts"'), '教具不可自帶題幹或選項');

ok(shell.includes('"R-4-3": "components/formula_g4_lab.html?mode=concept"'), 'shell.js 缺 R-4-3 概念映射');
ok(shell.includes('const UNIT_CONCEPT_MOVIES'), 'shell.js 缺 UNIT_CONCEPT_MOVIES');
ok(!/UNIT_CONCEPT_MOVIES[\s\S]{0,80}R-4-3/.test(shell), 'R-4-3 誤入 UNIT_CONCEPT_MOVIES');

if (fail.length) {
  console.error('FAIL verify_r43: ' + fail.length + ' 項未過\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log(`PASS verify_r43: 10 題契約（跨 ${schools.size} 校）、10 專屬公式教具、雙模式主題、註冊外套全綠`);
process.exit(0);
