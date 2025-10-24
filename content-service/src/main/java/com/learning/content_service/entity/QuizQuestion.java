package com.learning.content_service.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {
    @NotBlank(message = "Câu hỏi không được để trống")
    private String questionText;

    @NotNull(message = "Danh sách đáp án không được để trống")
    private List<String> options;

    @NotNull(message = "Đáp án đúng không được để trống")
    private Integer correctOptionIndex;
}
