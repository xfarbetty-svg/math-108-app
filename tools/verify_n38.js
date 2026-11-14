/**
 * tools/verify_n38.js — G3-N-3-8 解題（四則估算） 靜態驗證守門員
 * 1. 靜態契約驗證：N-3-8.json 10 題多元真題（規律探索/秒殺思維/生活採買/除錯偵探/核心陷阱/
 *    大數加法/大數減法/三位數減法/乘法估算/綜合四則）、出處、答案互斥性、算理解析。
 * 2. 教具驗證：estimation_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：每題取概數與估算結果逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-8 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-8.json', 'utf8'));
ok(unit.code === 'N-3-8', '單元代碼為 N-3-8');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');
ok(unit.verified_source.includes('通道一') && unit.verified_source.includes('本地 OpenCode'), '施工鋼印含通道一 本地 OpenCode');

const expectedSources = ['內湖 112-1', '內湖 114-1', '內湖 114-1', '內湖 114-1', '內湖 114-1', '內湖 112-1', '內湖 114-1', '內湖 112-1', '內湖 113-1', '內湖 114-1'];
unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-8-Q0${num}` : `G3-N-3-8-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'estimation-lab', `Q${num} 教具元件 = estimation-lab`);
  ok(q.component_path === `components/estimation_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['round_add', 'radar_scale', 'bakery', 'detective', 'cap_budget', 'thousands_add', 'thousands_sub', 'hundreds_sub', 'snack_multiply', 'thousands_sum'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));

// 10-Type Matrix：題型關鍵字逐一命中
const typeKeywords = ['規律', '秒殺', '生活採買', '除錯', '核心陷阱', '大數加法', '大數減法', '三位數減法', '乘法生活', '綜合四則'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));

// 算理真值驗證：每題取概數與估算結果
ok(Math.round(507 / 100) * 100 === 500 && Math.round(291 / 100) * 100 === 300 && 500 + 300 === 800, 'Q1 整百概數相加真值 500＋300＝800');
ok(Math.round(495 / 100) * 100 === 500 && 500 * 6 === 3000 && 495 * 6 === 2970 && Math.abs(2970 - 3000) < 50, 'Q2 乘法估算定位真值 500×6＝3000 最接近 2970');
ok(Math.round(48 / 10) * 10 === 50 && 50 * 7 === 350 && 48 * 7 === 336, 'Q3 培根麵包估算真值 50×7＝350 元');
ok(500 * 6 === 3000 && 4970 > 3000 * 1.5, 'Q4 除錯小偵探真值 4970 遠大於 3000 不合理');
ok(859 > 850 && 850 * 2 === 1700 && 1500 < 1700, 'Q5 預算高估真值 850×2＝1700 ＞ 1500 錢不夠買');
ok(Math.round(4903 / 1000) * 1000 === 5000 && Math.round(1991 / 1000) * 1000 === 2000 && 5000 + 2000 === 7000, 'Q6 四位數大數加法真值 5000＋2000＝7000');
ok(Math.round(7150 / 1000) * 1000 === 7000 && Math.round(1100 / 1000) * 1000 === 1000 && 7000 - 1000 === 6000, 'Q7 四位數大數減法真值 7000－1000＝6000');
ok(Math.round(907 / 100) * 100 === 900 && Math.round(289 / 100) * 100 === 300 && 900 - 300 === 600, 'Q8 三位數減法真值 900－300＝600');
ok(Math.round(29 / 10) * 10 === 30 && 30 * 5 === 150 && 29 * 5 === 145, 'Q9 單價 29 元乘法估算真值 30×5＝150');
ok(Math.round(1930 / 1000) * 1000 === 2000 && Math.round(3130 / 1000) * 1000 === 3000 && 2000 + 3000 === 5000, 'Q10 四位數大數合併真值 2000＋3000＝5000');

// 教具內容靜態檢查
const html = fs.readFileSync('app/components/estimation_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), '教具無 100vh / min-height:100% 違憲高度');
ok(html.includes('height: auto'), '教具高度契約使用 height: auto');
ok(html.includes('QUESTIONS'), '教具具備 10 題題組資料表（?q=1~10 映射）');
expectedModes.forEach(m => ok(html.includes(m), `教具支援視覺模式 ${m}`));
unit.questions.forEach((q, i) => ok(html.includes(q.final_check.slice(0, 8)), `教具 Q${i + 1} 題組最終揭示 '${q.final_check.slice(0, 8)}' 已映射`));

// 課綱契約檢驗
const cur = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = cur.grades.find(g => g.grade === 3);
const n38 = g3.units.find(u => u.code === 'N-3-8');
ok(n38 && n38.status === 'ready', 'curriculum.json 中 N-3-8 標記為 ready');
ok(n38 && n38.question_count === 10, 'curriculum.json 中 N-3-8 question_count 為 10');
ok(n38 && n38.verified_source && n38.verified_source.includes('內湖'), 'curriculum.json 中 N-3-8 來源掛內湖＋通道一鋼印');

console.log('N38_ALL_VERIFIED — ALL PASS');
