package com.learning.enrollment_service.client;

import com.learning.enrollment_service.dto.CourseDTO;
import com.learning.enrollment_service.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

@FeignClient(name = "course-service", url = "${app.services.course.url}", configuration = FeignAuthInterceptor.class)
public interface CourseClient {
    @PostMapping("/graphql")
    Map<String, Object> executeGraphQL(@RequestBody Map<String, Object> requestBody, @RequestHeader(value = "Authorization", required = false) String authHeader);

    default CourseDTO getCourseById(Long id) {
        Logger log = LoggerFactory.getLogger(CourseClient.class);  // Tạo logger thủ công
        log.info("Fetching course by ID: {}", id);
        String query = String.format("{ getCourseById(id: %d) { id title description instructor { id fullName } price thumbnailUrl createdAt } }", id);
        Map<String, Object> request = Map.of("query", query);

        Map<String, Object> response;
        try {
            response = executeGraphQL(request, null);  // authHeader = null, để interceptor handle
        } catch (Exception e) {
            log.error("Feign call to course-service failed for course ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Feign call to course-service failed: " + e.getMessage(), e);
        }

        if (response.containsKey("errors")) {
            Object errors = response.get("errors");
            log.error("GraphQL error for course ID {}: {}", id, errors);
            throw new RuntimeException("GraphQL error in course-service: " + errors.toString());
        }

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data == null || !data.containsKey("getCourseById")) {
            log.warn("No course data found for ID: {}", id);
            return null;
        }

        Map<String, Object> courseMap = (Map<String, Object>) data.get("getCourseById");
        if (courseMap == null) {
            log.warn("Course map is null for ID: {}", id);
            return null;
        }

        CourseDTO course = new CourseDTO();

        Object idObj = courseMap.get("id");
        if (idObj != null) {
            if (idObj instanceof Number numId) {
                course.setCourseId(numId.longValue());
            } else if (idObj instanceof String idStr) {
                try {
                    course.setCourseId(Long.parseLong(idStr));
                } catch (NumberFormatException e) {
                    log.error("Invalid ID format from course-service for ID {}: {}", id, idStr);
                    throw new RuntimeException("Invalid ID format from course-service: " + idStr, e);
                }
            } else {
                course.setCourseId(null);
            }
        }

        course.setTitle((String) courseMap.get("title"));
        course.setDescription((String) courseMap.get("description"));
        Object priceObj = courseMap.get("price");
        if (priceObj != null) {
            if (priceObj instanceof Number numPrice) {
                course.setPrice(numPrice.toString());
            } else if (priceObj instanceof String priceStr) {
                course.setPrice(priceStr);
            } else {
                course.setPrice("0");
            }
        }

        course.setThumbnailUrl((String) courseMap.get("thumbnailUrl"));

        @SuppressWarnings("unchecked")
        Map<String, Object> instructorMap = (Map<String, Object>) courseMap.get("instructor");
        if (instructorMap != null) {
            UserDTO instructor = new UserDTO();
            Object instIdObj = instructorMap.get("id");
            if (instIdObj != null) {
                if (instIdObj instanceof Number numInstId) {
                    instructor.setId(numInstId.longValue());
                } else if (instIdObj instanceof String instIdStr) {
                    try {
                        instructor.setId(Long.parseLong(instIdStr));
                    } catch (NumberFormatException e) {
                        log.warn("Invalid instructor ID format: {}", instIdStr);
                        // Log nhưng continue, không throw
                    }
                }
            }
            instructor.setName((String) instructorMap.get("fullName"));
            course.setInstructor(instructor);
        }

        String createdAtStr = (String) courseMap.get("createdAt");
        if (createdAtStr != null && !createdAtStr.trim().isEmpty()) {
            try {
                // Thử parse ISO-8601 trước (mặc định)
                course.setCreatedAt(LocalDateTime.parse(createdAtStr));
            } catch (DateTimeParseException e) {
                try {
                    // Fallback: Giả sử format dd/MM/yyyy HH:mm:ss (thay bằng format thực tế từ course-service nếu khác)
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
                    course.setCreatedAt(LocalDateTime.parse(createdAtStr, formatter));
                } catch (DateTimeParseException e2) {
                    log.warn("Invalid createdAt format from course-service for course ID {}: {}. Skipping.", id, createdAtStr);
                    course.setCreatedAt(null);  // Fallback null thay vì throw
                }
            }
        } else {
            course.setCreatedAt(null);
        }

        log.info("Successfully fetched course: {}", course.getTitle());
        return course;
    }
}
