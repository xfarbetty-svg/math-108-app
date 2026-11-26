/* N-4-4 靜態契約 + 數學真值驗證（G3/G4 標準架構／算式解析引擎） */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function check(ok, label) { console.log((ok ? 'PASS ' : 'FAIL ') + label); if (!ok) fail++; }

const unit = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/N-4-4.json'), 'utf8'));
check(unit.$schema === 'math-app-unit-v1', '$schema = math-app-unit-v1');
check(unit.curriculum_code === 'N-4-4' && unit.grade === 4, 'curriculum_code/grade');
check(unit.question_count === 10, 'question_count = 10');
check(Array.isArray(unit.questions) && unit.questions.length === 10, 'questions.length = 10');
check(/兩步驟|併式|四則/.test(unit.unit_name), 'unit_name 涵蓋兩步驟／併式／四則');

/* ---- 與教具解析引擎獨立的逆波蘭求值器（bilingual 符號正規化） ---- */
function norm(s) { return String(s).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/－/g, '-').replace(/＋/g, '+').replace(/＝/g, '=').replace(/\s/g, ''); }
function evaluate(expr) {
  const s = norm(expr);
  const toks = s.match(/[0-9.]+|[+\-*/()]/g);
  if (!toks || toks.join('') !== s) throw new Error('illegal char: ' + expr);
  let i = 0;
  function factor() { if (toks[i] === '(') { i++; const v = sum(); if (toks[i] !== ')') throw new Error('paren'); i++; return v; } const n = Number(toks[i++]); if (!Number.isFinite(n)) throw new Error('num'); return n; }
  function product() { let v = factor(); while (toks[i] === '*' || toks[i] === '/') { const op = toks[i++]; const r = factor(); v = op === '*' ? v * r : v / r; } return v; }
  function sum() { let v = product(); while (toks[i] === '+' || toks[i] === '-') { const op = toks[i++]; const r = product(); v = op === '+' ? v + r : v - r; } return v; }
  const out = sum(); if (i !== toks.length) throw new Error('trailing'); return out;
}
function numOf(raw) { const m = String(raw).match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; }
function firstCalc(step) { return norm(String(step || '').split('→').pop().split('＝')[0].trim()); }
function lastVal(step) { return numOf(String(step || '').split('＝').pop()); }

const ids = new Set(), schools = new Set(), stems = new Set();
let bracket = 0, mixed = 0;
unit.questions.forEach((q, i) => {
  const n = 'Q' + String(i + 1).padStart(2, '0');
  check(q.id === 'G4-N-4-4-' + n, n + ' id');
  check(!ids.has(q.id), n + ' id 唯一'); ids.add(q.id);
  check(typeof q.stem === 'string' && q.stem.length > 12, n + ' 題幹完整不閹割');
  check(!stems.has(q.stem), n + ' 10 題內部題幹零重複'); stems.add(q.stem);
  check(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, n + ' 4 選項且不重複');
  check(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, n + ' answer_index 合法');
  check(typeof q.answer_raw === 'string' && q.answer_raw.length > 0, n + ' answer_raw');
  check(/p\d/.test(q.exam_source) && /國小/.test(q.exam_source), n + ' 出處含學校頁碼');
  check(q.component === 'two_step_adv_g4_lab', n + ' component');
  check(q.component_path === 'components/two_step_adv_g4_lab.html?q=' + (i + 1), n + ' component_path ?q 聯動');
  check(q.fallback_height === 420, n + ' fallback_height 420');
  const e = q.explanation || {};
  check(typeof e.concept === 'string' && e.concept.length > 8, n + ' explanation.concept');
  check(Array.isArray(e.steps) && e.steps.length >= 3, n + ' explanation.steps');
  check(typeof e.trap === 'string' && e.trap.length > 8, n + ' explanation.trap');

  /* 數學致命錯誤守門：逐題驗證併式正解與兩步拆解 */
  const combined = String(e.steps[2] || '').split('併式：')[1] || '';
  const expr = combined.split('＝')[0];
  let val = NaN;
  try { val = evaluate(expr); } catch (err) { check(false, n + ' 併式無法解析：' + expr + ' / ' + err.message); }
  check(Math.abs(val - numOf(q.answer_raw)) < 1e-9, n + ' 併式真值 ' + expr + '＝' + val + ' 對齊 answer_raw ' + q.answer_raw);
  check(Math.abs(val - numOf(q.choices[q.answer_index])) < 1e-9, n + ' 併式真值對齊正解選項 ' + q.choices[q.answer_index]);
  const firstLeft = firstCalc(e.steps[0]);
  check(norm(expr).indexOf(firstLeft) >= 0, n + ' 第一步「' + firstLeft + '」確實出自併式（嚴禁憑空捏造）');
  check(Math.abs(lastVal(e.steps[1]) - val) < 1e-9, n + ' 第二步結果對齊最終正解');

  const m = q.exam_source.match(/(陽明|獅湖|永安|南湖)國小/); if (m) schools.add(m[1]);
  if (/\(/.test(expr) || /\(/.test(q.title)) bracket++;
  if (/[*\/]/.test(norm(expr)) && /[+\-]/.test(norm(expr))) mixed++;
});
check(schools.size >= 3, '跨 3 校以上（實 ' + schools.size + '：' + [...schools].join('/') + '）');
check(bracket >= 3, '括號併式題 >= 3（實 ' + bracket + '）');
check(mixed >= 6, '四則混合題 >= 6（實 ' + mixed + '）');

/* Q1 回歸：128÷(10＋6)，括號內先加後除，嚴禁重複 10−6 */
const q1 = unit.questions[0];
check(firstCalc(q1.explanation.steps[0]) === '10+6' &&
      lastVal(q1.explanation.steps[1]) === 8 && q1.answer_raw === '8 顆', 'Q1 括號先加後除拆解無捏造');

/* 與 N-4-3 十題完全區隔（層級 A/B 防重複） */
const prev = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G4/N-4-3.json'), 'utf8'));
const prevStems = new Set(prev.questions.map(x => x.stem));
check(unit.questions.every(q => !prevStems.has(q.stem)), '與 N-4-3 十題題幹零重複');

const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const all = [];
(function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.code) all.push(o); Object.values(o).forEach(walk); } })(cur);
const u = all.find(x => x.code === 'N-4-4');
check(!!u && u.status === 'ready', 'curriculum N-4-4 status=ready');
check(!!u && u.question_count === 10, 'curriculum N-4-4 question_count=10');
check(!!u && u.component_path === 'components/two_step_adv_g4_lab.html', 'curriculum component_path');
check(!!u && u.concept_path === 'components/two_step_adv_g4_lab.html', 'curriculum concept_path');
check(fs.existsSync(path.join(ROOT, 'app/components/two_step_adv_g4_lab.html')), '教具檔案存在');

