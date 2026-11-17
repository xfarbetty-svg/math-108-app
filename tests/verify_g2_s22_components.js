// 閘門一：G2-S-2-2 五套微教具靜態契約驗證
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units/G2/S-2-2.json'), 'utf8'));
const files = {
  'G2-S-2-2-Q06': 'g2_s22_q6_cuboid.html',
  'G2-S-2-2-Q07': 'g2_s22_q7_compare.html',
  'G2-S-2-2-Q08': 'g2_s22_q8_parts.html',
  'G2-S-2-2-Q09': 'g2_s22_q9_faces.html',
  'G2-S-2-2-Q10': 'g2_s22_q10_net.html',
};
let fail = 0;
for (const q of data.questions) {
  const f = files[q.id];
  const p = path.join(ROOT, 'app/components', f);
  if (!fs.existsSync(p)) { console.log(`FAIL ${q.id} 檔案不存在: ${f}`); fail++; continue; }
  const html = fs.readFileSync(p, 'utf8');
  const checks = [];
  // 1) JSON component_path 指向本檔
  const jsonPath = q.component_path;
  if (jsonPath !== `components/${f}`) { checks.push(`JSON component_path 不符: ${jsonPath}`); }
  // 2) 題幹字字對齊
  if (!html.includes(q.stem)) checks.push('stem 未對齊 JSON');
  // 3) 四個選項字字對齊
  q.choices.forEach((c, i) => { if (!html.includes(`'${c}'`)) checks.push(`choice[${i}] 未對齊`); });
  // 4) answer_index 契約（answer: ANSWER 或字面 0）
  if (!new RegExp(`window\\.__q = \\{ id: '${q.id}', answer: (ANSWER|${q.answer_index}) \\}`).test(html)) checks.push('window.__q 契約不符');
  // 5) window.check 存在
  if (!html.includes('window.check = function')) checks.push('缺 window.check');
  // 6) 底圖融合三件套
  if (!html.includes('bg_desk.webp') || !html.includes('stage-overlay') || !html.includes('scene-svg')) checks.push('stage 融合架構缺件');
  // 7) 禁 Three.js
  if (/three\.js/i.test(html)) checks.push('偵測到 Three.js');
  // 8) 死圖掃描：addEventListener 數量 > 0
  const listeners = (html.match(/addEventListener\(/g) || []).length;
  if (listeners < 2) checks.push(`互動事件過少 (${listeners})`);
  // 9) 音檔管理器
  if (!html.includes('audio_manager.js')) checks.push('缺 audio_manager');
  if (checks.length) { console.log(`FAIL ${q.id} (${f}): ${checks.join(' | ')}`); fail++; }
  else console.log(`PASS ${q.id} (${f}) listeners=${listeners}`);
}
console.log(fail === 0 ? 'ALL PASS (5/5)' : `FAILED: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
