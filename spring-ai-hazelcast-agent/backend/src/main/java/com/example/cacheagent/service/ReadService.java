package com.example.cacheagent.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service giao tiếp với Read Service để lấy dữ liệu từ database.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReadService {

    @Qualifier("readRestTemplate")
    private final RestTemplate restTemplate;

    @Value("${read-service.base-url}")
    private String baseUrl;

    /**
     * Lấy dữ liệu theo key từ Read Service.
     * @return dữ liệu dạng Map, hoặc null nếu không tìm thấy
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> findByKey(String key) {
        String url = baseUrl + "/api/data/" + key;
        log.debug("[READ SERVICE] GET {}", url);

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            log.debug("[READ SERVICE] Response status={} key={}", response.getStatusCode(), key);
            return response.getBody();

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("[READ SERVICE] Key không tồn tại: {}", key);
            return null;

        } catch (Exception e) {
            log.error("[READ SERVICE] Lỗi khi đọc key={}: {}", key, e.getMessage());
            throw new RuntimeException("Read Service không phản hồi: " + e.getMessage(), e);
        }
    }
}
