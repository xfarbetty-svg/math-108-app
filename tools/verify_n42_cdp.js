/**
 * tools/verify_n42_cdp.js — G4-N-4-2 教具＋主入口整合 CDP 實機驗證
 * 1) 獨立教具：觀念模式＋?q=1..10 × Light/Dark × 390×844／1280×800
 * 2) q-mode 隱藏活動頁籤、題型鎖定、58×317 個位欄垂直對齊、主題切換、估算揭開直式
 * 3) 主入口：四年級 → N-4-2 → 概念探索 → 真題測驗 Q1..Q10 → 外殼主題切換
 * 任一 FAIL → Exit 1；截圖 tools/_scratch/n42_*.png
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createSession, sleep } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tools', '_scratch');
fs.mkdirSync(OUT, { recursive: true });
const fails = [];
const push = (cond, msg) => { if (!cond) fails.push(msg); };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const fp = path.join(ROOT, rel === '/' ? 'app/index.html' : rel);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
        res.writeHead(404); res.end('404'); return;
      }
      const ext = path.extname(fp).toLowerCase();
      const mime = {
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml', '.mp4': 'video/mp4'
      }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const METRICS = `(() => {
  const app = document.getElementById('app');
  const tabs = document.querySelector('.act-tabs');
  const ts = tabs ? getComputedStyle(tabs) : null;
  return {
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    cw: document.documentElement.clientWidth,
    h: app ? app.getBoundingClientRect().height : 0,
    sh: document.documentElement.scrollHeight,
    ch: document.documentElement.clientHeight,
    qmode: document.body.classList.contains('q-mode'),
    tabsHidden: !tabs || ts.display === 'none',
    mul: document.querySelectorAll('.mul-grid').length,
    div: document.querySelectorAll('.div-board').length,
    bal: document.querySelectorAll('.balance-svg').length,
    est: document.querySelectorAll('.est-box').length,
    theme: document.documentElement.dataset.theme
  };
})()`;

(async () => {
  const { server, port } = await startServer();
  const s = await createSession({ width: 390, height: 844 });
  const errors = [];
  s.onMessage((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params && msg.params.exceptionDetails;
      errors.push((d && (d.text || d.exception && d.exception.description)) || 'exception');
    }
  });
  const setVP = (w, h, mobile) => s.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile });
  const fileUrl = 'file:///' + path.join(ROOT, 'app', 'components', 'mul_div_g4_lab.html').replace(/\\/g, '/');
  const shot = (name) => s.screenshot(path.join(OUT, name));

  try {
    /* ---------- 1. 獨立教具：手機 10 題 × 雙主題 ---------- */
    for (const q of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const theme of ['light', 'dark']) {
        await setVP(390, 844, true);
        await s.navigate(fileUrl + '?q=' + q + '&theme=' + theme, 220);
        const m = await s.eval(METRICS);
        const tag = 'q' + q + '/' + theme;
        push(m.sw <= 390, tag + ' 橫向溢出 ' + m.sw);
        push(m.h <= 420, tag + ' 教具高 ' + m.h.toFixed(1) + 'px > 420');
        push(m.qmode === true, tag + ' 未進入 q-mode');
        push(m.tabsHidden === true, tag + ' 活動頁籤未隱藏');
        push(m.theme === theme, tag + ' 主題錯誤 ' + m.theme);
        if (q <= 5) {
          push(m.mul >= 1 && m.div === 0 && m.bal === 0 && m.est === 0,
            tag + ' 乘法題型鎖定失敗 ' + JSON.stringify({ mul: m.mul, div: m.div, bal: m.bal, est: m.est }));
        } else if (q === 9) {
          push(m.est >= 1 && m.mul === 0 && m.div === 0 && m.bal === 0,
            tag + ' 估算題型鎖定失敗 ' + JSON.stringify({ mul: m.mul, div: m.div, bal: m.bal, est: m.est }));
        } else {
          push(m.div >= 1 && m.mul === 0 && m.est === 0,
            tag + ' 除法題型鎖定失敗 ' + JSON.stringify({ mul: m.mul, div: m.div, est: m.est }));
        }
        if (q === 1 && theme === 'light') await shot('n42_q1_light.png');
        if (q === 6 && theme === 'light') {
          const q6Init = await s.eval(`document.querySelector('[data-kind="q"]').textContent`);
          push(q6Init.indexOf('?') !== -1 && q6Init.indexOf('1000') === -1, 'Q6 初始未保留 ? 佔位或劇透 ' + q6Init);
          await s.eval(`(() => { for (let i = 0; i < 4; i++) document.getElementById('btn-next').click(); return true; })()`);
          await sleep(80);
          const q6Done = await s.eval(`({ q: document.querySelector('[data-kind="q"]').textContent, p: [].slice.call(document.querySelectorAll('[data-kind="p"]')).map(x => x.textContent).join('|'), h: document.getElementById('app').getBoundingClientRect().height })`);
          push(q6Done.q.indexOf('1000') !== -1, 'Q6 展開商未顯示 1000: ' + q6Done.q);
          push(q6Done.h <= 420, 'Q6 展開後高 ' + q6Done.h.toFixed(1) + ' > 420');
          await shot('n42_q6_steps.png');
        }
        if (q === 7 && theme === 'dark') {
          const q7Init = await s.eval(`document.querySelector('[data-kind="q"]').textContent`);
          push(q7Init.indexOf('?') !== -1 && q7Init.indexOf('30') === -1, 'Q7 初始未保留 ? 佔位或劇透 ' + q7Init);
          await s.eval(`(() => { for (let i = 0; i < 2; i++) document.getElementById('btn-next').click(); return true; })()`);
          await sleep(80);
          const q7Done = await s.eval(`({ q: document.querySelector('[data-kind="q"]').textContent, h: document.getElementById('app').getBoundingClientRect().height })`);
          push(q7Done.q.indexOf('30') !== -1, 'Q7 展開商未顯示 30: ' + q7Done.q);
          push(q7Done.h <= 420, 'Q7 展開後高 ' + q7Done.h.toFixed(1) + ' > 420');
          await shot('n42_q7_dark.png');
        }
        if (q === 8 && theme === 'light') {
          await s.eval(`(() => { for (let i = 0; i < 2; i++) document.getElementById('btn-next').click(); return true; })()`);
          await sleep(80);
          const q8Done = await s.eval(`({ q: document.querySelector('[data-kind="q"]').textContent, h: document.getElementById('app').getBoundingClientRect().height })`);
          push(q8Done.q.indexOf('17') !== -1, 'Q8 展開商未顯示 17: ' + q8Done.q);
          push(q8Done.h <= 420, 'Q8 展開後高 ' + q8Done.h.toFixed(1) + ' > 420');
          await shot('n42_q8_steps.png');
        }
      }
    }

    /* ---------- 2. 獨立教具：桌面 1280×800 10 題 ---------- */
    for (const q of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      await setVP(1280, 800, false);
      await s.navigate(fileUrl + '?q=' + q, 180);
      const m = await s.eval(METRICS);
      push(m.sw <= 1280, 'q' + q + '/1280 橫向溢出 ' + m.sw);
      push(m.h <= 420, 'q' + q + '/1280 教具高 ' + m.h.toFixed(1) + 'px > 420');
    }

    /* ---------- 3. 觀念模式：三大活動、對齊、主題、估算 ---------- */
    await setVP(390, 844, true);
    await s.navigate(fileUrl + '?theme=light', 250);
    let m = await s.eval(METRICS);
    push(m.qmode === false, '觀念模式誤帶 q-mode');
    push(m.tabsHidden === false, '觀念模式活動頁籤未顯示');
    push(m.mul >= 1, '觀念模式預設未載入乘法部分積');
    push(m.h <= 420, '觀念模式教具高 ' + m.h.toFixed(1) + 'px > 420');
    push(m.sw <= 390, '觀念模式橫向溢出 ' + m.sw);
    await shot('n42_concept_light.png');

    const theme1 = await s.eval(`(() => {
      const btn = document.getElementById('btn-theme');
      const before = document.documentElement.dataset.theme;
      btn.click();
      return { before: before, after: document.documentElement.dataset.theme, icon: btn.textContent };
    })()`);
    push(theme1.before === 'light' && theme1.after === 'dark', '#btn-theme 未切到 dark');
    push(theme1.icon.indexOf('☀') !== -1, '#btn-theme dark 圖示未變 ☀️');
    await s.eval(`document.getElementById('btn-theme').click(); 'ok'`);
    const theme2 = await s.eval(`(() => ({
      theme: document.documentElement.dataset.theme,
      icon: document.getElementById('btn-theme').textContent
    }))()`);
    push(theme2.theme === 'light' && theme2.icon.indexOf('🌙') !== -1, '#btn-theme 未切回 light');
    await s.eval(`window.postMessage({ type: 'THEME_CHANGE', theme: 'dark' }, '*'); 'ok'`);
    await sleep(80);
    const theme3 = await s.eval(`document.documentElement.dataset.theme`);
    push(theme3 === 'dark', 'THEME_CHANGE 廣播未生效 ' + theme3);
    await s.eval(`window.postMessage({ type: 'THEME_CHANGE', theme: 'light' }, '*'); 'ok'`);
    await sleep(60);

    await s.eval(`(() => { for (let i = 0; i < 8; i++) document.getElementById('btn-next').click(); return true; })()`);
    await sleep(120);
    const align = await s.eval(`(() => {
      const rows = [].slice.call(document.querySelectorAll('.mul-grid .vrow')).filter(function (r) {
        const k = r.getAttribute('data-row') || '';
        return k === 'a' || k === 'b' || k === 'total' || /^p/.test(k);
      });
      const xs = rows.map(function (r) {
        const c = r.querySelector('[data-col="5"]');
        return c ? c.getBoundingClientRect().left : null;
      }).filter(function (x) { return x !== null; });
      const texts = {};
      rows.forEach(function (r) { texts[r.getAttribute('data-row')] = r.textContent; });
      return {
        n: xs.length,
        spread: xs.length ? Math.max.apply(null, xs) - Math.min.apply(null, xs) : 999,
        texts: texts
      };
    })()`);
    push(align.n >= 5, '58×317 對齊列數不足 ' + align.n);
    push(align.spread <= 1, '58×317 個位欄未垂直對齊，誤差 ' + align.spread.toFixed(2) + 'px');
    push((align.texts.p0 || '').indexOf('406') !== -1, '部分積 58×7=406 未出現');
    push((align.texts.p1 || '').indexOf('580') !== -1, '部分積 58×10=580 未出現');
    push((align.texts.p2 || '').indexOf('17400') !== -1, '部分積 58×300=17400 未出現');
    push((align.texts.total || '').indexOf('18386') !== -1, '總和 18386 未出現');

    await s.eval(`document.querySelectorAll('.act-tab')[1].click(); 'ok'`);
    await sleep(100);
    const act2 = await s.eval(`(() => ({
      bal: !!document.querySelector('.balance-svg'),
      div: !!document.querySelector('.div-board'),
      status: (document.querySelector('.balance-status') || {}).textContent || ''
    }))()`);
    push(act2.bal && act2.div && act2.status.length > 0, '活動二試商天平未載入');
    await s.eval(`document.getElementById('btn-tune-plus').click(); 'ok'`);
    await sleep(80);
    const act2b = await s.eval(`(document.querySelector('.balance-status') || {}).textContent || ''`);
    push(act2b.length > 0 && act2b !== act2.status, '活動二商加 1 未更新天平狀態');

    await s.eval(`document.querySelectorAll('.act-tab')[2].click(); 'ok'`);
    await sleep(100);
    const rev = await s.eval(`(() => {
      const btn = document.getElementById('btn-reveal-exact');
      if (!btn) return { ok: false };
      btn.click();
      const box = document.querySelector('.est-reveal');
      const row = box && box.querySelector('.vrow');
      return {
        ok: !!(box && box.classList.contains('show') && row),
        grid: row ? getComputedStyle(row).display === 'grid' : false,
        h: document.getElementById('app').getBoundingClientRect().height
      };
    })()`);
    push(rev.ok && rev.grid, '活動三揭開精算直式未展開 CSS Grid');
    push(rev.h <= 420, '活動三揭開後教具高 ' + rev.h.toFixed(1) + 'px > 420');

    /* ---------- 4. Q9 估算揭開除法直式 ---------- */
    await s.navigate(fileUrl + '?q=9&theme=light', 220);
    const q9 = await s.eval(`(() => {
      const btn = document.getElementById('btn-reveal-exact');
      if (!btn) return { ok: false };
      btn.click();
      const box = document.querySelector('.est-reveal');
      const grid = box && box.querySelector('.div-grid');
      return {
        ok: !!(box && box.classList.contains('show') && grid),
        grid: grid ? getComputedStyle(grid).display === 'grid' : false,
        h: document.getElementById('app').getBoundingClientRect().height,
        sw: document.body.scrollWidth
      };
    })()`);
    push(q9.ok && q9.grid, 'Q9 揭開精算直式未展開 CSS Grid');
    push(q9.h <= 420, 'Q9 揭開後教具高 ' + q9.h.toFixed(1) + 'px > 420');
    push(q9.sw <= 390, 'Q9 揭開後橫向溢出 ' + q9.sw);
    await shot('n42_q9_light.png');

    /* ---------- 5. 主入口整合：四年級 → N-4-2 → 概念 → 真題 Q1..Q10 ---------- */
    await s.navigate('http://127.0.0.1:' + port + '/app/index.html', 800);
    const gradeOk = await s.eval(`(() => {
      const b = [].slice.call(document.querySelectorAll('#gradeNav .grade-btn')).filter(function (x) { return /四年級/.test(x.textContent); })[0];
      if (!b) return false;
      b.click();
      return true;
    })()`);
    push(gradeOk, '主入口找不到四年級導航');
    await sleep(350);
    const unitOk = await s.eval(`(() => {
      const c = [].slice.call(document.querySelectorAll('.unit-card.ready')).filter(function (x) { return x.getAttribute('data-code') === 'N-4-2'; })[0];
      if (!c) return false;
      c.click();
      return true;
    })()`);
    push(unitOk, '主入口找不到 N-4-2 單元卡');
    await sleep(900);
    const tabsShown = await s.eval(`getComputedStyle(document.getElementById('unitModeTabs')).display`);
    push(tabsShown !== 'none', 'N-4-2 未出現概念／真題頁籤');
    const defaultConcept = await s.eval(`document.getElementById('btnModeConcept').classList.contains('active')`);
    push(defaultConcept === true, 'N-4-2 點入預設未顯示概念探索');
    await shot('n42_shell_concept.png');

    await s.eval(`document.getElementById('btnModeConcept').click(); 'ok'`);
    await sleep(800);
    const concept = await s.eval(`(() => {
      const f = document.getElementById('conceptFrame');
      const d = f.contentDocument;
      return {
        src: f.getAttribute('src') || '',
        qmode: d.body.classList.contains('q-mode'),
        tabs: getComputedStyle(d.querySelector('.act-tabs')).display,
        mul: !!d.querySelector('.mul-grid')
      };
    })()`);
    push(concept.src.indexOf('components/mul_div_g4_lab.html') !== -1, '概念探索未載入 N-4-2 教具 ' + concept.src);
    push(concept.qmode === false && concept.tabs !== 'none' && concept.mul, '概念探索 iframe 內容不正確');

    await s.eval(`document.getElementById('btnModeExam').click(); 'ok'`);
    await sleep(800);
    const exam0 = await s.eval(`(() => ({
      opts: document.querySelectorAll('#shellOptions .shell-opt').length,
      stem: document.getElementById('shellStem').textContent.trim().length,
      src: document.getElementById('stageFrame').getAttribute('src') || '',
      innerQ: (() => { try { return document.getElementById('stageFrame').contentDocument.body.classList.contains('q-mode'); } catch (e) { return false; } })()
    }))()`);
    push(exam0.opts === 4, '外殼四選項數 ' + exam0.opts);
    push(exam0.stem > 5, '外殼題幹為空');
    push(exam0.src.indexOf('mul_div_g4_lab.html?q=1') !== -1, '真題測驗未載入 ?q=1 ' + exam0.src);
    push(exam0.innerQ === true, '真題 iframe 未進入 q-mode');
    await shot('n42_shell_q1.png');

    for (let i = 0; i < 10; i++) {
      const r = await s.eval(`(() => ({
        idx: state.qIndex,
        opts: document.querySelectorAll('#shellOptions .shell-opt').length,
        stem: document.getElementById('shellStem').textContent.trim().length,
        src: document.getElementById('stageFrame').getAttribute('src') || ''
      }))()`);
      push(r.idx === i, '外殼題號 ' + r.idx + ' ≠ ' + i);
      push(r.opts === 4, 'Q' + (i + 1) + ' 外殼選項數 ' + r.opts);
      push(r.stem > 5, 'Q' + (i + 1) + ' 題幹為空');
      push(r.src.indexOf('?q=' + (i + 1)) !== -1, 'Q' + (i + 1) + ' 教具 src ' + r.src);
      if (i < 9) {
        await s.eval(`document.getElementById('btnNext').click(); 'ok'`);
        await sleep(240);
      }
    }

    const th = await s.eval(`(() => {
      const before = document.documentElement.dataset.theme;
      document.getElementById('btnThemeToggle').click();
      return { before: before, after: document.documentElement.dataset.theme };
    })()`);
    await sleep(300);
    const frameTheme = await s.eval(`(() => {
      try { return document.getElementById('stageFrame').contentDocument.documentElement.dataset.theme; }
      catch (e) { return 'ERR'; }
    })()`);
    push(th.after !== th.before, '外殼 #btnThemeToggle 未切換主題');
    push(frameTheme === th.after, '外殼主題未廣播到教具 iframe ' + frameTheme + '≠' + th.after);

    const shellMetrics = await s.eval(`(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      frameH: document.getElementById('stageFrame').getBoundingClientRect().height
    }))()`);
    push(shellMetrics.sw <= shellMetrics.cw + 1, '主入口橫向溢出 ' + shellMetrics.sw + '>' + shellMetrics.cw);
    push(shellMetrics.frameH <= 428, '主入口教具 iframe 高 ' + shellMetrics.frameH.toFixed(1) + ' > 428');

    if (errors.length) fails.push('JS exception ' + errors.length + ' 筆：' + errors[0].slice(0, 200));
    if (fails.length) {
      console.error('FAIL ' + fails.length + ':\n- ' + fails.join('\n- '));
      process.exit(1);
    }
    console.log('PASS verify_n42_cdp: 觀念模式＋10題×雙主題×雙視口零溢出、教具≤420px、題型鎖定、58×317 個位對齊、估算直式、主入口 Q1→Q10 與主題同步全綠');
    console.log('截圖：n42_concept_light.png / n42_q1_light.png / n42_q7_dark.png / n42_q9_light.png / n42_shell_q1.png');
    process.exit(0);
  } catch (e) {
    console.error('FAIL ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    s.close();
    server.close();
  }
})();
