package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentProgressDTO {
    private String contentId;
    private String title; // Optional, if fetched from ContentClient
    private String type; // VIDEO, QUIZ, etc.
    private Boolean completed;
    private Double score; // For QUIZ
    private Integer durationSpent; // For VIDEO
}