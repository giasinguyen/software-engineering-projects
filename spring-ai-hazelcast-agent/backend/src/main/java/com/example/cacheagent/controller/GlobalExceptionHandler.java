package com.example.cacheagent.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Xử lý tất cả exception tập trung, trả về JSON nhất quán.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Lỗi validation (request body không hợp lệ)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Không hợp lệ"
                ));

        return ResponseEntity.badRequest().body(Map.of(
            "status",    400,
            "source",    "agent",
            "message",   "Dữ liệu request không hợp lệ",
            "errors",    errors,
            "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Lỗi khi Read Service hoặc Write Service không phản hồi
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        log.error("[AGENT ERROR] {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
            "status",    503,
            "source",    "agent",
            "message",   ex.getMessage(),
            "timestamp", Instant.now().toString()
        ));
    }

    /**
     * Lỗi không xác định
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("[AGENT UNEXPECTED ERROR] {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(Map.of(
            "status",    500,
            "source",    "agent",
            "message",   "Lỗi hệ thống: " + ex.getMessage(),
            "timestamp", Instant.now().toString()
        ));
    }
}
