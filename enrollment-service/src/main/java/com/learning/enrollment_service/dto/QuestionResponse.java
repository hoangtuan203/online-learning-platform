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
public class QuestionResponse {
    private Long id;
    private String authorName;
    private String authorAvatar;
    private String contentId;
    private String questionText;
    private Boolean answered;
    private LocalDateTime createdAt;

    private Integer likeCount;
    private Boolean liked;
}