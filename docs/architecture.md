# QuickBite Architecture

## High-Level Architecture
QuickBite is designed as a modular monolith (Spring Boot) serving a decoupled Single Page Application (Next.js).

```mermaid
flowchart TD
    Client[Next.js Frontend]
    API[Spring Boot Backend REST API]
    WS[Spring WebSockets / STOMP]
    DB[(PostgreSQL Database)]

    Client -->|HTTPS/REST| API
    Client <-->|WSS/STOMP| WS
    API <-->|JPA/Hibernate| DB
    WS -->|JPA/Hibernate| DB
```

## Security & JWT Authentication Flow
We use a stateless JWT (JSON Web Token) approach.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthController
    participant JwtService
    
    User->>Frontend: Enter credentials
    Frontend->>AuthController: POST /api/auth/login
    AuthController->>JwtService: Verify & Generate Token
    JwtService-->>AuthController: JWT String
    AuthController-->>Frontend: 200 OK { token }
    Frontend->>Frontend: Store in localStorage
    User->>Frontend: Access protected route
    Frontend->>API: Request with Authorization: Bearer <token>
```
*Note: We extract the `customerId` entirely from the JWT payload to prevent IDOR.*

## Customer Order Flow
1. **Browse:** Customer browses `GET /api/restaurants`.
2. **Cart:** Customer adds items.
3. **Checkout:** Customer hits `POST /api/orders` to create a `PENDING` order.
4. **Payment:** Customer pays via Razorpay (`POST /api/payments/verify`).
5. **Confirmation:** Backend verifies the payment signature, marks order `CONFIRMED`, and automatically initializes the Delivery lifecycle.

## Delivery Workflow
Once an order is paid, the system automatically spawns a Delivery record.

```mermaid
stateDiagram-v2
    [*] --> ASSIGNING : Order Paid
    ASSIGNING --> ASSIGNED : Driver Accepts
    ASSIGNED --> PICKED_UP : Driver collects food
    PICKED_UP --> OUT_FOR_DELIVERY : Driver en route
    OUT_FOR_DELIVERY --> DELIVERED : Handed to customer
    ASSIGNING --> CANCELLED : Admin abort
```

## WebSocket Real-Time Status Flow
Instead of polling the server, customers receive updates instantly.

```mermaid
sequenceDiagram
    participant Customer
    participant Broker (Spring)
    participant Driver
    
    Customer->>Broker: CONNECT (JWT Auth)
    Customer->>Broker: SUBSCRIBE /topic/deliveries/{id}
    Driver->>API: PATCH /api/deliveries/{id}/status (e.g. PICKED_UP)
    API->>Database: Update Status
    API->>Broker: convertAndSend(/topic/deliveries/{id}, newStatus)
    Broker-->>Customer: MESSAGE (newStatus)
    Customer->>Customer: UI Updates Instantly
```

## Restaurant Onboarding Flow
To support growth safely, restaurants go through a vetting process.
- **Flow A (New Restaurant):** `POST /api/restaurants/apply` -> Status is `PENDING_APPROVAL`.
- **Flow B (Join Existing):** `POST /api/restaurants/{id}/staff-requests` -> Creates `RestaurantStaffProfile` with status `PENDING_APPROVAL`.
- **Visibility:** Queries strictly filter by `status IS NULL OR status = 'APPROVED'`, meaning pending applications remain invisible to public customers.

## Current Limitations
- **No Map UI:** GPS locations are collected but not currently rendered on a live map interface.
- **Monolith:** The backend is currently a single Spring Boot application. It is well-structured for future microservice extraction but is monolithic today.
- **Stateless WebSockets:** We currently use Spring's SimpleBroker. In a multi-instance deployment, this must be swapped for an external broker (like Redis or RabbitMQ) to share topics across instances.
