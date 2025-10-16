package com.learning.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.user_service.dto.AddUserRequest;
import com.learning.user_service.entity.User;
import com.learning.user_service.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final ObjectMapper objectMapper;
    private final UserService userService;

    @PostMapping(value = "/create", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> createCourse(
            @RequestPart("data") String data,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar
    ) {
        try {
            AddUserRequest request = objectMapper.readValue(data, AddUserRequest.class);
            User created = userService.addUser(request, avatar);
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi tạo khóa học: " + e.getMessage());
        }
    }
}
