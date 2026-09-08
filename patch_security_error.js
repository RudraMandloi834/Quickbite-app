const fs = require('fs');
let code = fs.readFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', 'utf8');

code = code.replace(/\.requestMatchers\("\/api\/health"\)\.permitAll\(\)/, '.requestMatchers("/api/health").permitAll()\n                .requestMatchers("/error").permitAll()');

fs.writeFileSync('src/main/java/com/quickbite/security/SecurityConfig.java', code);
