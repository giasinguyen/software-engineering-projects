package iuh.fit.orderService.enums;

public enum OrderStatus {
    PENDING,        // Chờ xác nhận
    CONFIRMED,      // Đã xác nhận
    PREPARING,      // Đang chuẩn bị
    DELIVERED,      // Đã giao
    CANCELLED       // Đã hủy
}
