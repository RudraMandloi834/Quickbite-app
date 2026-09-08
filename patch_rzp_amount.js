const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');

// Fix amount passed to Razorpay Checkout (convert to subunits or remove it)
// We will convert it to subunits just to be safe, or just remove amount/currency.
// Let's replace the options block
code = code.replace(/amount: initResponse\.amount,/, 'amount: Math.round(initResponse.amount * 100),');

fs.writeFileSync('frontend/src/app/checkout/page.tsx', code);
