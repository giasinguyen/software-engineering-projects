# Spring AI · Hazelcast Agent

> **Demo kiến trúc**: Spring Boot + Hazelcast Embedded Cache + RabbitMQ (CloudAMQP) + React + Tailwind CSS

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Các thành phần](#3-các-thành-phần)
4. [Chiến lược Cache](#4-chiến-lược-cache)
5. [Luồng xử lý](#5-luồng-xử-lý)
6. [API Reference](#6-api-reference)
7. [Load Test — Luồng hoạt động](#7-load-test--luồng-hoạt-động)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Cài đặt & Chạy](#9-cài-đặt--chạy)
10. [Cấu hình](#10-cấu-hình)

---

## 1. Tổng quan

Dự án minh họa cách kết hợp **3 công nghệ tăng hiệu năng** trong một hệ thống backend:

| Công nghệ | Vai trò | Lợi ích |
|-----------|---------|---------|
| **Hazelcast Embedded** | In-memory distributed cache | Read latency < 2ms (vs ~10ms từ DB) |
| **RabbitMQ (CloudAMQP)** | Message queue cho write operations | Write latency < 5ms (async, non-blocking) |
| **InMemory Database** | ConcurrentHashMap mô phỏng DB layer | Không cần DB thật để demo |

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        React UI                             │
│            (Vite + Tailwind CSS, port 5173)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Agent Service                           │
│              (Spring Boot 3.2.5, port 8080)                 │
│                                                             │
│   GET /{key}  ─────────────────────────────────────────┐    │
│                                                        │    │
│   POST / PUT / DELETE ──► WriteEventPublisher          │    │
│                                │                       │    │
│                                ▼                       ▼    │
└───────────────────────────────────────────────────────┬────┘
                                │                       │
              ┌─────────────────▼──┐         ┌──────────▼──────────┐
              │   RabbitMQ Cloud   │         │  Hazelcast Embedded  │
              │   (CloudAMQP SSL)  │         │    IMap: app-cache   │
              │  armadillo.rmq.    │         │    TTL: 300s         │
              │  cloudamqp.com     │         │    MaxSize: 10,000   │
              └─────────────────┬──┘         └──────────┬──────────┘
                                │                       │
                    ┌───────────▼──────┐                │ Cache Miss
                    │ WriteEventConsumer│               │
                    │ (2–5 threads)     │               ▼
                    └───────────┬──────┘    ┌───────────────────────┐
                                │           │   InMemory Database    │
                                └──────────►│  (ConcurrentHashMap)  │
                                            └───────────────────────┘
```

---

## 3. Các thành phần

### Backend (`/backend`)

#### `config/`
| File | Mô tả |
|------|-------|
| `HazelcastConfig.java` | Khởi tạo Hazelcast embedded instance, cấu hình IMap TTL và max-size |
| `RabbitMQConfig.java` | Khai báo Queue, Exchange (Topic), Binding, Jackson JSON converter |
| `CorsConfig.java` | Cho phép CORS từ `localhost:5173` và `localhost:3000` |
| `RestTemplateConfig.java` | Cấu hình RestTemplate (giữ lại cho tương thích) |

#### `mq/`
| File | Mô tả |
|------|-------|
| `WriteEvent.java` | DTO message: `type` (CREATE/UPDATE/DELETE) + `key` + `data` + `timestamp` |
| `WriteEventPublisher.java` | Gửi WriteEvent lên RabbitMQ exchange qua `RabbitTemplate.convertAndSend()` |
| `WriteEventConsumer.java` | `@RabbitListener` — nhận message, ghi `WriteService` (DB) + `CacheService` (Hazelcast) |

#### `service/`
| File | Mô tả |
|------|-------|
| `AgentService.java` | Orchestration: Cache-Aside (read), Write-Through (write), Invalidation (delete) |
| `CacheService.java` | Wrapper Hazelcast IMap: `get()`, `put()`, `evict()`, `flush()`, `getStats()` |
| `ReadService.java` | Đọc dữ liệu từ `InMemoryDatabase` |
| `WriteService.java` | Ghi/xóa dữ liệu vào `InMemoryDatabase` |
| `InMemoryDatabase.java` | `ConcurrentHashMap` mô phỏng database layer |

#### `controller/`
| File | Mô tả |
|------|-------|
| `AgentController.java` | REST API `/api/agent/**`, tích hợp MQ publisher cho writes |
| `GlobalExceptionHandler.java` | Xử lý lỗi toàn cục |

#### `dto/`
| File | Mô tả |
|------|-------|
| `ApiResponse<T>` | Response wrapper với `source`, `data`, `status`, `latencyMs`, `operation` |
| `WriteRequest` | Request body cho POST: `{ key, data }` |

---

### Frontend (`/frontend`)

| File | Mô tả |
|------|-------|
| `src/App.jsx` | Toàn bộ UI — tabs, load test, charts, activity log |
| `vite.config.js` | Proxy `/api` → `http://localhost:8080` |
| `src/index.css` | `@import "tailwindcss"` |

#### Các component chính trong `App.jsx`

| Component | Mô tả |
|-----------|-------|
| `ArchFlow` | Sơ đồ kiến trúc dạng flow diagram |
| `SourceBadge` | Badge hiển thị nguồn dữ liệu: ⚡ CACHE HIT / 🗄️ DATABASE / 🐇 QUEUED–MQ |
| `LatencyBar` | Thanh latency với màu xanh/vàng/đỏ theo ngưỡng |
| `ResponsePanel` | Hiển thị HTTP response, xử lý riêng 202 Accepted (MQ) |
| `ActivityLog` | Lịch sử 50 request gần nhất |
| `LoadTestPanel` | Benchmark concurrent với biểu đồ timeline + histogram |
| `LatencyChart` | SVG line chart latency theo thời gian |
| `LatencyHistogram` | Bar chart phân phối latency theo bucket |

---

## 4. Chiến lược Cache

### READ — Cache-Aside (Lazy Loading)

```
Client → GET /{key}
              │
              ▼
    Hazelcast IMap.get(key)
              │
      ┌───────┴────────┐
      │ HIT            │ MISS
      ▼                ▼
  Trả về ngay    InMemoryDatabase.find(key)
  source=cache         │
  latency ~1ms         ▼
                  IMap.put(key, data)   ← warm cache
                       │
                  Trả về data
                  source=database
                  latency ~5–15ms
```

### WRITE — Async via RabbitMQ → Write-Through

```
Client → POST/PUT /{key}
              │
              ▼
    WriteEventPublisher.publish(event)
              │
              ▼
    RabbitMQ Exchange → Queue
              │
    HTTP 202 Accepted ← trả về ngay (~2–5ms)
              │
    [Background] WriteEventConsumer:
              ├── WriteService.create/update(key, data)  → DB
              └── CacheService.put(key, data)            → Hazelcast
```

### DELETE — Async via RabbitMQ → Cache Invalidation

```
Client → DELETE /{key}
              │
              ▼
    WriteEventPublisher.publish({ type: "DELETE", key })
              │
    HTTP 202 Accepted ← trả về ngay
              │
    [Background] WriteEventConsumer:
              ├── WriteService.delete(key)  → DB
              └── CacheService.evict(key)  → Hazelcast
```

---

## 5. Luồng xử lý

### GET (Read) chi tiết

```
1. AgentController.read(key)
2. AgentService.read(key)
   a. CacheService.get(key)         → Hazelcast IMap.get()
   b. [Cache HIT] return ApiResponse.fromCache(data, latency)
   c. [Cache MISS] ReadService.findByKey(key)
                   → InMemoryDatabase.find(key)
   d. CacheService.put(key, data)   → Hazelcast IMap.put()
   e. return ApiResponse.fromDatabase(data, latency)
3. HTTP 200 OK
```

### POST (Create) chi tiết

```
1. AgentController.create(WriteRequest)
2. WriteEventPublisher.publish(WriteEvent{type=CREATE, key, data})
   → RabbitTemplate.convertAndSend(exchange, routingKey, event)
   → CloudAMQP receives message
3. HTTP 202 Accepted (latency < 5ms)

[Async - background thread]:
4. WriteEventConsumer.onWriteEvent(event)
5. WriteService.create(key, data) → InMemoryDatabase.save()
6. CacheService.put(key, savedData) → Hazelcast IMap.put()
```

---

## 6. API Reference

Base URL: `http://localhost:8080/api/agent`

| Method | Path | Mô tả | Response |
|--------|------|-------|---------|
| `GET` | `/{key}` | Đọc dữ liệu (Cache-Aside) | `200 OK` với `source: "cache"\|"database"` |
| `POST` | `/` | Tạo mới (async qua MQ) | `202 Accepted` |
| `PUT` | `/{key}` | Cập nhật (async qua MQ) | `202 Accepted` |
| `DELETE` | `/{key}` | Xóa (async qua MQ) | `202 Accepted` |
| `DELETE` | `/cache/flush` | Xóa toàn bộ Hazelcast IMap | `200 OK` |
| `GET` | `/cache/stats` | Thống kê Hazelcast | `200 OK` |
| `GET` | `/mq/status` | Kiểm tra kết nối RabbitMQ | `200 OK` |

### Response format

```json
{
  "source": "cache",
  "data": { "name": "Nguyen Van A", "age": 25 },
  "status": 200,
  "message": "Dữ liệu từ Hazelcast Cache",
  "latencyMs": 1,
  "operation": "READ",
  "timestamp": "2026-04-24T07:08:29Z"
}
```

### Ví dụ

```bash
# Tạo dữ liệu
curl -X POST http://localhost:8080/api/agent \
  -H "Content-Type: application/json" \
  -d '{"key":"user:1001","data":{"name":"Alice","age":25}}'

# Đọc (lần 1 = database, lần 2 = cache)
curl http://localhost:8080/api/agent/user:1001

# Xem cache stats
curl http://localhost:8080/api/agent/cache/stats

# Kiểm tra RabbitMQ
curl http://localhost:8080/api/agent/mq/status
```

---

## 7. Load Test — Luồng hoạt động

### Các giai đoạn khi nhấn "Run"

#### Giai đoạn 1 — Setup (sequential, 1 lần)

```
① DELETE /cache/flush         ← Xóa Hazelcast IMap (nếu chọn)
② POST /                      ← Tạo key → MQ → Consumer → DB + Cache
③ await 400ms                 ← Chờ MQ consumer ghi DB xong
```

#### Giai đoạn 2 — Concurrent Batching

```
Cấu hình: 1000 req, concurrency = 20 → 50 batches

Batch 1:  Promise.all([GET ×20])  → 20 request song song
Batch 2:  Promise.all([GET ×20])  → tiếp tục
...
Batch 50: Promise.all([GET ×20])  → hoàn tất
```

**Request đầu tiên (cache cold):**
```
GET /bench:key1
  → Hazelcast: MISS
  → InMemoryDatabase.find() → data
  → Hazelcast.put()   ← warm cache
  → source: "database", latency: ~8–15ms
```

**Request 2–1000 (cache warm):**
```
GET /bench:key1
  → Hazelcast: HIT ✅
  → source: "cache", latency: ~1–2ms
```

#### Giai đoạn 3 — Tính toán kết quả

| Metric | Công thức |
|--------|-----------|
| Throughput | `n / totalMs × 1000` req/s |
| Cache Hit Rate | `cacheHits / n × 100` % |
| p50/p95/p99 | Sort mảng latencies → lấy index 50%/95%/99% |

#### So sánh hiệu năng

| Mode | 1000 req | Throughput |
|------|----------|------------|
| Sequential (concurrency=1) | ~3,000ms | ~330 req/s |
| Concurrent (concurrency=20) | ~150ms | ~6,700 req/s |
| Concurrent (concurrency=50) | ~80ms | ~12,500 req/s |

> Hazelcast cache hit (~1ms) vs DB miss (~10ms) → **10× latency improvement** per request.

---

## 8. Cấu trúc thư mục

```
spring-ai-hazelcast-agent/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/example/cacheagent/
│       ├── CacheAgentApplication.java
│       ├── config/
│       │   ├── HazelcastConfig.java
│       │   ├── RabbitMQConfig.java
│       │   ├── CorsConfig.java
│       │   └── RestTemplateConfig.java
│       ├── controller/
│       │   ├── AgentController.java
│       │   └── GlobalExceptionHandler.java
│       ├── dto/
│       │   ├── ApiResponse.java
│       │   └── WriteRequest.java
│       ├── mq/
│       │   ├── WriteEvent.java
│       │   ├── WriteEventPublisher.java
│       │   └── WriteEventConsumer.java
│       └── service/
│           ├── AgentService.java
│           ├── CacheService.java
│           ├── InMemoryDatabase.java
│           ├── ReadService.java
│           └── WriteService.java
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx           ← Toàn bộ UI
│       ├── index.css
│       └── main.jsx
│
└── README.md
```

---

## 9. Cài đặt & Chạy

### Yêu cầu

- Java 17+
- Maven 3.8+
- Node.js 18+

### Backend

```bash
cd backend
mvn spring-boot:run
# Khởi động tại http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Khởi động tại http://localhost:5173
```

### Kiểm tra

```bash
# Backend health
curl http://localhost:8080/actuator/health

# MQ status
curl http://localhost:8080/api/agent/mq/status

# Cache stats
curl http://localhost:8080/api/agent/cache/stats
```

---

## 10. Cấu hình

### `application.yml` — Các tham số quan trọng

```yaml
spring:
  rabbitmq:
    host: armadillo.rmq.cloudamqp.com
    port: 5671          # AMQP over SSL
    ssl:
      enabled: true
    listener:
      simple:
        concurrency: 2        # Số consumer thread tối thiểu
        max-concurrency: 5    # Số consumer thread tối đa

hazelcast:
  cache:
    map-name: app-cache
    ttl-seconds: 300     # Hết hạn sau 5 phút
    max-size: 10000      # Tối đa 10,000 entries
```

### RabbitMQ Topology

```
Exchange: cache-agent.exchange  (Topic)
Queue:    cache-agent.write-events  (durable)
Binding:  routing-key = "write-event"
```

### Hazelcast Map Config

| Tham số | Giá trị | Ý nghĩa |
|---------|---------|---------|
| `ttl-seconds` | 300 | Entry tự động xóa sau 5 phút không access |
| `max-size` | 10,000 | Số entry tối đa trong IMap |
| `eviction-policy` | LRU (mặc định) | Xóa entry ít dùng nhất khi đầy |

---

## Kết quả minh họa

Sau khi chạy Load Test với `1000 requests, concurrency=20`:

```
⏱ Tổng thời gian:  ~0.15s
⚡ Throughput:      ~6,700 req/s
🎯 Cache Hit Rate:  99.9%  (999/1000 từ Hazelcast)
🗄️ DB Hits:         1      (lần đầu tiên - cache cold)

Latency percentiles:
  Min:   0.8ms
  Avg:   1.2ms
  p50:   1.1ms
  p95:   2.3ms
  p99:   4.1ms
  Max:   14.2ms  ← request đầu (DB hit)
```
