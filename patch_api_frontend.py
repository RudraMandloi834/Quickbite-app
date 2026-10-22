import re

with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

old_getRestaurants = r"""export const getRestaurants = async \([\s\S]*?\): Promise<PaginatedResponse<Restaurant>> => \{[\s\S]*?if \(!res\.ok\) throw new Error\(`Failed to fetch restaurants`\);\s*return res\.json\(\);\s*\}"""

new_getRestaurants = """export const getRestaurants = async (
  page = 0,
  search = "",
  cuisine = "",
  city = "",
  locality = "",
  minRating?: number,
  priceRange?: number
): Promise<PaginatedResponse<Restaurant>> => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", "16");
  if (search) params.append("search", search);
  if (cuisine) params.append("cuisine", cuisine);
  if (city) params.append("city", city);
  if (locality) params.append("locality", locality);
  if (minRating !== undefined) params.append("minRating", minRating.toString());
  if (priceRange !== undefined) params.append("priceRange", priceRange.toString());
  
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch restaurants`);
  return res.json();
}"""

content = re.sub(old_getRestaurants, new_getRestaurants, content)

old_getNearby = r"""export async function getNearbyRestaurants\(latitude: number, longitude: number, radiusKm: number = 10\): Promise<Restaurant\[\]> \{[\s\S]*?if \(!res\.ok\) throw new Error\(`Failed to fetch nearby restaurants`\);\s*return res\.json\(\);\s*\}"""

new_getNearby = """export async function getNearbyRestaurants(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 10,
  page: number = 0
): Promise<PaginatedResponse<Restaurant>> => {
  const params = new URLSearchParams({ 
    latitude: latitude.toString(), 
    longitude: longitude.toString(), 
    radiusKm: radiusKm.toString(),
    page: page.toString(),
    size: "16"
  });
  const res = await fetch(`${getApiBaseUrl()}/api/restaurants/nearby?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch nearby restaurants`);
  return res.json();
}"""

content = re.sub(old_getNearby, new_getNearby, content)

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
