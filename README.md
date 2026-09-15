# QuickBite

**A production-grade, full-stack food delivery platform with real-time tracking and secure operations.**

## Project Status
**Active Development** - The core ordering and delivery lifecycle (Phase 1) is fully functional and rigorously tested. Future iterations will focus on infrastructure, deployment, and DevOps/SRE principles.

## Main Product Features
- **Customer Ordering:** Browse restaurants, add items to a cart, checkout, and securely pay via Razorpay integration.
- **Real-Time Delivery Tracking:** Customers can view live, real-time updates of their delivery status (Assigning -> Assigned -> Picked Up -> Out for Delivery -> Delivered) powered by WebSockets/STOMP.
- **Driver Dashboard:** Secure operations dashboard where authorized drivers can claim deliveries and update their status.
- **Restaurant Onboarding:** Automated workflow for restaurants to apply for platform inclusion and staff to request access (pending operator approval).

## Engineering Highlights
- **Zero-Trust Security:** JWT-based stateless authentication with strict Role-Based Access Control (RBAC). Identifiers from request bodies are ignored in favor of the JWT principal to prevent IDOR (Insecure Direct Object Reference).
- **Scalable Real-Time Updates:** Engineered a WebSockets over STOMP architecture, securely integrated with Spring Security to broadcast granular updates directly to subscribed customers.
- **Data Integrity:** Extensive use of `@Transactional` operations and robust relational mappings in PostgreSQL ensure accurate delivery state machines.
- **Massive Data Seeding:** Fully compatible with high-volume synthetic datasets (10,000+ restaurants) while maintaining quick query access through optimized pagination and filtering.

## Tech Stack
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** Spring Boot 3 (Java 21), Spring Security, Spring WebSockets
- **Database:** PostgreSQL (with H2 for isolated integration tests)
- **Authentication:** JWT, Google OAuth (Planned/Partial)
- **Payment:** Razorpay Gateway

## Architecture Overview
QuickBite follows a decoupled client-server architecture:
- The **Next.js frontend** provides a fast, server-side rendered (SSR) interface and handles client-side state.
- The **Spring Boot backend** exposes secure RESTful APIs for transactional data and a WebSocket broker for real-time events.
- **PostgreSQL** serves as the persistent source of truth.

For an in-depth view, see our [Architecture Document](docs/architecture.md).

## Repository Structure
```
quickbite-app/
├── frontend/             # Next.js React frontend
│   ├── src/app/          # Next.js App Router pages
│   ├── src/components/   # Reusable UI components
│   └── src/lib/          # API clients and utilities
├── src/main/java/        # Spring Boot backend source
│   └── com/quickbite/    # Domain-driven backend modules
├── src/test/java/        # Comprehensive backend integration tests
├── docs/                 # Extended documentation
├── pom.xml               # Maven configuration
└── README.md             # This file
```

## Main Application Flows
1. **Customer Order Flow:** Register/Login -> Add to Cart -> Checkout -> Payment -> Order Confirmation.
2. **Delivery Workflow:** Delivery created (`ASSIGNING`) -> Driver Claims (`ASSIGNED`) -> Driver updates to `PICKED_UP`, `OUT_FOR_DELIVERY`, and `DELIVERED`.
3. **Restaurant Onboarding:** User submits restaurant application (`PENDING_APPROVAL`) -> Awaits operator approval to become `APPROVED`.

## Security Design
All endpoints are locked behind Spring Security. Public endpoints are strictly whitelisted (`/api/auth/**`, `/api/restaurants/**` for browsing). Actions requiring authorization extract the `customerId` strictly from the signed JWT, effectively neutralizing IDOR vulnerabilities. Driver actions are gated by the `ROLE_DRIVER` authority.

## Real-Time WebSocket Design
We use STOMP over WebSockets for real-time delivery status updates. When a driver patches a delivery status, the `DeliveryService` updates the database and immediately broadcasts the new state via `SimpMessagingTemplate` to the specific topic: `/topic/deliveries/{deliveryId}`. The frontend securely subscribes to this topic to update the UI instantly without polling.

## Database Overview
Relational schema centered around `Customer`, `Restaurant`, `MenuItem`, `Order`, and `Delivery` entities. Uses JPA/Hibernate for robust ORM mapping. Safely handles missing legacy data states (e.g., retrofitting a `status` column onto 10,000 legacy restaurants by resolving `null` to `APPROVED` dynamically).

## Local Setup Instructions

### Prerequisites
- Java 21
- Node.js 18+
- Maven
- PostgreSQL (Local or Docker)

### 1. Database Setup
Ensure PostgreSQL is running on `localhost:5432`. Create a database named `quickbite`.

### 2. Environment Variables
Copy the templates to create your local `.env` files. (See **Environment Variable Setup** below).

### 3. Start Backend
```bash
mvn clean install -DskipTests
source .env
mvn spring-boot:run
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

## Environment Variable Setup
Do not commit actual secrets. Use the provided templates.

**Backend (`.env`)**
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

**Frontend (`frontend/.env.local`)**
Copy `frontend/.env.example` to `frontend/.env.local`:
```bash
cp frontend/.env.example frontend/.env.local
```

## Test and Build Commands

**Backend Testing (Integration & Unit):**
```bash
mvn verify
```

**Frontend Build & Type Checking:**
```bash
cd frontend
npm run build
npx tsc --noEmit
```

## API Overview
- `POST /api/auth/login` - Authenticate and receive JWT
- `GET /api/restaurants` - Browse approved restaurants
- `POST /api/orders` - Submit a new order
- `PATCH /api/deliveries/{id}/status` - Driver updates delivery status (Requires `ROLE_DRIVER`)
- `POST /api/restaurants/apply` - Submit a restaurant application

## Screenshots
> *(Screenshots coming soon)*
> 
> ![Customer Ordering Placeholder](#)
> ![Driver Dashboard Placeholder](#)
> ![Real-Time Tracking Placeholder](#)

## Future Roadmap
See our comprehensive [Roadmap](docs/roadmap.md) which details our path toward a highly available microservices-ready deployment, including Kubernetes, CI/CD, and robust observability.

## Author
**QuickBite Engineering**
