async function run() {
  let res = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer_stomp3@test.com", password: "password" })
  });
  const customerToken = (await res.json()).token;
  res = await fetch("http://localhost:8080/api/carts?restaurantId=9980", {
    method: "POST", headers: { "Authorization": "Bearer " + customerToken }
  });
  console.log(await res.text());
}
run();
