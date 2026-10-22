import re
with open("frontend/src/app/restaurant/join/page.tsx", "r") as f: content = f.read()

content = content.replace("setRestaurants(data);", "setRestaurants(data.content);")
content = content.replace("const data = await getRestaurants();", "const data = await getRestaurants(0, searchQuery);")
# Add searchQuery to dependencies
content = content.replace("}, []);", "}, [searchQuery]);")
with open("frontend/src/app/restaurant/join/page.tsx", "w") as f: f.write(content)
