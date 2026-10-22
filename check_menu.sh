#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
sleep 25
curl -s "http://localhost:8080/api/restaurants/3002/menu" > menu.json
cat menu.json | jq '.[0] | {id: .id, name: .name, imageUrl: .imageUrl}'
kill -9 $PID
