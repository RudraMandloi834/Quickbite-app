const fs = require('fs');

// 1. Fix api.ts
let api = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
api = api.replace(/export async function getRestaurantById[\s\S]*?return match \|\| null;\n\}/, `export async function getRestaurantById(restaurantId: number | string): Promise<Restaurant | null> {
  const res = await fetch(\`\${getApiBaseUrl()}/api/restaurants/\${restaurantId}\`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(\`Failed to fetch restaurant details\`);
  }
  return res.json();
}`);
fs.writeFileSync('frontend/src/lib/api.ts', api);

// 2. Fix page.tsx
let page = fs.readFileSync('frontend/src/app/restaurants/page.tsx', 'utf8');
page = page.replace(/err\.message/g, '(err as Error).message');
page = page.replace(/\(\(restaurant as Restaurant & \{ distanceKm\?: number \}\)\.distanceKm\)\.toFixed\(1\)/g, '((restaurant as Restaurant & { distanceKm?: number }).distanceKm)?.toFixed(1)');
page = page.replace(/\{restaurant\.area\},/g, '{restaurant.location},');
page = page.replace(/restaurant\.priceRange === "\$\$" \? "₹₹" : \(restaurant\.priceRange === "\$\$\$" \? "₹₹₹" : "₹"\)/g, 'restaurant.priceRange === 2 ? "₹₹" : (restaurant.priceRange === 3 ? "₹₹₹" : "₹")');
fs.writeFileSync('frontend/src/app/restaurants/page.tsx', page);
