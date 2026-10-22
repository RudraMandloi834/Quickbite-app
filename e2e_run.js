const assert = require('assert');

const API_BASE = "http://localhost:8080";
const PW = "Password123!";

async function run() {
    console.log("=== PHASE 10 E2E TEST ===");

    const ts = Date.now();
    const custEmail = `cust${ts}@test.com`;
    const restEmail = `rest${ts}@test.com`;
    const driverEmail = `driver${ts}@test.com`;

    async function registerUser(email, role, name) {
        let res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: "9999999999", password: PW, role })
        });
        const data = await res.json();
        return data.token;
    }

    async function login(email) {
        let res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: PW })
        });
        const data = await res.json();
        return data.token;
    }

    // Create actors
    console.log("0. Creating Actors");
    const custToken = await registerUser(custEmail, "ROLE_CUSTOMER", "E2E Cust");
    const restToken = await registerUser(restEmail, "ROLE_CUSTOMER", "E2E RestOwner");
    // Wait, driver register expects ROLE_DRIVER or ROLE_CUSTOMER? Let's just create a generic user and we might need an admin to change role, or register allows it?
    // Let's assume register allows ROLE_DRIVER, if not we will just use it.
    let driverToken;
    try {
         driverToken = await registerUser(driverEmail, "ROLE_DRIVER", "E2E Driver");
    } catch(e) {}

    // Wait, if driverToken fails, maybe we can just query the database for an existing driver? 
    // Or we can register a customer and not worry about driver role if it's not strictly enforced, but it IS strictly enforced in Phase 6/7.
    // Let's just grab existing users from the DB if needed.

    // 1. Create Restaurant
    console.log("1. Creating Restaurant");
    let res = await fetch(`${API_BASE}/api/restaurants`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${restToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "E2E Restaurant", cuisine: "Pizza", city: "Bengaluru", locality: "Indiranagar",
            address: "123 Street", latitude: 0, longitude: 0, openingTime: "10 AM", closingTime: "10 PM",
            ownerEmail: restEmail, ownerName: "E2E RestOwner", ownerPhone: "9999999999"
        })
    });
    // Wait, the API might be different, let's just use a script to directly query DB or use existing data.
}

run().catch(console.error);
