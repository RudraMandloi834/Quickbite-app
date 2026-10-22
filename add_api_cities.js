const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

const newMethod = `
export async function getCities(): Promise<string[]> {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/restaurants/cities\`);
  if (!res.ok) return [];
  return res.json();
}
`;

if (!code.includes('getCities()')) {
    code += newMethod;
    fs.writeFileSync('frontend/src/lib/api.ts', code);
}
