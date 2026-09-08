const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/cart.ts', 'utf8');

const importCartDisplay = `import { Cart, CartDisplay, CartItemDisplay } from "@/types/cart";`;
const fetchCartDisplayImport = `import { fetchCartDisplay } from "./cart";`; // wait, fetchCartDisplay is in the same file!

const checkConflictCode = `
export async function checkCartConflict(restaurantId: number): Promise<{ conflict: false } | { conflict: true, cartDisplay: CartDisplay }> {
  const cartId = getStoredCartId();
  if (!cartId) return { conflict: false };
  try {
     const display = await fetchCartDisplay(cartId);
     if (display && display.restaurantId !== restaurantId && display.items.length > 0) {
        return { conflict: true, cartDisplay: display };
     }
  } catch {}
  return { conflict: false };
}
`;

code = code.replace(/export async function addItemToCart\(/, checkConflictCode + '\nexport async function addItemToCart(');

// Add forceReplace to addItemToCart
code = code.replace(/restaurantId: number,\n  menuItemId: number,\n  quantity: number = 1\n\): Promise<\{ cart: Cart; replacedRestaurant: boolean \}> \{/, `restaurantId: number,
  menuItemId: number,
  quantity: number = 1,
  forceReplace: boolean = false
): Promise<{ cart: Cart; replacedRestaurant: boolean }> {`);

code = code.replace(/\/\/ If cart was from a different restaurant\n  if \(existingCart && existingCart\.restaurantId !== restaurantId\) \{\n    replacedRestaurant = true;\n  \}/, `// If cart was from a different restaurant
  if (existingCart && existingCart.restaurantId !== restaurantId) {
    if (!forceReplace) {
      throw new Error("CART_CONFLICT"); // Safety check, though the UI should catch it first
    }
    replacedRestaurant = true;
  }`);

fs.writeFileSync('frontend/src/lib/cart.ts', code);
