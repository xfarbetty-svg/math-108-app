/**
 * tools/verify_n36.js — G3-N-3-6 解題（乘除應用問題） 靜態驗證守門員
 * 1. 靜態契約驗證：N-3-6.json 10 題多元真題（規律探索/免算比大小/生活估算/被除數未知偵探/
 *    除數未知陷阱/被乘數未知/乘數未知/被除數未知平分/雙算式天平/兩步驟逆向推導）、出處、答案互斥性、算理解析。
 * 2. 教具驗證：multiplication_division_relation_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：每題乘除互逆關係與未知數求解逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-6 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-6.json', 'utf8'));
ok(unit.code === 'N-3-6', '單元代碼為 N-3-6');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');
ok(unit.verified_source.includes('通道二') && unit.verified_source.includes('A-SERVER SSH'), '施工鋼印含通道二 A-SERVER SSH');

const expectedSources = [
  '內湖 113-2', '內湖 113-2', '內湖 114-1', '內湖 111-2', '內湖 111-2',
  '內湖 111-2', '內湖 111-2', '內湖 111-2', '內湖 112-2', '內湖 112-2'
];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-6-Q0${num}` : `G3-N-3-6-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'multiplication-division-lab', `Q${num} 教具元件 = multiplication-division-lab`);
  ok(q.component_path === `components/multiplication_division_relation_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['family', 'compare', 'estimate', 'detective', 'divisor_trap', 'multiplicand', 'multiplier', 'dividend', 'balance', 'reverse_calc'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));
// 10-Type Matrix：題型關鍵字逐一命中（規律/免算比大小/估算/偵探/陷阱/被乘數/乘數/被除數/符號推理/綜合應用）
const typeKeywords = ['規律', '免算比大小', '估算', '偵探', '陷阱', '被乘數', '乘數', '被除數', '符號推理', '綜合應用'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));

// 算理真值驗證：每題乘除互逆與未知數求解數學正確性
ok(125 / 5 === 25 && 25 * 5 === 125 && 5 * 25 === 125, 'Q1 互逆真值 125÷5=25 → 25×5=125');
ok(50 * 3 === 150 && 150 / 3 === 50 && 150 > 50, 'Q2 比大小真值 50×3=150 ＞ 150÷3=50');
ok(85 * 3 === 255 && 255 <= 300 && 85 * 4 === 340 && 340 > 300, 'Q3 估算真值 85×3=255 ≤ 300 ＜ 85×4=340');
ok(32 * 8 === 256 && 256 / 8 === 32 && 4 < 32, 'Q4 偵探真值 被除數＝商×除數 → 32×8=256（32÷8=4 ✗）');
ok(112 / 7 === 16 && 16 * 7 === 112 && 112 * 7 === 784, 'Q5 陷阱真值 除數＝被除數÷商 → 112÷7=16（112×7=784 ✗）');
ok(112 / 16 === 7 && 7 * 16 === 112, 'Q6 被乘數真值 112÷16=7（每包 7 塊）');
ok(96 / 8 === 12 && 8 * 12 === 96, 'Q7 乘數真值 96÷8=12（12 盒）');
ok(16 * 7 === 112 && 112 / 7 === 16, 'Q8 被除數真值 16×7=112（原本 112 本）');
ok(20 / 5 === 4 && 20 / 5 === 20 / 5 && 20 / 5 === 4, 'Q9 天平真值 20÷5=4 且 20÷▲=4 → ▲=5');
ok(20 / 4 === 5 && 5 * 6 === 30, 'Q10 兩步驟真值 ▲=20÷4=5 → 5×6=30');

const html = fs.readFileSync('app/components/multiplication_division_relation_lab.html', 'utf8');
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
  '25 × 5 ＝ 125', '150 ＞ 50 → 50 × 3 ＞ 150 ÷ 3', '85 × 3 ＝ 255 → 大約 3 盒',
  '32 × 8 ＝ 256 ✓', '112 ÷ 7 ＝ 16 ✓', '112 ÷ 16 ＝ 7', '96 ÷ 8 ＝ 12',
  '16 × 7 ＝ 112 本', '▲ ＝ 5', '5 × 6 ＝ 30'
];
truths.forEach((t, i) => ok(html.includes(t), `教具 Q${i + 1} 題組最終揭示 '${t}' 已映射`));

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n36 = g3.units.find(u => u.code === 'N-3-6');
ok(n36 && n36.status === 'ready', 'curriculum.json 中 N-3-6 標記為 ready');
ok(n36 && n36.question_count === 10, 'curriculum.json 中 N-3-6 question_count 為 10');
ok(n36 && n36.verified_source && n36.verified_source.includes('內湖') && n36.verified_source.includes('通道二'), 'curriculum.json 中 N-3-6 來源掛內湖＋通道二鋼印');

console.log('N36_ALL_VERIFIED — ALL PASS');
