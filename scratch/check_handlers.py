import os, re

files = [
    'weight_concept_lab.html',
    'time_concept_lab.html',
    'square_rectangle_lab.html',
    'solid_geometry_lab.html',
    'multiplication_division_lab.html',
    'pattern_reasoning_lab.html',
    'table_cross_lab.html'
]

for f in files:
    path = os.path.join('app', 'components', f)
    content = open(path, 'r', encoding='utf-8').read()
    
    # find all onclick handler names
    onclicks = set(re.findall(r'onclick=["\']([a-zA-Z0-9_]+)\(', content))
    
    # find all defined functions in script
    script_part = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
    script_text = '\n'.join(script_part) if script_part else ''
    defined_funcs = set(re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', script_text))
    
    missing = onclicks - defined_funcs
    print(f'=== {f} ===')
    if missing:
        print(f'  MISSING FUNCTIONS: {missing}')
    else:
        print(f'  ALL onclicks DEFINED ({len(onclicks)} functions: {sorted(list(onclicks))})')
