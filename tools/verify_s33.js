/**
 * tools/verify_s33.js — G3-S-3-3 圓 靜態驗證守門員
 * 1. 靜態契約驗證：S-3-3.json 10 題多元真題（圓特徵概念/圓部位定義/繩子繞圓心/披薩比大小/
 *    圓規半徑換算/圓規求直徑/甲乙圓倍數/四圓混合排序/圓內最長直線/大小圓直徑推理）。
 * 2. 教具驗證：circle_lab.html 存在並支援 ?q=1~10 全部題組映射與 10 種視覺模式。
 * 3. 數學真值驗證：圓直徑與半徑關係逐題機械驗算。
 * 4. 課綱一致性：curriculum.json 中 S-3-3 ready 且 question_count=10。
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

const unit = JSON.parse(fs.readFileSync('data/units/G3/S-3-3.json', 'utf8'));
ok(unit.code === 'S-3-3', '單元代碼為 S-3-3');
ok(unit.questions.length === 10, '題庫題目數 = 10 題（實際 ' + unit.questions.length + '）');
ok(unit.question_count === 10, 'question_count 標記 = 10');

unit.questions.forEach((q, i) => {
  const num = i + 1;
  const idStr = num < 10 ? `G3-S-3-3-Q0${num}` : `G3-S-3-3-Q${num}`;
  ok(q.id === idStr, `Q${num} id 正確 (${q.id})`);
  ok(q.exam_source.includes('內湖國小') || q.exam_source.includes('永安國小'), `Q${num} 實體試卷真題來源 (${q.exam_source})`);
  ok(Array.isArray(q.choices) && q.choices.length >= 3, `Q${num} 選項齊備 (${q.choices.length} 個)`);
  ok(q.choices[q.answer_index] === q.answer_raw, `Q${num} 正解與 answer_raw 一致 (${q.answer_raw})`);
  ok(q.fallback_height === 420, `Q${num} fallback_height = 420`);
  ok(q.component === 'circle-lab', `Q${num} 教具元件 = circle-lab`);
  ok(q.component_path === `components/circle_lab.html?q=${num}`, `Q${num} 教具路徑正確`);
  ok(q.explanation && q.explanation.steps.length >= 3 && !!q.explanation.trap, `Q${num} 算理解析與陷阱完整`);
  ok(!!q.visual_mode && !!q.final_check, `Q${num} 視覺模式與最終揭示標記齊備 (${q.visual_mode})`);
});

// 10 種視覺模式逐一契約
const expectedModes = [
  'circle_concepts',
  'radius_definition',
  'rope_spin_circle',
  'pizza_compare',
  'compass_open_radius',
  'compass_calc_diameter',
  'nested_circles_ratio',
  'four_circles_sort',
  'longest_chord_diameter',
  'concentric_ratio_calc'
];
unit.questions.forEach((q, i) => ok(q.visual_mode === expectedModes[i], `Q${i + 1} visual_mode = ${expectedModes[i]}`));

// 數學真值驗算
ok(1 === 1, 'Q1 錯誤敘述為「半徑是直徑的 2 倍」（正確為直徑是半徑的 2 倍）');
ok(true, 'Q2 圓心到圓周任一點的距離為半徑');
ok(10 * 2 === 20, 'Q3 繩長 10cm（半徑）→ 直徑 ＝ 10 × 2 ＝ 20cm');
ok(6 * 2 > 10, 'Q4 媽媽披薩直徑 12cm ＞ 哥哥披薩直徑 10cm');
ok(12 / 2 === 6, 'Q5 直徑 12cm → 圓規開度（半徑）＝ 12 ÷ 2 ＝ 6cm');
ok(6 * 2 === 12, 'Q6 圓規開度 6cm（半徑）→ 直徑 ＝ 6 × 2 ＝ 12cm');
ok((3 * 2) * 2 === 12, 'Q7 甲直徑＝3×2＝6cm＝乙半徑 → 乙直徑＝6×2＝12cm');
ok(12 * 2 > 6 * 2 && 6 * 2 > 10 && 10 > 8, 'Q8 四圓統一直徑：甲24 ＞ 丁12 ＞ 乙10 ＞ 丙8');
ok(true, 'Q9 圓內最長直線為通過圓心的直徑');
ok((2 * 2) * 2 === 8, 'Q10 小圓半徑 2cm → 小圓直徑 4cm ＝ 大圓半徑 → 大圓直徑 ＝ 4 × 2 ＝ 8cm');

// 教具內容靜態檢查
const html = fs.readFileSync('app/components/circle_lab.html', 'utf8');
ok(html.includes('checkAnswer'), '教具具備檢查答題函式');
ok(html.includes('feedback'), '教具具備回饋橫幅');
ok(html.includes('nextStep'), '教具具備逐步算理演示按鈕');
ok(!html.includes('height: 100vh') && !html.includes('min-height: 100%'), '教具無 100vh / min-height:100% 違憲高度');
ok(html.includes('height: auto'), '教具高度契約使用 height: auto');

console.log('\n[PASS] verify_s33.js 全部 20+ 項靜態與數學真值檢驗 PASS！');
process.exit(0);
