const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');

if (!code.includes('getToken')) {
    code = code.replace(
      'import { useAuth } from "@/context/AuthContext";',
      'import { useAuth } from "@/context/AuthContext";\nimport { getToken } from "@/lib/auth";'
    );
}

code = code.replace(
  'useSSE(token, (event) => {',
  'useSSE(getToken(), (event) => {'
);

fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', code);
