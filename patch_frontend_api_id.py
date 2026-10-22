import re

with open("frontend/src/lib/api.ts", "r") as f:
    content = f.read()

old_get_id = """export const getRestaurantById = async (restaurantId: string | number): Promise<Restaurant | null> => {
  const restaurants = await getRestaurants();
  const idNum = typeof restaurantId === "string" ? parseInt(restaurantId, 10) : restaurantId;
  const match = restaurants.find((r) => r.id === idNum);
  return match || null;
}"""

new_get_id = """export const getRestaurantById = async (restaurantId: string | number): Promise<Restaurant | null> => {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch restaurant details`);
  }
  return res.json();
}"""

content = content.replace(old_get_id, new_get_id)
with open("frontend/src/lib/api.ts", "w") as f:
    f.write(content)
