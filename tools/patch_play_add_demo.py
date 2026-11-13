# -*- coding: utf-8 -*-
with open('app/unit_n13.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = None
end = None
for i, l in enumerate(lines):
    if 'function playAddDemo()' in l:
        start = i
    if start is not None and i > start and l.strip() == '}':
        end = i
        break

print('playAddDemo lines:', start, 'to', end)

new_fn = [
    '    function playAddDemo() {\n',
    '      var p = questions[currentIdx].visual_engine.props;\n',
    '      var left = p.left_initial, right = p.right_initial;\n',
    '      fL.setCount(left);\n',
    '      fR.setCount(right);\n',
    '      if (right <= 0) return;\n',
    '      var total = left + right;\n',
    '      var moveCount = right;\n',
    '      var k = 0;\n',
    '      if (total >= 10) {\n',
    '        var need = 10 - left;\n',
    '        $(\'demoCaption\').textContent = \'大數 \' + left + \'，從右邊拿 \' + need + \' 顆湊成 10！\';\n',
    '      } else {\n',
    '        $(\'demoCaption\').textContent = left + \' 加上 \' + right + \' 合併成 \' + total + \'！\';\n',
    '      }\n',
    '      function step() {\n',
    '        k++;\n',
    '        flyOne(function () {\n',
    '          fR.setCount(right - k);\n',
    '          fL.setCount(left + k);\n',
    '          if (k < moveCount) {\n',
    '            later(step, 160);\n',
    '          } else {\n',
    '            $(\'demoCaption\').textContent = questions[currentIdx].explanation.breakdown_tree.step_3;\n',
    '            $(\'btnPlayDemo\').disabled = false;\n',
    '          }\n',
    '        });\n',
    '      }\n',
    '      step();\n',
    '    }\n'
]

lines = lines[:start] + new_fn + lines[end+1:]
with open('app/unit_n13.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Successfully patched playAddDemo.')
