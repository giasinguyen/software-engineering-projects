package com.example.cacheagent.service;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.map.IMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Service quản lý cache trên Hazelcast Cloud.
 * Dùng IMap - distributed map được replicate trên tất cả các node.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final HazelcastInstance hazelcastInstance;

    @Value("${hazelcast.cache.map-name:app-cache}")
    private String mapName;

    @Value("${hazelcast.cache.ttl-seconds:300}")
    private long ttlSeconds;

    // ─── Lấy IMap instance ────────────────────────────────────────────────────

    private IMap<String, Object> getMap() {
        return hazelcastInstance.getMap(mapName);
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    /**
     * Lấy dữ liệu từ cache.
     * @return dữ liệu nếu có (cache hit), null nếu không có (cache miss)
     */
    public Object get(String key) {
        Object value = getMap().get(key);
        if (value != null) {
            log.debug("[CACHE HIT] key={}", key);
        } else {
            log.debug("[CACHE MISS] key={}", key);
        }
        return value;
    }

    /**
     * Kiểm tra key có tồn tại trong cache không (không tăng hit count).
     */
    public boolean exists(String key) {
        return getMap().containsKey(key);
    }

    // ─── WRITE ────────────────────────────────────────────────────────────────

    /**
     * Lưu dữ liệu vào cache với TTL mặc định từ config.
     */
    public void put(String key, Object value) {
        if (ttlSeconds > 0) {
            getMap().put(key, value, ttlSeconds, TimeUnit.SECONDS);
            log.debug("[CACHE PUT] key={} ttl={}s", key, ttlSeconds);
        } else {
            getMap().put(key, value);
            log.debug("[CACHE PUT] key={} (no TTL)", key);
        }
    }

    /**
     * Lưu dữ liệu với TTL tùy chỉnh.
     */
    public void put(String key, Object value, long ttl, TimeUnit unit) {
        getMap().put(key, value, ttl, unit);
        log.debug("[CACHE PUT] key={} ttl={}{}", key, ttl, unit);
    }

    /**
     * Cập nhật dữ liệu đã có trong cache (set-and-forget, không block).
     */
    public void update(String key, Object value) {
        if (getMap().containsKey(key)) {
            put(key, value);
            log.debug("[CACHE UPDATE] key={}", key);
        } else {
            log.debug("[CACHE UPDATE SKIP] key={} không tồn tại trong cache", key);
        }
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    /**
     * Xóa key khỏi cache (invalidate).
     */
    public void evict(String key) {
        getMap().remove(key);
        log.debug("[CACHE EVICT] key={}", key);
    }

    /**
     * Xóa tất cả cache (dùng cẩn thận).
     */
    public void evictAll() {
        getMap().clear();
        log.warn("[CACHE CLEAR] Toàn bộ cache đã bị xóa!");
    }

    // ─── STATS ────────────────────────────────────────────────────────────────

    /**
     * Trả về số lượng entry hiện có trong cache.
     */
    public int size() {
        return getMap().size();
    }

    /**
     * Lấy local map stats (hit/miss/eviction).
     */
    public Map<String, Long> getStats() {
        var stats = getMap().getLocalMapStats();
        long hits   = stats.getHits();
        long misses = Math.max(0, stats.getGetOperationCount() - hits);
        return Map.of(
            "hits",       hits,
            "misses",     misses,
            "puts",       stats.getPutOperationCount(),
            "removes",    stats.getRemoveOperationCount(),
            "heapCost",   stats.getHeapCost(),
            "ownedCount", stats.getOwnedEntryCount()
        );
    }
}
