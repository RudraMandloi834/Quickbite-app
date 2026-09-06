import urllib.request
import re

req = urllib.request.Request(
    'https://unsplash.com/s/photos/restaurant-interior',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        # Find photo IDs
        ids = re.findall(r'"id":"([a-zA-Z0-9\-_]{11})"', html)
        ids = list(set(ids))
        print(f"Found {len(ids)} unique IDs.")
        for i in ids[:5]:
            print(i)
except Exception as e:
    print(e)
