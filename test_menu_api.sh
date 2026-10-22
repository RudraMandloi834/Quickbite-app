#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
sleep 25

# Get the ID of the first restaurant
curl -s "http://localhost:8080/api/restaurants?page=0&size=1" > page0.json
ID=$(cat page0.json | jq -r '.content[0].id')

echo "Testing /api/restaurants/$ID/menu"
curl -s "http://localhost:8080/api/restaurants/$ID/menu" > menu.json
cat menu.json | jq '. | length'

kill -9 $PID
