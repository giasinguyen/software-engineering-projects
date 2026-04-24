package com.example.cacheagent.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Value("${read-service.timeout-ms:3000}")
    private int readTimeoutMs;

    @Value("${write-service.timeout-ms:5000}")
    private int writeTimeoutMs;

    @Bean("readRestTemplate")
    public RestTemplate readRestTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofMillis(readTimeoutMs))
                .readTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }

    @Bean("writeRestTemplate")
    public RestTemplate writeRestTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofMillis(writeTimeoutMs))
                .readTimeout(Duration.ofMillis(writeTimeoutMs))
                .build();
    }
}
