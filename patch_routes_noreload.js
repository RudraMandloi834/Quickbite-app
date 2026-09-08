const fs = require('fs');

function patchFile(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    const reloadBlock = `if (!user) {
      requireAuth(() => {
        // Retry logic or reload
        window.location.reload();
      });
      return;
    }`;
    
    const newBlock = `if (!user) {
      requireAuth(() => {});
      return;
    }`;
    
    code = code.replace(reloadBlock, newBlock);
    
    // Also remove loading check from early returns so the hook can re-fire when user is set
    code = code.replace(/if \(!user && !loading\)/g, 'if (!user)');
    
    fs.writeFileSync(file, code);
}

patchFile('frontend/src/app/checkout/page.tsx');
patchFile('frontend/src/app/orders/page.tsx');
patchFile('frontend/src/app/orders/[id]/page.tsx');

