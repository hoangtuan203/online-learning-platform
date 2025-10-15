package com.learning.course_service.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.learning.course_service.dto.UserDTO;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    @JsonBackReference
    private Instructor instructor;

    @Column(precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;  // SỬA: Thay Double bằng BigDecimal

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private UserDTO instructorDTO;

    public UserDTO getInstructorDTO() {
        return instructorDTO;
    }

    public void setInstructorDTO(UserDTO instructorDTO) {
        this.instructorDTO = instructorDTO;
    }
}