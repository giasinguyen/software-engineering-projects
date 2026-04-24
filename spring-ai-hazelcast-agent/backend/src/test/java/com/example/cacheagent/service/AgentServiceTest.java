package com.example.cacheagent.service;

import com.example.cacheagent.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentServiceTest {

    @Mock CacheService cacheService;
    @Mock ReadService  readService;
    @Mock WriteService writeService;

    @InjectMocks AgentService agentService;

    private Map<String, Object> sampleData;

    @BeforeEach
    void setUp() {
        sampleData = Map.of("name", "Minh", "age", 28);
    }

    // ─── READ: Cache HIT ──────────────────────────────────────────────────────

    @Test
    @DisplayName("READ: Cache HIT → không gọi Read Service")
    void read_cacheHit_shouldNotCallReadService() {
        when(cacheService.get("user:1001")).thenReturn(sampleData);

        ApiResponse<Map<String, Object>> response = agentService.read("user:1001");

        assertThat(response.getSource()).isEqualTo("cache");
        assertThat(response.getData()).isEqualTo(sampleData);
        assertThat(response.getStatus()).isEqualTo(200);

        verify(readService, never()).findByKey(any());
        verify(cacheService, never()).put(any(), any());
    }

    // ─── READ: Cache MISS ─────────────────────────────────────────────────────

    @Test
    @DisplayName("READ: Cache MISS → gọi DB → lưu cache → trả về database")
    void read_cacheMiss_shouldCallDbAndPutCache() {
        when(cacheService.get("user:1001")).thenReturn(null);
        when(readService.findByKey("user:1001")).thenReturn(sampleData);

        ApiResponse<Map<String, Object>> response = agentService.read("user:1001");

        assertThat(response.getSource()).isEqualTo("database");
        assertThat(response.getData()).isEqualTo(sampleData);

        verify(readService).findByKey("user:1001");
        verify(cacheService).put("user:1001", sampleData);
    }

    // ─── READ: Not Found ──────────────────────────────────────────────────────

    @Test
    @DisplayName("READ: Cache MISS + DB không có → trả về 404")
    void read_notFound_shouldReturn404() {
        when(cacheService.get("user:9999")).thenReturn(null);
        when(readService.findByKey("user:9999")).thenReturn(null);

        ApiResponse<Map<String, Object>> response = agentService.read("user:9999");

        assertThat(response.getStatus()).isEqualTo(404);
        assertThat(response.getData()).isNull();
        verify(cacheService, never()).put(any(), any());
    }

    // ─── CREATE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("CREATE: ghi DB thành công → lưu vào cache")
    void create_shouldWriteDbAndPutCache() {
        when(writeService.create("user:1001", sampleData)).thenReturn(sampleData);

        ApiResponse<Map<String, Object>> response = agentService.create("user:1001", sampleData);

        assertThat(response.getSource()).isEqualTo("database");
        assertThat(response.getOperation()).isEqualTo("CREATE");
        verify(writeService).create("user:1001", sampleData);
        verify(cacheService).put("user:1001", sampleData);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("UPDATE: cập nhật DB thành công → cập nhật cache")
    void update_shouldWriteDbAndUpdateCache() {
        Map<String, Object> updated = Map.of("name", "Minh Updated", "age", 29);
        when(writeService.update("user:1001", updated)).thenReturn(updated);

        ApiResponse<Map<String, Object>> response = agentService.update("user:1001", updated);

        assertThat(response.getSource()).isEqualTo("database");
        assertThat(response.getOperation()).isEqualTo("UPDATE");
        verify(cacheService).put("user:1001", updated);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE: xóa DB thành công → evict cache")
    void delete_shouldDeleteDbAndEvictCache() {
        doNothing().when(writeService).delete("user:1001");

        ApiResponse<Void> response = agentService.delete("user:1001");

        assertThat(response.getOperation()).isEqualTo("DELETE");
        verify(writeService).delete("user:1001");
        verify(cacheService).evict("user:1001");
    }
}
