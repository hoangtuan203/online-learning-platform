package com.learning.enrollment_service.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    private Long id;

    private String title;

    private String description;

    private User instructor;

    private BigDecimal price = BigDecimal.ZERO;

    private String category;

    private String thumbnailUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

}