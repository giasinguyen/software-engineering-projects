package com.iuh.food_service.controller;

import java.util.List;

import com.iuh.food_service.dto.request.FoodRequest;
import com.iuh.food_service.entity.Food;
import com.iuh.food_service.service.FoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @PostMapping
    public ResponseEntity<Food> createFood(@Valid @RequestBody FoodRequest request) {
        Food created = foodService.createFood(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Food>> getAllFoods() {
        return ResponseEntity.ok(foodService.getAllFoods());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Food> getFoodById(@PathVariable String id) {
        return ResponseEntity.ok(foodService.getFoodById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Food> updateFood(@PathVariable String id, @Valid @RequestBody FoodRequest request) {
        return ResponseEntity.ok(foodService.updateFood(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable String id) {
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}
