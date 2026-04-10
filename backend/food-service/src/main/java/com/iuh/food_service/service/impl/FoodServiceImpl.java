package com.iuh.food_service.service.impl;

import java.util.List;

import com.iuh.food_service.dto.request.FoodRequest;
import com.iuh.food_service.entity.Food;
import com.iuh.food_service.exception.ResourceNotFoundException;
import com.iuh.food_service.repository.FoodRepository;
import com.iuh.food_service.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FoodServiceImpl implements FoodService {

    private final FoodRepository foodRepository;

    @Override
    public Food createFood(FoodRequest request) {
        Food food = Food.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .available(request.getAvailable())
                .build();

        return foodRepository.save(food);
    }

    @Override
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    @Override
    public Food getFoodById(String id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found with id: " + id));
    }

    @Override
    public Food updateFood(String id, FoodRequest request) {
        Food food = getFoodById(id);

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setCategory(request.getCategory());
        food.setAvailable(request.getAvailable());

        return foodRepository.save(food);
    }

    @Override
    public void deleteFood(String id) {
        Food food = getFoodById(id);
        foodRepository.delete(food);
    }
}
