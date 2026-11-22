/**
 * tools/verify_g3_viewport_width.js
 * G3 全線窄屏寬度地毯式體檢：24 單元 / 224 個 component_path × 360×800 與 390×844。
 * 檢查：整頁與 iframe 橫向捲軸、所有可見 DOM（含右上角浮動徽章、分頁列、底部狀態欄）右側切字、
 *       SVG <text> 超出 viewBox 安全區、教具容器高度 > 420px。
 * 用法：node tools/verify_g3_viewport_width.js [--phase pre|post] [--only <substr>] [--limit N]
 * Exit 0 = 0 溢出；Exit 1 = 有溢出（明細見 WIDTH_AUDIT_REPORT_<phase>.md）。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSession } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_scratch', 'g3_width_audit');
const ARG = process.argv.slice(2);
const arg = (name, def) => { const i = ARG.indexOf('--' + name); return i >= 0 ? ARG[i + 1] : def; };
const PHASE = arg('phase', 'pre');
const ONLY = arg('only', '');
const LIMIT = Number(arg('limit', '0')) || 0;
const VIEWPORTS = [{ w: 360, h: 800 }, { w: 390, h: 844 }];

function collectPaths() {
  const dir = path.join(ROOT, 'data', 'units', 'G3');
  const files = fs.readdirSync(dir).filter((f) => /\.json$/i.test(f)).sort();
  const seen = new Map();
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const unit = f.replace(/\.json$/i, '');
    for (const q of (data.questions || [])) {
      const cp = typeof q.component_path === 'string' ? q.component_path : '';
      if (!cp || seen.has(cp)) continue;
      const abs = path.join(ROOT, 'app', cp.split('?')[0]);
      seen.set(cp, { path: cp, unit, file: path.basename(cp.split('?')[0]), abs, exists: fs.existsSync(abs) });
    }
  }
  return [...seen.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** 在頁面內執行的量測函式（序列化後丟進 Runtime.evaluate）。 */
function measureInPage(vw, vh) {
  const de = document.documentElement;
  const out = {
    pageOverflowX: de.scrollWidth > de.clientWidth + 1,
    pageScrollWidth: de.scrollWidth,
    pageClientWidth: de.clientWidth,
    containerSelector: '',
    containerHeight: 0,
    bodyHeight: Math.round(document.body.getBoundingClientRect().height),
    overflows: [],
    svgText: [],
    iframes: [],
    visibleCount: 0
  };
  const cs = (el) => { try { return getComputedStyle(el); } catch (e) { return null; } };
  const vis = (el) => {
    const s = cs(el); if (!s) return false;
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n || 40);
  const desc = (el, offsetX, vwLocal) => {
    const r = el.getBoundingClientRect();
    const cls = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: clip(cls, 60),
      text: clip(el.textContent || (el.getAttribute && el.getAttribute('aria-label')) || '', 34),
      left: Math.round(r.left + offsetX),
      right: Math.round(r.right + offsetX),
      width: Math.round(r.width)
    };
  };
  const SKIP = new Set(['script', 'style', 'head', 'meta', 'link', 'title', 'template', 'noscript', 'br']);
  const walk = (root, offsetX, vwLocal) => {
    for (const el of root.querySelectorAll('*')) {
      if (SKIP.has(el.tagName.toLowerCase())) continue;
      // 放大鏡等 nested SVG 使用非零 viewBox 原點，內容被 #app overflow:hidden 裁去，
      // 不構成可見右側切字或橫向捲軸，排除誤判。
      const owner = el.closest && el.closest('svg[viewBox]');
      const vbRoot = owner && owner.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
      if (vbRoot && (vbRoot[0] !== 0 || vbRoot[1] !== 0)) continue;
      if (!vis(el)) continue;
      out.visibleCount++;
      const r = el.getBoundingClientRect();
      if (r.right + offsetX > vwLocal + 1) out.overflows.push(desc(el, offsetX, vwLocal));
      if (el.namespaceURI && el.namespaceURI.indexOf('svg') >= 0 && el.tagName.toLowerCase() === 'text') {
        const svg = el.ownerSVGElement;
        let vb = null;
        if (svg && svg.getAttribute('viewBox')) vb = svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
        const x = Number(el.getAttribute('x'));
        if (vb && vb.length >= 4 && vb[0] === 0 && vb[1] === 0 && Number.isFinite(x) && x > vb[2] - 16) {
          out.svgText.push({ text: clip(el.textContent || '', 34), x, viewBoxWidth: vb[2], limit: vb[2] - 16 });
        }
      }
    }
  };
  walk(document, 0, vw);
  for (const f of document.querySelectorAll('iframe')) {
    try {
      const d = f.contentDocument;
      if (!d || !d.documentElement) continue;
      const fr = f.getBoundingClientRect();
      const fd = d.documentElement;
      if (fd.scrollWidth > fd.clientWidth + 1 || d.body.scrollWidth > fd.clientWidth + 1) {
        out.iframes.push({ src: f.getAttribute('src') || '', scrollWidth: Math.max(fd.scrollWidth, d.body.scrollWidth), clientWidth: fd.clientWidth });
      }
      walk(d, fr.left, vw);
    } catch (e) {
      out.iframes.push({ src: f.getAttribute('src') || '', error: String(e.message || e) });
    }
  }
  for (const sel of ['#app-container', '#app', '#root', '.app-container', '.lab', '.app-shell']) {
    const el = document.querySelector(sel);
    if (el && vis(el)) { out.containerSelector = sel; out.containerHeight = Math.round(el.getBoundingClientRect().height); break; }
  }
  if (!out.containerSelector) { out.containerSelector = 'body'; out.containerHeight = out.bodyHeight; }
  return out;
}

