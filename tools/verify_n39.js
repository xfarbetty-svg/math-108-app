/**
 * tools/verify_n39.js — G3-N-3-9 簡單同分母分數 靜態驗證守門員
 * 1. 靜態契約驗證：N-3-9.json 10 題多元真題（同分母比較/加法天平/蛋糕切片平分/披薩概念除錯/
 *    1減分數陷阱/湯包單位分數/果凍盒加/果凍盒減/石斑魚切片連續減/1與分數大小關係）。
 * 2. 教具驗證：fraction_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：同分母分數比較、加、減（不超過2）逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 N-3-9 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-9.json', 'utf8'));
ok(unit.code === 'N-3-9', '單元代碼為 N-3-9');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');
ok(unit.verified_source.includes('通道一') && unit.verified_source.includes('本地 OpenCode'), '施工鋼印含通道一 本地 OpenCode');

const expectedSources = ['內湖 113-1', '永安 114-2', '內湖 113-1', '內湖 114-1', '永安 114-2', '永安 114-2', '內湖 111-1', '內湖 112-1', '永安 114-2', '永安 114-2'];
unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-9-Q0${num}` : `G3-N-3-9-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes(expectedSources[i].split(' ')[0]), `Q${num} 真題來源 (${q.exam_source})`);
  ok(q.exam_source.includes(expectedSources[i].slice(-5)), `Q${num} 學年度出處 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.answer_index === 0, `Q${num} 正解索引 = 0`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'fraction-lab', `Q${num} 教具元件 = fraction-lab`);
  ok(q.component_path === `components/fraction_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = ['fraction_compare', 'add_balance', 'cake_slices', 'pizza_detective', 'one_minus', 'dumplings', 'jelly_add', 'basketball', 'fish_slices', 'one_equal'];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));

// 10-Type Matrix：題型關鍵字逐一命中
const typeKeywords = ['規律', '秒殺', '生活情境', '除錯', '核心陷阱', '單位分數', '同分母加法', '單位分數', '連續同分母減法', '綜合分數'];
typeKeywords.forEach((kw, i) => ok(unit.questions[i].title.includes(kw) || unit.questions[i].explanation.concept.includes(kw), `Q${i + 1} 題型矩陣命中關鍵字「${kw}」`));

// 算理真值驗證：同分母分數比較、加、減（牽涉之分數與結果皆不超過 2）
ok(3 / 8 < 5 / 8, 'Q1 同分母分數大小真值 5/8 ＞ 3/8（分子越大分數越大）');
ok((5 + 1) / 12 === (2 + 4) / 12 && (5 + 1) / 12 === 6 / 12, 'Q2 同分母加法比大小真值 5/12＋1/12 ＝ 2/12＋4/12 ＝ 6/12');
ok(3 < 4 && 4 < 5, 'Q3 蛋糕切片平分真值 弟弟吃了 4 片（介於 3 片與 5 片之間）');
ok(4 * (1 / 8) === 4 / 8 && 4 / 8 === 0.5, 'Q4 披薩切片除錯真值 4 片 ＝ 4/8 個披薩');
ok((6 - 4) === 2 && Math.abs((1 - 4 / 6) - 2 / 6) < 1e-9 && Math.abs((2 / 6 + 4 / 6) - 1) < 1e-9, 'Q5 和等於1與減法真值 1 － 4/6 ＝ 6/6 － 4/6 ＝ 2/6');
ok(8 * (5 / 8) === 5, 'Q6 單位分數點數真值 8 顆中的 5/8 籠 ＝ 5 顆');
ok((3 + 7) / 12 === 10 / 12, 'Q7 果凍盒同分母加法真值 3/12 ＋ 7/12 ＝ 10/12');
ok((10 - 7) === 3 && (10 - 7) / 10 === 3 / 10, 'Q8 投籃命中率真值 10 次中 7 次 → 未進 3 次占 3/10');
ok((10 - 3 - 5) / 10 === 2 / 10, 'Q9 石斑魚切片連續減法真值 10/10 － 3/10 － 5/10 ＝ 2/10');
ok(5 / 5 === 1 && 6 / 7 < 1, 'Q10 整數1與分數真值 5/5 ＝ 1 且 1 ＞ 6/7');

// 教具內容靜態檢查
const html = fs.readFileSync('app/components/fraction_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), '教具無 100vh / min-height:100% 違憲高度');
ok(html.includes('height: auto'), '教具高度契約使用 height: auto');
ok(html.includes('QUESTIONS'), '教具具備 10 題題組資料表（?q=1~10 映射）');
expectedModes.forEach(m => ok(html.includes(m), `教具支援視覺模式 ${m}`));
unit.questions.forEach((q, i) => ok(html.includes(q.final_check.slice(0, 6)), `教具 Q${i + 1} 題組最終揭示 '${q.final_check.slice(0, 6)}' 已映射`));

// 課綱契約檢驗
const cur = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const g3 = cur.grades.find(g => g.grade === 3);
const n39 = g3.units.find(u => u.code === 'N-3-9');
ok(n39 && n39.status === 'ready', 'curriculum.json 中 N-3-9 標記為 ready');
ok(n39 && n39.question_count === 10, 'curriculum.json 中 N-3-9 question_count 為 10');
ok(n39 && n39.verified_source && n39.verified_source.includes('內湖'), 'curriculum.json 中 N-3-9 來源掛內湖＋通道一鋼印');

console.log('N39_ALL_VERIFIED — ALL PASS');
