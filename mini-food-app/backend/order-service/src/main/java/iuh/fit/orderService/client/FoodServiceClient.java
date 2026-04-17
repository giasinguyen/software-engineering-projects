package iuh.fit.orderService.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Client gọi Food Service để lấy thông tin món ăn.
 * Food Service cần expose: GET /api/foods/{id}
 * Response cần có: id, name, price
 *
 * URL cấu hình trong application.properties:
 *   app.food-service.url=http://192.168.x.x:8082  (LAN)
 *   app.food-service.url=http://localhost:8082     (local dev)
 */
@Slf4j
@Component
public class FoodServiceClient {

    private final WebClient webClient;

    public FoodServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${app.food-service.url}") String foodServiceUrl) {
        this.webClient = webClientBuilder
                .baseUrl(foodServiceUrl)
                .build();
        log.info("FoodServiceClient → {}", foodServiceUrl);
    }

    /**
     * Lấy thông tin món ăn theo ID.
     * Trả về Map<String, Object> để linh hoạt với mọi cấu trúc response của Food Service.
     * Trả về null nếu không tìm thấy hoặc lỗi.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getFoodById(String foodId) {
        try {
            Map<String, Object> food = webClient.get()
                    .uri("/api/foods/{id}", foodId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            log.info("Lấy thông tin food thành công: foodId={}", foodId);
            return food;
        } catch (Exception e) {
            log.error("Không thể lấy thông tin food [id={}]: {}", foodId, e.getMessage());
            return null;
        }
    }
}
