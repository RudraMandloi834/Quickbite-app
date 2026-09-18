#!/bin/bash
BASE_URL="http://localhost:8080"

# 1. Create two customers
C1_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"C1\",\"email\":\"c1_$RANDOM@test.com\",\"password\":\"dev123\"}")
C1_TOKEN=$(echo $C1_RES | jq -r .token)
C1_ID=$(python3 -c "import jwt; print(jwt.decode('$C1_TOKEN', options={'verify_signature': False})['customerId'])")

C2_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"C2\",\"email\":\"c2_$RANDOM@test.com\",\"password\":\"dev123\"}")
C2_TOKEN=$(echo $C2_RES | jq -r .token)
C2_ID=$(python3 -c "import jwt; print(jwt.decode('$C2_TOKEN', options={'verify_signature': False})['customerId'])")

# 2. Get the seeded Dev Burger restaurant id and menu
RESTS=$(curl -s -X GET $BASE_URL/api/restaurants)
REST_ID=$(echo $RESTS | jq -r '.[0].id')
MENU=$(curl -s -X GET $BASE_URL/api/restaurants/$REST_ID/menu)
MENU_ID=$(echo $MENU | jq -r '.[0].id')

# C1 creates an order
CART_RES=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $C1_TOKEN" -d "{\"customerId\":$C1_ID, \"restaurantId\":$REST_ID}")
CART_ID=$(echo $CART_RES | jq -r .id)
curl -s -X POST $BASE_URL/api/carts/$CART_ID/items -H "Content-Type: application/json" -H "Authorization: Bearer $C1_TOKEN" -d "{\"menuItemId\":$MENU_ID, \"quantity\":1}" > /dev/null
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Content-Type: application/json" -H "Authorization: Bearer $C1_TOKEN")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)

# Test 1: Customer accessing another customer's order
HTTP_STATUS_1=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $C2_TOKEN")
echo "Customer accessing another customer's order -> $HTTP_STATUS_1"

# 3. Create two owners
O1_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"O1\",\"email\":\"o1_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
O1_TOKEN=$(echo $O1_RES | jq -r .token)

O2_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"O2\",\"email\":\"o2_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
O2_TOKEN=$(echo $O2_RES | jq -r .token)

# O1 creates a restaurant
REST1_RES=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $O1_TOKEN" -d "{\"name\":\"O1 Rest\",\"cuisine\":\"American\",\"location\":\"Loc\",\"address\":\"Add\",\"rating\":4.0,\"city\":\"City\",\"area\":\"Area\",\"latitude\":0,\"longitude\":0,\"openingHours\":\"9-5\",\"deliveryRadius\":5,\"coverImageUrl\":\"\"}")
REST1_ID=$(echo $REST1_RES | jq -r .id)

# Test 2: Owner accessing another restaurant
# O2 tries to fetch O1's restaurant orders
HTTP_STATUS_2=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/restaurants/$REST1_ID/orders -H "Authorization: Bearer $O2_TOKEN")
echo "Owner accessing another restaurant -> $HTTP_STATUS_2"

# 4. Create two drivers
D1_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"D1\",\"email\":\"d1_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"DRIVER\"}")
D1_TOKEN=$(echo $D1_RES | jq -r .token)

D2_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"D2\",\"email\":\"d2_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"DRIVER\"}")
D2_TOKEN=$(echo $D2_RES | jq -r .token)

# C1 pays to spawn delivery
PAY_INIT=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID -H "Content-Type: application/json" -H "Authorization: Bearer $C1_TOKEN")
RZP_ORDER_ID=$(echo $PAY_INIT | jq -r .razorpayOrderId)
curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $C1_TOKEN" -d "{\"razorpayOrderId\":\"$RZP_ORDER_ID\", \"razorpayPaymentId\":\"dev_success\", \"razorpaySignature\":\"dev_signature\"}" > /dev/null

DELIVERY_RES=$(curl -s -X GET $BASE_URL/api/deliveries/order/$ORDER_ID -H "Authorization: Bearer $C1_TOKEN")
DELIVERY_ID=$(echo $DELIVERY_RES | jq -r .id)

# D1 assigns delivery
curl -s -X POST $BASE_URL/api/deliveries/$DELIVERY_ID/assign -H "Authorization: Bearer $D1_TOKEN" > /dev/null

# Test 3: Driver accessing another driver's delivery
# D2 tries to update status of D1's delivery
HTTP_STATUS_3=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE_URL/api/deliveries/$DELIVERY_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $D2_TOKEN" -d "{\"status\":\"PICKED_UP\"}")
echo "Driver accessing another driver's delivery -> $HTTP_STATUS_3"

# 5. Admin tests
ADMIN_RES=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"dev123\"}")
ADMIN_TOKEN=$(echo $ADMIN_RES | jq -r .token)

# Test 4: Admin accessing pending applications
HTTP_STATUS_4=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/operator/restaurants/pending -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Admin accessing pending applications -> $HTTP_STATUS_4"

# Test 5: Unauthenticated request
HTTP_STATUS_5=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/orders/$ORDER_ID)
echo "Unauthenticated request -> $HTTP_STATUS_5"

