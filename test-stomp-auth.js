const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

async function run() {
  console.log("Logging in customer...");
  let res = await fetch("http://localhost:8080/api/auth/signup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer_stomp10@test.com", password: "password", name: "Cust", phone: "123", address: "abc", role: "CUSTOMER" })
  });

  res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer_stomp10@test.com", password: "password" })
  });
  const customerToken = (await res.json()).token;

  res = await fetch("http://localhost:8080/api/customers", {
    headers: { "Authorization": "Bearer " + customerToken }
  });
  const customers = await res.json();
  const customerId = customers.find(c => c.email === "customer_stomp10@test.com").id;

  res = await fetch("http://localhost:8080/api/restaurants");
  let restaurants = await res.json();
  if (restaurants.content) restaurants = restaurants.content;
  const restId = restaurants[0].id;

  res = await fetch(`http://localhost:8080/api/restaurants/${restId}/menu`);
  let menu = await res.json();
  const menuItemId = menu[0].id;

  res = await fetch(`http://localhost:8080/api/carts`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken },
    body: JSON.stringify({ customerId: customerId, restaurantId: restId })
  });
  let cart = await res.json();
  console.log("Cart created:", cart.id);

  res = await fetch(`http://localhost:8080/api/carts/${cart.id}/items`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken },
    body: JSON.stringify({ menuItemId: menuItemId, quantity: 1 })
  });
  cart = await res.json();

  res = await fetch(`http://localhost:8080/api/orders/from-cart/${cart.id}`, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken }
  });
  const order = await res.json();
  console.log("Order created:", order.id);

  res = await fetch("http://localhost:8080/api/payments/verify", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + customerToken },
    body: JSON.stringify({ orderId: order.id, paymentId: "pay_test123", signature: "sig_test123" })
  });
  
  res = await fetch(`http://localhost:8080/api/deliveries/order/${order.id}`, {
    headers: { "Authorization": "Bearer " + customerToken }
  });
  const delivery = await res.json();
  console.log("Delivery created:", delivery.id);

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

      setTimeout(async () => {
         console.log("Backend updating status directly to skip driver assign...");
         await fetch("http://localhost:8080/api/auth/signup", {
           method: "POST", headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ email: "driver_stomp10@test.com", password: "password", name: "Driver", phone: "456", address: "def", role: "DRIVER" })
         });
         let drvRes = await fetch("http://localhost:8080/api/auth/login", {
           method: "POST", headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ email: "driver_stomp10@test.com", password: "password" })
         });
         const driverToken = (await drvRes.json()).token;

         await fetch(`http://localhost:8080/api/deliveries/${delivery.id}/assign`, {
           method: "POST", headers: { "Authorization": "Bearer " + driverToken }
         });
         await fetch(`http://localhost:8080/api/deliveries/${delivery.id}/status`, {
           method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + driverToken },
           body: JSON.stringify({ status: "PICKED_UP" })
         });
         console.log("Driver updated status.");
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
