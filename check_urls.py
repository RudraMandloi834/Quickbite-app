import urllib.request
from concurrent.futures import ThreadPoolExecutor

restaurant_urls = [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80",
        "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338988a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
        "https://images.unsplash.com/photo-1466978913421-bac2ce4e5058?w=800&q=80",
        "https://images.unsplash.com/photo-1551632436-dfbc80e66bbd?w=800&q=80",
        "https://images.unsplash.com/photo-1525610553991-56e1d2c6c06a?w=800&q=80",
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
        "https://images.unsplash.com/photo-1537047902400-815ea7bc9ae5?w=800&q=80",
        "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80",
        "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&q=80",
        "https://images.unsplash.com/photo-1424847651115-4399b2eb8c81?w=800&q=80",
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
        "https://images.unsplash.com/photo-1505275350441-83dcda8eeef5?w=800&q=80",
        "https://images.unsplash.com/photo-1563241527-31a8afb28272?w=800&q=80",
        "https://images.unsplash.com/photo-1500331882646-91f883da4e94?w=800&q=80",
        "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80",
        "https://images.unsplash.com/photo-1512411030438-e4b9f2b87f4c?w=800&q=80",
        "https://images.unsplash.com/photo-1535141192574-5d48937f60ed?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-14a5113d520e?w=800&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
        "https://images.unsplash.com/photo-1504672281656-99501bea8c68?w=800&q=80",
        "https://images.unsplash.com/photo-1471253797013-8b7d903fba13?w=800&q=80",
        "https://images.unsplash.com/photo-1481833761520-415f8f5c8c50?w=800&q=80",
        "https://images.unsplash.com/photo-1521017432531-f761501b44d3?w=800&q=80",
        "https://images.unsplash.com/photo-1485182708500-e8f1f3156028?w=800&q=80",
        "https://images.unsplash.com/photo-1513267048331-56fd0fac92a4?w=800&q=80",
        "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80",
        "https://images.unsplash.com/photo-1519690889869-e705e59f72d1?w=800&q=80",
        "https://images.unsplash.com/photo-1554679665-f5537f187268?w=800&q=80",
        "https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&q=80"
]

menu_urls = [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
        "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80",
        "https://images.unsplash.com/photo-1482049361208-132d73315a6b?w=400&q=80",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
        "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
        "https://images.unsplash.com/photo-1512152272829-410f971b8be8?w=400&q=80",
        "https://images.unsplash.com/photo-1484723091781-37d8e658bc66?w=400&q=80",
        "https://images.unsplash.com/photo-1490645935967-17de6ba727b8?w=400&q=80",
        "https://images.unsplash.com/photo-1504669886361-ec0691522f6d?w=400&q=80",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
        "https://images.unsplash.com/photo-1529042410759-bee2e7ccfec9?w=400&q=80",
        "https://images.unsplash.com/photo-1543339308-4171a7a13d78?w=400&q=80",
        "https://images.unsplash.com/photo-1559847116-ce24c9c72e27?w=400&q=80",
        "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80",
        "https://images.unsplash.com/photo-1594212699903-b09e469d7b48?w=400&q=80",
        "https://images.unsplash.com/photo-1606491956689-2ea866840c82?w=400&q=80",
        "https://images.unsplash.com/photo-1505253758473-9828d519e9de?w=400&q=80",
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80",
        "https://images.unsplash.com/photo-1512058564366-18510fd2b15e?w=400&q=80",
        "https://images.unsplash.com/photo-1574484284002-9a3d4f40f2f4?w=400&q=80",
        "https://images.unsplash.com/photo-1563379926898-112df86daef6?w=400&q=80",
        "https://images.unsplash.com/photo-1504544750208-dc0358e10fce?w=400&q=80",
        "https://images.unsplash.com/photo-1534422298391-e4f8c172dd36?w=400&q=80",
        "https://images.unsplash.com/photo-1544025162-0a6d0c675330?w=400&q=80",
        "https://images.unsplash.com/photo-1571162235969-95e2671391d4?w=400&q=80",
        "https://images.unsplash.com/photo-1600891964092-4b11428a1c9e?w=400&q=80",
        "https://images.unsplash.com/photo-1511690655026-0e1ce403e2c3?w=400&q=80",
        "https://images.unsplash.com/photo-1481070555726-a212354c0e64?w=400&q=80",
        "https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&q=80"
]

def check_url(url):
    req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            return True, url
    except Exception as e:
        return False, url

valid_restaurants = []
valid_menus = []

with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(check_url, restaurant_urls)
    for is_valid, url in results:
        if is_valid:
            valid_restaurants.append(url)
        else:
            print(f"Invalid Restaurant URL: {url}")

with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(check_url, menu_urls)
    for is_valid, url in results:
        if is_valid:
            valid_menus.append(url)
        else:
            print(f"Invalid Menu URL: {url}")

print(f"Valid Restaurant URLs: {len(valid_restaurants)}")
print(f"Valid Menu URLs: {len(valid_menus)}")

