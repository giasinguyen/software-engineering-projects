package iuh.fit.orderService.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItem {

    private String foodId;
    private String foodName;
    private int quantity;
    private double unitPrice;

    public double getSubtotal() {
        return unitPrice * quantity;
    }
}
