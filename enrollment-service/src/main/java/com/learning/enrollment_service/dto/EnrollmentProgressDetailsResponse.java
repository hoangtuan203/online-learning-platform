package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentProgressDetailsResponse {
    private Long enrollmentId;
    private String status; // EnrollmentStatus.name()
    private Integer progressPercentage;
    private Integer totalContentItems;
    private Integer completedContentItems;
    private String currentContentId; // ID of current unfinished content
    private List<ContentProgressDTO> contents; // List of all contents with completion status
}