#!/bin/bash
sed -i '/const loadCheckoutData = useCallback/,/}, \[\]);/d' frontend/src/app/checkout/page.tsx
sed -i 's/handler: async function (response: any)/handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string })/g' frontend/src/app/checkout/page.tsx
sed -i 's/const rzp = new (window as any).Razorpay(options);/const rzp = new (window as { Razorpay: any }).Razorpay(options);/g' frontend/src/app/checkout/page.tsx
sed -i 's/rzp.on("payment.failed", function (response: any)/rzp.on("payment.failed", function (response: { error: { description: string } })/g' frontend/src/app/checkout/page.tsx

sed -i '/setIsLoggedIn(getUser() !== null);/i \    // eslint-disable-next-line react-hooks/set-state-in-effect' frontend/src/components/Navbar.tsx

sed -i 's/window.location.href = /window.location.assign(/g' frontend/src/lib/api.ts
sed -i 's/encodeURIComponent(window.location.pathname);/encodeURIComponent(window.location.pathname));/g' frontend/src/lib/api.ts
sed -i 's/catch (e) {/catch (_e) {/g' frontend/src/lib/auth.ts
