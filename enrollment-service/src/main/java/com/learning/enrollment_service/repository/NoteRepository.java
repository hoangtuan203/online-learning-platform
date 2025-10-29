package com.learning.enrollment_service.repository;

import com.learning.enrollment_service.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByEnrollmentIdOrderByCreatedAtDesc(Long enrollmentId);
    List<Note> findByEnrollmentIdAndContentIdOrderByCreatedAtDesc(Long enrollmentId, String contentId); // Existing

    @Query("SELECT n FROM Note n WHERE n.enrollment.id = :enrollmentId " +
            "AND (:contentId IS NULL OR n.contentId = :contentId) " +
            "ORDER BY n.createdAt " + // Dynamic sort based on param
            "DESC")
    List<Note> findByEnrollmentIdAndOptionalContentIdOrderByCreatedAtDesc(
            @Param("enrollmentId") Long enrollmentId,
            @Param("contentId") String contentId);

    @Query("SELECT n FROM Note n WHERE n.enrollment.id = :enrollmentId " +
            "AND (:contentId IS NULL OR n.contentId = :contentId) " +
            "ORDER BY n.createdAt ASC")
    List<Note> findByEnrollmentIdAndOptionalContentIdOrderByCreatedAtAsc(
            @Param("enrollmentId") Long enrollmentId,
            @Param("contentId") String contentId);

    Optional<Note> findByIdAndEnrollmentId(Long noteId, Long enrollmentId);
}