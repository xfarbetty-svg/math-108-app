/* N-4-2 靜態契約閘門：題庫 SSOT、外殼註冊、教具外觀契約與防劇透 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const fail = [];
const check = (ok, label) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label);
  if (!ok) fail.push(label);
};

/* ---------- 1. 題庫 10 題 SSOT ---------- */
const unitPath = path.join(ROOT, 'data/units/G4/N-4-2.json');
const unit = JSON.parse(fs.readFileSync(unitPath, 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'N-4-2' && unit.grade === 4, 'curriculum_code/grade');
check(unit.question_count === 10, 'question_count = 10');
check(Array.isArray(unit.questions) && unit.questions.length === 10, 'questions.length = 10');
check(/乘除/.test(unit.unit_name), 'unit_name 涵蓋乘除');
check(/南湖.*內湖|內湖.*南湖/.test(unit.note), '如實註記檔名與卷首校名差異');
const ids = new Set();
const covers = { mul: 0, div: 0, est: 0 };
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-N-4-2-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一');
  ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 8, n + ' 題幹完整');
  check(Array.isArray(q.choices) && q.choices.length === 4, n + ' 4 選項');
  check(new Set(q.choices).size === 4, n + ' 選項不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(typeof q.answer_raw === 'string' && q.answer_raw.length > 0, n + ' answer_raw');
  check(typeof q.exam_source === 'string' && /p\d/.test(q.exam_source), n + ' 出處含頁碼');
  check(q.component === 'mul_div_g4_lab', n + ' component');
  check(q.component_path === 'components/mul_div_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 5, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps');
  check(typeof e.trap === 'string' && e.trap.length > 5, n + ' explanation.trap');
  if (/×/.test(q.title) || /×/.test(q.stem)) covers.mul++;
  if (/÷/.test(q.title) || /÷/.test(q.stem)) covers.div++;
  if (/估商|估算/.test(q.title) || /估商|估算/.test(q.stem)) covers.est++;
});
check(unit.questions[3].source_anomaly && /① 2 個/.test(unit.questions[3].source_anomaly), 'Q4 原卷誤植如實記載');
check(unit.questions[3].choices[2] === '2 個', 'Q4 選項③數值逐字保留');
check(covers.mul >= 4, '乘法題 >= 4（實 ' + covers.mul + '）');
check(covers.div >= 4, '除法題 >= 4（實 ' + covers.div + '）');
check(covers.est >= 1, '估商/估算題 >= 1（實 ' + covers.est + '）');

/* ---------- 2. 課綱與外殼註冊 ---------- */
const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const all = [];
(function walk(o) {
  if (Array.isArray(o)) o.forEach(walk);
  else if (o && typeof o === 'object') {
    if (o.code) all.push(o);
    Object.values(o).forEach(walk);
  }
})(cur);
const u = all.find((x) => x.code === 'N-4-2');
check(!!u && u.status === 'ready', 'curriculum N-4-2 status=ready');
check(!!u && u.question_count === 10, 'curriculum N-4-2 question_count=10');
check(!!u && u.component_path === 'components/mul_div_g4_lab.html', 'curriculum component_path');

const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
const shellBlock = shell.match(/const CONCEPT_COMPONENTS = \{([\s\S]*?)\n\};/);
check(!!shellBlock, 'shell.js CONCEPT_COMPONENTS 區塊存在');
check(!!shellBlock && /"N-4-2"\s*:\s*"components\/mul_div_g4_lab\.html"/.test(shellBlock[1]), 'shell.js 已註冊 N-4-2 觀念小教室');

/* ---------- 3. 教具外觀與防劇透契約 ---------- */
const labPath = path.join(ROOT, 'app/components/mul_div_g4_lab.html');
check(fs.existsSync(labPath), '教具檔案存在');
const html = fs.readFileSync(labPath, 'utf8');
check(/height:\s*auto/.test(html) && /min-height:\s*0/.test(html), 'body 採 height:auto / min-height:0');
check(!/100vh/.test(html), '禁 100vh');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且 Dark 覆寫');
check(/id="btn-theme"/.test(html) && /class="theme-btn"/.test(html), '右上角 Light/Dark 切換鈕 #btn-theme');
check(/localStorage\.getItem\('math108_theme'\)/.test(html), '支援 localStorage math108_theme');
check(/THEME_CHANGE/.test(html), '支援外殼 THEME_CHANGE 廣播');
check(/URLSearchParams/.test(html) && /get\('q'\)/.test(html), '支援 ?q 真題模式');
check(/body\.q-mode \.act-tabs\s*\{\s*display:\s*none !important/.test(html), 'q-mode 隱藏活動頁籤');
check(/grid-template-columns/.test(html), '直式使用 CSS Grid 固定欄位');
check(!/\.stem\b/.test(html), '教具內不含 .stem（外殼統一題幹）');
check(!/\.opts?\b/.test(html), '教具內不含 .opts／.opt（外殼統一四選項）');
check(/pointerdown/.test(html) && /pointerup/.test(html), '具真實 pointerdown/pointerup 事件');
check(/renderBracket/.test(html) && /isPlace/.test(html), '含標準長除法直式與補 0 占位教具');
check(/balance-svg/.test(html), '含除法試商天平');
check(/est-reveal/.test(html) && /btn-reveal-exact/.test(html), '含高位估算揭開精算直式');
check(/÷100/.test(html), 'Q10 同消 0 簡算對比');

if (fail.length) {
  console.error('FAILED ' + fail.length + ':\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('ALL PASS verify_n42: 題庫 10 題、外殼註冊、防劇透、CSS Grid、主題與雙模式契約全綠');
process.exit(0);
