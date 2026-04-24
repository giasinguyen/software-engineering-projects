package com.example.cacheagent.config;

import com.hazelcast.config.Config;
import com.hazelcast.config.MapConfig;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class HazelcastConfig {

    @Value("${hazelcast.cache.map-name:app-cache}")
    private String mapName;

    @Value("${hazelcast.cache.ttl-seconds:300}")
    private int ttlSeconds;

    @Value("${hazelcast.cache.max-size:10000}")
    private int maxSize;

    /**
     * Embedded local Hazelcast instance — dùng cho demo/local dev.
     * IMap API hoàn toàn tương thích với Hazelcast Cloud client.
     */
    @Bean
    public HazelcastInstance hazelcastInstance() {
        Config config = new Config();
        config.setInstanceName("cache-agent-local");

        // Tắt multicast discovery để tránh noise trong log
        config.getNetworkConfig()
              .getJoin()
              .getMulticastConfig()
              .setEnabled(false);

        // Cấu hình IMap với TTL và max-size
        MapConfig mapConfig = new MapConfig(mapName);
        mapConfig.setTimeToLiveSeconds(ttlSeconds);
        mapConfig.getEvictionConfig()
                 .setSize(maxSize);

        config.addMapConfig(mapConfig);

        log.info("Khởi động Hazelcast embedded (local) - map: {}, ttl: {}s", mapName, ttlSeconds);
        HazelcastInstance instance = Hazelcast.newHazelcastInstance(config);
        log.info("Hazelcast embedded khởi động thành công!");

        return instance;
    }
}
