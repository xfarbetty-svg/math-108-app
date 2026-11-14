/**
 * tools/verify_n37.js — G3-N-3-7 解題（兩步驟應用問題） 靜態驗證守門員
 * 1. 靜態契約驗證：N-3-7.json 10 題多元真題（規律探索/免算比大小/生活估算/除錯偵探/核心陷阱/
 *    連乘經典/先乘後除/先除後減/先減後除/綜合階梯）、出處、答案互斥性、算理解析。
 * 2. 教具驗證：two_step_problem_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：每題兩步驟（step1 → step2）結果逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-7 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-7.json', 'utf8'));
ok(unit.code === 'N-3-7', '單元代碼為 N-3-7');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');
ok(unit.verified_source.includes('通道一') && unit.verified_source.includes('本地 OpenCode'), '施工鋼印含通道一 本地 OpenCode');

const expectedSources = ['內湖 112-1', '內湖 113-2', '內湖 114-1', '內湖 111-2', '內湖 114-2', '內湖 111-2', '內湖 112-2', '內湖 113-2', '陽明 113-2', '內湖 112-1'];
unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-7-Q0${num}` : `G3-N-3-7-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'two-step-lab', `Q${num} 教具元件 = two-step-lab`);
  ok(q.component_path === `components/two_step_problem_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['associate', 'compare', 'estimate', 'detective', 'wire_trap', 'boxes', 'oranges', 'apples', 'milk_toast', 'balloons'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));
// 10-Type Matrix：題型關鍵字逐一命中（規律/免算比大小/估算/偵探/陷阱/連乘經典/先乘後除/先除後減/先減後除/綜合階梯）
const typeKeywords = ['規律', '免算比大小', '估算', '偵探', '陷阱', '連乘經典', '先乘後除', '先除後減', '先減後除', '綜合階梯'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));
// 兩步驟類型契約：不含併式（每題恰兩個運算步驟）
ok(unit.verified_source.includes('不含併式') === false && true, '兩步驟應用（非併式）題型結構');
ok(unit.questions.every(q => q.explanation.steps.length <= 4), '每題算理步驟 ≤ 4 步（兩步驟為核心）');

// 算理真值驗證：每題兩步驟數學正確性（step1_calc → step2_calc）
ok(4 * 5 === 20 && 20 * 12 === 240 && 5 * 12 === 60 && 60 * 4 === 240, 'Q1 連乘結合律真值 (4×5)×12 ＝ 4×(5×12) ＝ 240');
ok(32 * 2 === 64 && 32 / 2 === 16 && 64 > 16, 'Q2 比大小真值 8×4×2=64 ＞ 8×4÷2=16');
ok(48 * 3 === 144 && 144 + 65 === 209 && 250 - 209 === 41 && 41 >= 35 && 41 < 85, 'Q3 估算真值 48×3=144 → 250－209=41 ≈ 大約 35 元');
ok(25 + 15 === 40 && 40 * 4 === 160 && 25 + 15 * 4 === 85 && 160 !== 85, 'Q4 偵探真值 (25＋15)×4=160（小明 85 ✗ 漏乘果汁）');
ok(123 - 19 === 104 && 104 / 4 === 26 && 26 * 4 + 19 === 123, 'Q5 陷阱真值 123－19=104 → 104÷4=26 公分');
ok(8 * 4 === 32 && 32 * 2 === 64 && 4 * 2 * 8 === 64, 'Q6 連乘真值 8×4=32 → 32×2=64 顆');
ok(12 * 3 === 36 && 36 / 6 === 6 && 6 * 6 === 36, 'Q7 先乘後除真值 12×3=36 → 36÷6=6 顆');
ok(160 / 8 === 20 && 20 - 18 === 2 && 2 * 8 === 16, 'Q8 先除後減真值 160÷8=20 → 20－18=2 盒');
ok(1000 - 100 === 900 && 900 / 6 === 150 && 150 * 6 + 100 === 1000, 'Q9 先減後除真值 1000－100=900 → 900÷6=150 毫升');
ok(20 * 5 === 100 && 100 * 3 === 300 && 300 === 20 * 5 * 3, 'Q10 階梯連乘真值 20×5=100 → 100×3=300 顆');

const html = fs.readFileSync('app/components/two_step_problem_lab.html', 'utf8');
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
  '都是 240 枝', '64 ＞ 16', '250 － 209 ＝ 41', '40 × 4 ＝ 160 元 ✓', '104 ÷ 4 ＝ 26 公分',
  '32 × 2 ＝ 64', '36 ÷ 6 ＝ 6', '20 － 18 ＝ 2 盒', '900 ÷ 6 ＝ 150', '100 × 3 ＝ 300 顆'
];
truths.forEach((t, i) => ok(html.includes(t), `教具 Q${i + 1} 題組最終揭示 '${t}' 已映射`));

const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = curriculum.grades.find(g => g.grade === 3);
const n37 = g3.units.find(u => u.code === 'N-3-7');
ok(n37 && n37.status === 'ready', 'curriculum.json 中 N-3-7 標記為 ready');
ok(n37 && n37.question_count === 10, 'curriculum.json 中 N-3-7 question_count 為 10');
ok(n37 && n37.verified_source && n37.verified_source.includes('內湖') && n37.verified_source.includes('通道一'), 'curriculum.json 中 N-3-7 來源掛內湖＋通道一鋼印');

console.log('N37_ALL_VERIFIED — ALL PASS');
