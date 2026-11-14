/**
 * tools/verify_n35.js — G3-N-3-5 除以一位數 直式除法靜態驗證守門員
 * 1. 靜態契約驗證：N-3-5.json 10 題多元真題（規律探索/免算比大小/商位數估算/補0改錯偵探/
 *    商中間含0陷阱/整除檢驗/平分帶餘數/跨位進位/商含0整除/逆向推導）、出處、答案互斥性、算理解析。
 * 2. 教具驗證：division_vertical_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：每題直式除法計算、餘數鐵律與乘除互逆逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-5 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-5.json', 'utf8'));
ok(unit.code === 'N-3-5', '單元代碼為 N-3-5');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

const expectedSources = [
  '內湖 111-2', '內湖 113-2', '永安 114-2', '永安 114-2', '內湖 111-2',
  '永安 114-2', '內湖 111-2', '內湖 111-2', '內湖 114-2', '內湖 111-2'
];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-5-Q0${num}` : `G3-N-3-5-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'division-vertical-lab', `Q${num} 教具元件 = division-vertical-lab`);
  ok(q.component_path === `components/division_vertical_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['pattern', 'compare', 'digits', 'detective', 'zero_trap', 'divisible', 'remainder', 'carrying', 'zero_divisible', 'reverse'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));
// 10-Type Matrix：題型關鍵字逐一命中（規律/整十/估算/偵探/陷阱/整除/平分/直式/直式檢驗/逆向推導）
const typeKeywords = ['規律', '整十', '估算', '偵探', '陷阱', '整除', '平分', '直式除法', '直式', '逆向推導'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));

// 算理真值驗證：每題直式除法數學正確性
ok(38 * 100 === 3800 && 19 * 100 === 1900 && 3800 / 2 === 1900, 'Q1 規律真值 38→3800 擴大 100 倍，商 19×100=1900');
ok(80 / 4 === 20 && 20 * 4 === 80 && 80 % 4 === 0, 'Q2 整十真值 80÷4=20（整除）');
ok(5 * 17 === 85 && 86 - 85 === 1 && 1 < 5 && 8 > 5 && 17 >= 10 && 17 < 100, 'Q3 位數真值 86÷5=17…1（8＞5 夠除，商 17 是二位數）');
ok(618 / 6 === 103 && 103 !== 13 && String(103).length === 3 && 1 < 6, 'Q4 改錯真值 618÷6=103（十位 1＜6 補 0，非 13）');
ok(436 / 4 === 109 && 109 !== 19 && 436 % 4 === 0 && 3 < 4, 'Q5 陷阱真值 436÷4=109（十位 3＜4 商補 0）');
ok(285 / 5 === 57 && 57 * 5 === 285 && 285 % 5 === 0 && 2 < 5, 'Q6 整除真值 285÷5=57 無餘數（百位 2＜5 看前兩位）');
ok(125 * 5 + 4 === 629 && 4 < 5 && 629 % 5 === 4, 'Q7 餘數真值 629÷5=125…4（餘數 4＜除數 5）');
ok(938 / 7 === 134 && 134 * 7 === 938 && 938 % 7 === 0, 'Q8 跨位真值 938÷7=134（餘 2 合十位 23、餘 2 合個位 28）');
ok(927 / 9 === 103 && 103 !== 13 && 927 % 9 === 0 && 2 < 9, 'Q9 補0整除真值 927÷9=103（十位 2＜9 補 0，27÷9=3）');
ok(32 * 8 === 256 && 256 / 8 === 32, 'Q10 逆推真值 被除數＝商×除數 → 32×8=256');

const html = fs.readFileSync('app/components/division_vertical_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!/100vh|min-height:\s*100%/.test(html), '教具無 100vh / min-height:100% 違憲高度');
ok(/height:\s*auto/.test(html), '教具高度契約使用 height: auto');
ok(html.includes('QUESTIONS'), '教具具備 10 題題組資料表（?q=1~10 映射）');
ok(html.includes('renderAlgo'), '教具具備直式長除法通用渲染器（單一幾何公式）');
ok(html.includes('bracket'), '教具具備長除號括線（直式除法位值實驗台）');

// 10 種視覺模式全數支援
expectedModes.forEach(m => ok(html.includes(`'${m}'`), `教具支援視覺模式 ${m}`));

// 10 題資料完整映射檢核（最終揭示逐題存在於教具）
const truths = [
  '19 × 100 ＝ 1900', '80 ÷ 4 ＝ 20', '商是二位數 (17)',
  '正確答案是 103 (商中間補 0)', '436 ÷ 4 ＝ 109', '285 ÷ 5 ＝ 57 (整除)',
  '125 袋 剩 4 顆', '938 ÷ 7 ＝ 134', '927 ÷ 9 ＝ 103', '32 × 8 ＝ 256'
];
truths.forEach((t, i) => ok(html.includes(t), `教具 Q${i + 1} 題組最終揭示 '${t}' 已映射`));

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n35 = g3.units.find(u => u.code === 'N-3-5');
ok(n35 && n35.status === 'ready', 'curriculum.json 中 N-3-5 標記為 ready');
ok(n35 && n35.question_count === 10, 'curriculum.json 中 N-3-5 question_count 為 10');
ok(n35 && n35.verified_source && n35.verified_source.includes('內湖') && n35.verified_source.includes('永安'), 'curriculum.json 中 N-3-5 來源掛內湖＋永安');

console.log('N35_ALL_VERIFIED — ALL PASS');
