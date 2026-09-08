const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/layout.tsx', 'utf8');

if (!code.includes('AuthProvider')) {
    code = code.replace(/import \{ Navbar \} from "@\/components\/Navbar";/, 'import { Navbar } from "@/components/Navbar";\nimport { AuthProvider } from "@/context/AuthContext";');
    
    code = code.replace(/<Navbar \/>/, '<AuthProvider>\n          <Navbar />');
    code = code.replace(/<\/main>/, '</main>\n        </AuthProvider>');
    
    fs.writeFileSync('frontend/src/app/layout.tsx', code);
}
