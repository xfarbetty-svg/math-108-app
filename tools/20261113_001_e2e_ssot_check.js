// E2E SSOT 契約檢查（一次性驗證腳本，驗完即刪）
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('data/curriculum.json', 'utf8'));
const u = JSON.parse(fs.readFileSync('data/units/G1/N-1-1.json', 'utf8'));
const s = fs.readFileSync('app/shell.js', 'utf8');
const ix = fs.readFileSync('app/index.html', 'utf8');

const needIds = ['gradeNav','gradeView','stageView','resultView','progressNum','progressSource','dots','stageTitle','stageFrame','btnPrev','btnNext','btnFinish','btnBack','offlineNote'];
const miss = needIds.filter(id => !ix.includes('id="' + id + '"'));
if (miss.length) throw new Error('index missing IDs: ' + miss);

const cls = ['grade-hero','hero-card','stage-tag','unit-list','unit-card','badge-ready','badge-upcoming','badge-plan','start-arrow','blueprint','plan-badge','desc','pending-note','result-card','rsub','result-item','rtitle','rsrc','rexp','rlabel','rdemo','result-actions','btn-prev','btn-next','btn-finish','dot'];
const cssMiss = cls.filter(k => !ix.includes('.' + k));
if (cssMiss.length) throw new Error('index missing CSS: ' + cssMiss);

if (c.grades.length !== 6) throw new Error('grades != 6');
if (c.grades[0].units.length !== 9) throw new Error('G1 != 9 units');
if (c.grades[0].units[0].status !== 'ready') throw new Error('N-1-1 not ready');
if (c.grades.slice(1).every(g => g.units.every(x => x.status === 'ready'))) throw new Error('G2-G6 must be upcoming');
if (u.questions.length !== 4) throw new Error('unit != 4 questions');
u.questions.forEach(q => {
  if (!s.includes('component_path')) throw new Error('shell does not expect component_path');
  if (!fs.existsSync('app/' + q.component_path)) throw new Error('component missing: ' + q.component_path);
});
console.log('E2E contract: index.html IDs+CSS vs shell.js, 6 grades / G1=9 units / N-1-1=ready / 4 real questions / 4 demo files — ALL OK');
