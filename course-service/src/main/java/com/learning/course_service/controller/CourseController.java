package com.learning.course_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.course_service.dto.CreateCourseRequest;
import com.learning.course_service.entity.Course;
import com.learning.course_service.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/create", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> createCourse(
            @RequestPart("data") String data,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        try {

            CreateCourseRequest request = objectMapper.readValue(data, CreateCourseRequest.class);

            Course created = courseService.createCourse(request, thumbnail);

            return ResponseEntity.ok(created);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi tạo khóa học: " + e.getMessage());
        }
    }
}