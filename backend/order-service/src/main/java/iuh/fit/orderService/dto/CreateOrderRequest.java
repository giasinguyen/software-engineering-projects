package iuh.fit.orderService.dto;

import iuh.fit.orderService.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 món")
    private List<OrderItemRequest> items;

    private PaymentMethod paymentMethod = PaymentMethod.COD;

    private String note;

    @Data
    public static class OrderItemRequest {
        @NotBlank(message = "foodId không được để trống")
        private String foodId;

        private int quantity = 1;
    }
}
