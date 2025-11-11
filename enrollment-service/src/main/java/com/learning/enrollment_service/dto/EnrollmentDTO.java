package com.learning.enrollment_service.dto;

import com.learning.enrollment_service.entity.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDTO {
    private Long id;
    private Long userId;
    private Long courseId;
    private String thumbnailUrl;
    private String courseTitle;
    private String instructorName;
    private LocalDateTime enrollmentDate;
    private LocalDateTime startDate;
    private LocalDateTime completedDate;
    private EnrollmentStatus status;
    private Integer progressPercentage;
    private Integer totalContentItems;
    private String currentContentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<EnrollmentProgressSummaryDTO> progressSummaries;
}