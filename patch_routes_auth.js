const fs = require('fs');

function patchFile(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/import \{ getUser \} from "@\/lib\/auth";/, 'import { useAuth } from "@/context/AuthContext";');
    if (code.includes('const router = useRouter();')) {
       code = code.replace(/const router = useRouter\(\);/, 'const router = useRouter();\n  const { user, requireAuth } = useAuth();');
    } else {
       // if no router, we need to inject it or just useAuth
       code = code.replace(/export default function .*?\(\) \{/, '$&\n  const { user, requireAuth } = useAuth();');
    }
    
    // Replace the getUser() check
    code = code.replace(/if \(!getUser\(\)\) \{\n\s*router\.push\(.*?\);\n\s*return;\n\s*\}/g, `if (!user) {
      requireAuth(() => {
        // Retry logic or reload
        window.location.reload();
      });
      return;
    }`);
    fs.writeFileSync(file, code);
}

patchFile('frontend/src/app/checkout/page.tsx');
patchFile('frontend/src/app/orders/page.tsx');
patchFile('frontend/src/app/orders/[id]/page.tsx');

