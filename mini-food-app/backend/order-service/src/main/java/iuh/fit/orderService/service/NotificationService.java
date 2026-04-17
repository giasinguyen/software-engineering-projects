package iuh.fit.orderService.service;

import iuh.fit.orderService.model.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Notification Service: gửi thông báo khi có sự kiện đơn hàng.
 * Hiện tại dùng console log (có thể mở rộng thành REST call, email, v.v.)
 */
@Slf4j
@Service
public class NotificationService {

    public void notifyOrderCreated(Order order) {
        log.info("====================================================");
        log.info("[THÔNG BÁO] Đặt hàng thành công!");
        log.info("  Mã đơn hàng : {}", order.getId());
        log.info("  Người đặt   : {} (ID: {})", order.getUserName(), order.getUserId());
        log.info("  Tổng tiền   : {} VND", String.format("%,.0f", order.getTotalAmount()));
        log.info("  Thanh toán  : {}", order.getPaymentMethod());
        log.info("  Trạng thái  : {}", order.getStatus());
        log.info("  Thời gian   : {}", order.getCreatedAt());
        if (order.getNote() != null && !order.getNote().isBlank()) {
            log.info("  Ghi chú     : {}", order.getNote());
        }
        log.info("====================================================");
    }

    public void notifyOrderStatusUpdated(Order order) {
        log.info("====================================================");
        log.info("[THÔNG BÁO] Cập nhật trạng thái đơn hàng!");
        log.info("  Mã đơn hàng : {}", order.getId());
        log.info("  Trạng thái mới: {}", order.getStatus());
        log.info("  Cập nhật lúc: {}", order.getUpdatedAt());
        log.info("====================================================");
    }
}
