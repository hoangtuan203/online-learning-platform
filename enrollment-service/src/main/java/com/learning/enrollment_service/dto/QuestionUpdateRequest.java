package com.learning.enrollment_service.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionUpdateRequest {
    private String questionText;  // Nội dung mới, bắt buộc không rỗng
}