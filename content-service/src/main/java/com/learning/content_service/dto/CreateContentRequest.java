package com.learning.content_service.dto;

import com.learning.content_service.entity.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateContentRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private ContentType type;

    @NotBlank
    private String url;

    private Integer duration;  // Cho video

    @NotNull
    private Long courseId;  // FK đến course
}

