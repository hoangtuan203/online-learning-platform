package com.learning.content_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder

@NoArgsConstructor
@AllArgsConstructor
public class ContentUploadRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    @NotNull(message = "Loại nội dung không được để trống")
    private String type;

    @NotBlank(message = "URL video không được để trống")
    private String videoUrl;

    private String thumbnailUrl;

    private String videoPublicId;

    private String thumbnailPublicId;

    private Integer duration;
    @NotBlank(message = "Course ID không được để trống")
    private String courseId;

    private String level;

    private java.util.List<String> tags;
}