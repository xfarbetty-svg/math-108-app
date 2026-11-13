/**
 * tools/verify_curriculum_131.js — 108 課綱官方 131 條目骨架機械化驗證
 * 驗證 data/curriculum.json 結構與計數；全部通過 = Exit 0，任一失敗 = Exit 1。
 * 用法：node tools/verify_curriculum_131.js
 */
'use strict';
const fs = require('node:fs');

const EXPECTED = { 1: 11, 2: 24, 3: 24, 4: 26, 5: 27, 6: 19 }; // 合計 131
const results = [];
function check(ok, msg) {
  results.push({ ok, msg });
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
}

let data;
try {
  data = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
  check(true, 'data/curriculum.json 可解析');
} catch (err) {
  check(false, 'data/curriculum.json 解析失敗 → ' + err.message);
  process.exitCode = 1;
  print();
  process.exit(process.exitCode);
}

// 1. 六個年級、逐級條目數 11/24/24/26/27/19 = 131
check(Array.isArray(data.grades) && data.grades.length === 6, 'grades 共 6 個年級');
let total = 0;
data.grades.forEach((g, i) => {
  const expectGrade = i + 1;
  check(g.grade === expectGrade, 'G' + expectGrade + ' grade 欄位正確（grade=' + g.grade + '）');
  check(g.name === ['一年級','二年級','三年級','四年級','五年級','六年級'][i], 'G' + expectGrade + ' name=' + g.name);
  check(Array.isArray(g.units) && g.units.length === EXPECTED[expectGrade],
    'G' + expectGrade + ' 條目數 = ' + (g.units ? g.units.length : 0) + '（期望 ' + EXPECTED[expectGrade] + '）');
  total += g.units.length;
});
check(total === 131, '全量條目合計 = ' + total + '（期望 131）');

// 2. 每條目欄位完整：code/title/full_text/status/question_count/verified_source
const REQUIRED = ['code', 'title', 'full_text', 'status', 'question_count', 'verified_source'];
let fieldOk = true;
data.grades.forEach((g) => g.units.forEach((u) => {
  const miss = REQUIRED.filter((k) => !(k in u));
  if (miss.length) { fieldOk = false; check(false, g.name + ' ' + u.code + ' 缺欄位: ' + miss.join(',')); }
}));
if (fieldOk) check(true, '131 條目全部具備 6 個必要欄位（code/title/full_text/status/question_count/verified_source）');

// 3. status 分佈：N-1-1 ~ N-1-6 共 6 條 ready，其餘 125 條 upcoming；question_count / verified_source 一致
const all = data.grades.flatMap((g) => g.units);
const EXPECTED_READY_CODES = ['N-1-1', 'N-1-2', 'N-1-3', 'N-1-4', 'N-1-5', 'N-1-6'];
const readyUnits = all.filter((u) => u.status === 'ready');
check(readyUnits.length === EXPECTED_READY_CODES.length, `ready 條目共 ${EXPECTED_READY_CODES.length} 個（實際 ${readyUnits.length}）`);

EXPECTED_READY_CODES.forEach((code) => {
  const r = readyUnits.find((u) => u.code === code);
  check(!!r, `ready 條目包含 ${code}`);
  check(!!r && r.question_count > 0, `${code} question_count > 0（實際 ${r ? r.question_count : 0}）`);
  check(!!r && typeof r.verified_source === 'string' && r.verified_source.length > 5, `${code} verified_source 為有效試卷來源`);
});

const upcomingCount = 131 - EXPECTED_READY_CODES.length;
check(all.filter((u) => u.status === 'upcoming').length === upcomingCount, `upcoming 條目 = ${upcomingCount}`);
const upBad = all.filter((u) => u.status === 'upcoming' && (u.question_count !== 0 || u.verified_source !== null));
check(upBad.length === 0, `${upcomingCount} 條 upcoming 的 question_count=0 且 verified_source=null` + (upBad.length ? '（異常: ' + upBad.map((u) => u.code).join(',') + '）' : ''));

// 4. code 唯一性
const codes = new Set(all.map((u) => u.code));
check(codes.size === all.length, '131 個 code 無重複');

// 5. N-1-1 題庫 SSOT 存在且 4 題
try {
  const unit = JSON.parse(fs.readFileSync('data/units/G1/N-1-1.json', 'utf8'));
  check(unit.questions && unit.questions.length === 4, 'data/units/G1/N-1-1.json 題庫 4 題（SSOT）');
  unit.questions.forEach((q) => {
    if (!fs.existsSync('app/' + q.component_path)) check(false, '教具檔缺失: ' + q.component_path);
  });
  check(true, 'N-1-1 四題教具 component_path 全部存在於 app/');
} catch (err) {
  check(false, 'data/units/G1/N-1-1.json 驗證失敗 → ' + err.message);
}

// 6. shell.js 已對齊新骨架（name 欄位、已開放 x/y、upcoming 卡片流）
const shell = fs.readFileSync('app/shell.js', 'utf8');
check(shell.includes('g.name'), 'shell.js renderNav 使用 name 欄位');
check(shell.includes('已開放 ${readyCount}/${g.units.length}'), 'shell.js 顯示已開放 x/y 進度');
check(shell.includes('UPCOMING_HINT'), 'shell.js upcoming 卡片顯示建置說明');
check(!shell.includes('topic-chip'), 'shell.js 已移除藍圖 chips 模式');

function print() {
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed === 0
    ? 'CURRICULUM_131_VERIFIED (131 units / 6 grades / N-1-1 ready) — ALL PASS'
    : 'FAILED (' + failed + ')');
  process.exitCode = failed === 0 ? 0 : 1;
}
print();
