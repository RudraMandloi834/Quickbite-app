import urllib.request
import json

def fetch(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def run():
    print("Fetching total restaurants...")
    res = fetch("http://localhost:8080/api/restaurants?page=0&size=1")
    total = res['totalElements']
    print(f"Total restaurants: {total}")

    print("Fetching restaurants by city...")
    cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune",
        "Ahmedabad", "Jaipur", "Lucknow", "Indore", "Bhopal", "Chandigarh",
        "Surat", "Nagpur", "Patna", "Kochi", "Coimbatore", "Vadodara",
        "Visakhapatnam", "Nashik", "Mysuru", "Goa"]
    for city in cities:
        res = fetch(f"http://localhost:8080/api/restaurants?city={city}&page=0&size=1")
        print(f"City {city}: {res['totalElements']}")

run()
