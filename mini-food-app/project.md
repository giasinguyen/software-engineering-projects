# 📦 Mini Food Ordering System — Giải thích kiến trúc

## 1. Tổng quan hệ thống

Đây là hệ thống đặt đồ ăn theo kiến trúc **Microservices** gồm 4 service độc lập và 1 frontend:

```
Frontend (React + Vite)
    │
    ├── User Service   :8081  (Java Spring Boot, JWT auth)
    ├── Food Service   :8082  (Java Spring Boot, CRUD món ăn)
    ├── Order Service  :8083  (Java Spring Boot, tạo/quản lý đơn)
    └── Payment Service :8084  (Node.js Express, xử lý thanh toán)
          │                         │
          └─────── MongoDB Atlas ───┘
                (dùng chung 1 cluster)
```

---

## 2. Vai trò từng service

### 🟦 User Service (Port 8081)
- Đăng ký / Đăng nhập tài khoản
- Phát JWT Token sau khi login
- Xác thực token bằng Spring Security + JwtAuthFilter
- **Expose endpoint nội bộ `GET /users/{id}`** để Order Service gọi lấy tên user

### 🟦 Food Service (Port 8082)
- CRUD danh sách món ăn (tên, giá, mô tả, category)
- **Expose `GET /api/foods/{id}`** để Order Service gọi lấy tên + giá món

### 🟦 Order Service (Port 8083)
- Tạo đơn hàng: nhận `userId` + danh sách `[{foodId, quantity}]`
- **Gọi User Service** (`GET /users/{userId}`) → lấy tên người đặt
- **Gọi Food Service** (`GET /api/foods/{foodId}`) → lấy tên + giá từng món
- Tính `totalAmount`, lưu vào MongoDB
- Nếu một trong hai service kia không trả lời → **không crash**, dùng tên mặc định ("User-xxx", "Food-xxx"), giá = 0

### 🟩 Payment Service (Port 8084)
- Nhận `{orderId, amount, method}`
- Giả lập thanh toán thành công (luôn SUCCESS)
- **Gọi Order Service** (`PUT /orders/{orderId}/status`) → cập nhật trạng thái đơn thành `CONFIRMED`

### 🖥️ Frontend (React + Vite, Port 5173)
- Đọc địa chỉ các service từ biến môi trường `VITE_*` (mặc định là `localhost`)
- Gắn JWT token vào mọi request qua Axios interceptor
- Gọi trực tiếp từng service, **không qua API Gateway**

---

## 3. Luồng hoạt động chi tiết

### Luồng đặt hàng đầy đủ:

```
1. User đăng nhập
   Frontend → POST /api/auth/login → User Service
                                   ← JWT Token

2. User xem món ăn
   Frontend → GET /api/foods → Food Service
                             ← Danh sách món

3. User đặt hàng
   Frontend → POST /orders → Order Service
               Order Service → GET /users/{id} → User Service       (lấy tên)
               Order Service → GET /api/foods/{id} → Food Service   (lấy giá món)
               Order Service → Lưu vào MongoDB
                             ← OrderResponse (status: PENDING)

4. User thanh toán
   Frontend → POST /payments → Payment Service
               Payment Service → PUT /orders/{id}/status → Order Service  (cập nhật CONFIRMED)
                               ← { message: "Thanh toán thành công" }
```

---

## 4. Kết nối giữa các service (Service-to-Service calls)

| Caller | Callee | Endpoint | Mục đích |
|--------|--------|----------|----------|
| Order Service | User Service | `GET /users/{id}` | Lấy tên user khi tạo đơn |
| Order Service | Food Service | `GET /api/foods/{id}` | Lấy tên + giá món ăn |
| Payment Service | Order Service | `PUT /orders/{orderId}/status` | Cập nhật trạng thái đơn → CONFIRMED |

> ⚠️ **Quan trọng:** Order Service dùng **WebClient** (reactive), Payment Service dùng **axios** (Node.js).  
> Cả hai đều có xử lý lỗi — nếu service kia không running thì sẽ log warning, **không throw exception**.

---

## 5. Cơ sở dữ liệu

Tất cả service dùng **chung 1 MongoDB Atlas cluster** nhưng lưu vào **các collection riêng biệt**:

| Service | Collection |
|---------|-----------|
| User Service | `users` |
| Food Service | `foods` |
| Order Service | `orders` |
| Payment Service | `payments` |

Connection string:
```
mongodb+srv://products:admin@mini-food-system.hbvvgpd.mongodb.net/minifood
```

---

## 6. ❓ Tại sao trước đây Order Service không kết nối được?

### Nguyên nhân chính: **Endpoint không khớp**

Order Service gọi:
```
GET /users/{id}         ← UserServiceClient.java
```

User Service có **2 controller**:
- `InternalUserController` → `GET /users/{id}` ✅ (đúng endpoint, `permitAll`)
- `UserController` → `GET /api/users/validate/{id}` ❌ (khác path)

**Nếu lỗi** thường gặp là một trong các nguyên nhân sau:

| Lỗi | Nguyên nhân |
|-----|------------|
| `Connection refused` | User Service hoặc Food Service **chưa được chạy** |
| `404 Not Found` | Gọi sai endpoint (ví dụ `/api/users/` thay vì `/users/`) |
| `401 Unauthorized` | Endpoint chưa được `permitAll()` trong SecurityConfig |
| `CORS error` | Chỉ xảy ra từ trình duyệt, không ảnh hưởng service-to-service |

