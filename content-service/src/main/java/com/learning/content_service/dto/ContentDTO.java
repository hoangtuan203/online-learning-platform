package com.learning.content_service.dto;

import com.learning.content_service.entity.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentDTO {
    private String id;
    private String title;
    private String description;
    private ContentType type;
    private String url;
    private Integer duration;
    private Long courseId;
    private LocalDateTime createdAt;
}