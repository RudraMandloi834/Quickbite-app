import re

with open("frontend/src/lib/api.ts", "r") as f:
    content = f.read()

old_get = """export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch restaurants`);
  return res.json();
}"""

new_get = """export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const getRestaurants = async (
  page = 0,
  search = "",
  cuisine = "",
  city = ""
): Promise<PaginatedResponse<Restaurant>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", "12");
  if (search) params.append("search", search);
  if (cuisine) params.append("cuisine", cuisine);
  if (city) params.append("city", city);
  
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch restaurants`);
  return res.json();
};"""

content = content.replace(old_get, new_get)
with open("frontend/src/lib/api.ts", "w") as f:
    f.write(content)
