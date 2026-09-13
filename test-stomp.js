const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

async function test() {
  const loginRes = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer1@example.com", password: "password" })
  });
  const { token } = await loginRes.json();

  const driverLogin = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "driver1@example.com", password: "password" })
  });
  const { token: driverToken } = await driverLogin.json();

  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      console.log("Connected to STOMP!");
      client.subscribe(`/topic/deliveries/1`, (message) => {
        console.log("Received STOMP message:", message.body);
        process.exit(0);
      });
      
      // trigger patch
      fetch(`http://localhost:8080/api/driver/deliveries/1/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${driverToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ASSIGNED" })
      }).then(res => res.text()).then(t => console.log("Patch response:", t));
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame.headers['message']);
      process.exit(1);
    }
  });
  client.activate();
}
test();
