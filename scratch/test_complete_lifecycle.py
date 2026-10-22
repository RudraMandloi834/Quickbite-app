import urllib.request
import json
import sys

BASE_URL = "http://localhost:8080"

def post(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={
        "Content-Type": "application/json",
        **({"Authorization": f"Bearer {token}"} if token else {})
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def patch(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={
        "Content-Type": "application/json",
        **({"Authorization": f"Bearer {token}"} if token else {})
    }, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={
        **({"Authorization": f"Bearer {token}"} if token else {})
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

print("=== STARTING FULL ORDER LIFECYCLE VERIFICATION ===")

# 1. Login all accounts
status, res = post("/api/auth/login", {"email": "customer@test.com", "password": "dev123"})
assert status == 200, f"Customer login failed: {res}"
customer_token = res["token"]
print("✓ Customer logged in successfully")

status, res = post("/api/auth/login", {"email": "restaurant@test.com", "password": "dev123"})
assert status == 200, f"Restaurant login failed: {res}"
restaurant_token = res["token"]
print("✓ Restaurant partner logged in successfully")

status, res = post("/api/auth/login", {"email": "driver@test.com", "password": "dev123"})
assert status == 200, f"Driver login failed: {res}"
driver_token = res["token"]
print("✓ Driver logged in successfully")

# 2. Select a catalogue restaurant (e.g. an existing synthetic Indian restaurant, to test non-dev-seeded restaurant!)
status, restaurants = get("/api/restaurants?page=0&size=5")
assert status == 200, f"Failed to get restaurants: {restaurants}"
target_restaurant = restaurants["content"][0]
rest_id = target_restaurant["id"]
rest_name = target_restaurant["name"]
print(f"✓ Selected catalogue restaurant: #{rest_id} - '{rest_name}'")

# 3. Get menu items for target restaurant
status, menu_items = get(f"/api/restaurants/{rest_id}/menu")
assert status == 200 and len(menu_items) > 0, f"No menu items found for restaurant {rest_id}"
item = menu_items[0]
print(f"✓ Found menu item: '{item['name']}' (₹{item['price']})")

# 4. Create cart and add item
status, cart = post("/api/carts", {"customerId": 1, "restaurantId": rest_id}, customer_token)
assert status in (200, 201), f"Create cart failed: {cart}"
cart_id = cart["id"]

status, cart_item = post(f"/api/carts/{cart_id}/items", {
    "menuItemId": item["id"],
    "quantity": 2
}, customer_token)
assert status in (200, 201), f"Add item to cart failed: {cart_item}"
print(f"✓ Added 2x '{item['name']}' to cart #{cart_id}")

# 5. Checkout / Place Order
status, order = post(f"/api/orders/from-cart/{cart_id}", {}, customer_token)
assert status in (200, 201), f"Create order failed: {order}"
order_id = order["id"]
assert order["status"] == "PLACED", f"Initial order status must be PLACED, got {order['status']}"
assert order["restaurantId"] == rest_id, f"Order restaurantId mismatch"
print(f"✓ Order #{order_id} created with status 'PLACED' for restaurant #{rest_id}")

# 6. Verify Restaurant Partner Dashboard access
status, my_apps = get("/api/restaurants/my-applications", restaurant_token)
assert status == 200, f"Failed to get my-applications: {my_apps}"
# Verify the target restaurant is now in the partner's applications and sorted first (has latest order)
app_ids = [r["id"] for r in my_apps]
assert rest_id in app_ids, f"Target restaurant #{rest_id} should be associated with partner. Got {app_ids}"
assert my_apps[0]["id"] == rest_id, f"Restaurant #{rest_id} with latest order should be first in my-applications. Got {my_apps[0]['id']}"
print(f"✓ Target restaurant #{rest_id} is automatically accessible and first in partner's list")

# 7. Check restaurant orders
status, orders = get(f"/api/restaurants/{rest_id}/orders", restaurant_token)
assert status == 200, f"Failed to get restaurant orders: {orders}"
matching_orders = [o for o in orders if o["id"] == order_id]
assert len(matching_orders) == 1, f"Order #{order_id} not found in restaurant orders"
rec_order = matching_orders[0]
assert rec_order["status"] == "PLACED"
print(f"✓ Restaurant received Order #{order_id} under 'New Orders' (PLACED)")

# 8. Restaurant: ACCEPT Order
status, updated = patch(f"/api/restaurants/{rest_id}/orders/{order_id}/status", {"status": "ACCEPTED"}, restaurant_token)
assert status == 200 and updated["status"] == "ACCEPTED", f"Failed to accept: {updated}"
print("✓ Restaurant ACCEPTED the order")

# 9. Restaurant: START PREPARING
status, updated = patch(f"/api/restaurants/{rest_id}/orders/{order_id}/status", {"status": "PREPARING"}, restaurant_token)
assert status == 200 and updated["status"] == "PREPARING", f"Failed to start preparing: {updated}"
print("✓ Restaurant marked order PREPARING")

# 10. Restaurant: MARK READY FOR PICKUP
status, updated = patch(f"/api/restaurants/{rest_id}/orders/{order_id}/status", {"status": "READY_FOR_PICKUP"}, restaurant_token)
assert status == 200 and updated["status"] == "READY_FOR_PICKUP", f"Failed to mark ready: {updated}"
print("✓ Restaurant marked order READY_FOR_PICKUP")

# 11. Driver: Check Available Deliveries
status, available = get("/api/deliveries/available", driver_token)
assert status == 200, f"Failed to get available deliveries: {available}"
matching_deliveries = [d for d in available if d["orderId"] == order_id]
assert len(matching_deliveries) == 1, f"Delivery for order #{order_id} not found in available list"
delivery = matching_deliveries[0]
delivery_id = delivery["id"]
assert delivery["restaurantName"] == rest_name, f"Expected restaurantName {rest_name}, got {delivery.get('restaurantName')}"
assert delivery["orderTotal"] is not None, "Expected orderTotal to be populated"
assert delivery["customerName"] is not None, "Expected customerName to be populated"
print(f"✓ Driver sees Delivery #{delivery_id} in Available Deliveries with complete info (Restaurant: {delivery['restaurantName']}, Items: {delivery.get('orderItemsSummary')}, Value: ₹{delivery.get('orderTotal')})")

# 12. Driver: Accept Delivery
status, assigned = post(f"/api/deliveries/{delivery_id}/assign", {}, driver_token)
assert status == 200 and assigned["status"] == "ASSIGNED", f"Driver assign failed: {assigned}"
print(f"✓ Driver accepted delivery #{delivery_id} (Status: ASSIGNED)")

# 13. Verify Restaurant sees Assigned Driver
status, rest_order = get(f"/api/restaurants/{rest_id}/orders/{order_id}", restaurant_token)
assert status == 200
assert rest_order["status"] == "DRIVER_ASSIGNED", f"Order status should be DRIVER_ASSIGNED, got {rest_order['status']}"
assert rest_order["driverName"] == "Dev Driver", f"Expected driverName 'Dev Driver', got {rest_order.get('driverName')}"
print(f"✓ Restaurant dashboard sees Assigned Driver: '{rest_order['driverName']}'")

# 14. Driver: Mark Picked Up
status, picked_up = patch(f"/api/deliveries/{delivery_id}/status", {"status": "PICKED_UP"}, driver_token)
assert status == 200 and picked_up["status"] == "PICKED_UP", f"Pick up failed: {picked_up}"
print(f"✓ Driver marked PICKED_UP")

# 15. Driver: Start Delivery Route
status, on_way = patch(f"/api/deliveries/{delivery_id}/status", {"status": "OUT_FOR_DELIVERY"}, driver_token)
assert status == 200 and on_way["status"] == "OUT_FOR_DELIVERY", f"Start delivery failed: {on_way}"
print(f"✓ Driver marked OUT_FOR_DELIVERY")

# 16. Driver: Mark Delivered
status, delivered = patch(f"/api/deliveries/{delivery_id}/status", {"status": "DELIVERED"}, driver_token)
assert status == 200 and delivered["status"] == "DELIVERED", f"Mark delivered failed: {delivered}"
print(f"✓ Driver marked DELIVERED")

# 17. Verify Customer Tracking
status, cust_order = get(f"/api/orders/{order_id}", customer_token)
assert status == 200
assert cust_order["status"] == "DELIVERED", f"Customer tracking status must be DELIVERED, got {cust_order['status']}"
assert cust_order["deliveredAt"] is not None, "deliveredAt timestamp must be recorded"
print(f"✓ Customer order tracking confirms status 'DELIVERED' with deliveredAt: {cust_order['deliveredAt']}")

# 18. Verify Delivery status history
status, del_record = get(f"/api/deliveries/order/{order_id}", customer_token)
assert status == 200
assert del_record["status"] == "DELIVERED"
assert del_record["driverName"] == "Dev Driver"
print(f"✓ Customer tracking shows delivery partner '{del_record['driverName']}' and final status 'DELIVERED'")

print("\n=======================================================")
print("✅ ALL TESTS PASSED: COMPLETE QUICKBITE WORKFLOW VERIFIED!")
print("=======================================================")
