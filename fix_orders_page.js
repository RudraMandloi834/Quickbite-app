const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');

code = code.replace(
  'useSSE(String(id), (event) => {',
  'useSSE(token, (event) => {'
);

fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', code);
