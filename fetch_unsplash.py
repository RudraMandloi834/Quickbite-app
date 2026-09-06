import urllib.request
import re
import json

def fetch_ids(query, count=100):
    ids = set()
    page = 1
    while len(ids) < count and page <= 5:
        url = f"https://unsplash.com/napi/search/photos?query={query}&per_page=30&page={page}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                for result in data.get('results', []):
                    ids.add(result['id'])
                    if len(ids) >= count:
                        break
        except Exception as e:
            print(f"Error on page {page}: {e}")
            break
        page += 1
    return list(ids)

restaurant_ids = fetch_ids('restaurant interior', 100)
food_ids = fetch_ids('food', 100)

print(f"Restaurant IDs ({len(restaurant_ids)}):")
for i in restaurant_ids:
    print(f'        "https://images.unsplash.com/photo-{i}?w=800&q=80",')

print(f"\nFood IDs ({len(food_ids)}):")
for i in food_ids:
    print(f'        "https://images.unsplash.com/photo-{i}?w=400&q=80",')
