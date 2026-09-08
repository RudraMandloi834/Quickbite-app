const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

// Insert import
code = `import { getAuthHeaders, getUser } from "@/lib/auth";\n` + code;

// Replace createCart
code = code.replace(
  /export async function createCart\(restaurantId: number, customerId: number = 1\): Promise<Cart> \{/g,
  `export async function createCart(restaurantId: number, customerId?: number): Promise<Cart> {\n  const resolvedCustomerId = customerId || getUser()?.customerId || 0;`
);
code = code.replace(
  /const body: CreateCartRequest = \{ customerId, restaurantId \};/g,
  `const body: CreateCartRequest = { customerId: resolvedCustomerId, restaurantId };`
);

// Inject getAuthHeaders into all fetch calls
const fetchRegex = /fetch\(([^,]+),\s*\{([^}]*)\}\);/g;
code = code.replace(/fetch\(([^,]+),\s*\{/g, (match, url) => {
  return `fetch(${url}, {`;
});

// An easier way: just inject ...getAuthHeaders() into headers objects, or create a wrapper.
// Let's create an authenticatedFetch wrapper and replace fetch with it for protected endpoints.
