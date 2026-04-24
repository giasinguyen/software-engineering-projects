package com.example.cacheagent.config;

import com.hazelcast.client.HazelcastClient;
import com.hazelcast.client.config.ClientConfig;
import com.hazelcast.client.config.ClientConnectionStrategyConfig;
import com.hazelcast.core.HazelcastInstance;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class HazelcastConfig {

    @Value("${hazelcast.cloud.cluster-name}")
    private String clusterName;

    @Value("${hazelcast.cloud.discovery-token}")
    private String discoveryToken;

    /**
     * Tạo Hazelcast client kết nối đến Hazelcast Cloud.
     * Dùng smart routing để tự động kết nối đến member tối ưu nhất.
     */
    @Bean
    public HazelcastInstance hazelcastInstance() {
        ClientConfig config = new ClientConfig();

        // Kết nối Hazelcast Cloud
        config.getNetworkConfig()
              .getCloudConfig()
              .setEnabled(true)
              .setDiscoveryToken(discoveryToken);

        config.setClusterName(clusterName);

        // Cấu hình retry khi mất kết nối
        config.getConnectionStrategyConfig()
              .setReconnectMode(ClientConnectionStrategyConfig.ReconnectMode.ASYNC)
              .getConnectionRetryConfig()
              .setClusterConnectTimeoutMillis(10_000)
              .setInitialBackoffMillis(1000)
              .setMaxBackoffMillis(30_000)
              .setMultiplier(2.0);

        log.info("Đang kết nối Hazelcast Cloud - cluster: {}", clusterName);
        HazelcastInstance instance = HazelcastClient.newHazelcastClient(config);
        log.info("Kết nối Hazelcast Cloud thành công!");

        return instance;
    }
}
