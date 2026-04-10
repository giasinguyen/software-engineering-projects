package com.minifood.userservice.service.impl;

import com.minifood.userservice.dto.request.LoginRequest;
import com.minifood.userservice.dto.request.RegisterRequest;
import com.minifood.userservice.dto.response.AuthResponse;
import com.minifood.userservice.dto.response.UserResponse;
import com.minifood.userservice.entity.User;
import com.minifood.userservice.exception.AppException;
import com.minifood.userservice.mapper.UserMapper;
import com.minifood.userservice.repository.UserRepository;
import com.minifood.userservice.security.JwtProvider;
import com.minifood.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username already exists", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email already exists", HttpStatus.CONFLICT);
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        String token = jwtProvider.generateToken(saved.getId(), saved.getUsername(), saved.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(userMapper.toResponse(saved))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException("Invalid username or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException("Invalid username or password", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userMapper.toResponseList(userRepository.findAll());
    }

    @Override
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return userMapper.toResponse(user);
    }
}
