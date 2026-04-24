package com.example.cacheagent.mq;

import com.example.cacheagent.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes WriteEvent messages vào RabbitMQ exchange.
 *
 * Được gọi từ AgentController ngay khi nhận HTTP request ghi —
 * controller trả về 202 Accepted ngay lập tức mà không chờ DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WriteEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publish một WriteEvent lên exchange.
     *
     * @param event sự kiện ghi (CREATE / UPDATE / DELETE)
     */
    public void publish(WriteEvent event) {
        long start = System.currentTimeMillis();
        log.info("[MQ PUBLISH] → type={} key={}", event.getType(), event.getKey());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_KEY,
                event
        );

        long elapsed = System.currentTimeMillis() - start;
        log.info("[MQ PUBLISH] ✅ Published in {}ms type={} key={}",
                elapsed, event.getType(), event.getKey());
    }

    /**
     * Kiểm tra kết nối RabbitMQ.
     *
     * @return true nếu connected
     */
    public boolean isConnected() {
        try {
            var conn = rabbitTemplate.getConnectionFactory().createConnection();
            boolean open = conn.isOpen();
            conn.close();
            return open;
        } catch (Exception e) {
            log.warn("[MQ STATUS] Không thể kết nối RabbitMQ: {}", e.getMessage());
            return false;
        }
    }
}
