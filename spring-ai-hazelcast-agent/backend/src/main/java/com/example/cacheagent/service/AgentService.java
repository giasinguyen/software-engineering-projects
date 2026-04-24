package com.example.cacheagent.service;

import com.example.cacheagent.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * AgentService - Trung tâm xử lý của hệ thống.
 *
 * Chiến lược cache:
 *  - READ  → Cache-Aside (lazy loading): check cache → DB → put cache
 *  - WRITE → Write-Through: ghi DB → cập nhật cache ngay lập tức
 *  - DELETE → Invalidation: xóa DB → evict cache
 *
 * Nguyên tắc bất biến:
 *  1. Không gọi DB nếu cache có dữ liệu (cache hit)
 *  2. Sau mỗi lần ghi/xóa DB thành công → cache luôn được đồng bộ
 *  3. Mọi response đều có trường "source" = "cache" | "database"
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final CacheService cacheService;
    private final ReadService  readService;
    private final WriteService writeService;

    // ─── READ ─────────────────────────────────────────────────────────────────

    /**
     * Xử lý request đọc dữ liệu theo key.
     *
     * Luồng:
     *  1. Kiểm tra Hazelcast IMap
     *  2a. Cache HIT  → trả về ngay (không gọi DB)
     *  2b. Cache MISS → gọi Read Service → lưu cache → trả về
     */
    @SuppressWarnings("unchecked")
    public ApiResponse<Map<String, Object>> read(String key) {
        long start = System.currentTimeMillis();
        log.info("[AGENT READ] Bắt đầu xử lý key={}", key);

        // Bước 1: Kiểm tra cache
        Object cached = cacheService.get(key);

        if (cached != null) {
            // ── Cache HIT ──
            long latency = System.currentTimeMillis() - start;
            log.info("[AGENT READ] Cache HIT key={} latency={}ms", key, latency);
            return ApiResponse.fromCache((Map<String, Object>) cached, latency);
        }

        // ── Cache MISS: gọi Read Service ──
        log.info("[AGENT READ] Cache MISS key={}, gọi Read Service...", key);
        Map<String, Object> data = readService.findByKey(key);

        if (data == null) {
            log.warn("[AGENT READ] Không tìm thấy dữ liệu key={}", key);
            return ApiResponse.notFound(key);
        }

        // Bước 2: Lưu vào cache để lần sau cache hit
        cacheService.put(key, data);
        log.info("[AGENT READ] Đã lưu vào cache key={}", key);

        long latency = System.currentTimeMillis() - start;
        log.info("[AGENT READ] Hoàn thành key={} latency={}ms (source=database)", key, latency);
        return ApiResponse.fromDatabase(data, latency);
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    /**
     * Xử lý request tạo mới dữ liệu.
     *
     * Luồng:
     *  1. Gọi Write Service → ghi vào DB
     *  2. Nếu thành công → lưu vào Hazelcast cache
     */
    public ApiResponse<Map<String, Object>> create(String key, Map<String, Object> data) {
        long start = System.currentTimeMillis();
        log.info("[AGENT CREATE] key={}", key);

        // Bước 1: Ghi vào DB qua Write Service
        Map<String, Object> saved = writeService.create(key, data);

        // Bước 2: Lưu vào cache (write-through)
        cacheService.put(key, saved != null ? saved : data);
        log.info("[AGENT CREATE] Đã lưu DB + cache key={}", key);

        long latency = System.currentTimeMillis() - start;
        return ApiResponse.written(saved != null ? saved : data, latency, "CREATE");
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    /**
     * Xử lý request cập nhật dữ liệu.
     *
     * Luồng:
     *  1. Gọi Write Service → cập nhật DB
     *  2. Nếu thành công → cập nhật cache ngay lập tức (write-through)
     */
    public ApiResponse<Map<String, Object>> update(String key, Map<String, Object> data) {
        long start = System.currentTimeMillis();
        log.info("[AGENT UPDATE] key={}", key);

        // Bước 1: Cập nhật DB
        Map<String, Object> updated = writeService.update(key, data);

        // Bước 2: Cập nhật cache (write-through, đảm bảo nhất quán)
        Map<String, Object> toCache = updated != null ? updated : data;
        cacheService.put(key, toCache);
        log.info("[AGENT UPDATE] Đã cập nhật DB + cache key={}", key);

        long latency = System.currentTimeMillis() - start;
        return ApiResponse.written(toCache, latency, "UPDATE");
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    /**
     * Xử lý request xóa dữ liệu.
     *
     * Luồng:
     *  1. Gọi Write Service → xóa khỏi DB
     *  2. Nếu thành công → evict key khỏi cache (invalidation)
     */
    public ApiResponse<Void> delete(String key) {
        long start = System.currentTimeMillis();
        log.info("[AGENT DELETE] key={}", key);

        // Bước 1: Xóa khỏi DB
        writeService.delete(key);

        // Bước 2: Invalidate cache
        cacheService.evict(key);
        log.info("[AGENT DELETE] Đã xóa DB + evict cache key={}", key);

        long latency = System.currentTimeMillis() - start;
        return ApiResponse.deleted(latency);
    }

    // ─── CACHE MANAGEMENT ────────────────────────────────────────────────────

    /**
     * Xóa toàn bộ cache (admin operation).
     */
    public void flushCache() {
        cacheService.evictAll();
    }

    /**
     * Lấy thống kê cache.
     */
    public Map<String, Long> getCacheStats() {
        return cacheService.getStats();
    }
}
