#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' | jq -r .token)

# Place order
ORDER_JSON=$(curl -s -X POST "http://localhost:8080/api/orders/from-cart/2" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"deliveryAddress":"123 Test St", "paymentMethod":"CARD"}')
echo $ORDER_JSON | jq '.'

ORDER_ID=$(echo $ORDER_JSON | jq -r '.id')
echo "Order ID: $ORDER_ID"

# Track order
curl -s "http://localhost:8080/api/orders/$ORDER_ID" -H "Authorization: Bearer $TOKEN" | jq '.status'

