package com.example.cacheagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Read Service — đọc dữ liệu từ database.
 * Demo: dùng InMemoryDatabase. Production: gọi HTTP đến read-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReadService {

    private final InMemoryDatabase db;

    /**
     * Lấy dữ liệu theo key.
     * @return dữ liệu dạng Map, hoặc null nếu không tìm thấy
     */
    public Map<String, Object> findByKey(String key) {
        log.debug("[READ SERVICE] findByKey key={}", key);
        Map<String, Object> result = db.find(key);
        if (result == null) {
            log.warn("[READ SERVICE] Key không tồn tại: {}", key);
        }
        return result;
    }
}

