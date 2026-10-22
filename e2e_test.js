const assert = require('assert');

const API_BASE = "http://localhost:8080";
const PW = "dev123";

async function login(email, password = PW) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data.token;
}

async function run() {
    console.log("=== PHASE 10 E2E TEST ===");

    // 1. Login Admin to setup restaurant
    console.log("1. Admin Login & Setup");
    const adminToken = await login("admin@test.com");
    
    // Get pending applications
    let res = await fetch(`${API_BASE}/api/admin/restaurants/pending`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    let pendingRests = await res.json();
    
    let restOwnerToken;
    let restaurantId;
    
    if (pendingRests.length > 0) {
        let rest = pendingRests[0];
        console.log(`Approving restaurant: ${rest.name}`);
        await fetch(`${API_BASE}/api/admin/restaurants/${rest.id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        restaurantId = rest.id;
        restOwnerToken = await login(rest.ownerEmail);
    } else {
        // Assume already approved, try to get my applications as restaurant@test.com
        restOwnerToken = await login("restaurant@test.com");
        let r = await fetch(`${API_BASE}/api/restaurants/my-applications`, {
            headers: { 'Authorization': `Bearer ${restOwnerToken}` }
        });
        let myRests = await r.json();
        restaurantId = myRests.find(x => x.status === 'APPROVED').id;
    }
    
    console.log(`Restaurant ID: ${restaurantId}`);

    // Get menu items
    res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/menu`);
    let menuItems = await res.json();
    let itemId = menuItems[0].id;
    console.log(`Menu Item ID: ${itemId}`);

    // 2. Customer Flow
    console.log("\n2. Customer Ordering Flow");
    const customerToken = await login("customer@test.com");
    
    // Clear cart
    await fetch(`${API_BASE}/api/cart`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    
    // Add to cart
    res = await fetch(`${API_BASE}/api/cart/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, menuItemId: itemId, quantity: 2 })
    });
    assert.strictEqual(res.status, 200, "Failed to add to cart");

    // Checkout
    res = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    let checkoutData = await res.json();
    let orderId = checkoutData.orderId;
    console.log(`Order Placed. Order ID: ${orderId}`);

    // 3. Restaurant Flow
    console.log("\n3. Restaurant Lifecycle Flow");
    
    // Accept
    res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${restOwnerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "ACCEPTED" })
    });
    assert.strictEqual(res.status, 200, "Restaurant failed to ACCEPT");
    console.log("Restaurant ACCEPTED order");

    // Preparing
    res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${restOwnerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "PREPARING" })
    });
    assert.strictEqual(res.status, 200, "Restaurant failed to PREPARE");
    console.log("Restaurant PREPARING order");

    // Ready
    res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${restOwnerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "READY_FOR_PICKUP" })
    });
    assert.strictEqual(res.status, 200, "Restaurant failed to READY");
    console.log("Restaurant marked READY_FOR_PICKUP");

    // 4. Driver Flow
    console.log("\n4. Driver Delivery Flow");
    const driverToken = await login("driver@test.com");

    res = await fetch(`${API_BASE}/api/deliveries/available`, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    let deliveries = await res.json();
    let delivery = deliveries.find(d => d.orderId === orderId);
    assert(delivery, "Delivery not found in available list");
    let deliveryId = delivery.id;
    console.log(`Driver found available Delivery ID: ${deliveryId}`);

    // Driver Assign
    res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/assign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    assert.strictEqual(res.status, 200, "Driver failed to Assign");
    console.log("Driver ASSIGNED");

    // Check Customer Tracking
    res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    let orderTracking = await res.json();
    assert.strictEqual(orderTracking.status, "DRIVER_ASSIGNED", "Customer tracking not DRIVER_ASSIGNED");
    console.log("Verified Customer Tracking: DRIVER_ASSIGNED");

    // Driver Picked Up
    res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${driverToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "PICKED_UP" })
    });
    assert.strictEqual(res.status, 200, "Driver failed to PICK UP");
    console.log("Driver PICKED_UP");

    // Driver Out For Delivery
    res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${driverToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "OUT_FOR_DELIVERY" })
    });
    assert.strictEqual(res.status, 200, "Driver failed to OUT FOR DELIVERY");
    console.log("Driver OUT_FOR_DELIVERY");

    // Driver Delivered
    res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${driverToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "DELIVERED" })
    });
    assert.strictEqual(res.status, 200, "Driver failed to DELIVER");
    console.log("Driver DELIVERED");

    // Final Customer Check
    res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    orderTracking = await res.json();
    assert.strictEqual(orderTracking.status, "DELIVERED", "Customer tracking not DELIVERED");
    console.log("Verified Customer Tracking: DELIVERED");

    console.log("\n=== E2E TEST COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error);
