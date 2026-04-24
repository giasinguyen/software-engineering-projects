package com.example.cacheagent.controller;

import com.example.cacheagent.config.RabbitMQConfig;
import com.example.cacheagent.dto.ApiResponse;
import com.example.cacheagent.dto.WriteRequest;
import com.example.cacheagent.mq.WriteEvent;
import com.example.cacheagent.mq.WriteEventPublisher;
import com.example.cacheagent.service.AgentService;
import com.example.cacheagent.service.InMemoryDatabase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AgentController - REST API cho AI Agent xử lý request.
 *
 * Base URL: /api/agent
 *
 * Endpoints:
 *  GET    /api/agent/{key}         → Đọc dữ liệu (cache-aside)
 *  POST   /api/agent               → Tạo mới (write-through)
 *  PUT    /api/agent/{key}         → Cập nhật (write-through)
 *  DELETE /api/agent/{key}         → Xóa (invalidation)
 *  DELETE /api/agent/cache/flush   → Xóa toàn bộ cache (admin)
 *  GET    /api/agent/cache/stats   → Thống kê cache
 */
@Slf4j
@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService        agentService;
    private final InMemoryDatabase    db;
    private final WriteEventPublisher publisher;

    // ─── READ ─────────────────────────────────────────────────────────────────

    /**
     * Đọc dữ liệu theo key.
     * Kiểm tra cache trước, nếu miss thì gọi Read Service.
     *
     * GET /api/agent/{key}
     *
     * Response:
     * {
     *   "source": "cache" | "database",
     *   "data": { ... },
     *   "status": 200,
     *   "message": "...",
     *   "latencyMs": 3,
     *   "operation": "READ",
     *   "timestamp": "2024-01-01T00:00:00Z"
     * }
     */
    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> read(
            @PathVariable String key) {

        log.info("[CONTROLLER] GET /api/agent/{}", key);
        ApiResponse<Map<String, Object>> response = agentService.read(key);

        int httpStatus = response.getStatus();
        return ResponseEntity.status(httpStatus).body(response);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    /**
     * Tạo mới dữ liệu → ghi DB → lưu cache.
     *
     * POST /api/agent
     * Body: { "key": "user:1001", "data": { "name": "Minh" } }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @Valid @RequestBody WriteRequest request) {

        long start = System.currentTimeMillis();
        log.info("[CONTROLLER] POST /api/agent key={} → MQ", request.getKey());

        publisher.publish(WriteEvent.builder()
                .type("CREATE")
                .key(request.getKey())
                .data(request.getData())
                .timestamp(System.currentTimeMillis())
                .build());

        long latency = System.currentTimeMillis() - start;
        return ResponseEntity.accepted()
                .body(ApiResponse.queued(request.getKey(), "CREATE", latency));
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Cập nhật dữ liệu → ghi DB → cập nhật cache.
     *
     * PUT /api/agent/{key}
     * Body: { "name": "Minh Updated", "age": 29 }
     */
    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable String key,
            @RequestBody Map<String, Object> data) {

        long start = System.currentTimeMillis();
        log.info("[CONTROLLER] PUT /api/agent/{} → MQ", key);

        publisher.publish(WriteEvent.builder()
                .type("UPDATE")
                .key(key)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build());

        long latency = System.currentTimeMillis() - start;
        return ResponseEntity.accepted()
                .body(ApiResponse.queued(key, "UPDATE", latency));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    /**
     * Xóa dữ liệu → xóa DB → evict cache.
     *
     * DELETE /api/agent/{key}
     */
    @DeleteMapping("/{key}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String key) {
        long start = System.currentTimeMillis();
        log.info("[CONTROLLER] DELETE /api/agent/{} → MQ", key);

        publisher.publish(WriteEvent.builder()
                .type("DELETE")
                .key(key)
                .timestamp(System.currentTimeMillis())
                .build());

        long latency = System.currentTimeMillis() - start;
        return ResponseEntity.accepted()
                .body(ApiResponse.queued(key, "DELETE", latency));
    }

    // ─── ADMIN: Cache Management ──────────────────────────────────────────────

    /**
     * Xóa toàn bộ Hazelcast cache (dùng khi cần force refresh).
     *
     * DELETE /api/agent/cache/flush
     */
    @DeleteMapping("/cache/flush")
    public ResponseEntity<Map<String, String>> flushCache() {
        log.warn("[CONTROLLER] FLUSH cache được gọi!");
        agentService.flushCache();
        return ResponseEntity.ok(Map.of(
            "status",  "success",
            "message", "Toàn bộ cache đã được xóa"
        ));
    }

    /**
     * Lấy thống kê cache từ Hazelcast.
     *
     * GET /api/agent/cache/stats
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> cacheStats() {
        Map<String, Long> stats = agentService.getCacheStats();
        return ResponseEntity.ok(Map.of(
            "source", "hazelcast-embedded",
            "dbSize", db.size(),
            "stats",  stats
        ));
    }

    // ─── MQ Status ────────────────────────────────────────────────────────────

    /**
     * Kiểm tra trạng thái kết nối RabbitMQ.
     *
     * GET /api/agent/mq/status
     */
    @GetMapping("/mq/status")
    public ResponseEntity<Map<String, Object>> mqStatus() {
        boolean connected = publisher.isConnected();
        return ResponseEntity.ok(Map.of(
            "connected",  connected,
            "host",       "armadillo.rmq.cloudamqp.com:5671",
            "queue",      RabbitMQConfig.QUEUE,
            "exchange",   RabbitMQConfig.EXCHANGE,
            "routingKey", RabbitMQConfig.ROUTING_KEY,
            "pattern",    "Async Write-Through"
        ));
    }
}
