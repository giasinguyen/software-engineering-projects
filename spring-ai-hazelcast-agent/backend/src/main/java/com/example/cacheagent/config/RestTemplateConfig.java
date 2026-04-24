package com.example.cacheagent.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Value("${read-service.timeout-ms:3000}")
    private int readTimeoutMs;

    @Value("${write-service.timeout-ms:5000}")
    private int writeTimeoutMs;

    @Bean("readRestTemplate")
    public RestTemplate readRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(readTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }

    @Bean("writeRestTemplate")
    public RestTemplate writeRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(writeTimeoutMs);
        factory.setReadTimeout(writeTimeoutMs);
        return new RestTemplate(factory);
    }
}
