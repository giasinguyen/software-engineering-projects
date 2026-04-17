## Plan: Movie Ticket System – Event-Driven, 4 người

Hệ thống đặt vé xem phim với kiến trúc Event-Driven, giao tiếp qua RabbitMQ (CloudAMQP). Gộp Movie + Booking cho 1 người vì Movie Service đơn giản (chỉ CRUD).

---

### Phân công

| Người | Phụ trách | Tech |
|-------|-----------|------|
| **1** | Frontend (React + Vite) | React 18, Tailwind, Axios |
| **2** | User Service | Spring Boot, Spring AMQP |
| **3** | Movie + Booking Service (CORE) | Spring Boot, Spring AMQP |
| **4** | Payment + Notification Service | Node.js, Express, amqplib |

---

### Event Flow

```
User Register → User Service → publish USER_REGISTERED
Đặt vé → Booking Service → publish BOOKING_CREATED
  → Payment Service (consume) → random success/fail
    → publish PAYMENT_COMPLETED hoặc BOOKING_FAILED
      → Notification Service (consume) → log thông báo
      → Booking Service (consume) → update booking status
```

### RabbitMQ Config (chung cho team)
- **Exchange**: `movie-ticket-events` (topic)
- **Routing keys**: `user.registered`, `booking.created`, `payment.completed`, `booking.failed`
- **Queues**: `payment-queue` (bind `booking.created`), `notification-queue` (bind `payment.completed`), `booking-update-queue` (bind `payment.completed` + `booking.failed`)

---

### Chi tiết từng người

**Người 1 – Frontend**
- Pages: Login, Register, Danh sách phim, Đặt vé (chọn phim + số ghế), Lịch sử booking
- Gọi API trực tiếp vào từng service (hoặc qua API Gateway nếu có)
- Hiển thị trạng thái booking (PENDING → CONFIRMED/FAILED)

**Người 2 – User Service (port 8081)**
- `POST /api/register` → lưu DB + publish `USER_REGISTERED`
- `POST /api/login` → xác thực, trả token/session
- Database: MongoDB collection `users`

**Người 3 – Movie + Booking Service (port 8082/8083)**
- Movie: `GET /api/movies`, `POST /api/movies` (CRUD đơn giản, không cần event)
- Booking: `POST /api/bookings` → lưu status=PENDING + publish `BOOKING_CREATED`
- Booking: `GET /api/bookings` → trả danh sách booking
- **Listen** `payment.completed` / `booking.failed` → update booking status thành CONFIRMED/FAILED
- Database: MongoDB collections `movies`, `bookings`

**Người 4 – Payment + Notification (port 8084)**
- Payment: Listen `BOOKING_CREATED` → setTimeout giả lập → random 70% success / 30% fail → publish `PAYMENT_COMPLETED` hoặc `BOOKING_FAILED`
- Notification: Listen `PAYMENT_COMPLETED` → console.log `"Booking #123 thành công! User: A"`
- Chạy chung 1 Node.js app, 2 consumer channels

---

### Phases

**Phase 1 – Setup (cùng làm, ~1 buổi)**
1. Tạo project structure cho từng service
2. Tạo account CloudAMQP, share connection string
3. Thống nhất format event message (JSON): `{ event, data, timestamp }`

**Phase 2 – Core Dev (song song)**
4. Người 1: UI pages với mock data
5. Người 2: User register/login + publish event
6. Người 3: Movie CRUD + Booking API + publish/listen events
7. Người 4: Payment consumer + Notification consumer

**Phase 3 – Integration**
8. Frontend kết nối API thật
9. Test end-to-end flow
10. Fix CORS, connection issues

**Phase 4 – Demo**
11. Chạy trên LAN hoặc Docker Compose
12. Demo kịch bản bắt buộc

### Verification
1. Register → kiểm tra RabbitMQ có message `user.registered`
2. Đặt vé → Payment service log nhận `booking.created`
3. Payment xử lý → Booking status updated trong DB
4. Notification log `"Booking #123 thành công!"`
5. Frontend hiển thị đúng trạng thái booking

### Ports
| Service | Port |
|---------|------|
| User Service | 8081 |
| Movie Service | 8082 |
| Booking Service | 8083 |
| Payment+Notification | 8084 |
| Frontend | 5173 (dev) / 80 (prod) |

---

