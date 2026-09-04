import { Restaurant, MenuItem } from "@/types/restaurant";

const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser, relative URL works seamlessly through Next.js proxy rewrites
    return "";
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
};

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch restaurants (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getRestaurantMenu(restaurantId: number | string): Promise<MenuItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/${restaurantId}/menu`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch menu (${res.status} ${res.statusText})`);
  }
  return res.json();
}

export async function getRestaurantById(restaurantId: number | string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants();
  const idNum = typeof restaurantId === "string" ? parseInt(restaurantId, 10) : restaurantId;
  const match = restaurants.find((r) => r.id === idNum);
  return match || null;
}
