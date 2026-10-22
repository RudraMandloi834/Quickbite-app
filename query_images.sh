#!/bin/bash
RAZORPAY_KEY_ID=dummy RAZORPAY_KEY_SECRET=dummy QUICKBITE_DB_PASSWORD=dummy mvn spring-boot:run -Dspring-boot.run.profiles=dev > spring-boot.log 2>&1 &
PID=$!
sleep 25
echo "SELECT DISTINCT cover_image_url FROM restaurant;" > query.sql
# We don't have direct access to H2 console from command line without setting up a client.
# Let's just create a quick Test endpoint or use the count.
kill -9 $PID
