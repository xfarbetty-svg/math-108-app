/**
 * tools/verify_n46.js — G4-N-4-6 靜態契約閘門
 *  A. 題庫 JSON：10 題 / 4 選項 / 出處 / 正解索引 / 零「分之」國字 / check 真值可驗
 *  B. 教具 HTML：標準 .frac 排版 / 四類等值分數真實視覺教具 / 零空白積木模板 / 零「分之」國字
 *  C. 註冊外套：shell.js 映射存在且 UNIT_CONCEPT_MOVIES 未被本單元改動
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

const jsonPath = path.join(root, 'data/units/G4/N-4-6.json');
const labPath = path.join(root, 'app/components/equiv_fraction_g4_lab.html');
const shellPath = path.join(root, 'app/shell.js');
const unit = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const lab = fs.readFileSync(labPath, 'utf8');
const shell = fs.readFileSync(shellPath, 'utf8');

/* A. 題庫契約 */
ok(unit.curriculum_code === 'N-4-6', 'curriculum_code 非 N-4-6');
ok(unit.grade === 4, 'grade 非 4');
ok(unit.question_count === 10 && unit.questions.length === 10, '題數非 10');
unit.questions.forEach((q, i) => {
  const n = i + 1;
  ok(q.id === 'G4-N-4-6-Q' + String(n).padStart(2, '0'), `Q${n} id 錯誤`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${n} 選項數非 4`);
  ok(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, `Q${n} answer_index 越界`);
  ok(typeof q.exam_source === 'string' && q.exam_source.length > 5, `Q${n} 缺真實出處`);
  ok(q.component === 'equiv_fraction_g4_lab', `Q${n} component 錯誤`);
  ok(q.component_path === `components/equiv_fraction_g4_lab.html?q=${n}`, `Q${n} component_path 錯誤`);
  ok(typeof q.explanation.check === 'string' && q.explanation.check.length > 0, `Q${n} 缺 check 真值式`);
  try {
    const v = Function('"use strict";return (' + q.explanation.check + ')')();
    ok(Number.isFinite(v), `Q${n} check 非有限數`);
  } catch (e) { fail.push(`Q${n} check 無法運算：${e.message}`); }
});
const jsonRaw = fs.readFileSync(jsonPath, 'utf8');
ok(!jsonRaw.includes('分之'), '題庫仍含「分之」國字寫法');

/* B. 教具契約 */
ok(lab.includes('class="frac"') || lab.includes("class=\\\"frac\\\""), '教具缺標準 .frac 結構');
ok(lab.includes('<span class="l">'), '教具缺分數橫線');
ok(!lab.includes('分之'), '教具仍含「分之」國字寫法');
['comboPool', 'comboSlots', 'verifyCombo', 'comboTokens', 'token-btn'].forEach((tag) => {
  ok(!lab.includes(tag), `教具仍殘留空白積木模板：${tag}`);
});
['expand', 'reduce', 'equal', 'compare'].forEach((type) => {
  ok(lab.includes(type), `教具缺視覺類型：${type}`);
});
ok(lab.includes('data-cell=') && lab.includes('eq-cell'), '等值長條缺可點擊分段');
ok(lab.includes('cross-prod') && lab.includes('xp-a'), '交叉相乘_board 缺元件');
ok(lab.includes('__N46_SELFTEST__'), '缺解析引擎自檢掛載');

/* C. 註冊外套契約 */
ok(shell.includes('"N-4-6": "components/equiv_fraction_g4_lab.html?mode=concept"'), 'shell.js 缺 N-4-6 概念映射');
ok(shell.includes('const UNIT_CONCEPT_MOVIES'), 'shell.js 缺 UNIT_CONCEPT_MOVIES');
ok(!/UNIT_CONCEPT_MOVIES[\s\S]{0,40}N-4-6/.test(shell), 'N-4-6 誤入 UNIT_CONCEPT_MOVIES');

if (fail.length) {
  console.error('FAIL verify_n46: ' + fail.length + ' 項未過\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('PASS verify_n46: 10 題契約、零「分之」國字、4 類真實視覺教具、無空白積木模板、註冊外套全綠');
process.exit(0);
