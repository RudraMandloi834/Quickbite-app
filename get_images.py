import urllib.request
import json
import re

html = urllib.request.urlopen("https://unsplash.com/napi/search/photos?query=restaurant%20food&per_page=100").read().decode('utf-8')
data = json.loads(html)
urls = [f'"{photo["urls"]["raw"]}&auto=format&fit=crop&w=400&q=80"' for photo in data["results"]]
print(",\n".join(urls))
