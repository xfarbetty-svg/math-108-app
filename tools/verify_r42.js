/* R-4-2 靜態契約 + 零劇透 + 跨校真題驗證 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) { console.log((ok ? 'PASS ' : 'FAIL ') + label); if (!ok) fail++; }

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/R-4-2.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'R-4-2' && unit.grade === 4, 'curriculum_code/grade');
check(unit.question_count === 10, 'question_count = 10');
check(Array.isArray(unit.questions) && unit.questions.length === 10, 'questions.length = 10');
check(/四則計算規律/.test(unit.unit_name), 'unit_name 涵蓋四則計算規律');

const ids = new Set(), schools = new Set(), stems = new Set();
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-R-4-2-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一'); ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 10, n + ' 題幹完整');
  check(!stems.has(q.stem), n + ' 題幹不重複'); stems.add(q.stem);
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(typeof q.answer_raw === 'string' && q.answer_raw.length > 0, n + ' answer_raw 非空');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含學校與頁碼');
  check(!/017|子由/.test(q.exam_source + q.stem), n + ' 不含禁區來源');
  check(q.component === 'calc_laws_g4_lab', n + ' component');
  check(q.component_path === 'components/calc_laws_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 8, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps >= 3');
  check(typeof e.trap === 'string' && e.trap.length > 8, n + ' explanation.trap');
  const m = q.exam_source.match(/(南湖|永安|陽明)國小/); if (m) schools.add(m[1]);
});
check(schools.size >= 3, '跨 3 校以上（實 ' + schools.size + '：' + [...schools].join('/') + '）');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const all = [];
(function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.code) all.push(o); Object.values(o).forEach(walk); } })(cur);
const u = all.find((x) => x.code === 'R-4-2');
check(!!u && u.status === 'ready', 'curriculum R-4-2 status=ready');
check(!!u && u.question_count === 10, 'curriculum R-4-2 question_count=10');
check(!!u && u.component_path === 'components/calc_laws_g4_lab.html', 'curriculum component_path');
check(!!u && u.concept_path === 'components/calc_laws_g4_lab.html?mode=concept', 'curriculum concept_path');

const htmlPath = path.join(ROOT, 'app/components/calc_laws_g4_lab.html');
check(fs.existsSync(htmlPath), '教具檔案存在');
const html = fs.readFileSync(htmlPath, 'utf8');
check(/height:auto;\s*min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto/min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且 Dark 覆寫');
check(/id="btn-theme"/.test(html) && /THEME_CHANGE/.test(html), '保留 #btn-theme 且監聽 THEME_CHANGE');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(!/苹果|鉑筆/.test(html), '無簡體或錯別字');
check(!/overflow-y:\s*auto/.test(html), '無內部垂直捲軸 CSS');
check(/水果店/.test(html) && /圖書館/.test(html) && /餅乾分裝/.test(html), '概念三活動使用三道不同生活情境例題');
check(/if\s*\(!st\.shown\)\s*return\s*''/.test(html), '算理區初始隱藏（零劇透）');
check(/type="number"/.test(html), '計算填答支援直接輸入數字與快捷步進');

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(/"R-4-2":\s*"components\/calc_laws_g4_lab\.html\?mode=concept"/.test(shell), 'shell.js CONCEPT_COMPONENTS 註冊 R-4-2');
check(/DEFAULT_CONCEPT_CODES[\s\S]*?"R-4-2"/.test(shell), 'shell.js 預設進入概念探索');

console.log(fail === 0 ? 'R42_STATIC_ALL_PASS — ALL PASS' : 'FAILED ' + fail);
process.exit(fail === 0 ? 0 : 1);
