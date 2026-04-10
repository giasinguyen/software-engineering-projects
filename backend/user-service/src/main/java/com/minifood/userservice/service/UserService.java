package com.minifood.userservice.service;

import com.minifood.userservice.dto.request.LoginRequest;
import com.minifood.userservice.dto.request.RegisterRequest;
import com.minifood.userservice.dto.response.AuthResponse;
import com.minifood.userservice.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    List<UserResponse> getAllUsers();

    UserResponse getUserById(String id);
}
