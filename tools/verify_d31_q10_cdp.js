/**
 * tools/verify_d31_q10_cdp.js
 * D-3-1 ?q=10 真實 CDP 覆核：全新分頁 + 強制清快取 + 隨機 timestamp。
 * 360×800 / 390×844 × Light/Dark 截圖至 _scratch/g3_width_audit/，供 Hy4 Flash 目視確認無舊表格殘影重疊。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSession } = require('./_cdp_util');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_scratch', 'g3_width_audit', 'd31_q10');
const COMP = path.join(ROOT, 'app', 'components', 'table_cross_lab.html');
const VIEWPORTS = [{ w: 360, h: 800 }, { w: 390, h: 844 }];
const THEMES = ['light', 'dark'];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(COMP)) throw new Error('D-3-1 教具不存在：' + COMP);
  const cdp = await createSession({ width: 390, height: 844 });
  const consoleErrors = [];
  cdp.onMessage((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' '));
    }
  });
  let captured = 0;
  try {
    for (const vp of VIEWPORTS) {
      await cdp.setViewport(vp.w, vp.h);
      for (const theme of THEMES) {
        consoleErrors.length = 0;
        const ts = Date.now() + '-' + Math.floor(Math.random() * 1e9);
        const url = pathToFileURL(COMP).href + '?q=10&_t=' + ts + '&theme=' + theme;
        await cdp.navigate(url, 700);
        await cdp.eval('window.postMessage({type:"THEME_CHANGE",theme:"' + theme + '"},"*");true');
        await new Promise((r) => setTimeout(r, 250));
        const m = await cdp.eval(`(() => {
          const de = document.documentElement;
          const badge = document.getElementById('q-badge');
          const focus = document.getElementById('q-focus');
          const scene = document.getElementById('q-scene');
          const activeView = document.querySelector('.view.active');
          const vis = (el) => { if (!el) return false; const cs=getComputedStyle(el), r=el.getBoundingClientRect(); return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; };
          const rect = (el) => { if (!el) return null; const r=el.getBoundingClientRect(); return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)}; };
          const overlap = (a,b) => { if(!a||!b) return false; return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; };
          const sceneRect = rect(scene), viewRect = rect(activeView);
          const tables = Array.from(document.querySelectorAll('table')).filter(vis).map((t)=>({id:t.id||'', cls:t.className||'', rect:rect(t), text:(t.textContent||'').trim().slice(0,40)}));
          const over = Array.from(document.querySelectorAll('body *')).filter(vis).map((el)=>({tag:el.tagName.toLowerCase(),id:el.id||'',cls:String(el.className||'').slice(0,60),right:Math.round(el.getBoundingClientRect().right),text:(el.textContent||'').trim().slice(0,30)})).filter((x)=>x.right>${vp.w}+1).slice(0,20);
          return {
            theme: de.dataset.theme, url: location.href,
            badge: badge ? badge.textContent : '', focus: focus ? focus.textContent : '',
            sceneRect, viewRect, sceneViewOverlap: overlap(sceneRect, viewRect),
            tables, overflows: over,
            pageOverflowX: de.scrollWidth > de.clientWidth + 1,
            scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
            bodyHeight: Math.round(document.body.getBoundingClientRect().height),
            containerHeight: Math.round((document.getElementById('app-container')||document.body).getBoundingClientRect().height)
          };
        })()`);
        if (m.theme !== theme) throw new Error(`${vp.w}px ${theme} 主題未生效：${m.theme}`);
        if (m.badge !== 'Q10') throw new Error(`${vp.w}px ${theme} 徽章非 Q10：${m.badge}`);
        if (!m.focus || !m.focus.trim()) throw new Error(`${vp.w}px ${theme} q-focus 空白`);
        if (m.pageOverflowX) throw new Error(`${vp.w}px ${theme} 橫向捲軸 ${m.scrollWidth}>${m.clientWidth}`);
        if (m.containerHeight > 420) throw new Error(`${vp.w}px ${theme} 高度 ${m.containerHeight}px > 420`);
        if (consoleErrors.length) throw new Error(`${vp.w}px ${theme} console 錯誤：${consoleErrors.join('; ')}`);
        const file = path.join(OUT, `D31_Q10_${vp.w}x${vp.h}_${theme}.png`);
        await cdp.screenshot(file);
        captured++;
        console.log(`PASS ${vp.w}x${vp.h} ${theme} badge=${m.badge} containerH=${m.containerHeight} tables=${m.tables.length} sceneViewOverlap=${m.sceneViewOverlap} overflows=${m.overflows.length} -> ${path.basename(file)}`);
        console.log('     focus=' + m.focus);
        if (m.overflows.length) console.log('     overflow=' + JSON.stringify(m.overflows.slice(0, 6)));
      }
    }
    console.log(`\nSUCCESS: D-3-1 ?q=10 雙視口雙模式 ${captured} 張截圖完成，DOM 斷言全綠 (Exit 0)`);
    process.exit(0);
  } catch (e) {
    console.error('FAIL: ' + e.message);
    process.exit(1);
  } finally {
    cdp.close();
  }
}
main();
