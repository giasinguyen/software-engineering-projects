package com.example.cacheagent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory database dùng cho demo — thay thế cho Read/Write Service thực.
 * Trong production, đây sẽ là các HTTP calls đến microservices thực.
 */
@Slf4j
@Component
public class InMemoryDatabase {

    private final ConcurrentHashMap<String, Map<String, Object>> store = new ConcurrentHashMap<>();

    public Map<String, Object> find(String key) {
        Map<String, Object> value = store.get(key);
        log.debug("[DB] READ key={} found={}", key, value != null);
        return value;
    }

    public Map<String, Object> save(String key, Map<String, Object> data) {
        Map<String, Object> record = new HashMap<>(data);
        record.put("_key", key);
        record.put("_savedAt", System.currentTimeMillis());
        store.put(key, Collections.unmodifiableMap(record));
        log.debug("[DB] SAVE key={}", key);
        return store.get(key);
    }

    public Map<String, Object> update(String key, Map<String, Object> data) {
        Map<String, Object> existing = store.getOrDefault(key, new HashMap<>());
        Map<String, Object> merged = new HashMap<>(existing);
        merged.putAll(data);
        merged.put("_key", key);
        merged.put("_updatedAt", System.currentTimeMillis());
        store.put(key, Collections.unmodifiableMap(merged));
        log.debug("[DB] UPDATE key={}", key);
        return store.get(key);
    }

    public boolean delete(String key) {
        boolean existed = store.remove(key) != null;
        log.debug("[DB] DELETE key={} existed={}", key, existed);
        return existed;
    }

    public int size() {
        return store.size();
    }
}
