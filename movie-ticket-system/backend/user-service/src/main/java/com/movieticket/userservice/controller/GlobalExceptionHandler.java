package com.movieticket.userservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        // Catch exceptions like "Username already exists" and return them as a 400 Bad Request
        // with a JSON body so the React frontend can extract err.response.data.message
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
