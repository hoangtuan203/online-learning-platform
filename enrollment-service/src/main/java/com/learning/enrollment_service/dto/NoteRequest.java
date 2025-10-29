package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteRequest {
    private String contentId;
    private String contentTitle;
    private String courseTitle;
    private String timestamp;
    private String noteText;
}