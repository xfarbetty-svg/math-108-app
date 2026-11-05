/**
 * tools/ac_gate.js — 機械化驗收閘門（TCK-08）
 * 一次跑完 G-1 語法、G-4 零外部資源、G-5 體積與 T-01~T-03 全量 AC，
 * 以「真實 exit code」判定，任何人眼看 RESULT 區塊都不算數。
 * 用法：node tools/ac_gate.js
 * 退出碼：0 = 全綠；1 = 有 FAIL；2 = 閘門本身執行失敗。
 */
'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const COMPONENTS = ['ten-frame-grid.js', 'dual-track-diff.js', 'balance-beam.js'];
const CHROME_CANDIDATES = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
const LIMIT_EACH = 12 * 1024;
const LIMIT_TOTAL = 30 * 1024;

const results = [];
const rec = (id, pass, info) => results.push({ id, pass, info });

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome/Edge 執行檔');
}
const chrome = findChrome();

/* G-1 語法 */
for (const f of COMPONENTS) {
  const abs = path.join(ROOT, 'app', 'components', f);
  const r = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf8' });
  rec('G-1 ' + f, r.status === 0, 'node --check exit=' + r.status);
}

/* G-5 體積（每檔 ≤12KB、合計 ≤30KB） */
let total = 0;
for (const f of COMPONENTS) {
  const size = fs.statSync(path.join(ROOT, 'app', 'components', f)).size;
  total += size;
  rec('G-5 ' + f, size <= LIMIT_EACH, size + ' B (<= ' + LIMIT_EACH + ')');
}
rec('G-5 total', total <= LIMIT_TOTAL, total + ' B (<= ' + LIMIT_TOTAL + ')');

/* G-4 零外部資源：僅允許 SVG 命名空間 */
const files = COMPONENTS.map((f) => path.join(ROOT, 'app', 'components', f))
  .concat([path.join(ROOT, 'app', 'playground.html')]);
const hits = [];
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const m = text.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  for (const u of m) hits.push(path.basename(f) + ' -> ' + u);
}
const external = hits.filter((h) => !/http:\/\/www\.w3\.org\/2000\/svg$/.test(h));
rec('G-4 零外部依賴', external.length === 0,
  'url_hits=' + hits.length + ' external=' + external.length +
  (external.length ? ' [' + external.join(', ') + ']' : ''));

/* AC 頁（自帶 RESULT_BEGIN/END） */
const PAGES = [
  { id: 'T-01', file: 'tests/ac_t01.html', args: ['--window-size=390,900'] },
  { id: 'T-02', file: 'tests/ac_t02.html', args: ['--window-size=390,900'] },
  { id: 'T-02-RM', file: 'tests/ac_t02.html', args: ['--window-size=390,900', '--force-prefers-reduced-motion'] },
  { id: 'T-03', file: 'tests/ac_t03.html', args: ['--window-size=390,900'] }
];

for (const page of PAGES) {
  const url = pathToFileURL(path.join(ROOT, page.file)).href;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-gate-'));
  const r = spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--allow-file-access-from-files', '--disable-extensions',
    '--virtual-time-budget=25000', '--user-data-dir=' + profile,
    ...page.args, '--dump-dom', url
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  fs.rmSync(profile, { recursive: true, force: true });

  const stdout = r.stdout || '';
  const lines = stdout.split(/\r?\n/).filter((l) => /^(PASS|FAIL) /.test(l));
  const fails = lines.filter((l) => l.startsWith('FAIL'));
  const passes = lines.filter((l) => l.startsWith('PASS'));
  const ok = r.status === 0 && fails.length === 0 && passes.length > 0;
  rec('AC ' + page.id, ok,
    'chrome_exit=' + r.status + ' pass=' + passes.length + ' fail=' + fails.length +
    (fails.length ? ' :: ' + fails.join(' | ') : ''));
}

/* 輸出 */
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + ' :: ' + r.info);
}
console.log('GATE_' + (failed === 0 ? 'GREEN' : 'RED') + ' (' + results.length + ' checks, ' + failed + ' failed)');
process.exitCode = failed === 0 ? 0 : 1;