/* 教具結構：G3 標準外殼＋雙模式＋真實事件＋無私自題幹/選項 */
const html = fs.readFileSync(path.join(ROOT, 'app/components/two_step_adv_g4_lab.html'), 'utf8');
check(/height:auto;\s*min-height:0/.test(html) && !/100vh/.test(html), '禁 100vh、採 height:auto/min-height:0');
check(/theme-tokens\.css/.test(html) && /html\[data-theme="dark"\]/.test(html), '接入 theme-tokens 且 Dark 覆寫');
check(/pointerdown/.test(html) && /pointermove/.test(html) && /pointerup/.test(html), '真實 pointerdown/move/up 事件監聽');
check(/URLSearchParams/.test(html) && /parseInt\(P\.get\('q'\)/.test(html), '?q=1..10 題目聯動');
check(/P\.get\('mode'\)==='concept'/.test(html), '支援 mode=concept 觀念小教室模式');
check(/reduceSteps/.test(html) && /firstReducible/.test(html) && /evalAST/.test(html), '算式解析引擎：AST 逐次化簡＋等價驗證');
check(/__N44_SELFTEST__/.test(html), 'Q1~Q10 逐題機械自檢輸出');
check(/activity-nav/.test(html) && /data-act=/.test(html) && /goToQuiz/.test(html), '標準活動膠囊導航與直通真題');
check(!/shellStem|shellOptions|class="opt"|option-btn|checkShellAnswer/.test(html), '教具內嚴禁私自重畫題幹與 4 選項');
check(/逐步算理/.test(html), '真題模式具備分步算理揭示');

/* N-4-4 升級守門：真題兩階段＋概念三道不同生活例題 */
check(/viz:\[/.test(html) && /steps:\[/.test(html), 'Q1~Q10 內建零劇透 viz 標籤與階段 B 兩步驟說明');
check(/diagramHTML\(d\.viz\)/.test(html), '真題條件圖只畫題目已知，嚴禁直接渲染中間量／正解');
check(/verifyCombo/.test(html) && /revealSteps/.test(html) && /comboPool/.test(html), '兩階段算式組合器：驗證算式＋看算理拆解');
check(/stepsBox'\)\.hidden=true/.test(html), '階段 B 初始隱藏，作答前不劇透逐步算理');
check(/28×3＋45/.test(html) && /\(120−32\)÷4/.test(html) && /84÷6×\(6−2\)/.test(html), '概念模式三活動使用三道不同生活例題');
check(!/鉛筆 15 元|360÷6÷5|240 條紙藤/.test(html), '概念例題與 N-4-3 完全區隔');
check(/a1Place/.test(html) && /pointerdown/.test(html), '活動一支援點擊槽位填入與拖曳雙操作');
const shell = fs.readFileSync(path.join(ROOT, 'app/shell.js'), 'utf8');
check(/"N-4-4":\s*"components\/two_step_adv_g4_lab\.html\?mode=concept"/.test(shell), '外殼註冊 N-4-4 觀念小教室映射');
check(/UNIT_CONCEPT_MOVIES/.test(shell) && !/"N-4-4":\s*"assets\/classroom_videos/.test(shell), '未掛載 N-4-4 微電影映射');

console.log(fail === 0 ? 'N44_STATIC_ALL_PASS — ALL PASS' : 'FAILED ' + fail);
process.exit(fail === 0 ? 0 : 1);
