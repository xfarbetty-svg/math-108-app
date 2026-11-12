/**
 * tools/embed_exam_bank.js — 將 data/g1_real_verified_exam_suite.json 內嵌進 app/index.html
 * 為什麼要內嵌：file:// 雙擊直開時 fetch/XHR 會被瀏覽器封鎖，內嵌可維持「純離線開箱可用」，
 * 而資料來源仍是 data/g1_real_verified_exam_suite.json 唯一正本（本工具負責同步，不手改題庫）。
 * 用法：node tools/embed_exam_bank.js
 * 退出碼：0 = 內嵌成功；1 = 題庫或容器不合法。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'g1_real_verified_exam_suite.json');
const HTML = path.join(ROOT, 'app', 'index.html');
const EXPECTED = 20;

const bank = JSON.parse(fs.readFileSync(DATA, 'utf8'));
if (!Array.isArray(bank) || bank.length !== EXPECTED) {
  console.error('FAIL embed_exam_bank :: 需要 ' + EXPECTED + ' 題，實得 ' +
    (Array.isArray(bank) ? bank.length : typeof bank));
  process.exit(1);
}

const bad = bank.filter((q) => {
  if (!q || typeof q.id !== 'string' || typeof q.stem !== 'string' || !q.stem.trim()) return true;
  if (!Array.isArray(q.choices) || typeof q.answer_index !== 'number') return true;
  if (!q.explanation || typeof q.explanation !== 'string') return true;
  if (q.choices.length > 0 && (q.answer_index < 0 || q.answer_index >= q.choices.length)) return true;
  if (q.choices.length === 0 && !q.answer_raw) return true;
  return false;
});
if (bad.length) {
  console.error('FAIL embed_exam_bank :: 題目欄位不完整 / 答案索引越界：' +
    bad.map((q) => (q && q.id) || '?').join(', '));
  process.exit(1);
}

/* '\u003c' 化：避免題幹含 </script> 提前截斷內嵌 JSON */
const payload = JSON.stringify(bank).replace(/</g, '\\u003c');
const html = fs.readFileSync(HTML, 'utf8');
const re = /(<script id="examBank" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) {
  console.error('FAIL embed_exam_bank :: app/index.html 找不到 <script id="examBank"> 容器');
  process.exit(1);
}

const next = html.replace(re, (m, open, close) => open + payload + close);
fs.writeFileSync(HTML, next, 'utf8');

const size = Buffer.byteLength(next, 'utf8');
const roundTrip = JSON.parse(payload);
if (roundTrip.length !== EXPECTED) {
  console.error('FAIL embed_exam_bank :: 回讀驗證失敗');
  process.exit(1);
}
console.log('PASS embed_exam_bank :: ' + bank.length + ' 題內嵌完成，app/index.html = ' + size + ' B');
