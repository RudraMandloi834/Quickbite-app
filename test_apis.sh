#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
echo "Waiting 30s for startup..."
sleep 30

echo "1. GET /api/restaurants?page=0&size=16"
curl -s "http://localhost:8080/api/restaurants?page=0&size=16" | jq '{totalElements: .totalElements, totalPages: .totalPages, number: .number, size: .size, elements: (.content | length)}'

echo "2. GET /api/restaurants?page=1&size=16"
curl -s "http://localhost:8080/api/restaurants?page=1&size=16" | jq '{number: .number, elements: (.content | length), firstItem: .content[0].name}'

echo "3. GET /api/restaurants?city=Delhi&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants?city=Delhi&page=0&size=16" | jq '{totalElements: .totalElements, elements: (.content | length), firstItemCity: .content[0].city}'

echo "4. GET /api/restaurants?cuisine=Indian&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants?cuisine=Indian&page=0&size=16" | jq '{totalElements: .totalElements, elements: (.content | length), firstItemCuisine: .content[0].cuisine}'

echo "5. GET /api/restaurants?search=biryani&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants?search=biryani&page=0&size=16" | jq '{totalElements: .totalElements, elements: (.content | length), firstItemCuisine: .content[0].cuisine}'

echo "Killing server..."
kill -9 $PID
