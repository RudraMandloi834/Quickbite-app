CUST_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust\",\"email\":\"cust_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"CUSTOMER\"}")
CUST_TOKEN=$(echo $CUST_RES | jq -r .token)
CUST_ID=$(python3 -c "import jwt; print(jwt.decode('$CUST_TOKEN', options={'verify_signature': False})['customerId'])")

REST_RES=$(curl -s -X POST http://localhost:8080/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Rest\",\"email\":\"rest_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
REST_TOKEN=$(echo $REST_RES | jq -r .token)
REST_APP=$(curl -s -X POST http://localhost:8080/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Rest 4\",\"cuisine\":\"C\",\"location\":\"L\",\"rating\":5.0}")
REST_ENT_ID=$(echo $REST_APP | jq -r .id)

echo "Cust Token: $CUST_TOKEN"
echo "Cust ID: $CUST_ID"
echo "Rest ID: $REST_ENT_ID"
curl -s -v -X POST http://localhost:8080/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID,\"restaurantId\":$REST_ENT_ID}"
