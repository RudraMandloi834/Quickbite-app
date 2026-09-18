source run_phase5_tests2.sh > /dev/null
echo "=== Database Evidence ==="
curl -s -X GET http://localhost:8080/api/deliveries/driver/me -H "Authorization: Bearer $DRIV1_TOKEN" | jq .
curl -s -X GET http://localhost:8080/api/deliveries/driver/me -H "Authorization: Bearer $DRIV2_TOKEN" | jq .
