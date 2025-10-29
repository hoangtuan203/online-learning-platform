package com.learning.course_service.repository;

import com.learning.course_service.entity.Course;
import feign.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByInstructorId(Long instructorId);
    List<Course> findByTitleContainingIgnoreCase(String title);
    @Query(value = "SELECT c FROM Course c WHERE " +
            "(:title IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
            "(:category IS NULL OR LOWER(c.category) LIKE LOWER(CONCAT('%', :category, '%')))",
            countQuery = "SELECT COUNT(c) FROM Course c WHERE " +
                    "(:title IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
                    "(:category IS NULL OR LOWER(c.category) LIKE LOWER(CONCAT('%', :category, '%')))")
    Page<Course> searchCourses(@Param("title") String title,
                               @Param("category") String category,
                               Pageable pageable);
}
