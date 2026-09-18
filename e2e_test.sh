#!/bin/bash
set -e

UNIQUE=$RANDOM
echo "1. Registering new owner..."
OWNER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Owner Bob\",\"email\":\"bob$UNIQUE@test.com\",\"password\":\"dev123\"}" | jq -r .token)

echo "2. Owner creates restaurant application..."
REST_RES=$(curl -s -X POST http://localhost:8080/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $OWNER_TOKEN" -d "{\"name\":\"Bob Burgers $UNIQUE\",\"cuisine\":\"American\",\"location\":\"Westside\",\"address\":\"789 Bob St\",\"rating\":4.0,\"city\":\"Bobville\",\"area\":\"Bob Area\",\"latitude\":0,\"longitude\":0,\"openingHours\":\"9-5\",\"deliveryRadius\":5,\"coverImageUrl\":\"\"}")
REST_ID=$(echo $REST_RES | jq -r .id)
echo "Created Restaurant ID: $REST_ID"

echo "3 & 4. Owner checks their applications..."
curl -s -X GET http://localhost:8080/api/restaurants/my-applications -H "Authorization: Bearer $OWNER_TOKEN" | jq .

echo "5. Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"dev123"}' | jq -r .token)

echo "6. Admin views pending applications..."
curl -s -X GET http://localhost:8080/api/operator/restaurants/pending -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "7. Admin approves restaurant $REST_ID..."
APP_RES=$(curl -s -X POST http://localhost:8080/api/operator/restaurants/$REST_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN")
PARTNER_USER=$(echo $APP_RES | jq -r .username)
PARTNER_PASS=$(echo $APP_RES | jq -r .temporaryPassword)

echo "8 & 9. Admin checks pending again..."
curl -s -X GET http://localhost:8080/api/operator/restaurants/pending -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "10. Logging in as restaurant partner ($PARTNER_USER) to add menu item..."
PARTNER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$PARTNER_USER\",\"password\":\"$PARTNER_PASS\"}" | jq -r .token)

MENU_RES=$(curl -s -X POST http://localhost:8080/api/restaurants/$REST_ID/menu -H "Content-Type: application/json" -H "Authorization: Bearer $PARTNER_TOKEN" -d '{"name":"Classic Burger","description":"Juicy","price":12.99,"available":true}')
MENU_ID=$(echo $MENU_RES | jq -r .id)
echo "Menu Item ID: $MENU_ID"

echo "12. Customer placing order..."
CUST_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust\",\"email\":\"cust$UNIQUE@test.com\",\"password\":\"dev123\"}" | jq -r .token)

# Add to cart
curl -s -X POST http://localhost:8080/api/cart/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"restaurantId\":$REST_ID, \"menuItemId\":$MENU_ID, \"quantity\":1}" > /dev/null
# Checkout
ORDER_RES=$(curl -s -X POST http://localhost:8080/api/orders -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"restaurantId\":$REST_ID}")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)
echo "Order ID: $ORDER_ID"

echo "14. Restaurant sees order..."
curl -s -X GET http://localhost:8080/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $PARTNER_TOKEN" | jq .

echo "15. Driver logs in and views available deliveries..."
DRIVER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"driver@test.com","password":"dev123"}' | jq -r .token)
curl -s -X GET http://localhost:8080/api/deliveries/available -H "Authorization: Bearer $DRIVER_TOKEN" | jq .

echo "16. Driver assigns order to themselves..."
DELIVERY_ID=$(curl -s -X GET http://localhost:8080/api/deliveries/order/$ORDER_ID -H "Authorization: Bearer $DRIVER_TOKEN" | jq -r .id)
echo "Delivery ID: $DELIVERY_ID"
curl -s -X POST http://localhost:8080/api/deliveries/$DELIVERY_ID/assign -H "Authorization: Bearer $DRIVER_TOKEN" > /dev/null

echo "17. Driver updates status to PICKED_UP..."
curl -s -X PATCH http://localhost:8080/api/deliveries/$DELIVERY_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIVER_TOKEN" -d '{"status":"PICKED_UP"}' > /dev/null

echo "18. Customer checks delivery..."
curl -s -X GET http://localhost:8080/api/deliveries/order/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN" | jq .

