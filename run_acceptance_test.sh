#!/bin/bash
set -e
UNIQUE=$RANDOM
BASE_URL="http://localhost:8080"
REST_NAME="Browser Test Restaurant $UNIQUE"

# 1. Users
CUST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust $UNIQUE\",\"email\":\"cust$UNIQUE@test.com\",\"password\":\"dev123\"}")
CUST_TOKEN=$(echo $CUST_RES | jq -r .token)

OWNER_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Owner $UNIQUE\",\"email\":\"owner$UNIQUE@test.com\",\"password\":\"dev123\"}")
OWNER_TOKEN=$(echo $OWNER_RES | jq -r .token)

ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"dev123"}' | jq -r .token)
DRIVER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"driver@test.com","password":"dev123"}' | jq -r .token)

# 2. Owner submits restaurant application.
REST_RES=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" -d "{\"name\":\"$REST_NAME\",\"cuisine\":\"American\",\"location\":\"Westside\",\"address\":\"789 Test St\",\"rating\":4.0,\"city\":\"Testville\",\"area\":\"Test Area\",\"latitude\":0,\"longitude\":0,\"openingHours\":\"9-5\",\"deliveryRadius\":5,\"coverImageUrl\":\"\"}")
REST_ID=$(echo $REST_RES | jq -r .id)
REST_STATUS_OWNER=$(echo $REST_RES | jq -r .status)

# 3. Admin sees the same restaurant ID in pending applications.
ADMIN_PENDING=$(curl -s -X GET $BASE_URL/api/operator/restaurants/pending -H "Authorization: Bearer $ADMIN_TOKEN")
REST_STATUS_ADMIN=$(echo $ADMIN_PENDING | jq -r ".[] | select(.id==$REST_ID) | .status")

# 4. Admin approves it.
APP_RES=$(curl -s -X POST $BASE_URL/api/operator/restaurants/$REST_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN")
PARTNER_USER=$(echo $APP_RES | jq -r .username)
PARTNER_PASS=$(echo $APP_RES | jq -r .temporaryPassword)

# 5. Owner sees APPROVED.
# 6. Restaurant name remains unchanged.
OWNER_APPS=$(curl -s -X GET $BASE_URL/api/restaurants/my-applications -H "Authorization: Bearer $OWNER_TOKEN")
REST_STATUS_APPROVED=$(echo $OWNER_APPS | jq -r ".[] | select(.id==$REST_ID) | .status")
REST_NAME_VERIFIED=$(echo $OWNER_APPS | jq -r ".[] | select(.id==$REST_ID) | .name")

PARTNER_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$PARTNER_USER\",\"password\":\"$PARTNER_PASS\"}" | jq -r .token)
MENU_RES=$(curl -s -X POST $BASE_URL/api/restaurants/$REST_ID/menu -H "Content-Type: application/json" -H "Authorization: Bearer $PARTNER_TOKEN" -d '{"name":"Burger","description":"Juicy","price":12.99,"available":true}')
MENU_ID=$(echo $MENU_RES | jq -r .id)

# 7. Customer sees that restaurant and its menu.
CUST_MENU=$(curl -s -X GET $BASE_URL/api/restaurants/$REST_ID/menu)

# 8. Customer creates an order.
CUST_ID=$(python3 -c "import jwt; print(jwt.decode('$CUST_TOKEN', options={'verify_signature': False})['customerId'])")
CART_RES=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID, \"restaurantId\":$REST_ID}")
CART_ID=$(echo $CART_RES | jq -r .id)
curl -s -X POST $BASE_URL/api/carts/$CART_ID/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID, \"quantity\":1}" > /dev/null
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)

# Payment Bypass to CONFIRM
PAY_INIT=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN")
RZP_ORDER_ID=$(echo $PAY_INIT | jq -r .razorpayOrderId)
curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RZP_ORDER_ID\", \"razorpayPaymentId\":\"dev_success\", \"razorpaySignature\":\"dev_signature\"}" > /dev/null

# 9. Restaurant sees the same order ID.
REST_ORDER=$(curl -s -X GET $BASE_URL/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $PARTNER_TOKEN" | jq -c '.[0] | {id, status}')

# 10. Driver sees the same delivery ID and order ID.
DELIVERY_ID=$(curl -s -X GET $BASE_URL/api/deliveries/available -H "Authorization: Bearer $DRIVER_TOKEN" | jq -r '.[0].id')
curl -s -X POST $BASE_URL/api/deliveries/$DELIVERY_ID/assign -H "Authorization: Bearer $DRIVER_TOKEN" > /dev/null

# 11. Driver updates delivery status.
curl -s -X PATCH $BASE_URL/api/deliveries/$DELIVERY_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" -d '{"status":"PICKED_UP"}' > /dev/null

# 12. Customer sees the update.
# 13. Restaurant sees the update. (Same DB)
# 14. Admin sees the update. (Stats check)
CUST_CHECK=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN" | jq -c '{id, status}')
DRIVER_CHECK=$(curl -s -X GET $BASE_URL/api/deliveries/driver/me -H "Authorization: Bearer $DRIVER_TOKEN" | jq -c '.[0] | {id, status, orderId}')
ADMIN_STATS=$(curl -s -X GET $BASE_URL/api/admin/stats -H "Authorization: Bearer $ADMIN_TOKEN" | jq -c .)

echo "--- RESULTS ---"
echo "Restaurant ID: $REST_ID"
echo "Order ID: $ORDER_ID"
echo "Delivery ID: $DELIVERY_ID"
echo "Status initially: $REST_STATUS_OWNER"
echo "Status for admin: $REST_STATUS_ADMIN"
echo "Status approved: $REST_STATUS_APPROVED"
echo "Name unchanged: $REST_NAME_VERIFIED"
echo "Customer Order View: $CUST_CHECK"
echo "Restaurant Order View: $REST_ORDER"
echo "Driver Delivery View: $DRIVER_CHECK"
echo "Admin Stats View: $ADMIN_STATS"

