# 🍔 Mini Food Ordering System — Service-Based Architecture

A mini internal food ordering system inspired by ShopeeFood, built using **Service-Based Architecture**. Each core functionality is separated into independent services communicating via REST APIs.

---

## 🚀 Overview

This project demonstrates how to design and implement a distributed system using **Spring Boot microservices** and a **ReactJS frontend**.

The system allows users to:

* Browse food items 🍜
* Add items to cart 🛒
* Place orders 📦
* Simulate payments 💳
* Receive notifications 🔔

---

## 🏗️ Architecture

We follow **Service-Based Architecture**, where each module is an independent service:

```
Frontend (ReactJS)
        ↓
-----------------------------------------
|   User Service     (Port 8081)        |
|   Food Service     (Port 8082)        |
|   Order Service    (Port 8083)        |
|   Payment Service  (Port 8084)        |
-----------------------------------------
```

* Communication: **REST API (HTTP)**
* Optional: API Gateway (Spring Cloud Gateway)

---

## 🧩 Services

### 👤 User Service

Handles authentication and user management.

**Endpoints:**

* `POST /register` — Register new user
* `POST /login` — Login
* `GET /users` — Get all users

**Features:**

* Basic authentication (JWT optional)
* Storage: In-memory or H2 database

---

### 🍱 Food Service

Manages food items.

**Endpoints:**

* `GET /foods` — Get all foods
* `POST /foods` — Add new food
* `PUT /foods/{id}` — Update food
* `DELETE /foods/{id}` — Delete food

**Features:**

* Pre-seeded data
* No complex authentication required

---

### 📦 Order Service

Handles order creation and management.

**Endpoints:**

* `POST /orders` — Create order
* `GET /orders` — Get all orders

**Responsibilities:**

* Calls **Food Service** to fetch food details
* Calls **User Service** to validate user

---

### 💳 Payment & Notification Service

Processes payments and sends notifications.

**Endpoints:**

* `POST /payments`

**Responsibilities:**

* Update order status (via Order Service)
* Send notification (console log or API)

**Example Notification:**

```
User A đã đặt đơn #123 thành công
```

---

### 🎨 Frontend (ReactJS)

User interface for the system.

**Pages:**

* Login / Register
* Food list
* Cart
* Checkout

**Tech Stack:**

* ReactJS
* Axios

---

## 🌐 Deployment (LAN Setup)

Each service runs on a different machine:

| Service         | Port |
| --------------- | ---- |
| User Service    | 8081 |
| Food Service    | 8082 |
| Order Service   | 8083 |
| Payment Service | 8084 |

⚠️ Important:

* Use **real IP addresses** (e.g. `192.168.x.x`)
* Configure **CORS properly**
* Do NOT use `localhost` across machines

---

## 🧪 Demo Flow (Required)

1. User registers & logs in
2. View food list
3. Add items to cart → create order
4. Make payment
5. Receive notification

---

## ⭐ Bonus Features

* API Gateway (Spring Cloud Gateway)
* Load balancing (round-robin simulation)
* Retry mechanism when services fail
* Centralized logging

---

## 🐳 Docker (Phase 2)

* Each service runs in a container
* Use `docker-compose` to start the whole system

```bash
docker-compose up --build
```

---

## ☁️ Deployment (Phase 3 - Optional)

* Deploy to VPS or lab server
* Run full system on a single host

---

## 🗄️ Database

Example MongoDB connection:

```
mongodb+srv://products:<db_password>@mini-food-system.hbvvgpd.mongodb.net/?appName=mini-food-system
```

---

## 📊 Grading Criteria

| Criteria                           | Score |
| ---------------------------------- | ----- |
| Correct Service-Based Architecture | 3     |
| API functionality                  | 2     |
| Inter-service communication        | 2     |
| Smooth frontend                    | 1.5   |
| Complete demo                      | 1     |

---

## 👥 Team Roles

| Role          | Responsibility             |
| ------------- | -------------------------- |
| Frontend Dev  | React UI + API integration |
| Backend Dev 1 | User Service               |
| Backend Dev 2 | Food Service               |
| Backend Dev 3 | Order Service              |
| Backend Dev 4 | Payment + Notification     |

---

## 🛠️ Tech Stack

* Backend: Spring Boot
* Frontend: ReactJS
* Communication: REST API
* Database: H2 / MongoDB
* Containerization: Docker

---

## 📌 Notes

* Keep services independent
* Handle service failures gracefully
* Focus on clear API contracts
* Logging is important for debugging

---

If you want, I can also:

* generate **folder structure for each service**
* write **sample Spring Boot code (controller/service)**
* or create a **docker-compose.yml ready to run**
