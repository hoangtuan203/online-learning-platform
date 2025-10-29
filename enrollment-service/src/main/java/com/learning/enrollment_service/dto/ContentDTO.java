package com.learning.enrollment_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentDTO {
    private String id;
    private String type;
    private String title;
    private LocalDateTime createdAt;

}
