const fs = require('fs');

function patchFile(file, matchStr, replacement) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(matchStr, replacement);
    fs.writeFileSync(file, code);
}

patchFile('frontend/src/app/checkout/page.tsx', '  }, [router]);', '  }, [router, user, loading, requireAuth]);');
patchFile('frontend/src/app/orders/page.tsx', '  }, [fetchOrders]);', '  }, [fetchOrders, user, loading]);');
patchFile('frontend/src/app/orders/[id]/page.tsx', '  }, [fetchOrder, params.id]);', '  }, [fetchOrder, params.id, user, loading]);');

