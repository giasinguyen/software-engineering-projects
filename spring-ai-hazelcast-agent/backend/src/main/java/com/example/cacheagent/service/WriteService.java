package com.example.cacheagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service giao tiếp với Write Service để ghi/cập nhật/xóa dữ liệu trong database.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WriteService {

    @Qualifier("writeRestTemplate")
    private final RestTemplate restTemplate;

    @Value("${write-service.base-url}")
    private String baseUrl;

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    /**
     * Tạo mới dữ liệu (POST).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> create(String key, Map<String, Object> data) {
        String url = baseUrl + "/api/data";
        log.debug("[WRITE SERVICE] POST {} key={}", url, key);

        Map<String, Object> payload = Map.of("key", key, "data", data);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            log.debug("[WRITE SERVICE] Create success key={}", key);
            return response.getBody();
        } catch (Exception e) {
            log.error("[WRITE SERVICE] Lỗi create key={}: {}", key, e.getMessage());
            throw new RuntimeException("Write Service lỗi khi tạo mới: " + e.getMessage(), e);
        }
    }

    /**
     * Cập nhật dữ liệu (PUT).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> update(String key, Map<String, Object> data) {
        String url = baseUrl + "/api/data/" + key;
        log.debug("[WRITE SERVICE] PUT {} key={}", url, key);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.PUT, request, Map.class);
            log.debug("[WRITE SERVICE] Update success key={}", key);
            return response.getBody();
        } catch (Exception e) {
            log.error("[WRITE SERVICE] Lỗi update key={}: {}", key, e.getMessage());
            throw new RuntimeException("Write Service lỗi khi cập nhật: " + e.getMessage(), e);
        }
    }

    /**
     * Xóa dữ liệu (DELETE).
     */
    public void delete(String key) {
        String url = baseUrl + "/api/data/" + key;
        log.debug("[WRITE SERVICE] DELETE {} key={}", url, key);

        try {
            restTemplate.delete(url);
            log.debug("[WRITE SERVICE] Delete success key={}", key);
        } catch (Exception e) {
            log.error("[WRITE SERVICE] Lỗi delete key={}: {}", key, e.getMessage());
            throw new RuntimeException("Write Service lỗi khi xóa: " + e.getMessage(), e);
        }
    }
}
