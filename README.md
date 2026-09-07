# ShopEase - Full Stack E-Commerce Platform with Razorpay & Kubernetes

[![Spring Boot 3](https://img.shields.io/badge/Spring_Boot-3.3.3-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-02042B?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Deployment-326CE5?style=for-the-badge&logo=kubernetes)](https://kubernetes.io/)

**ShopEase** is a production-grade, full-stack E-Commerce platform engineered for high performance, secure online transactions, and scalable cloud deployment. Built using **Java 17, Spring Boot 3, Spring Security 6 (JWT), React.js (Vite), Redux Toolkit, Tailwind CSS, Razorpay Payment Gateway, Docker, and Kubernetes**.

---

## 🌟 Key Features

### 🔐 Authentication & Authorization
- **JWT Authentication**: Access tokens (HMAC-SHA256) + Refresh tokens for secure session maintenance.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `ROLE_USER` and `ROLE_ADMIN`.
- **BCrypt Hashing**: Passwords stored using BCrypt password encoding.

### 🛍️ Customer Experience
- **Product Catalog**: Advanced search, multi-category filtering, price range filters, pagination, and dynamic sorting (Price / Name).
- **Interactive Cart**: State-managed shopping cart with quantity adjustment, instant total recalculation, and persistent user scoping.
- **Razorpay Checkout**: Seamless integration with Razorpay Payment Gateway modal, signature verification, and automated order status update (`PENDING` ➔ `PAID`).
- **Order Tracking**: Detailed order history with item breakdown and payment reference IDs.

### 🛡️ Admin Management Dashboard
- **Analytics & Revenue Metrics**: Live total revenue, order count, total user count, order status breakdown (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`).
- **Catalog CRUD**: Add, edit, and delete products with image previews and category association.
- **Stock Alert System**: Automated alerts for products running low in inventory (`< 10` units).
- **Order Fulfillment**: Update order statuses in real-time.

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |    Browser Client (React)   |
                      |  Redux Toolkit / Tailwind   |
                      +--------------+--------------+
                                     |
                                     | REST API / JWT
                                     v
                      +-----------------------------+
                      |   Nginx Reverse Proxy / FE  |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Spring Boot 3 REST API    |
                      |  Security 6 / JPA / JWT     |
                      +-------+--------------+------+
                              |              |
           Razorpay Payments  |              | JPA / Hibernate
                              v              v
                     +----------------+   +-------------------+
                     | Razorpay Cloud |   |  MySQL 8.0 DB     |
                     +----------------+   +-------------------+
```

---

## 💻 Tech Stack

- **Backend**: Java 17, Spring Boot 3.3.3, Spring Security 6, Spring Data JPA, Hibernate, MySQL 8.0, Lombok, MapStruct, Bean Validation.
- **Frontend**: React.js 18 (Vite), React Router 6, Redux Toolkit, Axios, Tailwind CSS v3, Lucide Icons.
- **Payments**: Razorpay Payment Gateway SDK (`razorpay-java:1.4.7` + JS SDK).
- **DevOps**: Docker Multi-stage Builds, Docker Compose, Kubernetes (`Deployment`, `Service`, `ConfigMap`, `Secret`, `PVC`).
- **API Docs**: Swagger / OpenAPI 3 (`http://localhost:8080/swagger-ui.html`).

---

## 🔑 Pre-Configured Demo Credentials

Seed data is automatically loaded on application startup:

| Account Type | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin User** | `admin@shopease.com` | `admin123` | `ROLE_ADMIN` |
| **Standard User** | `john@example.com` | `user123` | `ROLE_USER` |

---

## 🚀 Getting Started Locally

### Prerequisites
- **JDK 17** or **JDK 21**
- **Apache Maven 3.8+**
- **Node.js 18+** & **npm**
- **MySQL 8.0** running locally on port `3306`

### 1. Database Setup
Create MySQL database `shopease_db` or let Spring Boot auto-create it:
```sql
CREATE DATABASE IF NOT EXISTS shopease_db;
```

### 2. Run Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
- Server starts at: `http://localhost:8080`
- Swagger UI available at: `http://localhost:8080/swagger-ui.html`

### 3. Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- App running at: `http://localhost:5173`

---

## 🐳 Docker Compose Deployment

Spin up MySQL, Backend, and Frontend in containers with a single command:

```bash
# Build and launch containers
docker-compose up --build -d

# View container status
docker-compose ps

# Stop containers
docker-compose down
```

Services exposed:
- **Frontend App**: `http://localhost` or `http://localhost:5173`
- **Backend REST API**: `http://localhost:8080`
- **MySQL Database**: `localhost:3306`

---

## ☸️ Kubernetes Deployment Guide

The `/k8s` directory contains all Kubernetes manifests required to deploy ShopEase to any cluster (Minikube, Kind, GKE, EKS).

### Deployment Steps:

```bash
# 1. Apply ConfigMap and Secret
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 2. Deploy MySQL Database & PVC
kubectl apply -f k8s/mysql-deployment.yaml

# 3. Deploy Backend API Service
kubectl apply -f k8s/backend-deployment.yaml

# 4. Deploy Frontend Web App Service
kubectl apply -f k8s/frontend-deployment.yaml

# 5. Check Pod Status
kubectl get pods -w
```

### Accessing Minikube / Local K8s:
```bash
# Get service URL
minikube service frontend-service
```

---

## 💳 Razorpay Payment Gateway Integration

### Obtaining Razorpay Test Keys
1. Sign up for a free developer account at [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** -> **API Keys** -> **Generate Test Key**.
3. Copy `Key ID` and `Key Secret`.

### Configuring Keys
Update environment variables in `docker-compose.yml` or `k8s/secret.yaml`:
```yaml
RAZORPAY_KEY_ID: "rzp_test_YourKeyIdHere"
RAZORPAY_KEY_SECRET: "YourKeySecretHere"
```

> **Development Mode Support**: If test keys are omitted, ShopEase runs with an automated mock payment verification handler so checkout flows seamlessly during local development and code reviews!

---

## 📚 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register user & receive JWT tokens
- `POST /api/auth/login` - Sign in user & receive JWT access + refresh tokens
- `POST /api/auth/refresh-token` - Refresh access token

### Products (`/api/products`)
- `GET /api/products` - Filtered & paginated product catalog
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (*Admin*)
- `PUT /api/products/{id}` - Update product (*Admin*)
- `DELETE /api/products/{id}` - Delete product (*Admin*)

### Shopping Cart (`/api/cart`)
- `GET /api/cart` - View authenticated user's cart
- `POST /api/cart/items` - Add product to cart
- `PUT /api/cart/items/{id}` - Update item quantity
- `DELETE /api/cart/items/{id}` - Remove item from cart

### Orders & Payment (`/api/orders`, `/api/payment`)
- `POST /api/orders/checkout` - Create order from cart
- `GET /api/orders/my-orders` - Get user order history
- `POST /api/payment/create-order` - Create Razorpay order (amount in paise)
- `POST /api/payment/verify` - Verify HMAC-SHA256 Razorpay signature
