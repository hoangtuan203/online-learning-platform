package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QAPayload {
    private Long id;
    private Long questionId;
    private String answerText;
    private Long answeredBy;
    private String answererName;  // Thêm nếu cần
    private LocalDateTime createdAt;
    private String enrollmentId;  // Để route consumer
    private String contentId;  // Để filter per content
}