package com.example.cacheagent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class WriteRequest {

    @NotBlank(message = "Key không được trống")
    private String key;

    @NotNull(message = "Data không được null")
    private Map<String, Object> data;
}
