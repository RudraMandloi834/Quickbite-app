#!/bin/bash
BASE_URL="http://localhost:8080"
echo "=== Phase 5 Tests ==="

R=$RANDOM

# Users
CUST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Cust\",\"email\":\"cust_$R@test.com\",\"password\":\"dev123\",\"role\":\"CUSTOMER\"}")
CUST_TOKEN=$(echo $CUST_RES | jq -r .token)
CUST_ID=$(python3 -c "import jwt; print(jwt.decode('$CUST_TOKEN', options={'verify_signature': False})['customerId'])")

REST_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Rest\",\"email\":\"rest_$R@test.com\",\"password\":\"dev123\",\"role\":\"RESTAURANT_PARTNER\"}")
REST_TOKEN=$(echo $REST_RES | jq -r .token)

DRIV1_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Driv1\",\"email\":\"driv1_$R@test.com\",\"password\":\"dev123\",\"role\":\"DRIVER\"}")
DRIV1_TOKEN=$(echo $DRIV1_RES | jq -r .token)

DRIV2_RES=$(curl -s -X POST $BASE_URL/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Driv2\",\"email\":\"driv2_$R@test.com\",\"password\":\"dev123\",\"role\":\"DRIVER\"}")
DRIV2_TOKEN=$(echo $DRIV2_RES | jq -r .token)

ADMIN_RES=$(curl -s -X POST $BASE_URL/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"dev123\"}")
ADMIN_TOKEN=$(echo $ADMIN_RES | jq -r .token)

# Restaurant & Cart setup
REST_APP=$(curl -s -X POST $BASE_URL/api/restaurants/apply -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Rest $R\",\"cuisine\":\"C\",\"location\":\"L\",\"rating\":5.0}")
REST_ENT_ID=$(echo $REST_APP | jq -r .id)
curl -s -X POST $BASE_URL/api/operator/restaurants/$REST_ENT_ID/approve -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

MENU_RES=$(curl -s -X POST $BASE_URL/api/restaurants/$REST_ENT_ID/menu -H "Content-Type: application/json" -H "Authorization: Bearer $REST_TOKEN" -d "{\"name\":\"Food\",\"description\":\"D\",\"price\":10.0,\"available\":true}")
MENU_ID=$(echo $MENU_RES | jq -r .id)

CART_RES=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID,\"restaurantId\":$REST_ENT_ID}")
CART_ID=$(echo $CART_RES | jq -r .id)
curl -s -X POST $BASE_URL/api/carts/$CART_ID/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID,\"quantity\":1}" > /dev/null

# 1. Unpaid order cannot become confirmed. (It skips straight from CREATED to PAYMENT_PENDING when hitting /from-cart, wait. But we can try to mark it CONFIRMED as admin or something, or it's blocked by state machine).
ORDER_RES=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID=$(echo $ORDER_RES | jq -r .id)

PAY_INIT=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
RAZORPAY_ORDER_ID=$(echo $PAY_INIT | jq -r .razorpayOrderId)

# Failed payment
curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RAZORPAY_ORDER_ID\",\"razorpayPaymentId\":\"dev_pay\",\"razorpaySignature\":\"wrong\"}" > /dev/null
ORDER_RES_FAIL=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
echo "Order status after bad verification: $(echo $ORDER_RES_FAIL | jq -r .status) (Expected: PAYMENT_PENDING)"

# Wait, the prompt says "Failed payment does not create delivery". We fail the payment properly using /fail
PAY_ID=$(echo $PAY_INIT | jq -r .paymentId)
curl -s -X POST $BASE_URL/api/payments/$PAY_ID/fail -H "Authorization: Bearer $CUST_TOKEN" > /dev/null
ORDER_RES_FAIL2=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
echo "Order status after fail: $(echo $ORDER_RES_FAIL2 | jq -r .status) (Expected: PAYMENT_FAILED)"

# Delivery check for failed payment
DELIV_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/deliveries/order/$ORDER_ID -H "Authorization: Bearer $CUST_TOKEN")
echo "Delivery for failed payment -> $DELIV_EXISTS (Expected: 404)"


# Recreate cart & order
CART_RES2=$(curl -s -X POST $BASE_URL/api/carts -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"customerId\":$CUST_ID,\"restaurantId\":$REST_ENT_ID}")
CART_ID2=$(echo $CART_RES2 | jq -r .id)
curl -s -X POST $BASE_URL/api/carts/$CART_ID2/items -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"menuItemId\":$MENU_ID,\"quantity\":1}" > /dev/null
ORDER_RES2=$(curl -s -X POST $BASE_URL/api/orders/from-cart/$CART_ID2 -H "Authorization: Bearer $CUST_TOKEN")
ORDER_ID2=$(echo $ORDER_RES2 | jq -r .id)
PAY_INIT2=$(curl -s -X POST $BASE_URL/api/payments/orders/$ORDER_ID2 -H "Authorization: Bearer $CUST_TOKEN")
RAZORPAY_ORDER_ID2=$(echo $PAY_INIT2 | jq -r .razorpayOrderId)

# 2. Successful payment creates one confirmed order
curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RAZORPAY_ORDER_ID2\",\"razorpayPaymentId\":\"dev_pay\",\"razorpaySignature\":\"dev_signature\"}" > /dev/null
ORDER_RES_SUCC=$(curl -s -X GET $BASE_URL/api/orders/$ORDER_ID2 -H "Authorization: Bearer $CUST_TOKEN")
echo "Order status after success: $(echo $ORDER_RES_SUCC | jq -r .status) (Expected: CONFIRMED)"

# 3. Repeated payment callback does not duplicate order/delivery
DUP_PAY_RES=$(curl -s -X POST $BASE_URL/api/payments/verify -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" -d "{\"razorpayOrderId\":\"$RAZORPAY_ORDER_ID2\",\"razorpayPaymentId\":\"dev_pay\",\"razorpaySignature\":\"dev_signature\"}")
DUP_PAY_STATUS=$(echo $DUP_PAY_RES | jq -r .status)
echo "Duplicate payment verification result: $DUP_PAY_STATUS (Expected: SUCCESS)"

# Delivery created once
DELIV_RES=$(curl -s -X GET $BASE_URL/api/deliveries/order/$ORDER_ID2 -H "Authorization: Bearer $CUST_TOKEN")
DELIV_ID=$(echo $DELIV_RES | jq -r .id)
echo "Delivery created with ID: $DELIV_ID"
echo "Delivery status: $(echo $DELIV_RES | jq -r .status) (Expected: AVAILABLE)"

# 4. Two drivers cannot atomically accept (simulate with concurrent requests)
# We can't perfectly guarantee race in bash, but we can fire them in background
echo "Simulating concurrent driver acceptance..."
curl -s -o /tmp/driv1_res.txt -w "%{http_code}" -X POST $BASE_URL/api/deliveries/$DELIV_ID/assign -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV1_TOKEN" &
curl -s -o /tmp/driv2_res.txt -w "%{http_code}" -X POST $BASE_URL/api/deliveries/$DELIV_ID/assign -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV2_TOKEN" &
wait

echo "Driver 1 result: $(cat /tmp/driv1_res.txt)"
echo "Driver 2 result: $(cat /tmp/driv2_res.txt)"

# 5. Driver cannot accept the same delivery twice
DUP_ASSIGN=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/deliveries/$DELIV_ID/assign -H "Content-Type: application/json" -H "Authorization: Bearer $DRIV1_TOKEN")
echo "Duplicate driver assignment -> $DUP_ASSIGN (Expected: 409)"
