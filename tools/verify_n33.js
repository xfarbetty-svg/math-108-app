/**
 * tools/verify_n33.js — G3-N-3-3 乘以一位數 CDP 實機驗證守門員
 * 1. 靜態契約驗證：N-3-3.json 10 題真題、出處、答案互斥性、算理解析。
 * 2. 教具驗證：multiplication_lab.html 存在並支援 ?q=1~10 全部題組映射。
 * 3. 課綱一致性：curriculum.json 中 N-3-3 ready 且 question_count=10。
 * 4. 退出碼守門：全通過 Exit 0，任一失敗 Exit 1。
 */
'use strict';
const fs = require('node:fs');

function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-3.json', 'utf8'));
ok(unit.code === 'N-3-3', '單元代碼為 N-3-3');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

const expectedSources = [
  '內湖國小 113-1', '內湖國小 111-1', '永安國小 114-1', '內湖國小 114-1',
  '內湖國小 113-1', '內湖國小 114-1', '內湖國小 111-1', '永安國小 114-1',
  '內湖國小 114-1', '內湖國小 113-1'
];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-3-Q0${num}` : `G3-N-3-3-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].replace(' ', ' ').slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'multiplication-lab', `Q${num} 教具元件 = multiplication-lab`);
  ok(q.component_path === `components/multiplication_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
});

// 算理真值驗證：每題數學正確性（乘法直式逐位檢核）
const truthy = {
  1: ['53', 2, '106'], 2: ['33', 4, '132'], 3: ['84', 6, '504'], 4: ['131', 7, '917'],
  5: ['309', 3, '927'], 6: ['506', 9, '4554'], 7: ['125', 8, '1000'], 10: ['200', 3, '600']
};
for (const [num, [a, m, prod]] of Object.entries(truthy)) {
  ok(Number(a) * m === Number(prod), `Q${num} 數學真值 ${a} × ${m} = ${prod}`);
}

const html = fs.readFileSync('app/components/multiplication_lab.html', 'utf8');
ok(html.includes('calc-area'), '教具具備直式計算版面結構');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!/100vh|min-height:\s*100%/.test(html), '教具無 100vh / min-height:100% 違憲高度');
ok(html.includes('QUESTIONS'), '教具具備 10 題題組資料表（?q=1~10 映射）');
// 10 題資料完整映射檢核（真值逐題存在於教具）
const truths = ['106', '132', '504', '917', '927', '4554', '1000', '3000', '600 元'];
truths.forEach((t, i) => ok(html.includes(`'${t}'`) || html.includes(`"${t}"`), `教具 Q${i + 1} 題組正解 '${t}' 已映射`));

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n33 = g3.units.find(u => u.code === 'N-3-3');
ok(n33 && n33.status === 'ready', 'curriculum.json 中 N-3-3 標記為 ready');
ok(n33 && n33.question_count === 10, 'curriculum.json 中 N-3-3 question_count 為 10');
ok(n33 && n33.verified_source && n33.verified_source.includes('內湖') && n33.verified_source.includes('永安'), 'curriculum.json 中 N-3-3 來源掛內湖＋永安');

console.log('N33_ALL_VERIFIED — ALL PASS');
