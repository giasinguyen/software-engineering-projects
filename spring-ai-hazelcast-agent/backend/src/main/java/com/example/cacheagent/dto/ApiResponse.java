package com.example.cacheagent.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /** Nguồn dữ liệu: "cache" hoặc "database" */
    private String source;

    /** Dữ liệu thực sự trả về */
    private T data;

    /** HTTP status code */
    private int status;

    /** Thông báo mô tả kết quả */
    private String message;

    /** Thời gian xử lý (ms) */
    private Long latencyMs;

    /** Thời điểm response */
    @Builder.Default
    private Instant timestamp = Instant.now();

    /** Tên operation: READ, WRITE, DELETE */
    private String operation;

    // ─── Factory methods ──────────────────────────────────────────────────────

    public static <T> ApiResponse<T> fromCache(T data, long latencyMs) {
        return ApiResponse.<T>builder()
                .source("cache")
                .data(data)
                .status(200)
                .message("Dữ liệu từ Hazelcast Cache")
                .latencyMs(latencyMs)
                .operation("READ")
                .build();
    }

    public static <T> ApiResponse<T> fromDatabase(T data, long latencyMs) {
        return ApiResponse.<T>builder()
                .source("database")
                .data(data)
                .status(200)
                .message("Dữ liệu từ Database (đã lưu vào cache)")
                .latencyMs(latencyMs)
                .operation("READ")
                .build();
    }

    public static <T> ApiResponse<T> written(T data, long latencyMs, String operation) {
        return ApiResponse.<T>builder()
                .source("database")
                .data(data)
                .status(200)
                .message("Ghi thành công. Cache đã đồng bộ.")
                .latencyMs(latencyMs)
                .operation(operation)
                .build();
    }

    public static <T> ApiResponse<T> deleted(long latencyMs) {
        return ApiResponse.<T>builder()
                .source("database")
                .status(200)
                .message("Xóa thành công. Cache đã invalidate.")
                .latencyMs(latencyMs)
                .operation("DELETE")
                .build();
    }

    public static <T> ApiResponse<T> notFound(String key) {
        return ApiResponse.<T>builder()
                .source("database")
                .status(404)
                .message("Không tìm thấy dữ liệu với key: " + key)
                .operation("READ")
                .build();
    }

    /**
     * Response trả về khi write request được đưa vào MQ (Async Write-Through).
     * HTTP 202 Accepted – dữ liệu sẽ được ghi bởi consumer bất đồng bộ.
     */
    public static <T> ApiResponse<T> queued(String key, String operation, long latencyMs) {
        return ApiResponse.<T>builder()
                .source("mq")
                .status(202)
                .message("Đã gửi vào RabbitMQ. Consumer đang xử lý bất đồng bộ...")
                .latencyMs(latencyMs)
                .operation(operation)
                .build();
    }
}
