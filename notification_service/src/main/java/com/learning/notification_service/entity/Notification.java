package com.learning.notification_service.entity;

import com.fasterxml.jackson.databind.ObjectMapper; // Để convert JSON
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "notifications")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column
    private String link;

    @Column
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String dataJson; // Lưu dưới dạng JSON string, ví dụ: {"progress": 50}

    private static final ObjectMapper objectMapper = new ObjectMapper();

    // Set data từ Map (gọi khi tạo Notification)
    public void setData(Map<String, Object> data) {
        try {
            if (data != null && !data.isEmpty()) {
                this.dataJson = objectMapper.writeValueAsString(data);
            } else {
                this.dataJson = null;
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi convert Map to JSON", e);
        }
    }

    // Get data thành Map
    public Map<String, Object> getData() {
        if (this.dataJson == null || this.dataJson.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(this.dataJson, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi convert JSON to Map", e);
        }
    }
}