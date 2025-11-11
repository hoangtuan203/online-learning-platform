package com.learning.enrollment_service.dto;

import com.learning.enrollment_service.entity.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentProgressSummaryDTO {
    private Long id;
    private String contentItemId;
    private ContentType contentType;
    private Boolean completed;
    private Double score;
    private Integer durationSpent;
}