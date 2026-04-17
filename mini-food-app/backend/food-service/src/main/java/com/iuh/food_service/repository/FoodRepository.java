package com.iuh.food_service.repository;

import com.iuh.food_service.entity.Food;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FoodRepository extends MongoRepository<Food, String> {
}