### Tại sao hiện tại vẫn tạo được đơn hàng dù service khác chết?

Vì `OrderService.java` có **fallback**:
```java
try {
    Map<String, Object> user = userServiceClient.getUserById(...);
    if (user != null) userName = ...;
    else log.warn("Không tìm thấy user, dùng default name");
} catch (Exception e) {
    log.warn("Lỗi khi gọi User Service, dùng default name");
}
```
→ Đơn hàng vẫn được tạo, nhưng `userName = "User-xxx"` và `price = 0` nếu Food Service không phản hồi.

---

## 7. 🏫 Khi chạy LAN (mỗi máy 1 service) — Cần làm gì?

### Phân công máy (ví dụ):

| Máy | Service | Port |
|-----|---------|------|
| Máy 1 (Frontend) | React Vite | 5173 |
| Máy 2 | User Service | 8081 |
| Máy 3 | Food Service | 8082 |
| Máy 4 (bạn) | Order Service | 8083 |
| Máy 5 | Payment Service | 8084 |

---

### ✅ Việc cần làm trước khi lên lớp

#### Bước 1: Tìm IP từng máy
Mỗi người chạy lệnh này để lấy IP LAN:
```powershell
# Windows
ipconfig
# → xem địa chỉ "IPv4 Address" (thường là 192.168.x.x)
```

#### Bước 2: Chỉnh `application-lan.properties` trong Order Service

Mở file [backend/order-service/src/main/resources/application-lan.properties](backend/order-service/src/main/resources/application-lan.properties) và sửa:

```properties
# Thay IP thật của từng máy:
app.user-service.url=http://<IP_MÁY_CHẠY_USER_SERVICE>:8081
app.food-service.url=http://<IP_MÁY_CHẠY_FOOD_SERVICE>:8082
app.cors.allowed-origins=http://<IP_MÁY_CHẠY_FRONTEND>:5173
```

#### Bước 3: Chỉnh `.env` trong Payment Service

Mở file [backend/payment-service/.env](backend/payment-service/.env) và sửa:
```env
ORDER_SERVICE=http://<IP_MÁY_CHẠY_ORDER_SERVICE>:8083
```

#### Bước 4: Chỉnh `.env` trong Frontend

Tạo hoặc sửa file `frontend/.env`:
```env
VITE_USER_SERVICE=http://<IP_MÁY_2>:8081
VITE_FOOD_SERVICE=http://<IP_MÁY_3>:8082
VITE_ORDER_SERVICE=http://<IP_MÁY_4>:8083
VITE_PAYMENT_SERVICE=http://<IP_MÁY_5>:8084
```

#### Bước 5: Chạy Order Service với profile LAN
```powershell
cd backend/order-service
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=lan
```

---

### ⚠️ Các lỗi hay gặp khi chạy LAN

| Lỗi | Nguyên nhân | Cách fix |
|-----|------------|---------|
| `Connection refused` | Firewall chặn port | Tắt Windows Firewall hoặc mở inbound rule cho port 808x |
| `Connection timed out` | Sai IP | Kiểm tra lại `ipconfig` |
| `CORS blocked` | Frontend gọi service bị chặn CORS | Kiểm tra `app.cors.allowed-origins` trong order-service profile LAN |
| Giá = 0, tên = "Food-xxx" | Food/User service chưa chạy | Đảm bảo service kia đã start trước khi tạo đơn |

---

## 8. Tổng kết API endpoints

### User Service `:8081`
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/auth/register` | ❌ | Đăng ký |
| POST | `/api/auth/login` | ❌ | Đăng nhập, trả JWT |
| GET | `/api/users` | ✅ | Lấy danh sách users |
| GET | `/users/{id}` | ❌ | Internal: lấy user theo ID |

### Food Service `:8082`
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/foods` | ❌ | Lấy danh sách món |
| GET | `/api/foods/{id}` | ❌ | Lấy món theo ID |
| POST | `/api/foods` | ❌ | Tạo món mới |
| PUT | `/api/foods/{id}` | ❌ | Cập nhật món |
| DELETE | `/api/foods/{id}` | ❌ | Xóa món |

### Order Service `:8083`
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/orders` | ✅ | Lấy tất cả đơn (có thể lọc `?userId=`) |
| GET | `/orders/{id}` | ✅ | Lấy đơn theo ID |
| POST | `/orders` | ✅ | Tạo đơn hàng mới |
| PUT | `/orders/{id}/status` | ✅ | Cập nhật trạng thái đơn |
| PUT | `/orders/{id}/cancel` | ✅ | Hủy đơn |

### Payment Service `:8084`
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/payments` | ✅ | Tạo thanh toán |
| GET | `/payments` | ✅ | Lấy lịch sử thanh toán |

---

## 9. Chạy nhanh (localhost, 1 máy)

```powershell
# Terminal 1
cd backend/user-service ;  mvn spring-boot:run

# Terminal 2
cd backend/food-service ;  .\mvnw.cmd spring-boot:run

# Terminal 3
cd backend/order-service ; .\mvnw.cmd spring-boot:run

# Terminal 4
cd backend/payment-service ; npm start

# Terminal 5 (frontend)
cd frontend ; npm run dev
```

Frontend chạy tại: http://localhost:5173
