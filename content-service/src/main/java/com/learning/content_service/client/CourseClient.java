package com.learning.content_service.client;

import com.learning.content_service.dto.CourseDTO;
import com.learning.content_service.dto.UserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
@FeignClient(name = "course-service")
public interface CourseClient {

    @PostMapping("/graphql")
    Map<String, Object> executeGraphQL(@RequestBody Map<String, Object> requestBody, @RequestHeader(value = "Authorization", required = false) String authHeader);

    default CourseDTO getCourseById(Long id, String token) {
        String query = String.format("{ getCourseById(id: %d) { id title description instructor { id fullName } price thumbnailUrl createdAt } }", id);
        Map<String, Object> request = Map.of("query", query);

        String authHeader = (token != null && !token.isEmpty()) ? "Bearer " + token : null;

        Map<String, Object> response;
        try {
            response = executeGraphQL(request, authHeader);
        } catch (Exception e) {
            throw new RuntimeException("Feign call to course-service failed: " + e.getMessage(), e);
        }

        if (response.containsKey("errors")) {
            Object errors = response.get("errors");
            throw new RuntimeException("GraphQL error in course-service: " + errors.toString());
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data == null || !data.containsKey("getCourseById")) {
            return null;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> courseMap = (Map<String, Object>) data.get("getCourseById");
        if (courseMap == null) {
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
                        // Log nhưng continue
                    }
                }
            }
            instructor.setFullName((String) instructorMap.get("fullName"));
            course.setInstructor(instructor);
        }

        // Parse createdAt
        String createdAtStr = (String) courseMap.get("createdAt");
        if (createdAtStr != null) {
            try {
                course.setCreatedAt(LocalDateTime.parse(createdAtStr));  // Giả sử method là setCreatedAt
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Invalid createdAt format from course-service: " + createdAtStr, e);
            }
        }

        return course;
    }
}