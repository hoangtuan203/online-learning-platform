package com.learning.enrollment_service.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "enrollments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDateTime enrollmentDate = LocalDateTime.now();

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.PENDING;

    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;

    @Column(name = "total_content_items", nullable = false)
    private Integer totalContentItems = 0;

    @Column(name = "current_content_id")
    private String currentContentId;


    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Version
    private Integer version;

    @OneToMany(mappedBy = "enrollment", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    @ToString.Exclude
    private List<EnrollmentProgress> enrollmentProgresses = new ArrayList<>();

    public void calculateProgress() {
        if (totalContentItems > 0) {
            long completedCount = enrollmentProgresses.stream()
                    .filter(EnrollmentProgress::getCompleted)
                    .count();
            this.progressPercentage = (int) ((completedCount * 100) / totalContentItems);
        } else {
            this.progressPercentage = 0;
        }
        if (this.progressPercentage >= 100) {
            this.status = EnrollmentStatus.COMPLETED;
            this.completedDate = LocalDateTime.now();
        }
    }
}

