package com.iuh.food_service.config;

import com.iuh.food_service.entity.Food;
import com.iuh.food_service.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final FoodRepository foodRepository;

    @Override
    public void run(String... args) {
        if (foodRepository.count() > 0) {
            log.info("Database đã có {} món ăn, bỏ qua seed data.", foodRepository.count());
            return;
        }

        List<Food> foods = List.of(
            Food.builder().name("Phở Bò").description("Phở bò truyền thống Hà Nội").price(new BigDecimal("45000")).category("Món chính").available(true).build(),
            Food.builder().name("Cơm Tấm Sườn").description("Cơm tấm sườn bì chả, đặc sản Sài Gòn").price(new BigDecimal("40000")).category("Món chính").available(true).build(),
            Food.builder().name("Bún Bò Huế").description("Bún bò cay nồng đặc trưng Huế").price(new BigDecimal("42000")).category("Món chính").available(true).build(),
            Food.builder().name("Bánh Mì Thịt").description("Bánh mì kẹp thịt với rau và nước sốt").price(new BigDecimal("25000")).category("Ăn nhẹ").available(true).build(),
            Food.builder().name("Gỏi Cuốn").description("Gỏi cuốn tôm thịt tươi mát").price(new BigDecimal("30000")).category("Ăn nhẹ").available(true).build(),
            Food.builder().name("Trà Đá").description("Trà đá giải khát").price(new BigDecimal("5000")).category("Đồ uống").available(true).build(),
            Food.builder().name("Cà Phê Sữa Đá").description("Cà phê sữa đá phin truyền thống").price(new BigDecimal("20000")).category("Đồ uống").available(true).build(),
            Food.builder().name("Chè Ba Màu").description("Chè ba màu thập cẩm").price(new BigDecimal("18000")).category("Tráng miệng").available(true).build()
        );

        foodRepository.saveAll(foods);
        log.info("Đã seed {} món ăn vào database.", foods.size());
    }
}
