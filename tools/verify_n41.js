/**
 * tools/verify_n41.js — G4-N-4-1 靜態契約閘門
 * 檢查 math-app-unit-v1 結構、10 題、4 選項、答案索引、題源、教具檔案、?
 * 任一失敗 Exit 1。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'data', 'units', 'G4', 'N-4-1.json');
const lab = path.join(root, 'app', 'components', 'place_value_g4_lab.html');
const fail = [];
const ok = (c, m) => { if (!c) fail.push(m); };

const u = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(u.$schema === 'math-app-unit-v1', '$schema 必須為 math-app-unit-v1');
ok(u.unit_id === 'G4-N-4-1', 'unit_id 錯誤');
ok(u.curriculum_code === 'N-4-1' && u.grade === 4, '課綱代碼/年級錯誤');
ok(u.question_count === 10 && u.questions.length === 10, '題數必須為 10');
ok(fs.existsSync(lab), '教具檔案不存在');
const html = fs.readFileSync(lab, 'utf8');
ok(!/100vh/.test(html), '嚴禁 100vh');
ok(/theme-tokens\.css/.test(html), '必須接入 theme-tokens.css');
ok(/margin:0;padding:8px;height:auto;min-height:0/.test(html), 'body 版面規格不符');
ok(/pointerdown/.test(html) && /pointerup/.test(html), '缺少真實指標事件');
ok(/URLSearchParams/.test(html) && /get\('q'\)/.test(html), '未提供 ?q 題庫聯動');

const ids = new Set();
u.questions.forEach((q, i) => {
  const n = i + 1;
  ok(!ids.has(q.id), 'Q' + n + ' id 重複'); ids.add(q.id);
  ok(q.choices.length === 4, 'Q' + n + ' 選項數不為 4');
  ok(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, 'Q' + n + ' answer_index 錯誤');
  ok(q.stem && q.stem.length >= 10, 'Q' + n + ' 題幹過短');
  ok(q.exam_source && /永安|獅湖|內湖/.test(q.exam_source), 'Q' + n + ' 缺少真實學校出處');
  ok(/p\d/.test(q.exam_source), 'Q' + n + ' 缺少 PDF 頁碼');
  ok(q.explanation && q.explanation.concept && Array.isArray(q.explanation.steps) && q.explanation.steps.length >= 3 && q.explanation.trap, 'Q' + n + ' 詳解不完整');
  ok(q.component === 'place_value_g4_lab', 'Q' + n + ' component 錯誤');
  ok(q.component_path === 'components/place_value_g4_lab.html?q=' + n, 'Q' + n + ' component_path 錯誤');
  ok(q.fallback_height === 420, 'Q' + n + ' fallback_height 錯誤');
});
const cur = JSON.parse(fs.readFileSync(path.join(root, 'data', 'curriculum.json'), 'utf8'));
const g4 = (cur.grades || cur.units || []).find((g) => g.grade === 4);
const n41 = g4 && g4.units.find((x) => x.code === 'N-4-1');
ok(n41 && n41.status === 'ready' && n41.question_count === 10, 'curriculum.json N-4-1 未同步為 ready/10');
ok(n41 && n41.component_path === 'components/place_value_g4_lab.html', 'curriculum.json component_path 未補');

if (fail.length) { console.error('FAIL ' + fail.length + ':\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('PASS verify_n41: 10 題 / 4 選項 / 真實出處 / 教具 / 課綱同步全綠');
process.exit(0);
