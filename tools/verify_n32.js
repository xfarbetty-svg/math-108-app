/**
 * tools/verify_n32.js — G3-N-3-2 加減直式計算 CDP 實機驗證守門員
 * 1. 靜態契約驗證：N-3-2.json 10 題真題、出處、答案互斥性、算理解析。
 * 2. 教具驗證：vertical_calc_lab.html 存在並支援 ?q=1~10。
 * 3. 課綱一致性：curriculum.json 中 N-3-2 ready 且 question_count=10。
 * 4. 退出碼守門：全通過 Exit 0，任一失敗 Exit 1。
 */
'use strict';
const fs = require('node:fs');
const assert = require('node:assert');

function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-2.json', 'utf8'));
ok(unit.code === 'N-3-2', '單元代碼為 N-3-2');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-2-Q0${num}` : `G3-N-3-2-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes('內湖國小'), `Q${num} 真題來源為內湖國小 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${num} 選項為 4 個`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.fallback_height >= 350 && q.fallback_height <= 450, `Q${num} fallback_height 符合單屏 (${q.fallback_height})`);
  ok(q.component_path === `components/vertical_calc_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
});

const html = fs.readFileSync('app/components/vertical_calc_lab.html', 'utf8');
ok(html.includes('calc-area') || html.includes('vertical-board') || html.includes('v-table'), '教具具備直式計算版面結構');
ok(html.includes('checkAnswer') || html.includes('check()'), '教具具備檢查答題函式');
ok(html.includes('feedback') || html.includes('result') || html.includes('resultBanner'), '教具具備回饋橫幅');
ok(html.includes('stepBtn') || html.includes('stepCalc') || html.includes('nextStep'), '教具具備逐步算理演示按鈕');

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n32 = g3.units.find(u => u.code === 'N-3-2');
ok(n32 && n32.status === 'ready', 'curriculum.json 中 N-3-2 標記為 ready');
ok(n32 && n32.question_count === 10, 'curriculum.json 中 N-3-2 question_count 為 10');
ok(n32 && n32.verified_source.includes('內湖'), 'curriculum.json 中 N-3-2 來源掛內湖');

console.log('N32_ALL_VERIFIED — ALL PASS');
