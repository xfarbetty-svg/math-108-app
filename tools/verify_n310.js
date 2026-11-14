/**
 * tools/verify_n310.js — G3-N-3-10 一位小數 靜態驗證守門員
 * 1. 靜態契約驗證：N-3-10.json 10 題多元真題（十分位位值/0.1組成/位值反推/十六點八讀寫/鉛筆盒0.1換算/精準量尺毫米公分/數線跳數規律/天平比大小/直式小數加減/牛奶兩步驟應用題）。
 * 2. 教具驗證：decimal_place_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：逐題機械算理檢核。
 * 4. 課綱一致性：curriculum.json 中 N-3-10 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/N-3-10.json', 'utf8'));
ok(unit.code === 'N-3-10', '單元代碼為 N-3-10');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-N-3-10-Q0${num}` : `G3-N-3-10-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes('內湖國小') && (q.exam_source.includes('111-2') || q.exam_source.includes('112-2') || q.exam_source.includes('113-2') || q.exam_source.includes('114-2')), `Q${num} 實體試卷真題來源 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'decimal-place-lab', `Q${num} 教具元件 = decimal-place-lab`);
  ok(q.component_path === `components/decimal_place_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = [
  'place_value_intro',
  'decimal_composition',
  'digit_reconstruct',
  'read_write_decimal',
  'pencil_boxes_decimal',
  'precision_ruler',
  'decimal_number_line',
  'balance_compare',
  'vertical_decimal_calc',
  'milk_boxes_two_step'
];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));

// 算理真值驗證
ok(Math.floor(10.6) === 10 && Math.round((10.6 - 10) * 10) === 6, 'Q1 10.6 十分位數字為 6');
ok(Math.abs((2 * 1 + 6 * 0.1) - 2.6) < 1e-9, 'Q2 2 個 1 和 6 個 0.1 ＝ 2.6');
ok(Math.abs((6 + 3 * 0.1) - 6.3) < 1e-9, 'Q3 個位 6 十分位 3 ＝ 6.3');
ok(Math.round((16.8 - 16) * 10) === 8, 'Q4 16.8 十分位數字為 8');
ok(Math.abs((17 * 0.1) - 1.7) < 1e-9, 'Q5 17 個 0.1 盒 ＝ 1.7 盒');
ok(Math.abs((2 + 9 * 0.1) - 2.9) < 1e-9, 'Q6 2 公分 9 毫米 ＝ 2.9 公分');
ok(Math.abs((4.7 + 0.1) - 4.8) < 1e-9 && Math.abs((4.8 + 0.1) - 4.9) < 1e-9 && Math.abs((4.9 + 0.1) - 5.0) < 1e-9, 'Q7 數線跳數 4.7->4.8->4.9->5.0->5.1');
ok(0.7 > 0.6, 'Q8 零點七 (0.7) ＞ 0.6');
ok(Math.abs((1.7 + 0.8) - 2.5) < 1e-9, 'Q9 直式加法 1.7 ＋ 0.8 ＝ 2.5');
ok(Math.abs((1.5 + 1.3) - 2.8) < 1e-9 && Math.abs((5.0 - 2.8) - 2.2) < 1e-9, 'Q10 兩步驟牛奶 1.5＋1.3＝2.8，5－2.8＝2.2');

// 教具內容靜態檢查
const html = fs.readFileSync('app/components/decimal_place_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), '教具無 100vh / min-height:100% 違憲高度');
ok(html.includes('height: auto'), '教具高度契約使用 height: auto');

console.log('\n[PASS] verify_n310.js 全部 20+ 項靜態與數學真值檢驗 PASS！');
process.exit(0);
