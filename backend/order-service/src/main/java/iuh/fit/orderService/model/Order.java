package iuh.fit.orderService.model;

import iuh.fit.orderService.enums.OrderStatus;
import iuh.fit.orderService.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    private String userId;          // ID người đặt (từ User Service)
    private String userName;        // Tên người đặt (cached)

    private List<OrderItem> items;  // Danh sách món ăn

    private double totalAmount;     // Tổng tiền

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    private String note;            // Ghi chú đơn hàng
}
