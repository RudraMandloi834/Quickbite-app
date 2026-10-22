import urllib.request
import json
import re

req = urllib.request.Request(
    'https://api.pexels.com/v1/search?query=restaurant%20food&per_page=80',
    headers={'Authorization': '563492ad6f91700001000001e91206f477324fa6827d048d2eb46358'}
)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        urls = [f'"{photo["src"]["large"]}"' for photo in data["photos"]]
        print(",\n".join(urls))
except Exception as e:
    print(e)
