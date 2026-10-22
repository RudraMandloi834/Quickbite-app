#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
echo "Waiting 35s for startup..."
sleep 35

echo "1. Fetching restaurants page 0"
curl -s "http://localhost:8080/api/restaurants?page=0&size=16" > page0.json
cat page0.json | jq '{number: .number, elements: (.content | length), firstItemImage: .content[0].coverImageUrl}'

echo "2. Fetching restaurants page 1"
curl -s "http://localhost:8080/api/restaurants?page=1&size=16" > page1.json
cat page1.json | jq '{number: .number, elements: (.content | length), firstItemImage: .content[0].coverImageUrl}'

echo "3. Fetching menu for restaurant 1"
curl -s "http://localhost:8080/api/restaurants/1/menu" > menu.json
cat menu.json | jq '.[0] | {id: .id, name: .name, imageUrl: .imageUrl}'

echo "Killing server..."
kill -9 $PID
