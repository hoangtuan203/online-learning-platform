package com.learning.course_service.dto;

import com.learning.course_service.entity.Course;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Optional;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CoursePage {
    private List<Course> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
