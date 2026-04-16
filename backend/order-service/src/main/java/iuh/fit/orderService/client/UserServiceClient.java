package iuh.fit.orderService.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;

/**
 * Client gọi User Service để validate user.
 * User Service cần expose: GET /users/{id}
 * Response cần có: id, username (hoặc name)
 *
 * URL cấu hình trong application.properties:
 *   app.user-service.url=http://192.168.x.x:8081  (LAN)
 *   app.user-service.url=http://localhost:8081     (local dev)
 */
@Slf4j
@Component
public class UserServiceClient {

    private final WebClient webClient;

    public UserServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${app.user-service.url}") String userServiceUrl) {
        this.webClient = webClientBuilder
                .baseUrl(userServiceUrl)
                .build();
        log.info("UserServiceClient → {}", userServiceUrl);
    }

    /**
     * Validate user theo ID.
     * Trả về Map chứa thông tin user, hoặc null nếu không tồn tại / lỗi.
     * Timeout: 5s, Retry: 3 lần với backoff 1s.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserById(String userId) {
        try {
            Map<String, Object> user = webClient.get()
                    .uri("/users/{id}", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                            .doBeforeRetry(signal -> log.warn("Retry #{} gọi User Service cho userId={}",
                                    signal.totalRetries() + 1, userId)))
                    .block();
            log.info("Validate user thành công: userId={}", userId);
            return user;
        } catch (Exception e) {
            log.error("Không thể validate user [id={}]: {}", userId, e.getMessage());
            return null;
        }
    }
}
