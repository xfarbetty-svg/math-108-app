/* tools/verify_n49.js — N-4-9 靜態契約與題庫真值驗證 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) {
  console.log((ok ? 'PASS ' : 'FAIL ') + label);
  if (!ok) fail++;
}

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/N-4-9.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'N-4-9' && unit.grade === 4, 'curriculum_code/grade = N-4-9 / 4');
check(unit.question_count === 10 && Array.isArray(unit.questions) && unit.questions.length === 10, '滿編 10 題');
check(/公里/.test(unit.unit_name), 'unit_name 涵蓋公里');

const ids = new Set();
const schools = new Set();
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-N-4-9-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一');
  ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 8, n + ' 題幹完整');
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項且不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(typeof q.answer_raw === 'string' && q.answer_raw.length > 0, n + ' answer_raw 非空');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含學校與頁碼');
  check(q.component === 'length_km_g4_lab', n + ' component = length_km_g4_lab');
  check(q.component_path === 'components/length_km_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height = 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 6, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps >= 3');
  check(typeof e.trap === 'string' && e.trap.length > 6, n + ' explanation.trap');
  const m = String(q.exam_source).match(/(南湖|獅湖|永安)國小/);
  if (m) schools.add(m[1]);
});
check(schools.size >= 2, '跨 2 校以上真卷（實 ' + schools.size + '：' + [...schools].join('/') + '）');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const g4 = cur.grades.find((g) => g.grade === 4);
const u = g4 && g4.units.find((x) => x.code === 'N-4-9');
check(!!u && u.status === 'ready' && u.question_count === 10, 'curriculum.json N-4-9 status=ready & question_count=10');
check(!!u && u.component_path === 'components/length_km_g4_lab.html', 'curriculum.json component_path');
check(!!u && u.concept_path === 'components/length_km_g4_lab.html?mode=concept', 'curriculum.json concept_path');

const htmlPath = path.join(ROOT, 'app/components/length_km_g4_lab.html');
check(fs.existsSync(htmlPath), '教具檔案存在');
const html = fs.readFileSync(htmlPath, 'utf8');
check(/height:auto;min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto;min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且支援 Dark Mode');
check(/URLSearchParams/.test(html) && /parseInt\(P\.get\('q'\)/.test(html), '?q=1..10 題目聯動');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(/explainHTML/.test(html) && /if \(!st\.shown\) return ''/.test(html), '未操作前不渲染詳解（零劇透）');

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(/"N-4-9":\s*"components\/length_km_g4_lab\.html\?mode=concept"/.test(shell), 'shell.js CONCEPT_COMPONENTS 已註冊 N-4-9');

if (fail > 0) {
  console.error('FAIL verify_n49: ' + fail + ' 項未過');
  process.exit(1);
}
console.log('PASS verify_n49: N-4-9 靜態契約全數通過');
process.exit(0);
