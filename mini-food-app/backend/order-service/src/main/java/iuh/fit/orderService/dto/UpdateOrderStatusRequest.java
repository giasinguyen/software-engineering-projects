package iuh.fit.orderService.dto;

import iuh.fit.orderService.enums.OrderStatus;
import iuh.fit.orderService.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private OrderStatus status;

    // Tuỳ chọn — payment-service gửi kèm để đồng bộ phương thức thanh toán
    private PaymentMethod paymentMethod;
}
