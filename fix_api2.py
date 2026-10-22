import re

with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

def replace_fn(match):
    return match.group(1) + " {"

content = re.sub(r'(export async function.*?)\s*=>\s*\{', replace_fn, content, flags=re.DOTALL)

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
