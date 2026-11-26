/* S-4-4 靜態契約 + 零劇透 + 跨校真題驗證 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) { console.log((ok ? 'PASS ' : 'FAIL ') + label); if (!ok) fail++; }

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/S-4-4.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'S-4-4' && unit.grade === 4, 'curriculum_code/grade');
check(unit.question_count === 10, 'question_count = 10');
check(Array.isArray(unit.questions) && unit.questions.length === 10, 'questions.length = 10');
check(/體積/.test(unit.unit_name), 'unit_name 涵蓋體積');

const ids = new Set(), schools = new Set(), stems = new Set();
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-S-4-4-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一'); ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 10, n + ' 題幹完整');
  check(!stems.has(q.stem), n + ' 題幹不重複'); stems.add(q.stem);
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(q.choices[q.answer_index] === q.answer_raw, n + ' answer_raw 對齊正解選項');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含學校與頁碼');
  check(!/017|子由/.test(q.exam_source + q.stem), n + ' 不含禁區來源');
  check(q.component === 'volume_s44_g4_lab', n + ' component');
  check(q.component_path === 'components/volume_s44_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 8, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps >= 3');
  check(typeof e.trap === 'string' && e.trap.length > 8, n + ' explanation.trap');
  const m = q.exam_source.match(/(南湖|獅湖|永安)國小/); if (m) schools.add(m[1]);
});
check(schools.size >= 3, '跨 3 校以上（實 ' + schools.size + '：' + [...schools].join('/') + '）');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const all = [];
(function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.code) all.push(o); Object.values(o).forEach(walk); } })(cur);
const u = all.find((x) => x.code === 'S-4-4');
check(!!u && u.status === 'ready', 'curriculum S-4-4 status=ready');
check(!!u && u.question_count === 10, 'curriculum S-4-4 question_count=10');
check(!!u && u.component_path === 'components/volume_s44_g4_lab.html', 'curriculum component_path');
check(!!u && u.concept_path === 'components/volume_s44_g4_lab.html?mode=concept', 'curriculum concept_path');

const htmlPath = path.join(ROOT, 'app/components/volume_s44_g4_lab.html');
check(fs.existsSync(htmlPath), '教具檔案存在');
const html = fs.readFileSync(htmlPath, 'utf8');
check(/height:auto;min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto;min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且 Dark 覆寫');
check(/id="btn-theme"/.test(html) && /THEME_CHANGE/.test(html), '保留 #btn-theme 且監聽 THEME_CHANGE');
check(/\[hidden\]\{display:none!important\}/.test(html), '嚴格隱藏未啟用卡片');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(/果汁/.test(html) && /紙箱/.test(html) && /橡皮泥/.test(html), '概念三活動使用三道不同生活情境');
check(/if\(!st\.shown\)return ''/.test(html), '算理區初始零劇透');
['liquidSVG','boxSVG','claySVG','sliceSVG','arrangeSVG','balloonSVG','squashSVG','unitSVG','stackSVG','longDivSVG'].forEach(function(f){
  check(new RegExp('function\\s+' + f).test(html), '專屬視覺函式 ' + f);
});

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(/"S-4-4":\s*"components\/volume_s44_g4_lab\.html\?mode=concept"/.test(shell), 'shell.js CONCEPT_COMPONENTS 註冊 S-4-4');
check(/"S-4-4"/.test(shell), 'shell.js 預設進入概念探索');
check(!/UNIT_CONCEPT_MOVIES[\s\S]{0,4000}"S-4-4"/.test(shell), '未寫入 UNIT_CONCEPT_MOVIES');

console.log(fail === 0 ? 'S44_STATIC_ALL_PASS — ALL PASS' : 'FAILED ' + fail);
process.exit(fail === 0 ? 0 : 1);
