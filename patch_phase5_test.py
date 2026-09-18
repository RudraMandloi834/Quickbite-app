import re

file_path = "run_phase5_tests2.sh"
with open(file_path, "r") as f:
    content = f.read()

# Add the missing restaurant transitions
missing_transitions = """
echo "Restaurant accepting and preparing order..."
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID2/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\\"status\\":\\"RESTAURANT_ACCEPTED\\"}" > /dev/null
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID2/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\\"status\\":\\"PREPARING\\"}" > /dev/null
curl -s -X PATCH $BASE_URL/api/restaurants/$REST_ENT_ID/orders/$ORDER_ID2/status -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\\"status\\":\\"READY_FOR_PICKUP\\"}" > /dev/null
"""
content = content.replace("DELIV_RES=$(curl -s -X GET $BASE_URL/api/deliveries/order/$ORDER_ID2 -H \"Authorization: Bearer $CUST_TOKEN\")", missing_transitions + "\nDELIV_RES=$(curl -s -X GET $BASE_URL/api/deliveries/order/$ORDER_ID2 -H \"Authorization: Bearer $CUST_TOKEN\")")

with open(file_path, "w") as f:
    f.write(content)
