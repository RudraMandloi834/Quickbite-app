#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
sleep 25
echo "Testing base restaurants endpoint:"
curl -s "http://localhost:8080/api/restaurants?page=0&size=16&sort=rating,desc" > page0.json
cat page0.json | jq '{totalElements: .totalElements, size: (.content | length), firstItem: .content[0].name}'

echo "Testing nearby endpoint:"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=28.6139&longitude=77.2090&radiusKm=20&page=0&size=16" > nearby.json
cat nearby.json | jq '{totalElements: .totalElements, size: (.content | length), firstItem: .content[0].name}'

echo "Testing getById endpoint:"
cat page0.json | jq -r '.content[0].id' > id.txt
ID=$(cat id.txt)
curl -s "http://localhost:8080/api/restaurants/$ID" | jq '{id: .id, name: .name}'

kill -9 $PID
