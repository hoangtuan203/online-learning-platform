package com.learning.notification_service.dto;

import com.learning.notification_service.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCreateRequest {
    private String userId;

    private NotificationType type;

    private String title;

    private String message;

    private String link;

    private Map<String, Object> data;
}