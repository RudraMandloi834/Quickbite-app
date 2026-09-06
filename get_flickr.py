import urllib.request
from concurrent.futures import ThreadPoolExecutor

def get_real_url(index, category):
    url = f"https://loremflickr.com/800/600/{category}?lock={index}"
    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.url
    except Exception as e:
        return None

restaurants = set()
foods = set()

with ThreadPoolExecutor(max_workers=5) as executor:
    results = executor.map(lambda i: get_real_url(i, 'restaurant,interior'), range(1, 150))
    for url in results:
        if url and 'flickr.com' in url:
            restaurants.add(url)
        if len(restaurants) >= 100: break

with ThreadPoolExecutor(max_workers=5) as executor:
    results = executor.map(lambda i: get_real_url(i, 'food,meal'), range(1, 150))
    for url in results:
        if url and 'flickr.com' in url:
            foods.add(url)
        if len(foods) >= 100: break

with open('ImageConstants.java.part', 'w') as f:
    f.write("public static final String[] RESTAURANT_IMAGES = {\n")
    f.write(",\n".join([f'    "{url}"' for url in list(restaurants)[:100]]))
    f.write("\n};\n\n")
    
    f.write("public static final String[] MENU_IMAGES = {\n")
    f.write(",\n".join([f'    "{url}"' for url in list(foods)[:100]]))
    f.write("\n};\n")

print(f"Got {len(restaurants)} restaurant URLs and {len(foods)} food URLs.")
