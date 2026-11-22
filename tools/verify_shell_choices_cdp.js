/**
 * tools/verify_shell_choices_cdp.js — 外殼統一 A/B/C/D 選項雙視口 × 雙模式實機驗證
 * 360×800 / 390×844 × Light/Dark × S-3-2 / S-3-4 / N-3-16 / R-3-2 / D-3-1：
 *   4 選項唯一（教具內重複列為 0）→ 點選 → 檢查答案 → 對錯標記＋concept/steps/trap 展開 → 零橫向溢出 → 零 error
 * 截圖：_scratch/shell_choices_shots/20261122_00X_*.png（供人工目視）
 * Exit 0 = 20 組合全綠；任一 FAIL → Exit 1。
 */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { createSession, sleep } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, '_scratch', 'shell_choices_shots');
const UNITS = ['S-3-2', 'S-3-4', 'N-3-16', 'R-3-2', 'D-3-1'];
const VIEWPORTS = [{ tag: '360x800', w: 360, h: 800 }, { tag: '390x844', w: 390, h: 844 }];
const THEMES = ['light', 'dark'];
const errors = [];

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const fp = path.join(ROOT, rel === '/' ? 'app/index.html' : rel);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
        res.writeHead(404); res.end('404'); return;
      }
      const ext = path.extname(fp).toLowerCase();
      const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.mp4': 'video/mp4', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const { server, port } = await startServer();
  const session = await createSession({ width: 390, height: 844 });
  session.onMessage((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push('[exception] ' + msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push('[console.error] ' + msg.params.args.map((a) => a.value || a.description || a.type).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push('[log] ' + msg.params.entry.text);
  });
  let pass = 0;
  try {
    for (const vp of VIEWPORTS) {
      await session.setViewport(vp.w, vp.h);
      await session.navigate('http://127.0.0.1:' + port + '/app/index.html', 700);
      await session.eval(`(() => { document.querySelectorAll('#gradeNav .grade-btn')[2].click(); return state.grade; })()`);
      for (const theme of THEMES) {
        // 確保外殼主題正確（applyTheme 會廣播給 iframe）
        await session.eval(`(() => { if (document.documentElement.dataset.theme !== '${theme}') document.getElementById('btnThemeToggle').click(); return document.documentElement.dataset.theme; })()`);
        let unitIdx = 0;
        for (const code of UNITS) {
          await session.eval(`(async () => { await openUnit('${code}'); await new Promise(r => setTimeout(r, 450)); return true; })()`);
          const wantCorrect = unitIdx % 2 === 0;
          const r = await session.eval(`(() => {
            const q = state.unit.questions[state.qIndex];
            const opts = [...document.querySelectorAll('#shellOptions .shell-opt')];
            const ai = q.answer_index;
            const pick = ${wantCorrect ? 'ai' : '(ai + 1) % 4'};
            const stem = document.getElementById('shellStem').textContent.trim();
            const fb = document.getElementById('shellFeedback');
            const beforeHidden = fb.hidden && fb.textContent.length === 0;
            opts[pick].click();
            const selected = opts.filter(o => o.classList.contains('selected'));
            document.getElementById('btnCheckMain').click();
            const f = document.getElementById('stageFrame');
            let innerVisible = 0;
            try {
              const d = f.contentDocument;
              d.querySelectorAll('.options-grid,.opt-grid,#quest-options,.options,.option-btn,.opt-btn,.choice-btn').forEach(el => {
                const cs = d.defaultView.getComputedStyle(el);
                if (cs.display !== 'none' && el.getBoundingClientRect().width > 0) innerVisible++;
              });
            } catch (e) {}
            const optsAfter = [...document.querySelectorAll('#shellOptions .shell-opt')];
            const de = document.documentElement;
            return {
              code: state.unit.code, count: opts.length, stemLen: stem.length, beforeHidden,
              selectedCount: selected.length, pick, ai,
              correctMarks: optsAfter.map((o, i) => o.classList.contains('correct') ? i : -1).filter(i => i >= 0),
              wrongMarks: optsAfter.map((o, i) => o.classList.contains('wrong') ? i : -1).filter(i => i >= 0),
              feedbackShown: !fb.hidden, feedbackText: fb.textContent,
              innerVisible, overflowX: de.scrollWidth > de.clientWidth + 1,
              scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
              theme: de.dataset.theme, frameH: Math.round(f.getBoundingClientRect().height)
            };
          })()`);
          const tag = `${code} ${vp.tag} ${theme}`;
          const check = (cond, msg) => { if (!cond) errors.push(tag + ': ' + msg); };
          check(r.code === code, '載入單元錯誤 ' + r.code);
          check(r.count === 4, '外殼選項數 ' + r.count + ' ≠ 4');
          check(r.stemLen > 5, '題幹為空');
          check(r.beforeHidden, '作答前已劇透詳解');
          check(r.selectedCount === 1, '點選後高亮數 ' + r.selectedCount);
          check(r.feedbackShown, '檢查後回饋未展開');
          check(r.correctMarks.length === 1 && r.correctMarks[0] === r.ai, '正解標記錯誤 ' + JSON.stringify(r.correctMarks));
          if (wantCorrect) check(r.feedbackText.includes('答對了'), '未顯示答對');
          else check(r.feedbackText.includes('答錯了') && r.wrongMarks.length === 1 && r.wrongMarks[0] === r.pick, '答錯標記錯誤');
          ['核心概念', '解題步驟', '常見陷阱'].forEach((k) => check(r.feedbackText.includes(k), '缺 ' + k));
          check(r.innerVisible === 0, '教具內仍有 ' + r.innerVisible + ' 組可見選項');
          check(!r.overflowX, '橫向溢出 ' + r.scrollWidth + '>' + r.clientWidth);
          check(r.theme === theme, '主題錯誤 ' + r.theme);
          check(r.frameH <= 420, '教具高度 ' + r.frameH + ' > 420');
          const shot = path.join(SHOTS, `20261122_${String(pass + 1).padStart(3, '0')}_${code}_${vp.tag}_${theme}.png`);
          await session.screenshot(shot);
          console.log(`PASS ${tag} :: 4 選項 / 唯一 / ${wantCorrect ? '答對' : '答錯'} / 詳解 / 無溢出 / 教具 ${r.frameH}px`);
          pass++;
          unitIdx++;
        }
      }
    }
  } finally {
    session.close();
    server.close();
  }
  if (errors.length) {
    console.error('FAIL verify_shell_choices_cdp:');
    errors.slice(0, 40).forEach((e) => console.error(' - ' + e));
    process.exit(1);
  }
  console.log(`SHELL_CHOICES_CDP_VERIFIED (${pass}/20 組合全綠，截圖 ${SHOTS})`);
  process.exit(0);
}

main().catch((err) => { console.error('ERROR: ' + (err && err.stack || err)); process.exit(2); });