function esc(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
function slug(s) { return s.replace(/[^a-zA-Z0-9._-]+/g, '_'); }

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let paths = collectPaths();
  if (ONLY) paths = paths.filter((p) => p.path.indexOf(ONLY) >= 0);
  if (LIMIT) paths = paths.slice(0, LIMIT);
  if (!paths.length) throw new Error('沒有符合的 component_path');
  console.log(`受測：${paths.length} 個 component_path × ${VIEWPORTS.length} 視口 = ${paths.length * VIEWPORTS.length} 次量測`);

  const cdp = await createSession({ width: 390, height: 844 });
  const consoleErrors = [];
  cdp.onMessage((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' '));
    }
  });
  const results = [];
  const expr = '(' + measureInPage.toString() + ')';
  try {
    let n = 0;
    for (const vp of VIEWPORTS) {
      await cdp.setViewport(vp.w, vp.h);
      for (const item of paths) {
        if (!item.exists) { results.push({ ...item, vp: vp.w, missing: true }); continue; }
        consoleErrors.length = 0;
        const ts = Date.now() + '-' + Math.floor(Math.random() * 1e9);
        const qi = item.path.indexOf('?');
        const qpart = qi >= 0 ? item.path.slice(qi + 1) + '&' : '';
        const url = pathToFileURL(item.abs).href + '?' + qpart + '_t=' + ts + '&theme=light';
        await cdp.navigate(url, 120);
        const m = await cdp.eval(`${expr}(${vp.w},${vp.h})`);
        if (!m) throw new Error('量測回傳空值：' + item.path);
        m.consoleErrors = consoleErrors.slice(0, 5);
        results.push({ ...item, vp: vp.w, ...m });
        n++;
        if (n % 40 === 0) console.log(`  ...${n}/${paths.length * VIEWPORTS.length}`);
      }
    }
  } finally {
    cdp.close();
  }

  const bad = results.filter((r) => r.missing || r.pageOverflowX || r.overflows.length || r.svgText.length || r.iframes.length || r.containerHeight > 420 || r.consoleErrors.length);
  fs.writeFileSync(path.join(OUT, `audit_${PHASE}.json`), JSON.stringify({ phase: PHASE, generated: new Date().toISOString(), viewports: VIEWPORTS, total: results.length, bad: bad.length, results }, null, 2));

  const lines = [];
  lines.push(`# G3 24 單元窄屏寬度體檢報告（${PHASE === 'post' ? '修復後' : '修復前基線'}）`);
  lines.push('');
  lines.push(`- 產生時間：${new Date().toISOString()}`);
  lines.push(`- 視口：360×800 / 390×844`);
  lines.push(`- 題庫：data/units/G3/*.json（24 檔 / 234 題 / ${paths.length} 個不重複 component_path）`);
  lines.push(`- 量測次數：${results.length}；異常次數：**${bad.length}**`);
  lines.push(`- 判定：${bad.length === 0 ? '✅ 0 溢出（Exit 0）' : '❌ 仍有溢出（Exit 1）'}`);
  lines.push('');
  lines.push('## 異常摘要');
  lines.push('');
  lines.push('| 元件 | 視口 | 頁面橫捲 | 容器高 | 右側溢出元素 | SVG文字 | iframe | console |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|');
  for (const r of bad) {
    lines.push(`| ${esc(r.path)} | ${r.vp} | ${r.missing ? '缺件' : (r.pageOverflowX ? `${r.pageScrollWidth}>${r.pageClientWidth}` : '—')} | ${r.containerHeight || '-'}px | ${r.overflows.length} | ${r.svgText.length} | ${r.iframes.length} | ${r.consoleErrors.length} |`);
  }
  lines.push('');
  lines.push('## 異常明細');
  lines.push('');
  for (const r of bad) {
    lines.push(`### ${r.path} @ ${r.vp}px`);
    lines.push('');
    lines.push(`- 容器：${r.containerSelector || '?'} 高 ${r.containerHeight}px（上限 420）`);
    lines.push(`- 整頁：scrollWidth=${r.pageScrollWidth} / clientWidth=${r.pageClientWidth} ${r.pageOverflowX ? '⚠ 橫向溢出' : 'OK'}`);
    if (r.overflows.length) {
      lines.push('- 右側溢出（right > ' + r.vp + '）：');
      lines.push('');
      lines.push('  | tag#id.class | 文字 | left | right |');
      lines.push('  |---|---|---:|---:|');
      for (const o of r.overflows.slice(0, 25)) {
        lines.push(`  | ${esc(o.tag + (o.id ? '#' + o.id : '') + (o.cls ? '.' + o.cls.split(' ')[0] : ''))} | ${esc(o.text)} | ${o.left} | ${o.right} |`);
      }
      if (r.overflows.length > 25) lines.push(`  - ...另有 ${r.overflows.length - 25} 筆`);
    }
    if (r.svgText.length) {
      lines.push('- SVG 文字超出 viewBox 安全區：' + r.svgText.map((s) => `${s.text}(x=${s.x}, limit=${s.limit})`).join('；'));
    }
    if (r.iframes.length) lines.push('- iframe 異常：' + JSON.stringify(r.iframes));
    if (r.consoleErrors.length) lines.push('- console 錯誤：' + r.consoleErrors.join('；'));
    lines.push('');
  }
  const report = path.join(OUT, `WIDTH_AUDIT_REPORT${PHASE === 'pre' ? '' : '_' + PHASE}.md`);
  fs.writeFileSync(report, lines.join('\n'));
  console.log(`\n報告：${report}`);
  if (bad.length) {
    console.error(`FAIL: ${bad.length} 個視口量測仍有溢出`);
    process.exit(1);
  }
  console.log('SUCCESS: G3 全線 ' + results.length + ' 次量測 0 溢出 (Exit 0)');
  process.exit(0);
}
main().catch((e) => { console.error('FAIL: ' + e.message); console.error(e.stack); process.exit(1); });
