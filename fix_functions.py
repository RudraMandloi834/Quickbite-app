import re

with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

# Replace `export async function name(...) => {` with `export async function name(...) {`
content = re.sub(r'(export async function [^\(]+\([^)]*\)(?:[:\sA-Za-z0-9<>|]*))\s*=>\s*\{', r'\1 {', content)

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
