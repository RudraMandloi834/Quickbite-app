REST_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Rest\",\"email\":\"rest_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
REST_TOKEN=$(echo $REST_RES | jq -r .token)
curl -s -v -X POST http://localhost:8080/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Rest 4\",\"cuisine\":\"C\",\"location\":\"L\",\"rating\":5.0}"
