/* ============================================================
 * r32_pattern_engine.js — 可復用「首項＋遞增重疊」SVG 動態推導引擎
 * ------------------------------------------------------------
 * 來源：028-1 國小數學APP / G3 R-3-2 Q05～Q10（2026-11-23）。
 * 設計目的：把「數量加減 + 重疊結構可視化 + 無劇透狀態列 + 統一控制器」
 *   抽離為單一模組，供 G4 同類題型（首項＋遞增、共用邊／座位扣減）
 *   直接掛載。G4 使用方式：
 *     1) 在教具 html 引入本檔：<script src="../js/r32_pattern_engine.js"></script>
 *     2) PatternEngine.mount(sceneEl, q, { badge, title, hint });
 *     3) 於下方 CONFIG 擴充一個 kind（render 回傳 SVG 字串、status 回傳狀態字串）。
 *     4) 驗證門禁tools/verify_r32_interactive_cdp.js 的 SPECS 同步加一筆即可複用。
 * 硬約束：高對比明亮色、雙模式可見、無純黑填充、無提交按鈕、未作答不印答案。
 * ============================================================ */
(function (global) {
  'use strict';

  // ---------- 明亮高對比色票（Light / Dark 通用，嚴禁純黑 #000） ----------
  var COL = {
    orange: '#FF9E2C', orangeDark: '#A84E00', gold: '#FFC93C', goldDark: '#8A5E00',
    leaf: '#39B54A', leafDark: '#1F7A2E',
    green: '#2FBF71', greenDark: '#0F6B3C', greenSoft: '#7BE0A8',
    red: '#F4455B', redDark: '#9E1630',
    blue: '#3F8CFF', blueDark: '#174BA6',
    paper: '#FFF6DC', paperLine: '#C9A227',
    tape: '#FFD23F', tapeLine: '#B07D00',
    wood: '#E8A93C', woodDark: '#7A4E0C', woodNew: '#FF6B35',
    ink: '#4A2E00', stroke: '#6B5B3A'
  };

  var BEAN_PALETTE = ['#FFD166', '#7BDFF2', '#B8E986', '#FFABAB', '#C7CEEA', '#FFC8A2'];

  // ---------- 小型 SVG 產生器 ----------
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function T(x, y, s, cls, extra) {
    return '<text class="' + (cls || 't') + '" x="' + x + '" y="' + y +
      '" text-anchor="middle" ' + (extra || '') + '>' + esc(s) + '</text>';
  }
  function circle(cx, cy, r, fill, stroke, sw, extra) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill +
      '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw || 0) + '" ' + (extra || '') + '/>';
  }
  function rect(x, y, w, h, fill, stroke, sw, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw || 0) + '" ' + (extra || '') + '/>';
  }
  function line(x1, y1, x2, y2, stroke, sw, extra) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linecap="round" ' + (extra || '') + '/>';
  }
  // 紅色虛線叉叉：標示「相接重疊處被扣掉的部分」
  function cross(x, y, r) {
    r = r || 9;
    return '<g class="iv-cross">' +
      line(x - r, y - r, x + r, y + r, COL.red, 3, 'stroke-dasharray="5,3"') +
      line(x + r, y - r, x - r, y + r, COL.red, 3, 'stroke-dasharray="5,3"') +
      '</g>';
  }
  function svgWrap(inner, h) {
    return '<svg viewBox="0 0 360 ' + (h || 258) + '" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>';
  }

  // ============================================================
  // Q05 — 柳丁兩兩一數（15～20 顆）
  // ============================================================
  function orangesSVG(n) {
    var xs = [58, 138, 218, 298], ys = [48, 90, 132, 174, 216];
    var out = T(180, 19, '柳丁兩兩一數：每 2 顆圈一組，看最後有沒有剩 1 顆', 't');
    for (var i = 0; i < n; i++) {
      var row = Math.floor(i / 4), col = i % 4;
      var x = xs[col], y = ys[row];
      // 只把「兩顆」圈成一組；奇數時最後 1 顆不畫空框，改由金色外環＋文字標示單獨剩餘
      if (i % 2 === 0 && !(i === n - 1 && n % 2 === 1)) {
        var bw = (col <= 2 ? xs[col + 1] - xs[col] : 80) + 40;
        out += rect(x - 20, y - 18, bw, 36, 'none', COL.blue, 2.4, 'rx="12" stroke-dasharray="7,4"');
      }
      var leftover = (i === n - 1 && n % 2 === 1);
      out += '<g class="iv-orange" data-i="' + i + '">';
      out += '<ellipse cx="' + (x + 9) + '" cy="' + (y - 17) + '" rx="9" ry="4.5" fill="' +
        COL.leaf + '" stroke="' + COL.leafDark + '" stroke-width="1.2" transform="rotate(-28 ' +
        (x + 9) + ' ' + (y - 17) + ')"/>';
      out += circle(x, y, 17, COL.orange, leftover ? COL.gold : COL.orangeDark, leftover ? 4 : 2);
      out += T(x, y + 5, String(i + 1), 'iv-num');
      if (leftover) out += T(x, y + 31, '單獨剩 1 顆', 'iv-tag-gold');
      out += '</g>';
    }
    out += (n % 2 === 1)
      ? T(180, 253, '最後 1 顆：單獨剩 1 顆', 'iv-tag-gold')
      : T(180, 253, '剛好兩兩分完（剩 0 顆）', 'iv-tag-green');
    return svgWrap(out, 262);
  }
  function orangesStatus(n) {
    var pairs = Math.floor(n / 2);
    return '目前 ' + n + ' 顆：' + pairs + ' 組兩兩' +
      (n % 2 === 1 ? ' ＋ 1 顆單獨剩餘' : '，剛好兩兩分完（剩 0 顆）');
  }

  // ============================================================
  // Q06 — 小精靈吃豆子（12 顆，偶數＋1 / 奇數−1）
  // ============================================================
  var BEANS = [22, 62, 74, 25, 15, 48, 16, 19, 50, 6, 33, 99];
  function beansSVG(marked) {
    var xs = [44, 100, 156, 212, 268, 324], ys = [88, 180];
    var out = T(180, 20, '小精靈吃豆子：偶數＋1 分，奇數−1 分', 't');
    for (var i = 0; i < BEANS.length; i++) {
      var num = BEANS[i], col = i % 6, row = Math.floor(i / 6);
      var x = xs[col], y = ys[row];
      var parity = (num % 2 === 0) ? 'even' : 'odd';
      var isMarked = !!marked[num];
      var stroke = isMarked ? (parity === 'even' ? COL.green : COL.red) : COL.stroke;
      var sw = isMarked ? 3.4 : 1.6;
      out += '<g class="iv-bean" data-num="' + num + '" data-parity="' + parity +
        '" data-marked="' + (isMarked ? 1 : 0) + '" role="button" tabindex="0" style="cursor:pointer">';
      out += '<ellipse cx="' + x + '" cy="' + y + '" rx="22" ry="19" fill="' +
        BEAN_PALETTE[i % BEAN_PALETTE.length] + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
      out += '<path d="M' + (x - 13) + ' ' + (y - 5) + ' q 8 7 16 0" fill="none" stroke="' +
        COL.stroke + '" stroke-width="1.5" opacity="0.65"/>';
      out += T(x, y + 6, String(num), 'iv-num');
      if (isMarked) {
        var badgeFill = parity === 'even' ? COL.green : COL.red;
        out += circle(x + 18, y - 15, 10, badgeFill, '#FFFFFF', 1.5);
        out += T(x + 18, y - 11, parity === 'even' ? '+1' : '−1', 'iv-badge-num');
      }
      out += '</g>';
    }
    out += T(180, 238, '點豆子或按下方按標記；得分留給自己算', 'iv-legend');
    return svgWrap(out, 250);
  }
  function beansStatus(marked) {
    var e = 0, o = 0;
    BEANS.forEach(function (num) {
      if (!marked[num]) return;
      if (num % 2 === 0) e++; else o++;
    });
    return '已標記：偶數 ' + e + ' 顆（＋1）　奇數 ' + o + ' 顆（−1）　尚未標記 ' + (12 - e - o) + ' 顆';
  }

  // ============================================================
  // Q07 — 作品貼膠帶（1～5 張）：上緣＋下緣＋接縫，接縫共用少 1 段
  // ============================================================
  function tapeSVG(n, lastAdded) {
    var y = 66, w = 56, h = 72, step = 64, ox = 32 + (5 - n) * step / 2;
    var out = T(180, 19, '作品貼膠帶：接縫共用，每多貼 1 張只多 3 段', 't');
    for (var i = 0; i < n; i++) {
      var x = ox + i * step, isNew = (lastAdded && i === n - 1);
      out += '<g class="iv-paper ' + (isNew ? 'iv-new' : '') + '">';
      out += rect(x, y, w, h, COL.paper, COL.paperLine, 2, 'rx="2"');
      out += T(x + w / 2, y + h / 2 + 4, '作品 ' + (i + 1), 'iv-num');
      out += rect(x - 3, y - 5, w + 6, 10, COL.tape, COL.tapeLine, 1.5, 'rx="3" opacity="0.88"');
      out += rect(x - 3, y + h - 5, w + 6, 10, COL.tape, COL.tapeLine, 1.5, 'rx="3" opacity="0.88"');
      out += '</g>';
      if (i < n - 1) {
        var sx = x + w + step / 2 - 4;
        out += rect(sx - 4, y + 2, 8, h - 4, COL.tape, COL.tapeLine, 1.5, 'rx="3" opacity="0.88"');
        out += cross(sx, y + h / 2, 9);
        out += T(sx, y + h / 2 + 24, '共用', 'iv-tag-red');
      }
    }
    out += T(180, 210, '黃色＝膠帶　紅色叉叉＝共用接縫（少貼 1 段）', 'iv-legend');
    return svgWrap(out, 220);
  }
  function tapeStatus(n) {
    return n + ' 張：上緣 ' + n + ' ＋ 下緣 ' + n + ' ＋ 接縫 ' + Math.max(0, n - 1) +
      ' ＝ ' + (3 * n - 1) + ' 段　（每多 1 張多 3 段）';
  }

  // ============================================================
  // Q08 — 梯形桌併桌（1～4 張）：每多 1 張，斜邊 2 座位被併掉 → 多 3 人
  // ============================================================
  function trapezoidSVG(n, lastAdded) {
    var y = 72, th = 52, bw = 72, step = 72, ox = 30 + (4 - n) * step / 2;
    var seatCols = [COL.red, COL.gold, COL.greenSoft, COL.blue, '#C08BFF', '#FF8A3D'];
    var out = T(180, 19, '梯形桌併桌：相接斜邊 2 個座位被併掉，每多 1 張多 3 人', 't');
    for (var i = 0; i < n; i++) {
      var x = ox + i * step, isNew = (lastAdded && i === n - 1);
      out += '<g class="iv-table ' + (isNew ? 'iv-new' : '') + '">';
      out += '<path d="M' + (x + 12) + ' ' + y + ' L' + (x + 60) + ' ' + y +
        ' L' + (x + bw) + ' ' + (y + th) + ' L' + x + ' ' + (y + th) + ' Z" fill="' +
        COL.blue + '" stroke="' + COL.blueDark + '" stroke-width="2.5"/>';
      out += T(x + bw / 2, y + th / 2 + 5, '桌 ' + (i + 1), 'iv-num-light');
      var seats = [[x + 24, y - 10], [x + 48, y - 10], [x + 36, y + th + 11],
                   [x - 4, y + 28], [x + bw + 4, y + 28]];
      for (var k = 0; k < seats.length; k++) {
        out += circle(seats[k][0], seats[k][1], 6, seatCols[k], '#FFFFFF', 1.4);
      }
      out += '</g>';
      if (i < n - 1) {
        var ix = x + bw;
        out += cross(ix, y + 28, 10);
        out += T(ix, y + 52, '−2 人', 'iv-tag-red');
      }
    }
    out += T(180, 176, '亮藍＝桌子　彩色＝座位　紅色叉叉＝被併掉、不坐人', 'iv-legend');
    return svgWrap(out, 188);
  }
  function trapezoidStatus(n) {
    return n + ' 張：5 ＋ 3×' + (n - 1) + ' ＝ ' + (3 * n + 2) +
      ' 人　（✖ 扣掉 ' + (2 * (n - 1)) + ' 個斜邊座位）';
  }

  // ============================================================
  // Q09 — 長方形桌併桌（1～3 張）：左右短邊各 2 座位被併掉 → 多 6 人
  // ============================================================
  function rectTableSVG(n, lastAdded) {
    var y = 74, w = 96, h = 58, step = 96, ox = 30 + (3 - n) * step / 2;
    var seatCols = [COL.red, COL.gold, COL.greenSoft, COL.blue, '#C08BFF', '#FF8A3D'];
    var out = T(180, 19, '長方形桌併桌：左右短邊座位被併掉，上下邊座位累加', 't');
    for (var i = 0; i < n; i++) {
      var x = ox + i * step, isNew = (lastAdded && i === n - 1);
      out += '<g class="iv-table ' + (isNew ? 'iv-new' : '') + '">';
      out += rect(x, y, w, h, COL.green, COL.greenDark, 2.5, 'rx="3"');
      out += T(x + w / 2, y + h / 2 + 5, '桌 ' + (i + 1), 'iv-num-light');
      var seats = [
        [x + 18, y - 10], [x + 48, y - 10], [x + 78, y - 10],
        [x + 18, y + h + 11], [x + 48, y + h + 11], [x + 78, y + h + 11],
        [x - 9, y + 18], [x - 9, y + 44], [x + w + 9, y + 18], [x + w + 9, y + 44]
      ];
      for (var k = 0; k < seats.length; k++) {
        out += circle(seats[k][0], seats[k][1], 6, seatCols[k % seatCols.length], '#FFFFFF', 1.4);
      }
      out += '</g>';
      if (i < n - 1) {
        var seam = x + w;
        out += cross(seam + 9, y + 18, 8) + cross(seam + 9, y + 44, 8);
        out += cross(seam - 9, y + 18, 8) + cross(seam - 9, y + 44, 8);
        out += T(seam, y + h + 27, '−4 人', 'iv-tag-red');
      }
    }
    out += T(180, 190, '亮綠＝桌子　彩色＝座位　紅色叉叉＝被併掉（每接一次少 4 個）', 'iv-legend');
    return svgWrap(out, 202);
  }
  function rectTableStatus(n) {
    return n + ' 張：10 ＋ 6×' + (n - 1) + ' ＝ ' + (6 * n + 4) +
      ' 人　（✖ 扣掉 ' + (4 * (n - 1)) + ' 個短邊座位）';
  }

  // ============================================================
  // Q10 — 竹籤排相連正方形（1～4 個）：共用 1 根，每多 1 個只多 3 根
  // ============================================================
  function sticksSVG(n, lastAdded) {
    var size = 58, y = 70, ox = 30 + (4 - n) * size / 2;
    var out = T(180, 19, '竹籤排正方形：中間共用 1 根，每多 1 個只多 3 根', 't');
    // 先畫所有正方形的上、下、右三邊（新補的用亮橘）
    for (var i = 0; i < n; i++) {
      var x = ox + i * size, isNew = (lastAdded && i === n - 1);
      var c = isNew ? COL.woodNew : COL.wood;
      out += '<g class="iv-square" data-i="' + i + '">';
      // 立體感：深底 + 亮面
      out += line(x, y, x + size, y, COL.woodDark, 9) + line(x, y, x + size, y, c, 5.5);
      out += line(x, y + size, x + size, y + size, COL.woodDark, 9) + line(x, y + size, x + size, y + size, c, 5.5);
      out += line(x + size, y, x + size, y + size, COL.woodDark, 9) + line(x + size, y, x + size, y + size, c, 5.5);
      out += T(x + size / 2, y + size / 2 + 6, String(i + 1), 'iv-num-onbg');
      out += '</g>';
    }
    // 左邊：第 1 個用一般竹籤；之後每根都是「共用」＝前一個的右邊
    out += line(ox, y, ox, y + size, COL.woodDark, 9) + line(ox, y, ox, y + size, COL.wood, 5.5);
    for (var j = 1; j < n; j++) {
      var sx = ox + j * size;
      out += '<g class="iv-shared">';
      out += circle(sx, y + size / 2, 19, 'none', COL.gold, 2.5, 'stroke-dasharray="5,3"');
      out += T(sx, y - 15, '共用 1 根', 'iv-tag-gold');
      out += cross(sx, y + size / 2, 6);
      out += '</g>';
    }
    out += T(180, 180, '木黃＝竹籤　金光＋叉叉＝共用 1 根（只算一次）　亮橘＝新補的 3 根', 'iv-legend');
    return svgWrap(out, 194);
  }
  function sticksStatus(n) {
    return n + ' 個：4 ＋ 3×' + (n - 1) + ' ＝ ' + (3 * n + 1) +
      ' 根　（共用 ' + (n - 1) + ' 根只算一次）';
  }

  // ============================================================
  // CONFIG — G4 複用時於此擴充 kind
  // ============================================================
  var CONFIG = {
    oranges: {
      min: 15, max: 20, init: 15, unit: '顆',
      minusLabel: '➖ 減少 1 顆', plusLabel: '➕ 多買 1 顆',
      render: orangesSVG, status: orangesStatus
    },
    tape: {
      min: 1, max: 5, init: 1, unit: '張',
      minusLabel: '➖ 少貼 1 張', plusLabel: '➕ 多貼 1 張',
      render: tapeSVG, status: tapeStatus
    },
    trapezoid: {
      min: 1, max: 4, init: 1, unit: '張',
      minusLabel: '➖ 少 1 張', plusLabel: '➕ 多 1 張',
      render: trapezoidSVG, status: trapezoidStatus
    },
    recttable: {
      min: 1, max: 3, init: 1, unit: '張',
      minusLabel: '➖ 少 1 張', plusLabel: '➕ 多 1 張',
      render: rectTableSVG, status: rectTableStatus
    },
    sticks: {
      min: 1, max: 4, init: 1, unit: '個',
      minusLabel: '➖ 少 1 個', plusLabel: '➕ 多 1 個',
      render: sticksSVG, status: sticksStatus
    }
  };

  var QKIND = { 5: 'oranges', 6: 'beans', 7: 'tape', 8: 'trapezoid', 9: 'recttable', 10: 'sticks' };
  var QINFO = {
    5: { title: '柳丁兩兩一數', hint: '按＋／－改變柳丁數量，觀察每 2 顆一圈後，最後會不會多 1 顆。' },
    6: { title: '小精靈吃豆子', hint: '逐顆點豆子分類：偶數亮綠框＋1、奇數亮紅框−1，得分自己算。' },
    7: { title: '作品貼膠帶', hint: '每多貼 1 張，接縫共用；注意紅色叉叉處少貼了 1 段。' },
    8: { title: '梯形桌併桌', hint: '每多 1 張，相接斜邊的 2 個座位被併掉（紅色叉叉），只多 3 人。' },
    9: { title: '長方形桌併桌', hint: '左右短邊各 2 個座位被併掉（紅色叉叉），上下邊座位累加。' },
    10: { title: '竹籤排正方形', hint: '金光閃爍處是共用的 1 根竹籤，新補的 3 根以亮橘標出。' }
  };

  // ---------- 對外掛載 ----------
  function say(text) {
    try {
      if (global.parent && global.parent !== global) global.parent.postMessage({ type: 'TTS_SPEAK', text: text }, '*');
    } catch (e) {}
  }

  function mount(host, q, meta) {
    if (!host) return;
    var kind = QKIND[q];
    if (!kind) return;
    var info = QINFO[q] || {};
    var badge = (meta && meta.badge) || 'Q' + String(q).padStart(2, '0');
    var title = (meta && meta.title) || info.title || '';
    var hint = (meta && meta.hint) || info.hint || '';

    // 外部浮動 q-badge / q-focus 改為內部繪製，避免遮擋文字（仍保留 q-badge 文字供門禁讀取）
    var extBadge = document.getElementById('q-badge');
    var extFocus = document.getElementById('q-focus');
    if (extBadge) extBadge.style.display = 'none';
    if (extFocus) extFocus.style.display = 'none';

    host.classList.add('interactive');
    host.dataset.kind = kind;
    host.dataset.q = String(q);

    var controls;
    if (kind === 'beans') {
      controls = '<button class="iv-btn iv-btn-plus iv-btn-even" data-act="even">標記偶數 (+1)</button>' +
        '<button class="iv-btn iv-btn-odd" data-act="odd">標記奇數 (−1)</button>' +
        '<button class="iv-btn iv-btn-minus iv-btn-reset" data-act="reset">重置</button>';
    } else {
      var cfg = CONFIG[kind];
      controls = '<button class="iv-btn iv-btn-minus" data-act="minus">' + cfg.minusLabel + '</button>' +
        '<button class="iv-btn iv-btn-plus" data-act="plus">' + cfg.plusLabel + '</button>';
    }

    host.innerHTML =
      '<div class="iv-wrap" data-kind="' + kind + '" data-count="" data-step="0">' +
        '<div class="iv-head"><span class="iv-badge">' + esc(badge) + '</span>' +
          '<span class="iv-title">' + esc(title) + '</span></div>' +
        '<p class="iv-hint">' + esc(hint) + '</p>' +
        '<div class="iv-svg" id="iv-svg"></div>' +
        '<div class="iv-status" id="iv-status"></div>' +
        '<div class="iv-controls">' + controls + '</div>' +
      '</div>';

    var wrap = host.querySelector('.iv-wrap');
    var svgEl = host.querySelector('#iv-svg');
    var statusEl = host.querySelector('#iv-status');
    var n = kind === 'beans' ? 0 : CONFIG[kind].init;
    var marked = {};
    var lastAdded = false;
    var step = 0;

    function render() {
      if (kind === 'beans') {
        svgEl.innerHTML = beansSVG(marked);
        statusEl.textContent = beansStatus(marked);
        wrap.dataset.count = String(Object.keys(marked).length);
      } else {
        var cfg = CONFIG[kind];
        svgEl.innerHTML = cfg.render(n, lastAdded);
        statusEl.textContent = cfg.status(n);
        wrap.dataset.count = String(n);
        var minusBtn = host.querySelector('.iv-btn-minus');
        var plusBtn = host.querySelector('.iv-btn-plus');
        if (minusBtn) minusBtn.disabled = (n <= cfg.min);
        if (plusBtn) plusBtn.disabled = (n >= cfg.max);
      }
      wrap.dataset.step = String(step);
      host.dataset.ivStep = String(step);
      host.dataset.count = wrap.dataset.count;
    }

    function next(act) {
      if (kind === 'beans') {
        if (act === 'even' || act === 'odd') {
          var wantEven = (act === 'even');
          BEANS.forEach(function (num) { if ((num % 2 === 0) === wantEven) marked[num] = 1; });
          say(wantEven ? '已標記 7 顆偶數豆子' : '已標記 5 顆奇數豆子');
        } else if (act === 'reset') {
          marked = {};
          say('已重置');
        }
        step++;
      } else {
        var cfg = CONFIG[kind];
        if (act === 'plus' && n < cfg.max) { n++; lastAdded = true; say('增加 1 ' + cfg.unit); }
        else if (act === 'minus' && n > cfg.min) { n--; lastAdded = false; say('減少 1 ' + cfg.unit); }
        else return;
        step++;
      }
      render();
    }

    function toggleBean(el) {
      var num = parseInt(el.getAttribute('data-num'), 10);
      if (marked[num]) delete marked[num]; else marked[num] = 1;
      step++;
      render();
      say(num + (marked[num] ? '，已標記' : '，已取消標記'));
    }

    host.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.iv-btn') : null;
      if (btn && host.contains(btn) && !btn.disabled) { next(btn.getAttribute('data-act')); return; }
      var bean = e.target.closest ? e.target.closest('.iv-bean') : null;
      if (bean && host.contains(bean)) toggleBean(bean);
    });
    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var bean = e.target.closest ? e.target.closest('.iv-bean') : null;
      if (bean && host.contains(bean)) { e.preventDefault(); toggleBean(bean); }
    });

    render();
    say((meta && meta.hint) || hint);
  }

  global.PatternEngine = {
    mount: mount,
    COL: COL,
    BEANS: BEANS,
    CONFIG: CONFIG,
    // 供 G4 驗證腳本重複使用：回傳給定題號的預期 kind 與範圍
    spec: function (q) {
      var kind = QKIND[q];
      if (!kind) return null;
      if (kind === 'beans') return { q: q, kind: kind, min: 0, max: 12, init: 0 };
      var cfg = CONFIG[kind];
      return { q: q, kind: kind, min: cfg.min, max: cfg.max, init: cfg.init };
    }
  };
})(window);
