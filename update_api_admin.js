const fs = require('fs');
let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

// Replace getPendingRestaurants, approveRestaurant, rejectRestaurant
const newAdminMethods = `
export interface RestaurantAdminDTO {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  locality: string;
  address: string;
  cuisine: string;
  status: string;
  createdAt: string;
}

export const getPendingRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/admin/restaurants/pending\`);
  if (!res.ok) throw new Error("Failed to fetch pending restaurants");
  return res.json();
};

export const getApprovedRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/admin/restaurants/approved\`);
  if (!res.ok) throw new Error("Failed to fetch approved restaurants");
  return res.json();
};

export const getRejectedRestaurants = async (): Promise<RestaurantAdminDTO[]> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/admin/restaurants/rejected\`);
  if (!res.ok) throw new Error("Failed to fetch rejected restaurants");
  return res.json();
};

export const approveRestaurant = async (restaurantId: number): Promise<RestaurantAdminDTO> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/admin/restaurants/\${restaurantId}/approve\`, {
    method: "PUT"
  });
  if (!res.ok) throw new Error("Failed to approve restaurant");
  return res.json();
};

export const rejectRestaurant = async (restaurantId: number, reason: string): Promise<RestaurantAdminDTO> => {
  const res = await authFetch(\`\${getApiBaseUrl()}/api/admin/restaurants/\${restaurantId}/reject\`, {
    method: "PUT"
  });
  if (!res.ok) throw new Error("Failed to reject restaurant");
  return res.json();
};
`;

code = code.replace(/export const getPendingRestaurants[\s\S]*?(?=\nexport const)/, newAdminMethods);

fs.writeFileSync('frontend/src/lib/api.ts', code);
