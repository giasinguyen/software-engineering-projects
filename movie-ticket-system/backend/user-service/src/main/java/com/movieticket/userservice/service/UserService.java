package com.movieticket.userservice.service;

import com.movieticket.userservice.dto.LoginRequest;
import com.movieticket.userservice.dto.RegisterRequest;
import com.movieticket.userservice.entity.User;
import com.movieticket.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key.user-registered}")
    private String userRegisteredKey;

    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .build();

        user = userRepository.save(user);

        var event = Map.of(
                "event", "USER_REGISTERED",
                "userId", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail()
        );
        rabbitTemplate.convertAndSend(exchange, userRegisteredKey, event);
        log.info("Published USER_REGISTERED event for user: {}", user.getUsername());

        return user;
    }

    public User login(LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> u.getPassword().equals(request.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }
}
