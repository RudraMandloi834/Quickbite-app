with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace(
'''export const getRestaurants = async (
  page = 0,
  search = "",
  cuisine = "",
  city = "",
  locality = "",
  minRating?: number,
  priceRange?: number
): Promise<PaginatedResponse<Restaurant>> {''',
'''export const getRestaurants = async (
  page = 0,
  search = "",
  cuisine = "",
  city = "",
  locality = "",
  minRating?: number,
  priceRange?: number
): Promise<PaginatedResponse<Restaurant>> => {''')

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
