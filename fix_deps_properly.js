const fs = require('fs');

function patchDependencies(file) {
    let code = fs.readFileSync(file, 'utf8');
    // For useCallback
    code = code.replace(/  \}, \[\]\);/g, '  }, [user, loading, requireAuth]);');
    // For useEffect
    code = code.replace(/  \}, \[router\]\);/g, '  }, [router, user, loading, requireAuth]);');
    // Also fix any others just in case
    code = code.replace(/  \}, \[fetchOrders, user, loading\]\);/g, '  }, [fetchOrders, user, loading]);'); 
    
    fs.writeFileSync(file, code);
}

patchDependencies('frontend/src/app/orders/page.tsx');
patchDependencies('frontend/src/app/orders/[id]/page.tsx');
