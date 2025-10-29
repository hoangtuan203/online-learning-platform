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
public class NoteResponse {
    private Long id;
    private String contentId;
    private String contentTitle;
    private String courseTitle;
    private String timestamp;
    private String noteText;
    private LocalDateTime createdAt;
}