package com.learning.enrollment_service.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "enrollment_progress")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    @ToString.Exclude
    private Enrollment enrollment;

    @Column(name = "content_item_id", nullable = false)
    private String contentItemId;  // ID từ Content Service

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType = ContentType.VIDEO;

    @Column(name = "completed")
    private Boolean completed = false;

    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    @Column(name = "score")
    private Double score;

    @Column(name = "duration_spent")
    private Integer durationSpent = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void updateCompletion(Double newScore, Integer newDuration) {
        this.durationSpent = newDuration != null ? newDuration : this.durationSpent;
        this.updatedAt = LocalDateTime.now();

        switch (contentType) {
            case QUIZ:
                if (newScore != null && newScore >= 70.0) {
                    this.completed = true;
                    this.completedDate = LocalDateTime.now();
                    this.score = newScore;
                }
                break;
            case VIDEO:
            case STREAM:

                this.completed = true;
                this.completedDate = LocalDateTime.now();
                break;
            case DOCUMENT:
                this.completed = true;
                this.completedDate = LocalDateTime.now();
                break;
            default:
                break;
        }

    }
}

