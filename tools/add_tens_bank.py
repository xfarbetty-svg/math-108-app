# -*- coding: utf-8 -*-
import json
import re

with open('data/curriculum_v3/g1_n13_make_ten.json', 'r', encoding='utf-8') as f:
    real_data = f.read()

with open('app/unit_n13.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. 替換 EMBEDDED_QUESTIONS
html = re.sub(
    r'const EMBEDDED_QUESTIONS = \[[\s\S]*?\];\s*var questions',
    'const EMBEDDED_QUESTIONS = ' + real_data + ';\n    var questions',
    html
)

# 2. 加入 tens-bank 容器
if 'id="tensBank"' not in html:
    html = html.replace(
        '<div class="visual-stage">',
        '<div class="visual-stage">\n        <div class="tens-bank" id="tensBank"></div>'
    )

# 3. 加入 tens-bank CSS
css_snippet = """
    /* 十位硬幣區 (保留不動的 10) */
    .tens-bank {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
      min-height: 38px;
    }
    .coin-10-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #FFFBEB;
      border: 2px solid #F59E0B;
      border-radius: 99px;
      padding: 4px 14px;
      box-shadow: 0 2px 6px rgba(217, 119, 6, 0.2);
    }
    .coin-10-circle {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FDE68A, #F59E0B);
      border: 1.5px solid #D97706;
      color: #78350F;
      font-weight: 900;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .coin-10-label {
      font-size: 13px;
      font-weight: 800;
      color: #B45309;
    }
"""
if '.tens-bank' not in html:
    html = html.replace('</style>', css_snippet + '\n  </style>')

# 4. 在 renderQuestion 中動態渲染 tensBank
render_tens_code = """
      /* 十位不動硬幣區渲染 */
      var tensBox = $('tensBank');
      if (tensBox) {
        tensBox.innerHTML = '';
        if (p.unmoved_tens && p.unmoved_tens > 0) {
          var pill = document.createElement('div');
          pill.className = 'coin-10-pill';
          var circlesHtml = '';
          for (var t = 0; t < p.unmoved_tens; t++) {
            circlesHtml += '<div class="coin-10-circle">⑩</div>';
          }
          pill.innerHTML = circlesHtml + '<div class="coin-10-label">' + (p.unmoved_tens_label || ('不動的 ' + p.unmoved_tens + ' 個 ⑩')) + '</div>';
          tensBox.appendChild(pill);
        }
      }
"""
stem_target = "$('questionStem').textContent = q.stem;"
if '/* 十位不動硬幣區渲染 */' not in html and stem_target in html:
    html = html.replace(stem_target, stem_target + '\n' + render_tens_code)

with open('app/unit_n13.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Successfully upgraded unit_n13.html with tensBank support.')
