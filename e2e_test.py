import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        contexts = {}
        pages = {}
        for role in ["admin", "owner", "customer", "driver"]:
            contexts[role] = await browser.new_context()
            pages[role] = await contexts[role].new_page()

        print("Browser sessions initialized.")

        # 1. Admin login
        await pages["admin"].goto("http://localhost:3000/login")
        await pages["admin"].fill('input[type="email"]', "admin@test.com")
        await pages["admin"].fill('input[type="password"]', "dev123")
        await pages["admin"].click('button:has-text("Sign In")')
        await pages["admin"].wait_for_url("**/admin/dashboard")
        print("1. Admin logged in.")

        # Create user accounts via API directly to save time, then login
        # ... Wait, Playwright is more robust if I just login!

        # Let's create users via API first using requests to ensure they exist cleanly.
        # Driver
        import requests
        requests.post("http://localhost:8080/api/auth/signup", json={"name": "Driver 8", "email": "driver8@test.com", "password": "dev123", "role": "DRIVER"})
        # Owner
        requests.post("http://localhost:8080/api/auth/signup", json={"name": "Owner 8", "email": "owner8@test.com", "password": "dev123", "role": "RESTAURANT_PARTNER"})
        # Customer
        requests.post("http://localhost:8080/api/auth/signup", json={"name": "Customer 8", "email": "customer8@test.com", "password": "dev123", "role": "CUSTOMER"})
        
        # Login everyone
        async def login(role, email):
            await pages[role].goto("http://localhost:3000/login")
            await pages[role].fill('input[type="email"]', email)
            await pages[role].fill('input[type="password"]', "dev123")
            await pages[role].click('button:has-text("Sign In")')
            await pages[role].wait_for_timeout(2000)

        await login("driver", "driver8@test.com")
        await login("owner", "owner8@test.com")
        await login("customer", "customer8@test.com")
        
        # Create restaurant application
        await pages["owner"].goto("http://localhost:3000/restaurant/register")
        await pages["owner"].fill('input[name="name"]', "Test Rest 8")
        await pages["owner"].fill('input[name="cuisine"]', "Italian")
        await pages["owner"].fill('input[name="address"]', "123 Test St")
        await pages["owner"].fill('input[name="city"]', "Test City")
        await pages["owner"].fill('input[name="contactPhone"]', "1234567890")
        await pages["owner"].click('button:has-text("Submit Application")')
        await pages["owner"].wait_for_timeout(2000)
        print("2. Owner applied for restaurant.")

        # Admin approves
        await pages["admin"].goto("http://localhost:3000/operator/restaurants")
        await pages["admin"].wait_for_timeout(2000)
        # Click the first approve button
        await pages["admin"].click('button:has-text("Approve")')
        await pages["admin"].wait_for_selector('text=Restaurant Approved Successfully!')
        print("3. Admin approved restaurant.")
        
        # Owner adds a menu item
        await pages["owner"].goto("http://localhost:3000/restaurant/dashboard")
        await pages["owner"].wait_for_timeout(2000)
        # ... Oh wait, I can just seed the menu using API to avoid finding the exact React inputs.
        
        # Let's seed menu using Owner's token
        owner_token = await pages["owner"].evaluate("localStorage.getItem('token')")
        rest_res = requests.get("http://localhost:8080/api/restaurants", headers={"Authorization": f"Bearer {owner_token}"})
        rest_id = [r for r in rest_res.json() if r['name'] == 'Test Rest 8'][0]['id']
        requests.post(f"http://localhost:8080/api/restaurants/{rest_id}/menu", headers={"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}, json={"name": "Pasta 8", "description": "Good", "price": 12.5, "available": True})
        
        # Customer orders
        await pages["customer"].goto(f"http://localhost:3000/restaurants/{rest_id}")
        await pages["customer"].wait_for_timeout(2000)
        await pages["customer"].click('button:has-text("Add to Cart")')
        await pages["customer"].wait_for_timeout(1000)
        await pages["customer"].goto("http://localhost:3000/cart")
        await pages["customer"].wait_for_timeout(2000)
        await pages["customer"].click('button:has-text("Proceed to Checkout")')
        await pages["customer"].wait_for_timeout(2000)
        
        # We need to click place order
        await pages["customer"].click('button:has-text("Place Order")')
        await pages["customer"].wait_for_url("**/orders/*")
        print("4. Customer placed order.")
        
        # Monitor SSE on Customer page by hooking into page network
        
        await browser.close()

asyncio.run(run())
