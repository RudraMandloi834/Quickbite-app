const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/ReplaceCartModal.tsx', 'utf8');

code = code.replace(/<h2 id="modal-title" className="text-2xl font-serif font-semibold text-brand-fg text-center mb-3">\n\s*Replace your cart with \{newRestaurant\?\.name\}\?\n\s*<\/h2>/, 
`<h2 id="modal-title" className="text-2xl font-serif font-semibold text-brand-fg text-center mb-3">
            Replace your cart with {newRestaurant?.name}?
          </h2>`);

code = code.replace(/<p className="text-brand-muted text-center text-sm sm:text-base mb-8">\n\s*Your QuickBite cart can only include items from one restaurant at a time. Your current items will be removed and the selected item will be added.\n\s*<\/p>/,
`<p className="text-brand-muted text-center text-sm sm:text-base mb-8">
            <span className="block font-medium text-brand-fg mb-1">Your cart has items from another restaurant.</span>
            Your QuickBite cart can only include items from one restaurant at a time. Your current items will be removed and the selected item will be added.
          </p>`);

fs.writeFileSync('frontend/src/components/ReplaceCartModal.tsx', code);
