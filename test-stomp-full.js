const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

async function run() {
  console.log("Creating customer...");
  await fetch("http://localhost:8080/api/auth/signup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@test.com", password: "password", name: "Cust", phone: "123", address: "abc", role: "CUSTOMER" })
  });

  console.log("Logging in customer...");
  let res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@test.com", password: "password" })
  });
  const customerToken = (await res.json()).token;

  console.log("Creating driver...");
  await fetch("http://localhost:8080/api/auth/signup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "driver@test.com", password: "password", name: "Driver", phone: "456", address: "def", role: "DRIVER" })
  });
  res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "driver@test.com", password: "password" })
  });
  const driverToken = (await res.json()).token;

  console.log("Customer placing order...");
  // get a restaurant
  res = await fetch("http://localhost:8080/api/restaurants");
  const restaurants = await res.json();
  const restId = restaurants.content[0].id;
  // create order
  res = await fetch("http://localhost:8080/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken },
    body: JSON.stringify({ restaurantId: restId, items: [{ menuItemId: 1, quantity: 1, price: 10 }] })
  });
  const order = await res.json();
  console.log("Order created:", order.id);

  // verify payment to confirm order
  await fetch("http://localhost:8080/api/payments/verify", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken },
    body: JSON.stringify({ orderId: order.id, paymentId: "pay_test123", signature: "sig_test123" })
  });
  
  // get delivery
  res = await fetch(`http://localhost:8080/api/deliveries/order/${order.id}`, {
    headers: { "Authorization": "Bearer " + customerToken }
  });
  const delivery = await res.json();
  console.log("Delivery created:", delivery.id, delivery.status);

  console.log("Connecting STOMP...");
  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    connectHeaders: { Authorization: `Bearer ${customerToken}` },
    onConnect: () => {
      console.log("STOMP CONNECTED!");
      client.subscribe(`/topic/deliveries/${delivery.id}`, (message) => {
        console.log("STOMP RECEIVED MESSAGE:", message.body);
        process.exit(0);
      });
      console.log("STOMP Subscribed!");

      // Driver assigns
      setTimeout(async () => {
         console.log("Driver assigning...");
         await fetch(`http://localhost:8080/api/deliveries/${delivery.id}/assign`, {
           method: "POST", headers: { "Authorization": "Bearer " + driverToken }
         });
         console.log("Driver assigned.");
         // Driver updates status
         await fetch(`http://localhost:8080/api/deliveries/${delivery.id}/status`, {
           method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + driverToken },
           body: JSON.stringify({ status: "PICKED_UP" })
         });
         console.log("Driver status updated.");
      }, 1000);
    },
    onStompError: (err) => {
      console.error("STOMP ERROR", err);
      process.exit(1);
    }
  });
  client.activate();
}
run();
