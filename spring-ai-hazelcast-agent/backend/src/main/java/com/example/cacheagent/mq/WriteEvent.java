package com.example.cacheagent.mq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Message gửi vào RabbitMQ cho mọi thao tác ghi (CREATE / UPDATE / DELETE).
 *
 * Consumer nhận message này và thực hiện ghi DB + đồng bộ cache
 * một cách bất đồng bộ (async write-through).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteEvent {

    /** Loại thao tác: "CREATE" | "UPDATE" | "DELETE" */
    private String type;

    /** Key của bản ghi cần ghi / xóa */
    private String key;

    /** Dữ liệu cần ghi (null với DELETE) */
    private Map<String, Object> data;

    /** Thời điểm publish (epoch ms) */
    private long timestamp;
}
