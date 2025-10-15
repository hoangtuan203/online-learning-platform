package com.learning.course_service.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseDTO {
    Long courseId;
    String title;
    String description;
    String price;
    String thumbnailUrl;
    Long instructorId;
    LocalDateTime createdAt;
}