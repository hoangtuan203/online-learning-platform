package com.learning.enrollment_service.repository;

import com.learning.enrollment_service.entity.Enrollment;
import com.learning.enrollment_service.entity.EnrollmentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollProgressRepository extends JpaRepository<EnrollmentProgress, Long> {
    List<EnrollmentProgress> findByEnrollment(Enrollment enrollment);
    Optional<EnrollmentProgress> findByEnrollmentIdAndContentItemId(Long enrollmentId, String contentItemId);
}