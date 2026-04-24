# Spring Boot Cache Agent

AI Agent xử lý request với **Hazelcast Cloud** cache, **Read Service** và **Write Service**.

## Kiến trúc

```
Client Request
     │
     ▼
AgentController  (/api/agent)
     │
     ▼
AgentService  ◄── Logic trung tâm
  │       │
  │       ▼
  │   CacheService  ──► Hazelcast Cloud IMap
  │
  ├── ReadService   ──► Read Service (port 8081)
  └── WriteService  ──► Write Service (port 8082)
```

## Chiến lược Cache

| Operation | Chiến lược       | Luồng                                   |
|-----------|------------------|-----------------------------------------|
| GET       | Cache-Aside      | Check cache → Hit: trả về / Miss: DB → Put cache |
| POST      | Write-Through    | Ghi DB → Lưu cache                      |
| PUT       | Write-Through    | Cập nhật DB → Cập nhật cache            |
| DELETE    | Invalidation     | Xóa DB → Evict cache                   |

## Cấu hình

### 1. Biến môi trường

```bash
export HAZELCAST_CLUSTER_NAME=your-cluster-name
export HAZELCAST_DISCOVERY_TOKEN=your-token-from-hazelcast-cloud
export READ_SERVICE_URL=http://localhost:8081
export WRITE_SERVICE_URL=http://localhost:8082
```

### 2. Hazelcast Cloud

1. Đăng nhập https://cloud.hazelcast.com
2. Tạo cluster mới (Free Tier có sẵn)
3. Copy **Cluster Name** và **Discovery Token**
4. Điền vào biến môi trường trên

## Chạy ứng dụng

```bash
mvn clean package -DskipTests
java -jar target/cache-agent-1.0.0.jar
```

## API Endpoints

### Đọc dữ liệu
```bash
GET /api/agent/{key}

# Ví dụ
curl http://localhost:8080/api/agent/user:1001
```

Response (cache hit):
```json
{
  "source": "cache",
  "data": { "name": "Minh", "age": 28 },
  "status": 200,
  "message": "Dữ liệu từ Hazelcast Cache",
  "latencyMs": 2,
  "operation": "READ",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Response (cache miss, lấy từ DB):
```json
{
  "source": "database",
  "data": { "name": "Minh", "age": 28 },
  "status": 200,
  "message": "Dữ liệu từ Database (đã lưu vào cache)",
  "latencyMs": 45,
  "operation": "READ",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Tạo mới dữ liệu
```bash
POST /api/agent
Content-Type: application/json

{
  "key": "user:1001",
  "data": { "name": "Minh", "age": 28, "email": "minh@example.com" }
}
```

### Cập nhật dữ liệu
```bash
PUT /api/agent/user:1001
Content-Type: application/json

{ "name": "Minh Updated", "age": 29 }
```

### Xóa dữ liệu
```bash
DELETE /api/agent/user:1001
```

### Admin: Xóa toàn bộ cache
```bash
DELETE /api/agent/cache/flush
```

### Admin: Thống kê cache
```bash
GET /api/agent/cache/stats
```

## Cấu trúc Project

```
src/main/java/com/example/cacheagent/
├── CacheAgentApplication.java       # Entry point
├── config/
│   ├── HazelcastConfig.java         # Cấu hình Hazelcast Cloud client
│   └── RestTemplateConfig.java      # HTTP client cho Read/Write Service
├── controller/
│   ├── AgentController.java         # REST API endpoints
│   └── GlobalExceptionHandler.java  # Xử lý lỗi tập trung
├── dto/
│   ├── ApiResponse.java             # Response wrapper chuẩn
│   └── WriteRequest.java            # Request body cho POST
└── service/
    ├── AgentService.java            # Logic trung tâm của Agent
    ├── CacheService.java            # Hazelcast IMap operations
    ├── ReadService.java             # Giao tiếp Read Service
    └── WriteService.java            # Giao tiếp Write Service
```

## Chạy Unit Test

```bash
mvn test
```
