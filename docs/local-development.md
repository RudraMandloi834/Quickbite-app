# QuickBite Local Development Guide

This guide provides instructions for setting up, running, testing, and debugging the QuickBite application in a local development environment.

---

## 1. Prerequisites

Before getting started, verify that your environment has the following installed:

| Tool | Required Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- |
| **Java Development Kit (JDK)** | **21** (Temurin / OpenJDK) | `java -version` | Spring Boot 3.5 requires Java 21 |
| **Apache Maven** | **3.8+** | `mvn -version` | Project includes Maven wrapper |
| **Node.js** | **18.x / 20.x** | `node -v` | LTS recommended |
| **npm** | **9.x / 10.x** | `npm -v` | Installed with Node.js |
| **Git** | **2.30+** | `git --version` | Version control |
| **Docker & Docker Compose** | **v2+** | `docker compose version` | Optional for containerized workflow |

---

## 2. Fast-Track Local Setup (Zero-Database Setup via H2)

The easiest way to run QuickBite locally is using the `dev` profile. This profile boots an in-memory or file-based H2 database and automatically seeds demo accounts, approved restaurants, and menu items.

### Step 1: Clone the Repository
```bash
git clone https://github.com/RudraMandloi834/Quickbite-app.git
cd Quickbite-app
```

### Step 2: Configure Environment Variables
Copy the sanitized environment templates for both backend and frontend:

```bash
# Backend environment setup
cp .env.example .env

# Frontend environment setup
cp frontend/.env.example frontend/.env.local
```

### Step 3: Start the Spring Boot Backend
Run the backend with profile `dev`:
```bash
mvn clean compile
java -jar target/quickbite-app-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
# Alternatively, via Maven:
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
The backend initializes in approximately 6–8 seconds and starts listening on port `8080`.

### Step 4: Start the Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3000`.

---

## 3. Seeded Demo Accounts

When running in the `dev` profile, the following demo accounts are seeded automatically with password **`dev123`**:

| Role | Email Address | Password | Permissions & Dashboard |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@test.com` | `dev123` | Cart checkout, live order tracking, address management |
| **Restaurant Partner** | `restaurant@test.com` | `dev123` | Kitchen dashboard (`/restaurant/dashboard`), order status actions |
| **Delivery Driver** | `driver@test.com` | `dev123` | Driver operations (`/driver`), claiming deliveries, COD collection |
| **Platform Operator** | `admin@test.com` | `dev123` | Operator dashboard (`/admin/dashboard`), restaurant approvals |

---

## 4. Docker Compose Setup (PostgreSQL + Containers)

To run the complete production-like stack locally with PostgreSQL 15, Spring Boot, and Next.js:

```bash
docker compose up --build
```

Services initialized:
- `db`: PostgreSQL 15 on port `5432` with healthcheck.
- `backend`: Spring Boot 3 running on port `8080` (`production` profile with Flyway migrations).
- `frontend`: Next.js running on port `3000`.

To tear down containers and persist data volume:
```bash
docker compose down
```

---

## 5. Developer Testing & Quality Checks

### Run Backend Unit and Integration Tests
```bash
mvn test
```
Executes the complete test suite (47 tests) validating RBAC security, order lifecycle transitions, rate limiting, and onboarding rules.

### Run Frontend Build & Type Checking
```bash
cd frontend
npx tsc --noEmit
npm run build
```
Verifies TypeScript type safety and compiles Next.js pages with Turbopack.

### Run Automated End-to-End Order Lifecycle Script
QuickBite includes an automated verification script that executes a complete order from customer cart creation through restaurant acceptance, driver assignment, cash collection, and final delivery:

```bash
python3 scratch/test_cod_verification.py
```

---

## 6. Developer Tools & Diagnostics

- **H2 Database Console:** Access the browser SQL client at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:quickbite_dev`, User: `sa`, Password: *(empty)*).
- **Liveness Probe:** `curl http://localhost:8080/api/health`
- **Actuator Health Metrics:** `curl http://localhost:8080/actuator/health`
