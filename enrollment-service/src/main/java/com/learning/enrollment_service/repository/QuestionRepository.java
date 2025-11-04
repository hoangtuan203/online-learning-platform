package com.learning.enrollment_service.repository;

import com.learning.enrollment_service.entity.Answer;
import com.learning.enrollment_service.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByEnrollmentIdAndContentIdOrderByCreatedAtAsc(Long enrollmentId, String contentId);
    List<Question> findByEnrollmentIdOrderByCreatedAtAsc(Long enrollmentId);
    @Query("SELECT q FROM Question q WHERE q.courseId = :courseId AND q.contentId = :contentId ORDER BY q.createdAt DESC")
    List<Question> findByCourseIdAndContentIdOrderByCreatedAtDesc(@Param("courseId") Long courseId, @Param("contentId") String contentId);
    @Query("SELECT q FROM Question q LEFT JOIN FETCH q.likes WHERE q.id = :id")
    Optional<Question> findByIdWithLikes(@Param("id") Long id);
}