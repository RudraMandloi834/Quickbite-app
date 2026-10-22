const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

// We have duplicate export const approveRestaurant. Let's remove the second one.
const toRemove = `export const approveRestaurant = async (restaurantId: number): Promise<ApprovalResponse> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/operator/restaurants/\${restaurantId}/approve\`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to approve restaurant");
  return res.json();
};

export const rejectRestaurant = async (restaurantId: number, reason: string): Promise<Restaurant> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/operator/restaurants/\${restaurantId}/reject\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error("Failed to reject restaurant");
  return res.json();
};`;

code = code.replace(toRemove, '');
code = code.replace('export interface ApprovalResponse { restaurant: Restaurant; username: string; temporaryPassword?: string; }', '');

fs.writeFileSync('frontend/src/lib/api.ts', code);
