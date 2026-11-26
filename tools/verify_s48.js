/* S-4-8 靜態契約 + 零劇透 + 跨校真題驗證 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) { console.log((ok ? 'PASS ' : 'FAIL ') + label); if (!ok) fail++; }

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/S-4-8.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'S-4-8' && unit.grade === 4, 'curriculum_code/grade');
check(unit.question_count === 10, 'question_count = 10');
check(Array.isArray(unit.questions) && unit.questions.length === 10, 'questions.length = 10');
check(/四邊形/.test(unit.unit_name), 'unit_name 涵蓋四邊形');

const ids = new Set(), schools = new Set(), stems = new Set();
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-S-4-8-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一'); ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 10, n + ' 題幹完整');
  check(!stems.has(q.stem), n + ' 題幹不重複'); stems.add(q.stem);
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(q.choices[q.answer_index] === q.answer_raw, n + ' answer_raw 對齊正解選項');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含學校與頁碼');
  check(!/017|子由/.test(q.exam_source + q.stem), n + ' 不含禁區來源');
  check(q.component === 'quadrilateral_g4_lab', n + ' component');
  check(q.component_path === 'components/quadrilateral_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 8, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps >= 3');
  check(typeof e.trap === 'string' && e.trap.length > 8, n + ' explanation.trap');
  const m = q.exam_source.match(/(永安|獅湖|內湖|南湖|陽明)國小/); if (m) schools.add(m[1]);
});
check(schools.size >= 3, '跨 3 校以上（實 ' + schools.size + '：' + [...schools].join('/') + '）');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const all = [];
(function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.code) all.push(o); Object.values(o).forEach(walk); } })(cur);
const u = all.find((x) => x.code === 'S-4-8');
check(!!u && u.status === 'ready', 'curriculum S-4-8 status=ready');
check(!!u && u.question_count === 10, 'curriculum S-4-8 question_count=10');
check(!!u && u.component_path === 'components/quadrilateral_g4_lab.html', 'curriculum component_path');
check(!!u && u.concept_path === 'components/quadrilateral_g4_lab.html?mode=concept', 'curriculum concept_path');

const htmlPath = path.join(ROOT, 'app/components/quadrilateral_g4_lab.html');
check(fs.existsSync(htmlPath), '教具檔案存在');
const html = fs.readFileSync(htmlPath, 'utf8');
check(/height:auto;min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto;min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且 Dark 覆寫');
check(/id="btn-theme"/.test(html) && /THEME_CHANGE/.test(html), '保留 #btn-theme 且監聽 THEME_CHANGE');
check(/pointerdown/.test(html) && /pointermove/.test(html) && /pointerup/.test(html), '真實 pointerdown/move/up 事件監聽');
check(/\[hidden\]\{display:none!important\}/.test(html) && /\.q-mode\s+#act-0-view/.test(html), '嚴格隱藏未啟用卡片與 q-mode 隔離');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(/伸縮鐵捲門/.test(html) && /風箏骨架/.test(html) && /七巧板對角剪裁/.test(html), '概念三活動使用三道不同生活情境例題');
check(/stepsBox\.hidden\s*=\s*true/.test(html), '真題階段 B 初始隱藏（零劇透）');

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(!/['"]S-4-8['"]\s*:/.test(shell.slice(shell.indexOf('UNIT_CONCEPT_MOVIES'), shell.indexOf('UNIT_CONCEPT_MOVIES') + 1500)), '嚴禁修改 UNIT_CONCEPT_MOVIES');

if (fail > 0) { console.error('FAIL ' + fail + ' 項'); process.exit(1); }
console.log('PASS verify_s48: 所有靜態契約全綠');
process.exit(0);
