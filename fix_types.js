const fs = require('fs');

// 1. cart/page.tsx
let cart = fs.readFileSync('frontend/src/app/cart/page.tsx', 'utf8');
cart = cart.replace('import { fetchCartDisplay, updateItemQuantity, removeItemFromCart, getStoredCartId } from "@/lib/cart";', 'import { fetchCartDisplay, updateItemQuantity, removeItemFromCart, getStoredCartId } from "@/lib/cart";\nimport { getCart } from "@/lib/api";\nimport { Cart } from "@/types/cart";');
cart = cart.replace('const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);', 'const [cartDisplay, setCartDisplay] = useState<CartDisplay | null>(null);\n  const [rawCart, setRawCart] = useState<Cart | null>(null);');
cart = cart.replace('const display = await fetchCartDisplay(cid);', 'const display = await fetchCartDisplay(cid);\n        const raw = await getCart(cid);');
cart = cart.replace('setCartDisplay(display);', 'setCartDisplay(display);\n          setRawCart(raw);');
cart = cart.replace(`const updated = await updateItemQuantity(cartDisplay.restaurantId, menuItemId, newQuantity);
      setCartDisplay(updated);`, `if (!rawCart) return;
      await updateItemQuantity(rawCart, menuItemId, newQuantity);
      const display = await fetchCartDisplay(rawCart.id);
      setCartDisplay(display);`);
cart = cart.replace(`const updated = await removeItemFromCart(cartDisplay.restaurantId, menuItemId);
      setCartDisplay(updated);`, `if (!rawCart) return;
      await removeItemFromCart(rawCart, menuItemId);
      const display = await fetchCartDisplay(rawCart.id);
      setCartDisplay(display);`);
fs.writeFileSync('frontend/src/app/cart/page.tsx', cart);

// 2. orders/[id]/page.tsx
let order = fs.readFileSync('frontend/src/app/orders/[id]/page.tsx', 'utf8');
order = order.replace('import { Customer } from "@/types/auth";', ''); // Customer is not exported there, I'll use any or fetch it dynamically
order = order.replace('const [driver, setDriver] = useState<Customer | null>(null);', 'const [driver, setDriver] = useState<any | null>(null);');
order = order.replace('delData.driverId', 'delData.deliveryAgentId'); // The backend likely uses deliveryAgentId
order = order.replace('delData.driverId', 'delData.deliveryAgentId'); // for both
order = order.replace('useSSE(Number(id),', 'useSSE(String(id),');
order = order.replace('order.deliveryAddress ||', '(order as any).deliveryAddress ||');
order = order.replace('order.items.map', '(order.items || []).map');
order = order.replace('item.price', '(item as any).unitPrice || (item as any).price || 0');
fs.writeFileSync('frontend/src/app/orders/[id]/page.tsx', order);

// 3. profile/page.tsx
let profile = fs.readFileSync('frontend/src/app/profile/page.tsx', 'utf8');
profile = profile.replace(/user\.name/g, "(user as any).name || (user as any).sub?.split('@')[0] || 'User'");
profile = profile.replace(/user\.email/g, "(user as any).email || (user as any).sub");
fs.writeFileSync('frontend/src/app/profile/page.tsx', profile);

