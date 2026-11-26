/**
 * tools/verify_n47.js — G4-N-4-7 靜態契約閘門
 *  A. 題庫 JSON：10 題 / 4 選項 / 真實出處 / check 真值與 answer_raw 一致
 *  B. 教具 HTML：四類真實視覺教具 / 概念三活動 / 語音與草稿保留 / 不自帶題幹選項 / 零劇透
 *  C. 註冊外套：shell.js 概念映射存在且 UNIT_CONCEPT_MOVIES 未被本單元改動
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

const unit = JSON.parse(fs.readFileSync(path.join(root, 'data/units/G4/N-4-7.json'), 'utf8'));
const lab = fs.readFileSync(path.join(root, 'app/components/decimal_hundredth_g4_lab.html'), 'utf8');
const shell = fs.readFileSync(path.join(root, 'app/shell.js'), 'utf8');

ok(unit.curriculum_code === 'N-4-7', 'curriculum_code 非 N-4-7');
ok(unit.grade === 4, 'grade 非 4');
ok(unit.question_count === 10 && unit.questions.length === 10, '題數非 10');
unit.questions.forEach((q, i) => {
  const n = i + 1;
  ok(q.id === 'G4-N-4-7-Q' + String(n).padStart(2, '0'), `Q${n} id 錯誤`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${n} 選項數非 4`);
  ok(Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4, `Q${n} answer_index 越界`);
  ok(typeof q.exam_source === 'string' && /國小/.test(q.exam_source) && /期末|期中/.test(q.exam_source), `Q${n} 缺真實出處`);
  ok(q.component === 'decimal_hundredth_g4_lab', `Q${n} component 錯誤`);
  ok(q.component_path === `components/decimal_hundredth_g4_lab.html?q=${n}`, `Q${n} component_path 錯誤`);
  ok(typeof q.stem === 'string' && q.stem.length > 8, `Q${n} 題幹過短`);
  ['concept', 'steps', 'trap', 'check'].forEach(k => ok(!!q.explanation && !!q.explanation[k], `Q${n} 缺 explanation.${k}`));
  ok(Array.isArray(q.explanation.steps) && q.explanation.steps.length === 3, `Q${n} steps 非 3 行`);
  try {
    const v = Function('"use strict";return (' + q.explanation.check + ')')();
    ok(Number.isFinite(v), `Q${n} check 非有限數`);
    ok(Math.abs(v - parseFloat(q.answer_raw)) < 2e-3, `Q${n} check 與 answer_raw 不一致：${v} vs ${q.answer_raw}`);
    ok(q.choices[q.answer_index].indexOf(String(Math.round(v * 100) / 100)) >= 0 || parseFloat(q.choices[q.answer_index]) === parseFloat(q.answer_raw), `Q${n} 正解選項與 check 不一致`);
  } catch (e) { fail.push(`Q${n} check 無法運算：${e.message}`); }
});
const schools = new Set(unit.questions.map(q => (q.exam_source.match(/(南湖|永安|獅湖|陽明)/) || [])[1]).filter(Boolean));
ok(schools.size >= 2, `真卷學校數不足：${schools.size}`);

/* 教具契約 */
['place', 'convert', 'compare', 'vertical'].forEach(t => ok(lab.includes(t + ':function()'), `教具缺視覺類型 ${t}`));
ok(lab.includes('__N47_SELFTEST__') && lab.includes('__N47_MODE__') && lab.includes('__N47_READY__'), '缺解析引擎掛載');
ok(lab.includes('THEME_CHANGE') && lab.includes('theme-tokens.css'), '缺雙主題串接');
ok(lab.includes('🔊 語音導讀') && lab.includes('📝 算草稿'), '未保留語音導讀或算草稿');
ok(lab.includes('🎒 活動一') && lab.includes('🐠 活動二') && lab.includes('🥛 活動三'), '概念三活動不足');
ok(!/prompt\s*:/.test(lab) && !/choices\s*:/.test(lab) && !lab.includes('shell-opt'), '教具自帶題幹或四選項');
ok(!/\.stem|\.opt\b|shell-opt/.test(lab), '教具殘留通用題幹／選項模板');
ok(!/overflow-y\s*:\s*auto/.test(lab), '教具含內部垂直捲軸');
ok(lab.includes('class="vgrid"') && lab.includes("'fin'") && lab.includes('cmp-tick') && lab.includes('class="frac"'), '缺直式格線／數線／分數結構');
ok(!/除夕|分之|7分之/.test(lab), '教具含國字分數寫法');

/* 註冊外套 */
ok(shell.includes('"N-4-7": "components/decimal_hundredth_g4_lab.html?mode=concept"'), 'shell.js 缺 N-4-7 概念映射');
ok(shell.includes('const UNIT_CONCEPT_MOVIES'), 'shell.js 缺 UNIT_CONCEPT_MOVIES');
ok(!/UNIT_CONCEPT_MOVIES[\s\S]{0,40}N-4-7/.test(shell), 'N-4-7 誤入 UNIT_CONCEPT_MOVIES');

if (fail.length) { console.error('FAIL verify_n47: ' + fail.length + ' 項未過\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('PASS verify_n47: 10 題契約/check 真值、四類真實教具、三活動、語音與草稿保留、零自帶題幹、註冊外套全綠');
process.exit(0);
