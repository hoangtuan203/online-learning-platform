package com.learning.enrollment_service.dto;

import lombok.Data;

@Data
public class CreateAnswerRequest {
    private Long questionId;
    private String answerText;
}