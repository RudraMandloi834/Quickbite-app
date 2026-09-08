const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

code = code.replace(/name: user\?\.name \|\| "",/, 'name: "",');
code = code.replace(/email: user\?\.email \|\| "",/, 'email: user?.sub || "",');

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
