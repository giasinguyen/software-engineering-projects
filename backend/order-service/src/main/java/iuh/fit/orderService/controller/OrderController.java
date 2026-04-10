package iuh.fit.orderService.controller;

import iuh.fit.orderService.dto.CreateOrderRequest;
import iuh.fit.orderService.dto.OrderResponse;
import iuh.fit.orderService.dto.UpdateOrderStatusRequest;
import iuh.fit.orderService.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /orders
     * Tạo đơn hàng mới.
     * Body: { userId, items: [{foodId, quantity}], paymentMethod, note }
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /orders
     * Lấy tất cả đơn hàng (ADMIN).
     * Có thể lọc theo userId: GET /orders?userId=xxx
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String userId) {
        if (userId != null && !userId.isBlank()) {
            return ResponseEntity.ok(orderService.getOrdersByUser(userId));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * GET /orders/{id}
     * Lấy chi tiết một đơn hàng theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * PUT /orders/{id}/status
     * Cập nhật trạng thái đơn hàng.
     * Body: { status: "CONFIRMED" | "PREPARING" | "DELIVERED" | "CANCELLED" }
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
    }

    /**
     * PUT /orders/{id}/cancel
     * Hủy đơn hàng (shortcut).
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable String id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }
}
