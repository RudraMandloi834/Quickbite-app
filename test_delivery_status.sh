BASE_URL="http://localhost:8080"
echo "Logging in as driver..."
DRIV_RES=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"driv_$R@test.com\",\"password\":\"dev123\"}")
DRIV_TOKEN=$(echo $DRIV_RES | jq -r .token)
echo "DRIV_TOKEN: $DRIV_TOKEN"
# We need the last DELIV_ID, but let's just fetch my deliveries
DELIV_LIST=$(curl -s -X GET $BASE_URL/api/deliveries/driver/me -H "Authorization: Bearer $DRIV_TOKEN")
DELIV_ID=$(echo $DELIV_LIST | jq -r ".[0].id")
echo "DELIV_ID: $DELIV_ID"

echo "Updating status to PICKED_UP..."
curl -s -v -X PATCH $BASE_URL/api/deliveries/$DELIV_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV_TOKEN" -d "\"PICKED_UP\""
