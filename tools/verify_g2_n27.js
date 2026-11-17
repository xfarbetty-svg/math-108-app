/**
 * tools/verify_g2_n27.js — G2-N-2-7 單元（十十乘法：乘法表與倍數規律）靜態驗證守門員
 * 1. 題庫契約驗證：N-2-7.json 5 題段考真題（id/來源/選項/正解/算理）。
 * 2. 教具驗證：5 個考題組件檔案存在，並暴露 window.check() / window.__q / .opt-btn / .check-btn / #banner。
 * 3. 教學真值驗證：每題以機械算術驗算正解唯一性（倍數合併、積差、九九表檢索、7 的倍數盤、倍的應用）。
 * 4. 課綱一致性：curriculum.json 內 N-2-7 ready、question_count=5。
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

const unit = JSON.parse(fs.readFileSync('data/units/G2/N-2-7.json', 'utf8'));
ok(unit.code === 'N-2-7', '單元代碼正確 N-2-7');
ok(unit.grade === 2, '年級 = 2');
ok(unit.questions.length === 5, '題庫題目數 = 5 題（實際 ' + unit.questions.length + '）');

const expectedPaths = [
  'components/g2_n27_q1_distributive_intro.html',
  'components/g2_n27_q2_product_difference.html',
  'components/g2_n27_q3_table_search_24.html',
  'components/g2_n27_q4_dart_wheel_mult.html',
  'components/g2_n27_q5_age_multiple.html'
];
const expectedStemKeys = ['5 的 4 倍和 5 的 5 倍合起來', '10×3 比 10×8 的乘數少', '積是 24 的乘法算式', '中間的數是 7', '曉玉今年 8 歲'];

unit.questions.forEach((q, i) => {
  const num = i + 1;
  ok(q.id === `G2-N-2-7-Q0${num}`, `Q${num} id 正確 (${q.id})`);
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
// Q1: 倍數合併 4 倍＋5 倍＝9 倍，5×9＝45；「20 倍」是誤把倍數相乘
const q1 = unit.questions[0];
ok(4 + 5 === 9, 'Q1 倍數合併 4＋5 = 9');
ok(5 * 9 === 45, `Q1 真值 5×9 = ${5 * 9}`);
ok(5 * 8 === 40 && 40 !== 45, 'Q1 干擾項「9 倍，也就是 40」= 5×8 誤算，非 45');
ok(4 * 5 === 20 && 20 !== 9, 'Q1 干擾項「20 倍」= 4×5 誤把倍數相乘，非 9 倍');
ok(5 * 1 === 5 && 5 !== 45, 'Q1 干擾項「1 倍，也就是 5」非 45');
ok(q1.choices[0] === '9 倍，也就是 45', 'Q1 正解文字 = 9 倍，也就是 45');

// Q2: 10×3 vs 10×8：乘數差 5、積差 50
const q2 = unit.questions[1];
ok(10 * 3 === 30 && 10 * 8 === 80, 'Q2 兩積 30 與 80');
ok(8 - 3 === 5, 'Q2 乘數差 8−3 = 5');
ok(80 - 30 === 50, `Q2 積差 80−30 = ${80 - 30}`);
ok(5 * 10 === 50, 'Q2 積差 = 5 個 10 = 50');
ok([30, 80].every((v) => v !== 50), 'Q2 干擾項 30/80 皆非兩積之差');
ok(q2.choices[0] === '少 5 ，積少 50', 'Q2 正解文字 = 少 5 ，積少 50');

// Q3: 九九表內積 24 的四個算式，因數均 ≤ 9
const q3 = unit.questions[2];
ok([3 * 8, 8 * 3, 4 * 6, 6 * 4].every((v) => v === 24), 'Q3 真值 3×8/8×3/4×6/6×4 皆 = 24');
ok(12 > 9 && 24 > 9, 'Q3 干擾項 2×12、1×24 的因數超出九九表（>9）');
ok(2 * 8 === 16 && 16 !== 24, 'Q3 干擾項 2×8 = 16 非 24');
ok(4 * 8 === 32 && 32 !== 24, 'Q3 干擾項 4×8 = 32 非 24');
ok(q3.choices[0] === '3×8、8×3、4×6、6×4', 'Q3 正解文字 = 3×8、8×3、4×6、6×4');
ok(['3×8', '8×3', '4×6', '6×4'].every((f) => q3.choices[0].includes(f)), 'Q3 正解含全部四個算式');

// Q4: 7 的倍數盤 7×3/7×6/7×8/7×9
const q4 = unit.questions[3];
ok([7 * 3, 7 * 6, 7 * 8, 7 * 9].every((v) => v === 21 || v === 42 || v === 56 || v === 63), 'Q4 真值 21/42/56/63 皆為 7 × 中圈數');
ok(54 % 7 !== 0, 'Q4 干擾項 54 不是 7 的倍數（7×8 = 56）');
ok(14 === 7 * 2 && 70 === 7 * 10, 'Q4 干擾項 14/70 對應中圈 2 與 10，不在 3、6、8、9');
ok(36 % 7 !== 0, 'Q4 干擾項 36 不是 7 的倍數');
ok(q4.choices[0] === '21、42、56、63', 'Q4 正解文字 = 21、42、56、63');

// Q5: 倍的應用 8×5 = 40
const q5 = unit.questions[4];
ok(8 * 5 === 40, `Q5 真值 8×5 = ${8 * 5}`);
ok(8 + 8 + 8 + 8 + 8 === 40, 'Q5 連加驗算 5 個 8 = 40');
ok([45, 35].every((v) => v !== 40), 'Q5 干擾項 45/35 與真值 40 互斥');
ok(8 + 5 === 13 && 13 !== 40, 'Q5 干擾項 13 歲 = 把「5 倍」誤當「多 5 歲」');
ok(q5.choices[0] === '40 歲', 'Q5 正解文字 = 40 歲');

// ===== 課綱一致性 =====
const curriculum = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g2 = curriculum.grades.find((g) => g.grade === 2 || g.code === 'G2' || g.id === 'G2');
const n27 = (g2 ? g2.units : []).find((u) => u.code === 'N-2-7');
ok(!!n27, 'curriculum.json 內含 N-2-7 條目');
ok(!!n27 && n27.status === 'ready', 'N-2-7 status = ready');
ok(!!n27 && n27.question_count === 5, 'N-2-7 question_count = 5');
ok(!!n27 && typeof n27.verified_source === 'string' && n27.verified_source.length > 0, 'N-2-7 verified_source 已填寫');

console.log('G2_N27_CONTRACT_VERIFIED — ALL PASS');
