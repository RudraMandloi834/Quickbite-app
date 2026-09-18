#!/bin/bash
BASE_URL="http://localhost:8080"
echo "=== Phase 4 Tests ==="

R=$RANDOM

# Setup users
echo "Creating customer..."
CUST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust\",\"email\":\"cust_$R@test.com\",\"password\":\"dev123\",\"role\":\"CUSTOMER\"}")
CUST_TOKEN=$(echo $CUST_RES | jq -r .token)
CUST_ID=$(python3 -c "import jwt; print(jwt.decode('$CUST_TOKEN', options={'verify_signature': False})['customerId'])")

echo "Creating restaurant partner..."
REST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Rest\",\"email\":\"rest_$R@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
REST_TOKEN=$(echo $REST_RES | jq -r .token)
REST_ID=$(python3 -c "import jwt; print(jwt.decode('$REST_TOKEN', options={'verify_signature': False})['customerId'])")

echo "Creating driver..."
DRIV_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Driv\",\"email\":\"driv_$R@test.com\",\"password\":\"dev123\",\"role\":\"DRIVER\"}")
DRIV_TOKEN=$(echo $DRIV_RES | jq -r .token)

ADMIN_RES=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"dev123\"}")
ADMIN_TOKEN=$(echo $ADMIN_RES | jq -r .token)

# 1. Create Restaurant
echo "Applying for restaurant..."
REST_APP=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Rest $R\",\"cuisine\":\"C\",\"location\":\"L\",\"rating\":5.0}")
echo "REST_APP: $REST_APP"
REST_ENT_ID=$(echo $REST_APP | jq -r .id)

echo "Approving restaurant $REST_ENT_ID..."
curl -s -X POST $BASE_URL/api/operator/restaurants/$REST_ENT_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# 2. Add MenuItem & Create Cart
MENU_RES=$(curl -s -X POST $BASE_URL/api/restaurants/$REST_ENT_ID/menu -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Food\",\"description\":\"D\",\"price\":10.0,\"available\":true}")
MENU_ID=$(echo $MENU_RES | jq -r .id)

echo "Creating cart for CUST_ID=$CUST_ID, REST_ENT_ID=$REST_ENT_ID"
CART_RES=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID,\"restaurantId\":$REST_ENT_ID}")
echo "CART_RES: $CART_RES"
CART_ID=$(echo $CART_RES | jq -r .id)

echo "Adding item $MENU_ID to cart $CART_ID"
curl -s -X POST $BASE_URL/api/carts/$CART_ID/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID,\"quantity\":1}" > /dev/null

# 3. Create Order
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)
ORDER_STATUS=$(echo $ORDER_RES | jq -r .status)
echo "Order created with status: $ORDER_STATUS (Expected: PAYMENT_PENDING)"

# 4. Try invalid transition: Driver cannot prepare
HTTP_403_DRIV=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "{\"status\":\"PREPARING\"}")
echo "Driver modifying order -> $HTTP_403_DRIV (Expected: 403)"

# 5. Initiate Payment
PAY_INIT=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
PAY_ID=$(echo $PAY_INIT | jq -r .paymentId)

# 6. Fail Payment Test (creates new order because we want to see failure path without blocking main order)
curl -s -X POST $BASE_URL/api/payments/$PAY_ID/fail -H "Authorization: Bearer $CUST_TOKEN" > /dev/null
ORDER_RES2=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
echo "Order status after payment failure: $(echo $ORDER_RES2 | jq -r .status) (Expected: PAYMENT_FAILED)"

# Re-create order for happy path
CART_RES2=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID,\"restaurantId\":$REST_ENT_ID}")
CART_ID2=$(echo $CART_RES2 | jq -r .id)
curl -s -X POST $BASE_URL/api/carts/$CART_ID2/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID,\"quantity\":1}" > /dev/null
ORDER_RES3=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID2 -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID3=$(echo $ORDER_RES3 | jq -r .id)
PAY_INIT3=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN")
RAZORPAY_ORDER_ID=$(echo $PAY_INIT3 | jq -r .razorpayOrderId)

# 7. Verify Payment -> CONFIRMED
curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RAZORPAY_ORDER_ID\",\"razorpayPaymentId\":\"dev_pay\",\"razorpaySignature\":\"dev_signature\"}" > /dev/null
ORDER_RES4=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN")
echo "Order status after verification: $(echo $ORDER_RES4 | jq -r .status) (Expected: CONFIRMED)"

# 8. Restaurant Accepts -> RESTAURANT_ACCEPTED
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID3/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"status\":\"RESTAURANT_ACCEPTED\"}" > /dev/null
echo "Order status after accept: $(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN" | jq -r .status)"

# 9. Duplicate Request Test
HTTP_409_DUP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID3/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"status\":\"RESTAURANT_ACCEPTED\"}")
echo "Duplicate transition request -> $HTTP_409_DUP (Expected: 409)"

# 10. Restaurant PREPARING, READY_FOR_PICKUP
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID3/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"status\":\"PREPARING\"}" > /dev/null
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID3/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"status\":\"READY_FOR_PICKUP\"}" > /dev/null
echo "Order status after ready: $(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN" | jq -r .status) (Expected: READY_FOR_PICKUP)"

# 11. Customer Cannot Deliver
HTTP_403_CUST=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID3/status -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"status\":\"DELIVERED\"}")
echo "Customer marking delivered -> $HTTP_403_CUST (Expected: 403)"

# 12. Driver assignment & Delivery lifecycle
DELIV_LIST=$(curl -s -X GET $BASE_URL/api/deliveries/available -H "Authorization: Bearer $DRIV_TOKEN")
DELIV_ID=$(echo $DELIV_LIST | jq -r ".[0].id")
curl -s -X POST $BASE_URL/api/deliveries/$DELIV_ID/assign -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "{\"driverName\":\"Driv\",\"driverPhone\":\"1234\"}" > /dev/null
echo "Order status after driver assigned: $(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN" | jq -r .status) (Expected: DRIVER_ASSIGNED)"

curl -s -X PATCH $BASE_URL/api/deliveries/$DELIV_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "{\"status\":\"PICKED_UP\"}" > /dev/null
curl -s -X PATCH $BASE_URL/api/deliveries/$DELIV_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "{\"status\":\"OUT_FOR_DELIVERY\"}" > /dev/null
curl -s -X PATCH $BASE_URL/api/deliveries/$DELIV_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "{\"status\":\"DELIVERED\"}" > /dev/null

echo "Final Order status: $(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID3 -H "Authorization: Bearer $CUST_TOKEN" | jq -r .status) (Expected: DELIVERED)"

