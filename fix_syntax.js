const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(path, content);
};

['frontend/src/app/checkout/page.tsx', 
 'frontend/src/app/orders/[id]/page.tsx', 
 'frontend/src/app/orders/page.tsx', 
 'frontend/src/app/profile/page.tsx',
 'frontend/src/app/cart/page.tsx'
].forEach(fixFile);

// Also fix specific cart errors
let cart = fs.readFileSync('frontend/src/app/cart/page.tsx', 'utf8');
cart = cart.replace('MessageSquare } from "lucide-react";', 'MessageSquare, ShoppingBag } from "lucide-react";');
cart = cart.replace(/haven't/g, "haven&apos;t");
cart = cart.replace(/Let's/g, "Let&apos;s");
cart = cart.replace(/err: any/g, 'err: unknown');
cart = cart.replace(/err\.message/g, '(err as Error).message');
fs.writeFileSync('frontend/src/app/cart/page.tsx', cart);

let login = fs.readFileSync('frontend/src/app/login/page.tsx', 'utf8');
login = login.replace(/Don't/g, "Don&apos;t");
login = login.replace(/err: any/g, 'err: unknown');
login = login.replace(/err\.message/g, '(err as Error).message');
fs.writeFileSync('frontend/src/app/login/page.tsx', login);

let signup = fs.readFileSync('frontend/src/app/signup/page.tsx', 'utf8');
signup = signup.replace(/err: any/g, 'err: unknown');
signup = signup.replace(/err\.message/g, '(err as Error).message');
fs.writeFileSync('frontend/src/app/signup/page.tsx', signup);

let checkout = fs.readFileSync('frontend/src/app/checkout/page.tsx', 'utf8');
checkout = checkout.replace(/err: any/g, 'err: unknown');
checkout = checkout.replace(/err\.message/g, '(err as Error).message');
checkout = checkout.replace(/paymentErr: any/g, 'paymentErr: unknown');
checkout = checkout.replace(/paymentErr\.message/g, '(paymentErr as Error).message');
checkout = checkout.replace(/orderErr: any/g, 'orderErr: unknown');
checkout = checkout.replace(/orderErr\.message/g, '(orderErr as Error).message');
fs.writeFileSync('frontend/src/app/checkout/page.tsx', checkout);

let ordersList = fs.readFileSync('frontend/src/app/orders/page.tsx', 'utf8');
ordersList = ordersList.replace(/err: any/g, 'err: unknown');
ordersList = ordersList.replace(/err\.message/g, '(err as Error).message');
fs.writeFileSync('frontend/src/app/orders/page.tsx', ordersList);

let orderTracking = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');
orderTracking = orderTracking.replace(/err: any/g, 'err: unknown');
orderTracking = orderTracking.replace(/err\.message/g, '(err as Error).message');
fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', orderTracking);

