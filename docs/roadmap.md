# QuickBite Roadmap

## Completed
- ✅ Secure JWT-based Authentication
- ✅ Customer Restaurant & Menu Browsing
- ✅ Cart & Checkout Flow
- ✅ Razorpay Payment Gateway Integration
- ✅ Driver Role & Dashboard Foundation
- ✅ Order-to-Delivery Automated Handoff
- ✅ Real-time STOMP/WebSocket Delivery Tracking
- ✅ Safe Legacy Data Migration (10,000+ Restaurants)
- ✅ Restaurant Onboarding Foundation (Phase 1)
- ✅ Comprehensive Test Coverage (JUnit/MockMvc)

## In Progress
- 🔄 Operator Dashboard for Restaurant Approvals (Phase 2 Onboarding)
- 🔄 Google OAuth2 Social Login Integration

## Planned (Product)
- 📅 Live GPS Driver Tracking UI (Maps Integration)
- 📅 Automated Refunds via Razorpay API
- 📅 Push Notifications (FCM)
- 📅 Restaurant Owner Menu Management Dashboard

## Planned (DevOps / SRE / Infrastructure)
As we prepare for production, the following infrastructure enhancements are planned:
- 📅 **Dockerization:** Containerize the Spring Boot backend and Next.js frontend.
- 📅 **CI/CD Pipeline:** Implement GitHub Actions for automated testing and container publishing.
- 📅 **Linux/VPS Deployment:** Baseline provisioning scripts.
- 📅 **Nginx/HTTPS:** Reverse proxy setup with Let's Encrypt SSL.
- 📅 **Kubernetes & Helm:** Migration to K8s for orchestrating the backend, frontend, and DB.
- 📅 **GitOps:** Introduce Argo CD for declarative deployments.
- 📅 **Redis Integration:** Offload WebSocket SimpleBroker to a scalable Redis message broker for multi-instance sync.
- 📅 **Observability (OpenTelemetry/Jaeger):** Distributed tracing across API and WebSockets.
- 📅 **Centralized Logging:** ELK or Grafana Loki stack integration.
- 📅 **Monitoring (Prometheus/Grafana):** Expose Spring Actuator metrics and visualize performance.
- 📅 **SLOs and Error Budgets:** Define strict reliability targets for critical flows (Checkout, Delivery Updates).
- 📅 **Backup and Disaster Recovery:** Automated PostgreSQL continuous archiving (e.g., WAL-G or pgBackRest).
