const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

// Imports
code = code.replace(/from "@\/lib\/cart";/, 'from "@/lib/cart";\nimport { useAuth } from "@/context/AuthContext";');

// Hooks
code = code.replace(/const router = useRouter\(\);/, 'const router = useRouter();\n  const { user, loading, requireAuth } = useAuth();');

// useEffect
code = code.replace(/  useEffect\(\(\) => \{\n    let ignore = false;\n    const fetchIt = async \(\) => \{/g, `  useEffect(() => {
    let ignore = false;
    if (loading) return;
    if (!user) {
      requireAuth(() => {});
      return;
    }
    const fetchIt = async () => {`);

code = code.replace(/  \}, \[router\]\);/g, '  }, [router, user, loading, requireAuth]);');

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
