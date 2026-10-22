#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
echo "Waiting 30s for startup..."
sleep 30

echo "1. Delhi: GET /api/restaurants/nearby?latitude=28.6139&longitude=77.2090&radiusKm=20&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=28.6139&longitude=77.2090&radiusKm=20&page=0&size=16" | jq '{totalElements: .totalElements, firstItemCity: .content[0].city, firstItemArea: .content[0].area, distanceKm: .content[0].distanceKm, secondDistanceKm: .content[1].distanceKm}'

echo "2. Mumbai: GET /api/restaurants/nearby?latitude=19.0760&longitude=72.8777&radiusKm=20&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=19.0760&longitude=72.8777&radiusKm=20&page=0&size=16" | jq '{totalElements: .totalElements, firstItemCity: .content[0].city, firstItemArea: .content[0].area, distanceKm: .content[0].distanceKm}'

echo "3. Bengaluru: GET /api/restaurants/nearby?latitude=12.9716&longitude=77.5946&radiusKm=20&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=12.9716&longitude=77.5946&radiusKm=20&page=0&size=16" | jq '{totalElements: .totalElements, firstItemCity: .content[0].city, firstItemArea: .content[0].area, distanceKm: .content[0].distanceKm}'

echo "4. Hyderabad: GET /api/restaurants/nearby?latitude=17.3850&longitude=78.4867&radiusKm=20&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=17.3850&longitude=78.4867&radiusKm=20&page=0&size=16" | jq '{totalElements: .totalElements, firstItemCity: .content[0].city, firstItemArea: .content[0].area, distanceKm: .content[0].distanceKm}'

echo "5. Pune: GET /api/restaurants/nearby?latitude=18.5204&longitude=73.8567&radiusKm=20&page=0&size=16"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=18.5204&longitude=73.8567&radiusKm=20&page=0&size=16" | jq '{totalElements: .totalElements, firstItemCity: .content[0].city, firstItemArea: .content[0].area, distanceKm: .content[0].distanceKm}'

echo "6. Invalid lat/long handling:"
curl -s "http://localhost:8080/api/restaurants/nearby?latitude=100&longitude=200&radiusKm=10" | jq '{status: .status, error: .error, path: .path}'

echo "Killing server..."
kill -9 $PID
