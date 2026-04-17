package iuh.fit.orderService.dto;

import iuh.fit.orderService.enums.OrderStatus;
import iuh.fit.orderService.enums.PaymentMethod;
import iuh.fit.orderService.model.Order;
import iuh.fit.orderService.model.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {

    private String id;
    private String userId;
    private String userName;
    private List<OrderItem> items;
    private double totalAmount;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String note;

    public static OrderResponse fromOrder(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .userName(order.getUserName())
                .items(order.getItems())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentMethod(order.getPaymentMethod())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .note(order.getNote())
                .build();
    }
}
