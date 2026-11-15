// 機械化驗證：estimation_concept_lab.html（語法 + 外部依賴 + 必備元素）
const fs = require('fs');
const path = 'app/components/estimation_concept_lab.html';
const html = fs.readFileSync(path, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('NO_SCRIPT'); process.exit(1); }

// 1) JS 語法檢查
try { new Function(m[1]); console.log('JS_SYNTAX_OK'); }
catch (e) { console.error('JS_SYNTAX_FAIL: ' + e.message); process.exit(1); }

// 2) 外部依賴檢查（僅允許 TTS 雙通道規範內網域）
const urls = [];
for (const x of html.matchAll(/(?:src|href)=["'](http[^"']+)["']/g)) urls.push(x[1]);
const bad = urls.filter(u => !u.includes('math3-bank.pages.dev'));
if (bad.length) { console.error('EXTERNAL_DEP: ' + bad.join(',')); process.exit(1); }
console.log('NO_EXTERNAL_DEP_OK');

// 3) 必備元素檢查（任務卡規格）
const need = [
  'notifyHeight', 'postMessage', 'zh-TW-HsiaoChenNeural',
  'switchAct(1)', 'switchAct(2)', 'switchAct(3)', 'switchAct(4)',
  'act-1-view', 'act-4-view', 'viewBox="0 0 320 140"',
  '482', '418', '450', '899', '1150', '2049', '2100',
  '49', '295', '495', '4970', '3000', '1200',
  '數線磁鐵', '帶錢夠不夠', '乘除估算雷達', '合理檢驗偵探',
  '聽導讀', 'goToQuiz', 'switchToExamMode'
];
const miss = need.filter(k => !html.includes(k));
if (miss.length) { console.error('MISSING: ' + miss.join(',')); process.exit(1); }
console.log('ALL_ELEMENTS_OK');

// 4) 四幕語音檢查
for (let i = 1; i <= 4; i++) {
  const re = new RegExp('^\\s*' + i + ':\\s*"活動', 'm');
  if (!re.test(m[1])) { console.error('MISSING_VOICE_' + i); process.exit(1); }
}
console.log('VOICES_OK');

// 5) notifyHeight 必須在程式碼末尾存在且被掛載
const tail = m[1].slice(-400);
if (!tail.includes('notifyHeight') || !m[1].includes('window.addEventListener("load", notifyHeight)')) {
  console.error('NOTIFY_HEIGHT_MISSING'); process.exit(1);
}
console.log('NOTIFY_HEIGHT_OK');
console.log('ALL PASS');
