package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentStatusDTO {
    private boolean isEnrolled;
    private String status;  // PENDING, ACTIVE, COMPLETED nếu enrolled
    private String enrollmentId;  // UUID nếu enrolled
}