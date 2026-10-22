with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

# I will find all instances of `Promise<.*> {` that should be `Promise<.*> => {`
import re
content = re.sub(r'(Promise<[^>]*>) \{', r'\1 => {', content)
content = content.replace('export async function getNearbyRestaurants(\n  latitude: number, \n  longitude: number, \n  radiusKm: number = 10,\n  page: number = 0\n): Promise<PaginatedResponse<Restaurant>> => {', 'export async function getNearbyRestaurants(\n  latitude: number, \n  longitude: number, \n  radiusKm: number = 10,\n  page: number = 0\n): Promise<PaginatedResponse<Restaurant>> {')

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
