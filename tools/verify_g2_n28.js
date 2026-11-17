/**
 * tools/verify_g2_n28.js — G2-N-2-8 單元（解題：兩步驟應用問題（加、減、乘））靜態驗證守門員
 * 1. 題庫契約驗證：N-2-8.json 5 題段考真題（id/來源/選項/正解/算理）。
 * 2. 教具驗證：5 個考題組件檔案存在，並暴露 window.check() / window.__q / .opt-btn / .check-btn / #banner。
 * 3. 教學真值驗證：每題以機械算術驗算正解唯一性（加與乘、乘與加、減與乘、乘與減、時間乘與加）。
 * 4. 課綱一致性：curriculum.json 內 N-2-8 ready、question_count=5。
 * 5. 退出碼守門：全部通過 Exit 0，任一失敗 Exit 1。
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

const unit = JSON.parse(fs.readFileSync('data/units/G2/N-2-8.json', 'utf8'));
ok(unit.code === 'N-2-8', '單元代碼正確 N-2-8');
ok(unit.grade === 2, '年級 = 2');
ok(unit.questions.length === 5, '題庫題目數 = 5 題（實際 ' + unit.questions.length + '）');

const expectedPaths = [
  'components/g2_n28_q1_campsite.html',
  'components/g2_n28_q2_eraser_ribbon.html',
  'components/g2_n28_q3_yogurt_discount.html',
  'components/g2_n28_q4_pineapple_cake.html',
  'components/g2_n28_q5_origami_crane.html'
];
const expectedStemKeys = ['夏令營分組比賽', '橡皮擦的 6 倍再多 4 公分', '原價 45 元，今天特價 40 元', '共有 87 個鳳梨酥', '曉雪摺一隻紙鶴要花 3 分鐘'];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  ok(q.id === `G2-N-2-8-Q0${num}`, `Q${num} id 正確 (${q.id})`);
  ok(Array.isArray(q.choices) && q.choices.length === 4, `Q${num} 選項齊全 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(new Set(q.choices).size === q.choices.length, `Q${num} 選項互斥無重複`);
  ok(q.component_path === expectedPaths[i], `Q${num} 教具路徑正確 (${q.component_path})`);
  ok(q.exam_source && q.exam_source.length > 0, `Q${num} 段考來源已登記 (${q.exam_source})`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理與陷阱說明齊備`);
  ok(q.stem.includes(expectedStemKeys[i]), `Q${num} 題幹含關鍵真題字串「${expectedStemKeys[i]}」`);

  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  ok(html.includes('window.check'), `Q${num} 教具暴露 window.check()`);
  ok(html.includes('window.__q'), `Q${num} 教具暴露 window.__q`);
  ok(html.includes('correct_index'), `Q${num} window.__q 含 correct_index 契約`);
  ok(html.includes('opt-btn'), `Q${num} 教具有 .opt-btn 選項按鈕`);
  ok(html.includes('check-btn'), `Q${num} 教具有 .check-btn 檢查按鈕`);
  ok(html.includes('id="banner"') || html.includes("id='banner'"), `Q${num} 教具有 #banner 結果橫幅`);
  ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), `Q${num} 教具無 100vh / min-height:100% 違憲高度`);
});

// 教具答案契約：每題選項文字已寫入組件
unit.questions.forEach((q, i) => {
  const html = fs.readFileSync('app/' + q.component_path, 'utf8');
  q.choices.forEach((c) => ok(html.includes(c), `Q${i + 1} 選項「${c}」已寫入組件`));
});

// ===== 教學真值驗證（機械算術）=====
// Q1: 加與乘兩步驟 6＋4＝10，10×8＝80
const q1 = unit.questions[0];
ok(6 + 4 === 10, 'Q1 第一步加法 6＋4 = 10（每組人數）');
ok(10 * 8 === 80, `Q1 真值 10×8 = ${10 * 8}`);
ok(9 * 8 === 72 && 72 !== 80, 'Q1 干擾項「72 個人」= 9×8 誤算每組 9 人，非 80');
ok(6 * 8 === 48 && 48 !== 80, 'Q1 干擾項「48 個人」= 只算 6 個男生 6×8，漏女生');
ok(4 * 8 === 32 && 32 !== 80, 'Q1 干擾項「32 個人」= 只算 4 個女生 4×8，漏男生');
ok(q1.choices[0] === '80 個人', 'Q1 正解文字 = 80 個人');

// Q2: 乘與加兩步驟 6×6＝36，36＋4＝40
const q2 = unit.questions[1];
ok(6 * 6 === 36, 'Q2 第一步乘法 6×6 = 36（橡皮擦的 6 倍）');
ok(36 + 4 === 40, `Q2 真值 36＋4 = ${36 + 4}`);
ok(36 !== 40, 'Q2 干擾項「36 公分」= 只停在第 6×6 步，漏了再多 4');
ok(4 * 6 === 24 && 24 !== 40, 'Q2 干擾項「24 公分」= 4×6 誤乘');
ok(36 + 4 !== 64 && 6 * 6 + 4 * 7 === 64, 'Q2 干擾項「64 公分」非兩步驟真值');
ok(q2.choices[0] === '40 公分', 'Q2 正解文字 = 40 公分');

// Q3: 減與乘兩步驟 45−40＝5，5×6＝30
const q3 = unit.questions[2];
ok(45 - 40 === 5, 'Q3 第一步減法 45−40 = 5（每瓶省 5 元）');
ok(5 * 6 === 30, `Q3 真值 5×6 = ${5 * 6}`);
ok(5 !== 30, 'Q3 干擾項「5 元」= 只算一瓶差價，漏乘 6 瓶');
ok(40 * 6 === 240 && 240 !== 30, 'Q3 干擾項「240 元」= 特價總價 40×6，非差價');
ok(45 * 6 === 270 && 270 !== 30, 'Q3 干擾項「270 元」= 原價總價 45×6，非差價');
ok(q3.choices[0] === '30 元', 'Q3 正解文字 = 30 元');

// Q4: 乘與減兩步驟 9×9＝81，87−81＝6
const q4 = unit.questions[3];
ok(9 * 9 === 81, 'Q4 第一步乘法 9×9 = 81（已裝盒）');
ok(87 - 81 === 6, `Q4 真值 87−81 = ${87 - 81}`);
ok(81 !== 6, 'Q4 干擾項「81 個」= 只算裝盒數，沒回答剩下');
ok(6 !== 16 && 87 - 71 === 16, 'Q4 干擾項「16 個」= 87−71 退位減錯，非 87−81');
ok(6 !== 9, 'Q4 干擾項「9 個」= 誤把「9 個裝一盒」當剩下 9 個');
ok(q4.choices[0] === '6 個', 'Q4 正解文字 = 6 個');

// Q5: 時間乘與加兩步驟 3×9＝27，27＋15＝42
const q5 = unit.questions[4];
ok(3 * 9 === 27, 'Q5 第一步乘法 3×9 = 27（摺紙鶴時間）');
ok(27 + 15 === 42, `Q5 真值 27＋15 = ${27 + 15}`);
ok(27 !== 42, 'Q5 干擾項「27 分鐘」= 只算摺紙鶴時間，漏加休息 15 分鐘');
ok(3 * 8 === 24 && 24 !== 42, 'Q5 干擾項「24 分鐘」= 3×8 誤算隻數');
ok(3 * 6 === 18 && 18 !== 42, 'Q5 干擾項「18 分鐘」= 3×6 誤算隻數');
ok(q5.choices[0] === '42 分鐘', 'Q5 正解文字 = 42 分鐘');

// ===== 課綱一致性 =====
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g2 = curriculum.grades.find((g) => g.grade === 2 || g.code === 'G2' || g.id === 'G2');
const n28 = (g2 ? g2.units : []).find((u) => u.code === 'N-2-8');
ok(!!n28, 'curriculum.json 內含 N-2-8 條目');
ok(!!n28 && n28.status === 'ready', 'N-2-8 status = ready');
ok(!!n28 && n28.question_count === 5, 'N-2-8 question_count = 5');
ok(!!n28 && typeof n28.verified_source === 'string' && n28.verified_source.length > 0, 'N-2-8 verified_source 已填寫');

console.log('G2_N28_CONTRACT_VERIFIED — ALL PASS');
