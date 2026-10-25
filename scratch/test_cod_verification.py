import requests
import json
import sys

BASE_URL = "http://localhost:8080"

def log(msg):
    print(f"[TEST] {msg}")

def login(email, password):
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        raise Exception(f"Failed to login {email}: {res.status_code} {res.text}")
    return res.json()["token"]

def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def run_tests():
    log("Starting comprehensive COD and Regression Verification...")

    # 1. Login all roles
    customer_token = login("customer@test.com", "dev123")
    restaurant_token = login("restaurant@test.com", "dev123")
    driver_token = login("driver@test.com", "dev123")
    admin_token = login("admin@test.com", "dev123")

    c_headers = auth_headers(customer_token)
    r_headers = auth_headers(restaurant_token)
    d_headers = auth_headers(driver_token)
    a_headers = auth_headers(admin_token)

    # 2. Identify restaurant & menu item
    res = requests.get(f"{BASE_URL}/api/restaurants", headers=c_headers)
    restaurants = res.json()["content"]
    assert len(restaurants) > 0, "No restaurants found"
    restaurant = restaurants[0]
    restaurant_id = restaurant["id"]
    log(f"Selected Restaurant #{restaurant_id}: {restaurant['name']}")

    menu_res = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}/menu", headers=c_headers)
    menu_items = menu_res.json()
    assert len(menu_items) > 0, "No menu items found"
    menu_item = menu_items[0]
    log(f"Selected Menu Item #{menu_item['id']}: {menu_item['name']} - ₹{menu_item['price']}")

    # -------------------------------------------------------------
    # PART A: TEST COD ORDER LIFECYCLE
    # -------------------------------------------------------------
    log("\n--- PART A: TEST COD ORDER LIFECYCLE ---")

    # A1. Create Cart & Add Item
    cart_res = requests.post(f"{BASE_URL}/api/carts", json={"restaurantId": restaurant_id, "customerId": 1}, headers=c_headers)
    assert cart_res.status_code in [200, 201], f"Cart creation failed: {cart_res.text}"
    cart = cart_res.json()
    cart_id = cart["id"]

    add_res = requests.post(f"{BASE_URL}/api/carts/{cart_id}/items", json={"menuItemId": menu_item["id"], "quantity": 2}, headers=c_headers)
    assert add_res.status_code in [200, 201], f"Add item failed: {add_res.text}"

    # A2. Place Order with COD
    order_res = requests.post(f"{BASE_URL}/api/orders/from-cart/{cart_id}", json={"paymentMethod": "COD"}, headers=c_headers)
    assert order_res.status_code == 201, f"Order placement failed: {order_res.status_code} {order_res.text}"
    cod_order = order_res.json()
    cod_order_id = cod_order["id"]
    log(f"1. Placed COD Order #{cod_order_id}")
    assert cod_order["status"] == "PLACED", f"Expected PLACED, got {cod_order['status']}"
    assert cod_order["paymentMethod"] == "COD", f"Expected paymentMethod COD, got {cod_order.get('paymentMethod')}"
    assert cod_order["paymentStatus"] == "PENDING", f"Expected paymentStatus PENDING, got {cod_order.get('paymentStatus')}"

    # A3. Verify duplicate order placement from same cart is rejected (cart items cleared)
    dup_res = requests.post(f"{BASE_URL}/api/orders/from-cart/{cart_id}", json={"paymentMethod": "COD"}, headers=c_headers)
    assert dup_res.status_code == 400, f"Expected duplicate order to fail with 400, got {dup_res.status_code}"
    log("2. Duplicate order placement from emptied cart properly rejected (HTTP 400)")

    # A4. Verify online payment initiation is rejected for COD order
    rzp_res = requests.post(f"{BASE_URL}/api/payments/orders/{cod_order_id}", headers=c_headers)
    assert rzp_res.status_code == 400, f"Expected Razorpay initiation on COD to fail with 400, got {rzp_res.status_code}"
    log("3. Razorpay payment initiation on COD order properly blocked (HTTP 400)")

    # A5. Verify restaurant receives COD order
    r_orders_res = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}/orders", headers=r_headers)
    assert r_orders_res.status_code == 200, f"Failed to get restaurant orders: {r_orders_res.text}"
    r_orders = r_orders_res.json()
    matching_r_order = next((o for o in r_orders if o["id"] == cod_order_id), None)
    assert matching_r_order is not None, f"Order #{cod_order_id} not found in restaurant dashboard"
    assert matching_r_order["paymentMethod"] == "COD", f"Restaurant saw paymentMethod {matching_r_order['paymentMethod']}"
    assert matching_r_order["paymentStatus"] == "PENDING", f"Restaurant saw paymentStatus {matching_r_order['paymentStatus']}"
    log(f"4. Restaurant Dashboard verified: Order #{cod_order_id} shows Method: COD, Payment: PENDING")

    # A6. Restaurant transitions: ACCEPTED -> PREPARING -> READY_FOR_PICKUP
    for next_status in ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"]:
        status_res = requests.patch(
            f"{BASE_URL}/api/restaurants/{restaurant_id}/orders/{cod_order_id}/status",
            json={"status": next_status},
            headers=r_headers
        )
        assert status_res.status_code == 200, f"Transition to {next_status} failed: {status_res.status_code} {status_res.text}"
        log(f"5. Restaurant updated order to {next_status}")

    # Verify customer tracking sees READY_FOR_PICKUP
    track_res = requests.get(f"{BASE_URL}/api/orders/{cod_order_id}", headers=c_headers)
    assert track_res.json()["status"] == "READY_FOR_PICKUP"
    assert track_res.json()["paymentStatus"] == "PENDING"
    log("6. Customer tracking confirmed: status READY_FOR_PICKUP, paymentStatus PENDING")

    # A7. Driver checks available deliveries
    avail_res = requests.get(f"{BASE_URL}/api/deliveries/available", headers=d_headers)
    assert avail_res.status_code == 200, f"Driver available deliveries failed: {avail_res.text}"
    avail_deliveries = avail_res.json()
    deliv = next((d for d in avail_deliveries if d["orderId"] == cod_order_id), None)
    assert deliv is not None, f"Delivery for order #{cod_order_id} not in available deliveries"
    delivery_id = deliv["id"]
    assert deliv["paymentMethod"] == "COD", f"Expected COD, got {deliv.get('paymentMethod')}"
    assert deliv["paymentStatus"] == "PENDING", f"Expected PENDING, got {deliv.get('paymentStatus')}"
    log(f"7. Driver available deliveries verified: Delivery #{delivery_id} for Order #{cod_order_id} (COD, PENDING)")

    # A8. Driver accepts delivery
    assign_res = requests.post(f"{BASE_URL}/api/deliveries/{delivery_id}/assign", headers=d_headers)
    assert assign_res.status_code == 200, f"Driver assignment failed: {assign_res.text}"
    log("8. Driver accepted delivery (DRIVER_ASSIGNED)")

    # A9. Driver marks PICKED_UP then OUT_FOR_DELIVERY
    p_res = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}/status", json={"status": "PICKED_UP"}, headers=d_headers)
    assert p_res.status_code == 200, f"Picked up failed: {p_res.text}"
    log("9. Driver marked PICKED_UP")

    o_res = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=d_headers)
    assert o_res.status_code == 200, f"Out for delivery failed: {o_res.text}"
    log("10. Driver marked OUT_FOR_DELIVERY")

    # A10. Test unauthorized cash collection attempts
    unauth_cust = requests.post(f"{BASE_URL}/api/deliveries/{delivery_id}/collect-cash", headers=c_headers)
    assert unauth_cust.status_code == 403, f"Expected 403 for customer collecting cash, got {unauth_cust.status_code}"
    log("11. Unauthorized cash collection by customer rejected (HTTP 403)")

    # Verify payment is still PENDING
    d_check = requests.get(f"{BASE_URL}/api/deliveries/{delivery_id}", headers=d_headers).json()
    assert d_check["paymentStatus"] == "PENDING", f"Payment should still be PENDING, got {d_check['paymentStatus']}"
    log("12. Verified COD payment remains PENDING until explicitly collected")

    # A11. Driver confirms cash collection
    collect_res = requests.post(f"{BASE_URL}/api/deliveries/{delivery_id}/collect-cash", headers=d_headers)
    assert collect_res.status_code == 200, f"Cash collection failed: {collect_res.status_code} {collect_res.text}"
    collected_deliv = collect_res.json()
    assert collected_deliv["paymentStatus"] == "SUCCESS", f"Expected SUCCESS, got {collected_deliv['paymentStatus']}"
    log("13. Driver successfully confirmed cash collection -> paymentStatus=SUCCESS")

    # A12. Test duplicate cash collection attempt
    dup_collect = requests.post(f"{BASE_URL}/api/deliveries/{delivery_id}/collect-cash", headers=d_headers)
    assert dup_collect.status_code == 409, f"Expected 409 for duplicate cash collection, got {dup_collect.status_code}"
    log("14. Duplicate cash collection attempt rejected (HTTP 409 Conflict)")

    # A13. Driver marks DELIVERED
    deliv_res = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}/status", json={"status": "DELIVERED"}, headers=d_headers)
    assert deliv_res.status_code == 200, f"Mark delivered failed: {deliv_res.text}"
    log("15. Driver marked DELIVERED")

    # A14. Verify final customer tracking state
    final_cust_order = requests.get(f"{BASE_URL}/api/orders/{cod_order_id}", headers=c_headers).json()
    assert final_cust_order["status"] == "DELIVERED", f"Expected DELIVERED, got {final_cust_order['status']}"
    assert final_cust_order["paymentMethod"] == "COD", f"Expected COD, got {final_cust_order['paymentMethod']}"
    assert final_cust_order["paymentStatus"] == "SUCCESS", f"Expected SUCCESS, got {final_cust_order['paymentStatus']}"
    log("16. Customer order tracking verified: DELIVERED, Method: COD, Payment: SUCCESS (Paid)")

    # -------------------------------------------------------------
    # PART B: TEST REGRESSION - ONLINE PAYMENT FLOW
    # -------------------------------------------------------------
    log("\n--- PART B: TEST REGRESSION (ONLINE PAYMENT FLOW) ---")

    # B1. Create new cart
    cart2_res = requests.post(f"{BASE_URL}/api/carts", json={"restaurantId": restaurant_id, "customerId": 1}, headers=c_headers)
    assert cart2_res.status_code in [200, 201]
    cart2 = cart2_res.json()
    requests.post(f"{BASE_URL}/api/carts/{cart2['id']}/items", json={"menuItemId": menu_item["id"], "quantity": 1}, headers=c_headers)

    # B2. Place order with online CARD
    online_order_res = requests.post(f"{BASE_URL}/api/orders/from-cart/{cart2['id']}", json={"paymentMethod": "CARD"}, headers=c_headers)
    assert online_order_res.status_code == 201, f"Online order failed: {online_order_res.text}"
    online_order = online_order_res.json()
    online_order_id = online_order["id"]
    log(f"17. Placed Online Order #{online_order_id} (CARD)")
    assert online_order["paymentMethod"] == "CARD"

    # B3. Initiate Razorpay payment
    init_res = requests.post(f"{BASE_URL}/api/payments/orders/{online_order_id}", headers=c_headers)
    assert init_res.status_code == 201, f"Razorpay init failed: {init_res.text}"
    rzp_data = init_res.json()
    log(f"18. Razorpay payment initiated: {rzp_data['razorpayOrderId']}")

    # B4. Verify Razorpay payment (dev signature)
    verify_res = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "razorpayOrderId": rzp_data["razorpayOrderId"],
        "razorpayPaymentId": "dev_test_payment",
        "razorpaySignature": "dev_signature"
    }, headers=c_headers)
    assert verify_res.status_code == 200, f"Verify failed: {verify_res.text}"
    assert verify_res.json()["status"] == "SUCCESS"
    log("19. Online payment verified successfully: PaymentStatus=SUCCESS")

    # B5. Verify customer tracking reflects online paid
    cust_online_check = requests.get(f"{BASE_URL}/api/orders/{online_order_id}", headers=c_headers).json()
    assert cust_online_check["paymentStatus"] == "SUCCESS"
    log("20. Customer tracking confirmed online order paymentStatus=SUCCESS")

    # B6. Progress online order through restaurant and driver
    requests.patch(f"{BASE_URL}/api/restaurants/{restaurant_id}/orders/{online_order_id}/status", json={"status": "ACCEPTED"}, headers=r_headers)
    requests.patch(f"{BASE_URL}/api/restaurants/{restaurant_id}/orders/{online_order_id}/status", json={"status": "PREPARING"}, headers=r_headers)
    requests.patch(f"{BASE_URL}/api/restaurants/{restaurant_id}/orders/{online_order_id}/status", json={"status": "READY_FOR_PICKUP"}, headers=r_headers)

    avail_online = requests.get(f"{BASE_URL}/api/deliveries/available", headers=d_headers).json()
    deliv_online = next(d for d in avail_online if d["orderId"] == online_order_id)
    requests.post(f"{BASE_URL}/api/deliveries/{deliv_online['id']}/assign", headers=d_headers)
    requests.patch(f"{BASE_URL}/api/deliveries/{deliv_online['id']}/status", json={"status": "PICKED_UP"}, headers=d_headers)
    requests.patch(f"{BASE_URL}/api/deliveries/{deliv_online['id']}/status", json={"status": "OUT_FOR_DELIVERY"}, headers=d_headers)
    requests.patch(f"{BASE_URL}/api/deliveries/{deliv_online['id']}/status", json={"status": "DELIVERED"}, headers=d_headers)

    final_online = requests.get(f"{BASE_URL}/api/orders/{online_order_id}", headers=c_headers).json()
    assert final_online["status"] == "DELIVERED"
    assert final_online["paymentStatus"] == "SUCCESS"
    log("21. Online order completed full lifecycle to DELIVERED successfully without any regression")

    # -------------------------------------------------------------
    # PART C: TEST INVALID PAYMENT METHOD VALIDATION
    # -------------------------------------------------------------
    log("\n--- PART C: TEST SERVER-SIDE PAYMENT METHOD VALIDATION ---")
    cart3_res = requests.post(f"{BASE_URL}/api/carts", json={"restaurantId": restaurant_id, "customerId": 1}, headers=c_headers)
    cart3 = cart3_res.json()
    requests.post(f"{BASE_URL}/api/carts/{cart3['id']}/items", json={"menuItemId": menu_item["id"], "quantity": 1}, headers=c_headers)

    inv_res = requests.post(f"{BASE_URL}/api/orders/from-cart/{cart3['id']}", json={"paymentMethod": "BITCOIN"}, headers=c_headers)
    assert inv_res.status_code == 400, f"Expected 400 for invalid payment method, got {inv_res.status_code}"
    log("22. Invalid payment method ('BITCOIN') properly rejected with HTTP 400")

    log("\n=======================================================")
    log("ALL 22 VERIFICATION CHECKS PASSED WITH ZERO REGRESSIONS!")
    log("=======================================================")

if __name__ == "__main__":
    run_tests()
