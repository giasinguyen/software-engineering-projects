package iuh.fit.orderService.service;

import iuh.fit.orderService.client.FoodServiceClient;
import iuh.fit.orderService.client.UserServiceClient;
import iuh.fit.orderService.dto.CreateOrderRequest;
import iuh.fit.orderService.dto.OrderResponse;
import iuh.fit.orderService.dto.UpdateOrderStatusRequest;
import iuh.fit.orderService.enums.OrderStatus;
import iuh.fit.orderService.model.Order;
import iuh.fit.orderService.model.OrderItem;
import iuh.fit.orderService.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FoodServiceClient foodServiceClient;
    private final UserServiceClient userServiceClient;
    private final NotificationService notificationService;    // ─────────────────────────────────────────────────────────────────
    // Tạo đơn hàng mới
    // ─────────────────────────────────────────────────────────────────
    public OrderResponse createOrder(CreateOrderRequest request) {

        // 1. Validate user qua User Service (optional - nếu null thì dùng default)
        String userName = "User-" + request.getUserId();  // Default name
        try {
            Map<String, Object> user = userServiceClient.getUserById(request.getUserId());
            if (user != null) {
                userName = resolveUserName(user);
                log.info("Lấy thông tin user thành công: {}", userName);
            } else {
                log.warn("Không tìm thấy user ID: {}, dùng default name", request.getUserId());
            }
        } catch (Exception e) {
            log.warn("Lỗi khi gọi User Service: {}, dùng default name", e.getMessage());
        }

        // 2. Lấy thông tin từng món ăn qua Food Service (optional - nếu null thì dùng default)
        List<OrderItem> orderItems = new ArrayList<>();
        double totalAmount = 0;

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            String foodName = "Food-" + itemReq.getFoodId();
            double unitPrice = 0;
            
            try {
                Map<String, Object> food = foodServiceClient.getFoodById(itemReq.getFoodId());
                if (food != null) {
                    foodName = (String) food.getOrDefault("name", foodName);
                    unitPrice = parseDouble(food.getOrDefault("price", 0));
                    log.info("Lấy thông tin food thành công: {}", foodName);
                } else {
                    log.warn("Không tìm thấy food ID: {}, dùng default", itemReq.getFoodId());
                }
            } catch (Exception e) {
                log.warn("Lỗi khi gọi Food Service cho food {}: {}", itemReq.getFoodId(), e.getMessage());
            }

            int quantity = itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
            OrderItem item = new OrderItem(itemReq.getFoodId(), foodName, quantity, unitPrice);
            orderItems.add(item);
            totalAmount += item.getSubtotal();
        }

        // 3. Tạo và lưu Order vào MongoDB
        Order order = Order.builder()
                .userId(request.getUserId())
                .userName(userName)
                .items(orderItems)
                .totalAmount(totalAmount)
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .build();

        Order savedOrder = orderRepository.save(order);
        log.info("Đã tạo đơn hàng thành công: orderId={}", savedOrder.getId());

        // 4. Gửi thông báo
        notificationService.notifyOrderCreated(savedOrder);

        return OrderResponse.fromOrder(savedOrder);
    }

    // ─────────────────────────────────────────────────────────────────
    // Lấy tất cả đơn hàng
    // ─────────────────────────────────────────────────────────────────
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(OrderResponse::fromOrder)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────
    // Lấy đơn hàng theo ID
    // ─────────────────────────────────────────────────────────────────
    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderId));
        return OrderResponse.fromOrder(order);
    }

    // ─────────────────────────────────────────────────────────────────
    // Lấy đơn hàng theo userId
    // ─────────────────────────────────────────────────────────────────
    public List<OrderResponse> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId)
                .stream()
                .map(OrderResponse::fromOrder)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────
    // Cập nhật trạng thái đơn hàng (thanh toán / hủy / xác nhận...)
    // ─────────────────────────────────────────────────────────────────
    public OrderResponse updateOrderStatus(String orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderId));

        // Kiểm tra luồng trạng thái hợp lệ
        validateStatusTransition(order.getStatus(), request.getStatus());

        order.setStatus(request.getStatus());
        // Đồng bộ phương thức thanh toán nếu payment-service gửi kèm
        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }
        order.setUpdatedAt(LocalDateTime.now());

        Order updated = orderRepository.save(order);
        log.info("Cập nhật trạng thái đơn hàng: orderId={}, status={}", orderId, updated.getStatus());

        // Gửi thông báo
        notificationService.notifyOrderStatusUpdated(updated);

        return OrderResponse.fromOrder(updated);
    }

    // ─────────────────────────────────────────────────────────────────
    // Hủy đơn hàng
    // ─────────────────────────────────────────────────────────────────
    public OrderResponse cancelOrder(String orderId) {
        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.CANCELLED);
        return updateOrderStatus(orderId, req);
    }

    // ─────────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────────

    private String resolveUserName(Map<String, Object> user) {
        // Thử các key phổ biến mà User Service có thể trả về
        if (user.containsKey("username")) return (String) user.get("username");
        if (user.containsKey("name"))     return (String) user.get("name");
        if (user.containsKey("fullName")) return (String) user.get("fullName");
        return "User-" + user.get("id");
    }

    private double parseDouble(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try { return Double.parseDouble(value.toString()); }
        catch (NumberFormatException e) { return 0; }
    }

    /**
     * Kiểm tra chuyển trạng thái hợp lệ.
     * PENDING → CONFIRMED / CANCELLED
     * CONFIRMED → PREPARING / CANCELLED
     * PREPARING → DELIVERED
     * DELIVERED, CANCELLED → không thể thay đổi
     */
    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING    -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED  -> next == OrderStatus.PREPARING || next == OrderStatus.CANCELLED;
            case PREPARING  -> next == OrderStatus.DELIVERED;
            default         -> false; // DELIVERED, CANCELLED không thay đổi được
        };
        if (!valid) {
            throw new RuntimeException(
                String.format("Không thể chuyển trạng thái từ %s sang %s", current, next)
            );
        }
    }
}
