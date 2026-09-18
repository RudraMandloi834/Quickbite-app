#!/bin/bash
set -e
UNIQUE=$RANDOM
BASE_URL="http://localhost:8080"
echo "--- 1. Creating users ---"
CUST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust $UNIQUE\",\"email\":\"cust$UNIQUE@test.com\",\"password\":\"dev123\"}")
CUST_TOKEN=$(echo $CUST_RES | jq -r .token)
CUST_ID=$(python3 -c "import jwt; print(jwt.decode('$CUST_TOKEN', options={'verify_signature': False})['customerId'])")
echo "CUST_ID: $CUST_ID"

OWNER_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Owner $UNIQUE\",\"email\":\"owner$UNIQUE@test.com\",\"password\":\"dev123\"}")
OWNER_TOKEN=$(echo $OWNER_RES | jq -r .token)

ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"dev123"}' | jq -r .token)
DRIVER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"driver@test.com","password":"dev123"}' | jq -r .token)

echo "--- 2. Owner applies for restaurant ---"
REST_RES=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" -d "{\"name\":\"Bob Burgers $UNIQUE\",\"cuisine\":\"American\",\"location\":\"Westside\",\"address\":\"789 Bob St\",\"rating\":4.0,\"city\":\"Bobville\",\"area\":\"Bob Area\",\"latitude\":0,\"longitude\":0,\"openingHours\":\"9-5\",\"deliveryRadius\":5,\"coverImageUrl\":\"\"}")
REST_ID=$(echo $REST_RES | jq -r .id)
echo "REST_ID: $REST_ID"

echo "--- 4. Admin approves restaurant $REST_ID ---"
APP_RES=$(curl -s -X POST $BASE_URL/api/operator/restaurants/$REST_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN")
PARTNER_USER=$(echo $APP_RES | jq -r .username)
PARTNER_PASS=$(echo $APP_RES | jq -r .temporaryPassword)

echo "--- 5. Partner logs in and adds menu item ---"
PARTNER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$PARTNER_USER\",\"password\":\"$PARTNER_PASS\"}" | jq -r .token)
MENU_RES=$(curl -s -X POST $BASE_URL/api/restaurants/$REST_ID/menu -H "Content-Type: application/json" -H "Authorization: Bearer $PARTNER_TOKEN" -d '{"name":"Classic Burger","description":"Juicy","price":12.99,"available":true}')
MENU_ID=$(echo $MENU_RES | jq -r .id)
echo "MENU_ID: $MENU_ID"

echo "--- 6. Customer creates cart and adds item ---"
CART_RES=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID, \"restaurantId\":$REST_ID}")
CART_ID=$(echo $CART_RES | jq -r .id)
CART_ITEM_RES=$(curl -s -X POST $BASE_URL/api/carts/$CART_ID/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID, \"quantity\":1}")

echo "--- 7. Customer checks out cart to create Order ---"
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)
echo "ORDER_ID: $ORDER_ID"

echo "--- 8. Customer pays for Order $ORDER_ID ---"
PAY_INIT=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN")
RZP_ORDER_ID=$(echo $PAY_INIT | jq -r .razorpayOrderId)
echo "RZP_ORDER_ID: $RZP_ORDER_ID"
PAY_VERIFY=$(curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RZP_ORDER_ID\", \"razorpayPaymentId\":\"dev_success\", \"razorpaySignature\":\"dev_signature\"}")

echo "--- 9. Driver assigns order to themselves ---"
DELIVERY_RES=$(curl -s -X GET $BASE_URL/api/deliveries/available -H "Authorization: Bearer $DRIVER_TOKEN")
DELIVERY_ID=$(echo $DELIVERY_RES | jq -r '.[0].id')
echo "DELIVERY_ID: $DELIVERY_ID"
curl -s -X POST $BASE_URL/api/deliveries/$DELIVERY_ID/assign -H "Authorization: Bearer $DRIVER_TOKEN" > /dev/null

echo "--- 10. Driver updates status to PICKED_UP ---"
curl -s -X PATCH $BASE_URL/api/deliveries/$DELIVERY_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" -d '{"status":"PICKED_UP"}' > /dev/null

echo "--- 11. Endpoints check ---"
echo "Customer Order:"
curl -s -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN" | jq -c '{id, status}'

echo "Restaurant Order:"
curl -s -X GET $BASE_URL/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $PARTNER_TOKEN" | jq -c '.[0] | {id, status}'

echo "Driver Delivery:"
curl -s -X GET $BASE_URL/api/deliveries/driver/me -H "Authorization: Bearer $DRIVER_TOKEN" | jq -c '.[0] | {id, status, orderId}'

