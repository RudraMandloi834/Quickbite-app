# QuickBite REST API Reference

This document details the complete RESTful API contract for the QuickBite platform.

**Base URL:** `http://localhost:8080` (Development) / Configured Ingress Domain (Production)

---

## Table of Contents
1. [Authentication & Account Management](#1-authentication--account-management)
2. [Customer Profile & Orders](#2-customer-profile--orders)
3. [Restaurants & Spatial Discovery](#3-restaurants--spatial-discovery)
4. [Restaurant Menu Management](#4-restaurant-menu-management)
5. [Cart Operations](#5-cart-operations)
6. [Order Management & State Machine](#6-order-management--state-machine)
7. [Payment Processing & COD](#7-payment-processing--cod)
8. [Delivery & Dispatch Management](#8-delivery--dispatch-management)
9. [Real-Time Event Stream (SSE)](#9-real-time-event-stream-sse)
10. [Platform Operator & Administration](#10-platform-operator--administration)
11. [Health & Telemetry](#11-health--telemetry)

---

## 1. Authentication & Account Management

### Register Account
- **Endpoint:** `POST /api/auth/signup`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!",
    "phone": "+919876543210"
  }
  ```
- **Responses:**
  - `200 OK`: `{"token": "<jwt-token>"}`
  - `400 BAD REQUEST`: Validation error (blank fields, invalid email format)
  - `409 CONFLICT`: Account with this email already exists

### Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public (Rate-limited: 50 requests/min per IP)
- **Request Body:**
  ```json
  {
    "email": "customer@test.com",
    "password": "dev123"
  }
  ```
- **Responses:**
  - `200 OK`: `{"token": "<jwt-token>"}`
  - `401 UNAUTHORIZED`: Invalid email or password

---

## 2. Customer Profile & Orders

### Get Current Customer Profile
- **Endpoint:** `GET /api/customers/me`
- **Access:** Authenticated (`ROLE_CUSTOMER`, `ROLE_OPERATOR`, etc.)
- **Response:**
  ```json
  {
    "id": 1,
    "name": "Demo Customer",
    "email": "customer@test.com",
    "phone": "+919876543210",
    "role": "ROLE_CUSTOMER"
  }
  ```

### Update Password
- **Endpoint:** `POST /api/customers/me/password`
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "oldPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }
  ```
- **Response:** `200 OK`

### Get Customer Order History
- **Endpoint:** `GET /api/customers/me/orders`
- **Access:** Authenticated (`ROLE_CUSTOMER`)
- **Response:**
  ```json
  [
    {
      "id": 101,
      "customerId": 1,
      "restaurantId": 12,
      "totalAmount": 450.00,
      "status": "DELIVERED",
      "paymentMethod": "COD",
      "paymentStatus": "SUCCESS",
      "createdAt": "2026-10-25T14:30:00Z",
      "items": [
        {
          "id": 201,
          "menuItemId": 45,
          "menuItemName": "Paneer Butter Masala",
          "quantity": 2,
          "unitPrice": 225.00,
          "subtotal": 450.00
        }
      ]
    }
  ]
  ```

---

## 3. Restaurants & Spatial Discovery

### List Approved Restaurants (Paginated)
- **Endpoint:** `GET /api/restaurants`
- **Access:** Public
- **Query Parameters:**
  - `page` (default: 0): Page number
  - `size` (default: 16): Page size
  - `cuisine` (optional): Filter by cuisine name
  - `city` (optional): Filter by city
  - `search` (optional): Search restaurant names
  - `minRating` (optional): Minimum average rating (e.g., 4.0)
- **Response:** Spring Data `Page<Restaurant>` with content list, totalElements, and totalPages.

### Geolocation Search (Nearby Restaurants)
- **Endpoint:** `GET /api/restaurants/nearby`
- **Access:** Public
- **Query Parameters:**
  - `latitude` (required): Decimal latitude (e.g. 19.0760)
  - `longitude` (required): Decimal longitude (e.g. 72.8777)
  - `radiusKm` (default: 10): Search radius in kilometers
  - `page` (default: 0)
  - `size` (default: 16)
- **Computation:** Native SQL Haversine spherical trigonometric formula calculating spatial distance against indexed coordinates.

### Get Restaurant Details
- **Endpoint:** `GET /api/restaurants/{id}`
- **Access:** Public
- **Response:** `200 OK` with full Restaurant profile.

### Apply for Restaurant Onboarding
- **Endpoint:** `POST /api/restaurants/apply`
- **Access:** Authenticated (`ROLE_CUSTOMER` or `ROLE_RESTAURANT_PARTNER`)
- **Request Body:**
  ```json
  {
    "name": "Spice Symphony",
    "cuisine": "North Indian",
    "phone": "+919876543211",
    "email": "spice@example.com",
    "city": "Mumbai",
    "area": "Bandra West",
    "address": "45 Hill Road",
    "latitude": 19.0558,
    "longitude": 72.8312,
    "openingTime": "11:00",
    "closingTime": "23:00",
    "deliveryRadius": 8.0,
    "coverImageUrl": "https://images.unsplash.com/photo-..."
  }
  ```
- **Response:** `200 OK` with restaurant record in `PENDING_APPROVAL` status.

---

## 4. Restaurant Menu Management

### Get Restaurant Menu Items
- **Endpoint:** `GET /api/restaurants/{restaurantId}/menu`
- **Access:** Public
- **Response:** Array of `MenuItem` objects with availability and pricing.

### Add Menu Item
- **Endpoint:** `POST /api/restaurants/{restaurantId}/menu`
- **Access:** Authenticated (`ROLE_RESTAURANT_PARTNER` or `ROLE_OPERATOR`)
- **Request Body:**
  ```json
  {
    "name": "Garlic Naan",
    "description": "Clay oven baked flatbread brushed with garlic butter",
    "price": 60.00,
    "available": true,
    "imageUrl": "https://images.unsplash.com/photo-..."
  }
  ```
- **Response:** `201 CREATED`

### Update Menu Item
- **Endpoint:** `PUT /api/restaurants/{restaurantId}/menu/{menuItemId}`
- **Access:** Authenticated (Restaurant Owner or Operator)
- **Response:** `200 OK`

### Delete Menu Item
- **Endpoint:** `DELETE /api/restaurants/{restaurantId}/menu/{menuItemId}`
- **Access:** Authenticated (Restaurant Owner or Operator)
- **Response:** `204 NO CONTENT`

---

## 5. Cart Operations

### Create Cart
- **Endpoint:** `POST /api/carts`
- **Access:** Authenticated (`ROLE_CUSTOMER`)
- **Request Body:**
  ```json
  {
    "restaurantId": 12,
    "customerId": 1
  }
  ```
- **Response:** `201 CREATED` with Cart entity.

### Add Item to Cart
- **Endpoint:** `POST /api/carts/{cartId}/items`
- **Access:** Authenticated (Cart Owner)
- **Request Body:**
  ```json
  {
    "menuItemId": 45,
    "quantity": 2
  }
  ```
- **Response:** `200 OK` with created/updated `CartItem`.

### Get Cart
- **Endpoint:** `GET /api/carts/{cartId}`
- **Access:** Authenticated (Cart Owner)
- **Response:** `200 OK` with items and computed total amount.

---

## 6. Order Management & State Machine

### Create Order from Cart
- **Endpoint:** `POST /api/orders/from-cart/{cartId}`
- **Access:** Authenticated (`ROLE_CUSTOMER`)
- **Request Body (Optional):**
  ```json
  {
    "paymentMethod": "COD"
  }
  ```
  *(Supported `paymentMethod` values: `"CARD"`, `"UPI"`, `"COD"`. Defaults to `"CARD"` if omitted).*
- **Behavior:**
  - Persists order in `PLACED` status.
  - Automatically empties the cart to prevent duplicate order placements.
  - For `COD`, creates a `Payment` entity with `status: "PENDING"`.
- **Response:** `201 CREATED` with persisted Order.

### Get Order by ID
- **Endpoint:** `GET /api/orders/{orderId}`
- **Access:** Authenticated (Order Customer, Associated Restaurant, Assigned Driver, or Operator)
- **Response:** `200 OK` with order details, items, timestamps, and current `paymentStatus`.

### Cancel Order
- **Endpoint:** `DELETE /api/orders/{orderId}`
- **Access:** Authenticated (Order Customer only while in `PLACED` state)
- **Response:** `200 OK` with order status updated to `CANCELLED`.

### Get Orders for Restaurant Dashboard
- **Endpoint:** `GET /api/restaurants/{restaurantId}/orders`
- **Access:** Authenticated (Restaurant Staff or Operator)
- **Response:** `200 OK` with latest 50 active and historical orders.

### Update Restaurant Order Status
- **Endpoint:** `PATCH /api/restaurants/{restaurantId}/orders/{orderId}/status`
- **Access:** Authenticated (Restaurant Partner or Operator)
- **Request Body:**
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
  *(Allowed restaurant transitions: `ACCEPTED`, `PREPARING`, `READY_FOR_PICKUP`, `REJECTED`).*
- **Response:** `200 OK` with updated Order entity.

---

## 7. Payment Processing & COD

### Initiate Online Payment (Razorpay)
- **Endpoint:** `POST /api/payments/orders/{orderId}`
- **Access:** Authenticated (Order Customer)
- **Behavior:** Blocked (`400 BAD REQUEST`) if order `paymentMethod` is `"COD"`.
- **Response:**
  ```json
  {
    "paymentId": 501,
    "orderId": 101,
    "razorpayOrderId": "order_EKfLwp8P5GNN4G",
    "amount": 450.00,
    "currency": "INR",
    "keyId": "rzp_test_..."
  }
  ```

### Verify Online Payment Signature
- **Endpoint:** `POST /api/payments/verify`
- **Access:** Authenticated (Order Customer)
- **Request Body:**
  ```json
  {
    "razorpayOrderId": "order_EKfLwp8P5GNN4G",
    "razorpayPaymentId": "pay_29QQoUBi66xm2f",
    "razorpaySignature": "9ef4b60e4d1ceee9ea882ee035fb88d22b5e28516c41d3ee6d6cb0203a94395e"
  }
  ```
- **Validation:** Verifies HMAC-SHA256 signature using `razorpay.key-secret`.
- **Response:** `200 OK` with `PaymentStatus: "SUCCESS"`.

### Confirm Cash Collection (COD Orders)
- **Endpoint:** `POST /api/deliveries/{deliveryId}/collect-cash`
  *(Alternative: `POST /api/payments/orders/{orderId}/collect-cash`)*
- **Access:** Authenticated (Assigned Driver or Operator)
- **Behavior:**
  - Verifies order payment method is `"COD"`.
  - Verifies caller is the assigned driver or operator (`403 FORBIDDEN` otherwise).
  - Verifies payment is not already settled (`409 CONFLICT` if already `"SUCCESS"`).
  - Updates `Payment` entity status to `"SUCCESS"`.
  - Dispatches `PAYMENT_SUCCESS` system event across SSE.
- **Response:** `200 OK` with updated `Delivery` entity.

---

## 8. Delivery & Dispatch Management

### Get Available Deliveries Pool
- **Endpoint:** `GET /api/deliveries/available`
- **Access:** Authenticated (`ROLE_DRIVER` or `ROLE_OPERATOR`)
- **Response:** Array of unassigned orders in `READY_FOR_PICKUP` status with pickup & dropoff details.

### Get Driver Active & Completed Deliveries
- **Endpoint:** `GET /api/deliveries/driver/me`
- **Access:** Authenticated (`ROLE_DRIVER` or `ROLE_OPERATOR`)
- **Response:** Array of deliveries assigned to the requesting driver.

### Claim / Assign Delivery
- **Endpoint:** `POST /api/deliveries/{deliveryId}/assign`
- **Access:** Authenticated (`ROLE_DRIVER` or `ROLE_OPERATOR`)
- **Concurrency Protection:** Optimistic locking prevents race conditions between competing drivers.
- **Response:** `200 OK` with delivery status updated to `ASSIGNED` and order status to `DRIVER_ASSIGNED`.

### Patch Delivery Status
- **Endpoint:** `PATCH /api/deliveries/{deliveryId}/status`
- **Access:** Authenticated (Assigned Driver or Operator)
- **Request Body:**
  ```json
  {
    "status": "PICKED_UP"
  }
  ```
  *(Allowed driver transitions: `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`).*
- **Response:** `200 OK` with updated Delivery entity.

---

## 9. Real-Time Event Stream (SSE)

### Subscribe to Event Stream
- **Endpoint:** `GET /api/events/stream`
- **Access:** Authenticated via `Authorization: Bearer <token>` header
- **Content-Type:** `text/event-stream`
- **Payload Schema (`SystemEvent`):**
  ```json
  {
    "eventId": "f7d3a042-8c1e-4c7b-b3c1-92b5e28516c4",
    "type": "ORDER_READY_FOR_PICKUP",
    "orderId": 101,
    "restaurantId": 12,
    "customerId": 1,
    "driverId": 3,
    "status": "READY_FOR_PICKUP",
    "occurredAt": "2026-10-25T14:45:12.123Z"
  }
  ```

---

## 10. Platform Operator & Administration

### Get Platform Statistics
- **Endpoint:** `GET /api/admin/stats`
- **Access:** Authenticated (`ROLE_OPERATOR`)
- **Response:**
  ```json
  {
    "totalRestaurants": 10000,
    "pendingRestaurants": 3,
    "approvedRestaurants": 9997,
    "totalOrders": 1420,
    "activeDeliveries": 18
  }
  ```

### List Pending Restaurant Applications
- **Endpoint:** `GET /api/admin/restaurants/pending`
- **Access:** Authenticated (`ROLE_OPERATOR`)

### Approve Restaurant Application
- **Endpoint:** `PUT /api/admin/restaurants/{id}/approve`
- **Access:** Authenticated (`ROLE_OPERATOR`)
- **Response:** `200 OK` (Transitions restaurant status to `APPROVED`, publishing to catalogue).

### Reject Restaurant Application
- **Endpoint:** `PUT /api/admin/restaurants/{id}/reject`
- **Access:** Authenticated (`ROLE_OPERATOR`)
- **Response:** `200 OK` (Records rejection reason and updates status to `REJECTED`).

---

## 11. Health & Telemetry

### Liveness Probe
- **Endpoint:** `GET /api/health`
- **Access:** Public
- **Response:** `{"status": "UP"}`

### Spring Boot Actuator Probes
- **Endpoint:** `GET /actuator/health`
- **Access:** Public / Network Protected
- **Includes:**
  - `diskSpace`: Disk storage availability
  - `db`: Database connectivity verification
  - `payment`: Razorpay gateway configuration probe (`PaymentHealthIndicator`)
  - `sse`: Active real-time client emitter connections counter (`SseHealthIndicator`)
  - `outboxMonitor`: Event dispatch status (`OutboxMonitorIndicator`)
