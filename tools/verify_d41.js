/* tools/verify_d41.js — D-4-1 靜態契約與題庫真值驗證 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) {
  console.log((ok ? 'PASS ' : 'FAIL ') + label);
  if (!ok) fail++;
}

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/D-4-1.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'D-4-1' && unit.grade === 4, 'curriculum_code/grade = D-4-1 / 4');
check(unit.question_count === 10 && Array.isArray(unit.questions) && unit.questions.length === 10, '滿編 10 題');
check(/長條圖/.test(unit.unit_name) && /折線圖/.test(unit.unit_name) && /省略/.test(unit.unit_name), 'unit_name 涵蓋長條圖／折線圖／省略符號');

const ids = new Set();
const stems = new Set();
const schools = new Set();
let badAnswer = 0;
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-D-4-1-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一');
  ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 12, n + ' 題幹完整不閹割');
  check(!stems.has(q.stem), n + ' 題幹不與其他題重複');
  stems.add(q.stem);
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項且不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  const norm = (s) => String(s || '').replace(/[\s\-－—，,。]/g, '');
  const na = norm(q.answer_raw), nc = norm(q.choices[q.answer_index]);
  check(typeof q.answer_raw === 'string' && na.length > 0 && (na === nc || nc.includes(na) || na.includes(nc)), n + ' 正解與 answer_raw 一致');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含真實學校與頁碼');
  check(/111|112|113|114/.test(q.exam_source), n + ' 出處含學年度');
  check(q.component === 'charts_g4_lab', n + ' component = charts_g4_lab');
  check(q.component_path === 'components/charts_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height = 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 6, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps >= 3');
  check(typeof e.trap === 'string' && e.trap.length > 6, n + ' explanation.trap');
  const m = String(q.exam_source).match(/(南湖|永安|獅湖)國小/);
  if (m) schools.add(m[1]); else badAnswer++;
});
check(badAnswer === 0, '10 題全數標註合法學校');
check(schools.size >= 2, '跨 2 校以上真卷（實 ' + schools.size + '：' + [...schools].join('/') + '）');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const g4 = cur.grades.find((g) => g.grade === 4);
const u = g4 && g4.units.find((x) => x.code === 'D-4-1');
check(!!u && u.status === 'ready' && u.question_count === 10, 'curriculum.json D-4-1 status=ready & question_count=10');
check(!!u && u.component_path === 'components/charts_g4_lab.html', 'curriculum.json component_path');
check(!!u && u.concept_path === 'components/charts_g4_lab.html?mode=concept', 'curriculum.json concept_path');

const htmlPath = path.join(ROOT, 'app/components/charts_g4_lab.html');
check(fs.existsSync(htmlPath), '教具檔案存在');
const html = fs.readFileSync(htmlPath, 'utf8');
check(/height:auto;min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto;min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且支援 Dark Mode');
check(/THEME_CHANGE/.test(html) && /btn-theme/.test(html), 'THEME_CHANGE 廣播與 #btn-theme');
check(/URLSearchParams/.test(html) && /parseInt\(P\.get\('q'\)/.test(html), '?q=1..10 題目聯動');
check(/body\.q-mode \.tabs\{display:none!important\}/.test(html), 'q-mode 強制隱藏頂部頁籤');
check((html.match(/data-act="/g) || []).length === 3, '概念模式三頁籤');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer|\.stem\b/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(/explainHTML/.test(html) && /if \(!st\.shown\) return ''/.test(html), '未操作前不渲染詳解（零劇透）');
const modules = [...html.matchAll(/module:'([a-z_0-9]+)'/g)].map(m => m[1]);
check(modules.length === 10 && new Set(modules).size === 10, '10 題各自專屬互動模組（無一圖套十題）: ' + modules.join(','));
check(/function waveY\(/.test(html) && !/waveAt\(x0 \+ 22,\s*yB \+ 3\)/.test(html), '折線圖波浪省略符號置於縱軸 (waveY) 而非橫軸');
check(/unit:'℃'/.test(html) && /if \(opt\.unit\)/.test(html), '活動二折線圖標示溫度單位 ℃');
check(/t \+= 50/.test(html) && /一大格\(整碗\)＝100 碗/.test(html), 'Q4 象形統計圖具 50/100 格線與單位刻度');
check(/function barGradeSum\(/.test(html) && !/function tableMini\(/.test(html), 'Q7 已升級為正式長條圖 barGradeSum');
check(/體重統計圖（有 ～）/.test(html) && /借書統計圖（無 ～）/.test(html) && /標題、單位、類別/.test(html), 'Q9 具「有 ～ vs 無 ～」與必要要素對比');

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(/"D-4-1":\s*"components\/charts_g4_lab\.html\?mode=concept"/.test(shell), 'shell.js CONCEPT_COMPONENTS 已註冊 D-4-1');
check(!/UNIT_CONCEPT_MOVIES[\s\S]{0,80}charts_g4_lab/.test(shell), '未污染 UNIT_CONCEPT_MOVIES');

if (fail > 0) {
  console.error('FAIL verify_d41: ' + fail + ' 項未過');
  process.exit(1);
}
console.log('PASS verify_d41: D-4-1 靜態契約全數通過');
process.exit(0);
