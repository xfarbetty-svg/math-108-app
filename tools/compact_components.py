# -*- coding: utf-8 -*-
import re, glob

components = [
    'app/components/g2_n29_q1_jelly_party.html',
    'app/components/g2_n29_q2_mult_meaning.html',
    'app/components/g2_n29_q3_chocolate_rounds.html',
    'app/components/g2_n29_q4_grouping_box.html',
    'app/components/g2_n29_q5_candy_fair_check.html',
    'app/components/g2_n210_q1_triangle_fair_check.html',
    'app/components/g2_n210_q2_cup_capacity.html',
    'app/components/g2_n210_q3_rope_fold.html',
    'app/components/g2_n210_q4_apple_fraction.html',
    'app/components/g2_n210_q5_toast_slice.html'
]

for path in components:
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 調整 .scene-svg
    code = re.sub(
        r'\.scene-svg\s*\{[^}]*\}',
        '.scene-svg { display:block; height:125px; width:auto; margin:0 auto; max-width:100%; }',
        code
    )
    # 調整 body padding
    code = re.sub(
        r'padding:\s*8px 10px 14px;',
        'padding:6px 8px 8px;',
        code
    )
    # 調整 wrap gap
    code = re.sub(
        r'\.wrap\s*\{([^}]*?)gap:\s*\d+px;([^}]*?)\}',
        r'.wrap {\1gap:4px;\2}',
        code
    )
    # 調整 card padding
    code = re.sub(
        r'\.card\s*\{([^}]*?)padding:\s*\d+px\s*\d+px;([^}]*?)\}',
        r'.card {\1padding:5px 8px;\2}',
        code
    )
    # 調整 opt-btn
    code = re.sub(
        r'\.opt-btn\s*\{([^}]*?)padding:\s*\d+px\s*\d+px;([^}]*?)\}',
        r'.opt-btn {\1padding:5px 4px;\2}',
        code
    )
    # 調整 check-btn
    code = re.sub(
        r'\.check-btn\s*\{([^}]*?)padding:\s*\d+px\s*\d+px;([^}]*?)\}',
        r'.check-btn {\1padding:5px 22px;\2}',
        code
    )
    # 調整 stem font-size
    code = re.sub(
        r'\.stem\s*\{([^}]*?)font-size:\s*1[56]px;',
        r'.stem {\1font-size:13.5px;',
        code
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

print("Standardized all 10 components")
