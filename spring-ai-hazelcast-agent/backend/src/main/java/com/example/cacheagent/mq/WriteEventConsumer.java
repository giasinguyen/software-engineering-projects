package com.example.cacheagent.mq;

import com.example.cacheagent.config.RabbitMQConfig;
import com.example.cacheagent.service.CacheService;
import com.example.cacheagent.service.WriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Nhận WriteEvent từ RabbitMQ và thực hiện ghi DB + đồng bộ cache.
 *
 * Chạy bất đồng bộ: HTTP thread không chờ → latency thấp ở phía client.
 * Concurrency 2–5 consumer threads (cấu hình ở application.yml).
 *
 * Luồng:
 *  RabbitMQ queue → onWriteEvent() → WriteService (DB) → CacheService (Hazelcast)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WriteEventConsumer {

    private final WriteService  writeService;
    private final CacheService  cacheService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void onWriteEvent(WriteEvent event) {
        if (event == null || event.getType() == null || event.getKey() == null) {
            log.warn("[MQ CONSUME] Nhận event không hợp lệ, bỏ qua.");
            return;
        }

        long start = System.currentTimeMillis();
        log.info("[MQ CONSUME] ← type={} key={}", event.getType(), event.getKey());

        try {
            switch (event.getType()) {
                case "CREATE" -> {
                    Map<String, Object> saved = writeService.create(event.getKey(), event.getData());
                    cacheService.put(event.getKey(), saved != null ? saved : event.getData());
                    log.info("[MQ CONSUME] ✅ CREATE key={} in {}ms",
                            event.getKey(), System.currentTimeMillis() - start);
                }
                case "UPDATE" -> {
                    Map<String, Object> updated = writeService.update(event.getKey(), event.getData());
                    if (updated != null) {
                        cacheService.put(event.getKey(), updated);
                    }
                    log.info("[MQ CONSUME] ✅ UPDATE key={} in {}ms",
                            event.getKey(), System.currentTimeMillis() - start);
                }
                case "DELETE" -> {
                    writeService.delete(event.getKey());
                    cacheService.evict(event.getKey());
                    log.info("[MQ CONSUME] ✅ DELETE key={} in {}ms",
                            event.getKey(), System.currentTimeMillis() - start);
                }
                default -> log.warn("[MQ CONSUME] Loại event không xác định: {}", event.getType());
            }
        } catch (Exception e) {
            log.error("[MQ CONSUME] ❌ Lỗi xử lý type={} key={}: {}",
                    event.getType(), event.getKey(), e.getMessage(), e);
            // Không ném exception → message sẽ không bị requeue vô hạn
        }
    }
}
