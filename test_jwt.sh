# Generate JWT
JWT=$(mvn -q exec:java -Dexec.mainClass="com.quickbite.GenerateTokenScript")
echo "Generated JWT: $JWT"
# POST to /api/payments/orders/24
curl -v -X POST "http://localhost:8080/api/payments/orders/24" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json"
