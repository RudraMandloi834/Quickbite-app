import requests
import random

cities = ["New York", "San Francisco", "Austin", "Chicago", "Seattle"]
cuisines = ["Italian", "Mexican", "Chinese", "Indian", "American", "Thai", "Japanese"]
names = ["Bistro", "Cafe", "Grill", "Diner", "Kitchen", "Tavern", "House", "Place"]
adjectives = ["Golden", "Silver", "Red", "Blue", "Green", "Spicy", "Sweet", "Savory"]

# check count first
resp = requests.get("http://localhost:8080/api/restaurants?page=0&size=1")
if resp.status_code == 200:
    data = resp.json()
    total = data.get("totalElements", 0)
    print(f"Current total restaurants: {total}")
    if total < 10000:
        print(f"Need to insert {10000 - total} records. This might take a while if done via API sequentially.")
else:
    print("Failed to check restaurants", resp.status_code, resp.text)
