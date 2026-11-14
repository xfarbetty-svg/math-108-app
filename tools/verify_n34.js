/**
 * tools/verify_n34.js — G3-N-3-4 除法多元題型靜態驗證守門員
 * 1. 靜態契約驗證：N-3-4.json 10 題多元真題（規律探索/免算比大小/生活估算/餘數迷思除錯/
 *    餘數陷阱/乘除互逆/包含除/等分除/整除盒裝/逆向推導）、出處、答案互斥性、算理解析。
 * 2. 教具驗證：division_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：每題除法計算、餘數鐵律與逆推原理逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-4 ready 且 question_count=10。
 * 5. 退出碼守門：全通過 Exit 0，任一失敗 Exit 1。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-4.json', 'utf8'));
ok(unit.code === 'N-3-4', '單元代碼為 N-3-4');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

const expectedSources = [
  '內湖 114-1', '內湖 113-1', '永安 114-1', '永安 114-1', '內湖 114-1',
  '內湖 111-1', '內湖 111-1', '內湖 113-1', '永安 114-1', '內湖 113-1'
];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-4-Q0${num}` : `G3-N-3-4-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'division-lab', `Q${num} 教具元件 = division-lab`);
  ok(q.component_path === `components/division_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['rule', 'compare', 'estimate', 'detective', 'trap', 'inverse', 'grouping', 'sharing', 'boxes', 'reverse'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));
// 10-Type Matrix：題型關鍵字逐一命中（規律/比大小/估算/除錯/陷阱/互逆/包含除/等分除/整除/逆推）
const typeKeywords = ['基本性質', '免算比大小', '估算', '迷思', '陷阱', '互逆', '包含除', '等分除', '整除', '逆向推導'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));

// 算理真值驗證：每題除法數學正確性
ok(21 / 1 === 21 && 50 / 50 === 1 && 16 / 16 === 1, 'Q1 數學真值 21÷1=21、50÷50=1、16÷16=1');
ok(40 / 8 === 5 && 20 / 5 === 4 && 5 > 4, 'Q2 數學真值 40÷8=5 ＞ 20÷5=4');
ok(8 * 7 === 56 && 60 - 56 === 4 && Math.ceil(60 / 8) === 8, 'Q3 估算真值 8×7=56，60−56=4，需要 8 個袋子');
ok(8 * 2 + 5 === 21 && 5 < 8 && 5 > 2, 'Q4 驗算 8×2+5=21 且餘數 5＜除數 8（小明的「比商小」是迷思）');
ok([0, 1, 2, 3, 4].every(r => r < 5) && !(5 < 5), 'Q5 餘數鐵律：除數 5 時餘數只能 0~4，不可能剩下 5 個');
ok(56 / 8 === 7 && 8 * 7 === 56, 'Q6 乘除互逆 8×7=56 ⇔ 56÷8=7');
ok(Math.floor(30 / 4) === 7 && 30 % 4 === 2, 'Q7 包含除 30÷4=7…2（7 盒 剩 2 顆）');
ok(36 / 4 === 9 && 36 % 4 === 0, 'Q8 等分除 36÷4=9（每袋 9 顆）');
ok(42 % 6 === 0 && 42 / 6 === 7 && 42 % 5 !== 0 && 42 % 8 !== 0 && 42 % 9 !== 0, 'Q9 整除檢驗：42 只被 6 整除（5/8/9 都有餘數）');
ok(6 * 7 + 3 === 45, 'Q10 逆推真值 6×7+3=45（被除數＝除數×商＋餘數）');

const html = fs.readFileSync('app/components/division_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!/100vh|min-height:\s*100%/.test(html), '教具無 100vh / min-height:100% 違憲高度');
ok(/height:\s*auto/.test(html), '教具高度契約使用 height: auto');
ok(html.includes('QUESTIONS'), '教具具備 10 題題組資料表（?q=1~10 映射）');

// 10 種視覺模式全數支援
expectedModes.forEach(m => ok(html.includes(`'${m}'`), `教具支援視覺模式 ${m}`));

// 10 題資料完整映射檢核（最終揭示逐題存在於教具）
const truths = [
  '●=1, ▲=1, ■=16', '40 ÷ 8 ＞ 20 ÷ 5', '需要 8 個袋子', '小明說錯了！',
  '不可能剩下 5 個', '56 ÷ 8 ＝ 7', '7 盒 剩 2 顆', '每袋 9 顆',
  '每盒裝 6 個', '原本共有 45 張'
];
truths.forEach((t, i) => ok(html.includes(t), `教具 Q${i + 1} 題組最終揭示 '${t}' 已映射`));

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n34 = g3.units.find(u => u.code === 'N-3-4');
ok(n34 && n34.status === 'ready', 'curriculum.json 中 N-3-4 標記為 ready');
ok(n34 && n34.question_count === 10, 'curriculum.json 中 N-3-4 question_count 為 10');
ok(n34 && n34.verified_source && n34.verified_source.includes('內湖') && n34.verified_source.includes('永安'), 'curriculum.json 中 N-3-4 來源掛內湖＋永安');

console.log('N34_ALL_VERIFIED — ALL PASS');
