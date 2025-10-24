package com.learning.content_service.dto;

import com.learning.content_service.entity.QuizQuestion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContentRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotNull(message = "Loại nội dung không được để trống")
    private String type; // VIDEO, DOCUMENT, QUIZ

    private String url;

    private Integer duration;

    @NotBlank(message = "Course ID không được để trống")
    private String courseId;

    private String thumbnail;

    private String level;

    private java.util.List<String> tags;
    private List<QuizQuestion> questions;
}