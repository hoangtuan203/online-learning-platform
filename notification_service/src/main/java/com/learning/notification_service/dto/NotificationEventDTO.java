package com.learning.notification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEventDTO {
    private String type; // e.g., "QUESTION_ANSWERED"
    private Long targetUserId; // ID người nhận (người hỏi câu hỏi)
    private Long questionId;
    private Long answerId;
    private String message; // e.g., "Câu hỏi của bạn đã được trả lời bởi [Tên người trả lời]"
    private String answererName;
    private LocalDateTime timestamp;
}