package com.learning.content_service.dto;

import com.learning.content_service.entity.QuizQuestion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentResponse {

    private String id;

    private String title;

    private String description;

    private String type;

    private String url;

    private Integer duration;

    private String courseId;

    private String thumbnail;

    private String level;

    private java.util.List<String> tags;
    private java.util.List<QuizQuestion> questions;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String error;
}
