#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123"}' | jq -r .token)
echo "Got token"

curl -s -X POST "http://localhost:8080/api/carts/2/items" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"menuItemId":121, "quantity":2}'
echo "Added item"

curl -s http://localhost:8080/api/carts/2 -H "Authorization: Bearer $TOKEN" | jq '.'
