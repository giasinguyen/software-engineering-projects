package com.example.cacheagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Write Service — ghi/cập nhật/xóa dữ liệu vào database.
 * Demo: dùng InMemoryDatabase. Production: gọi HTTP đến write-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WriteService {

    private final InMemoryDatabase db;

    public Map<String, Object> create(String key, Map<String, Object> data) {
        log.debug("[WRITE SERVICE] create key={}", key);
        return db.save(key, data);
    }

    public Map<String, Object> update(String key, Map<String, Object> data) {
        log.debug("[WRITE SERVICE] update key={}", key);
        return db.update(key, data);
    }

    public void delete(String key) {
        log.debug("[WRITE SERVICE] delete key={}", key);
        db.delete(key);
    }
}

