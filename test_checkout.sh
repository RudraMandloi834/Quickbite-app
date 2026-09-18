#!/bin/bash
set -e
UNIQUE=$RANDOM
BASE_URL="http://localhost:8080"
# Just reuse the existing REST_ID 10005, MENU_ID 50093, CUST_TOKEN
CUST_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust $UNIQUE\",\"email\":\"cust$UNIQUE@test.com\",\"password\":\"dev123\"}" | jq -r .token)
CART_RES=$(curl -s -X POST $BASE_URL/api/cart/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"restaurantId\":10005, \"menuItemId\":50093, \"quantity\":1}")
CART_ID=$(echo $CART_RES | jq -r .id)
echo "Cart ID: $CART_ID"
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN")
echo $ORDER_RES | jq .
