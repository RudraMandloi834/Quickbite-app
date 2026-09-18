#!/bin/bash
BASE_URL="http://localhost:8080"
echo "=== Phase 3 Tests ==="

# 1. Setup Admin
ADMIN_RES=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"dev123\"}")
ADMIN_TOKEN=$(echo $ADMIN_RES | jq -r .token)

# 2. Setup Owner 1
O1_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"O1\",\"email\":\"o1_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
O1_TOKEN=$(echo $O1_RES | jq -r .token)
O1_ID=$(python3 -c "import jwt; print(jwt.decode('$O1_TOKEN', options={'verify_signature': False})['customerId'])")

# 3. Setup Owner 2
O2_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"O2\",\"email\":\"o2_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
O2_TOKEN=$(echo $O2_RES | jq -r .token)
O2_ID=$(python3 -c "import jwt; print(jwt.decode('$O2_TOKEN', options={'verify_signature': False})['customerId'])")

# --- FLOW A ---
echo -e "\n--- FLOW A ---"
# O1 Creates Application
REST_RES=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $O1_TOKEN" -d "{\"name\":\"O1 Cafe\",\"cuisine\":\"Cafe\",\"location\":\"Loc\",\"rating\":5.0}")
REST_ID=$(echo $REST_RES | jq -r .id)
REST_NAME=$(echo $REST_RES | jq -r .name)
echo "Owner 1 created application: ID=$REST_ID, Name=$REST_NAME"

# Admin sees it in pending queue
PENDING_RES=$(curl -s -X GET $BASE_URL/api/operator/restaurants/pending -H "Authorization: Bearer $ADMIN_TOKEN")
PENDING_ID=$(echo $PENDING_RES | jq -r ".[0].id")
echo "Admin sees pending restaurant ID: $PENDING_ID"

# Admin approves
APP_RES=$(curl -s -X POST $BASE_URL/api/operator/restaurants/$REST_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN")
APP_ID=$(echo $APP_RES | jq -r ".restaurant.id")
APP_NAME=$(echo $APP_RES | jq -r ".restaurant.name")
echo "Admin approved restaurant. Resulting ID=$APP_ID, Name=$APP_NAME"

# Check if ID and name preserved
if [ "$REST_ID" == "$APP_ID" ] && [ "$REST_NAME" == "$APP_NAME" ]; then
    echo "SUCCESS: Admin approval preserves same restaurant ID and name."
else
    echo "FAIL: ID or name changed!"
fi

# --- FLOW B ---
echo -e "\n--- FLOW B ---"
# O1 generates invite code for REST_ID
INVITE_RES=$(curl -s -X POST $BASE_URL/api/restaurants/$REST_ID/invitations -H "Authorization: Bearer $O1_TOKEN")
INVITE_CODE=$(echo $INVITE_RES | jq -r .code)
echo "Owner 1 generated invite code: $INVITE_CODE"

# O2 uses invite code to join
JOIN_RES=$(curl -s -X POST $BASE_URL/api/restaurants/join-with-code -H "Content-Type: application/json" -H "Authorization: Bearer $O2_TOKEN" -d "{\"code\":\"$INVITE_CODE\"}")
REQ_ID=$(echo $JOIN_RES | jq -r .id)
echo "Owner 2 joined with code. Request ID=$REQ_ID"

# Test Unauthorized Owner (O2 before approval)
HTTP_403=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $O2_TOKEN")
echo "Unauthorized owner getting orders -> $HTTP_403 (Expected: 403)"

# O1 approves the join request
APP_JOIN=$(curl -s -X POST $BASE_URL/api/restaurants/join-requests/$REQ_ID/approve -H "Authorization: Bearer $O1_TOKEN")
JOIN_STATUS=$(echo $APP_JOIN | jq -r .status)
echo "Owner 1 approved join request. Status: $JOIN_STATUS"

# Test Authorized Owner (O2 after approval)
HTTP_200=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $O2_TOKEN")
echo "Authorized owner getting orders -> $HTTP_200 (Expected: 200)"

# Test Rejected Owner
# Setup Owner 3
O3_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"O3\",\"email\":\"o3_$RANDOM@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
O3_TOKEN=$(echo $O3_RES | jq -r .token)
O3_ID=$(python3 -c "import jwt; print(jwt.decode('$O3_TOKEN', options={'verify_signature': False})['customerId'])")

JOIN3_RES=$(curl -s -X POST $BASE_URL/api/restaurants/join-with-code -H "Content-Type: application/json" -H "Authorization: Bearer $O3_TOKEN" -d "{\"code\":\"$INVITE_CODE\"}")
REQ3_ID=$(echo $JOIN3_RES | jq -r .id)
curl -s -X POST $BASE_URL/api/restaurants/join-requests/$REQ3_ID/reject -H "Authorization: Bearer $O1_TOKEN" > /dev/null
echo "Owner 1 rejected Owner 3."

HTTP_403_REJ=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/restaurants/$REST_ID/orders -H "Authorization: Bearer $O3_TOKEN")
echo "Rejected owner getting orders -> $HTTP_403_REJ (Expected: 403)"

