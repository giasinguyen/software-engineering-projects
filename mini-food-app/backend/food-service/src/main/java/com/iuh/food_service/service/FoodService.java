package com.iuh.food_service.service;

import java.util.List;

import com.iuh.food_service.dto.request.FoodRequest;
import com.iuh.food_service.entity.Food;

public interface FoodService {

    Food createFood(FoodRequest request);

    List<Food> getAllFoods();

    Food getFoodById(String id);

    Food updateFood(String id, FoodRequest request);

    void deleteFood(String id);
}
