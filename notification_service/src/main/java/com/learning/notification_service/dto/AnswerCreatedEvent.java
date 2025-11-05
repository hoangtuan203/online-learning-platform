package com.learning.notification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerCreatedEvent {
    private String id = UUID.randomUUID().toString();
    private String questionId;
    private String answerId;
    private String ownerId;
    private String replierId;
    private String createdAt = LocalDateTime.now().toString();
}