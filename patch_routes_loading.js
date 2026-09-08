const fs = require('fs');

function patchFile(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Add loading to useAuth destructure
    code = code.replace(/const \{ user, requireAuth \} = useAuth\(\);/, 'const { user, loading, requireAuth } = useAuth();');
    
    // In useEffect or fetchOrders, wait if loading
    code = code.replace(/if \(!user\) \{\n\s*requireAuth\(\(\) => \{\}\);\n\s*return;\n\s*\}/g, `if (loading) return;
    if (!user) {
      requireAuth(() => {});
      return;
    }`);
    
    fs.writeFileSync(file, code);
}

patchFile('frontend/src/app/checkout/page.tsx');
patchFile('frontend/src/app/orders/page.tsx');
patchFile('frontend/src/app/orders/[id]/page.tsx');

