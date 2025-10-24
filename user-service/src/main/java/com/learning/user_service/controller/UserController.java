package com.learning.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.user_service.dto.*;
import com.learning.user_service.entity.User;
import com.learning.user_service.service.CloudinaryService;
import com.learning.user_service.service.UserService;
import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.text.ParseException;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;


    @PutMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String avatarUrl = userService.uploadAvatar(id, file);
            return ResponseEntity.ok(avatarUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload thất bại: " + e.getMessage());
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody AddUserRequest request) {
        try {
            if (request.getEmail() == null || request.getPassword() == null) {
                return ResponseEntity.badRequest().body("Email và password không được null");
            }

            User savedUser = userService.addUser(request);
            return ResponseEntity.ok(savedUser);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi tạo user: " + e.getMessage());
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            if (request == null || request.getUsername() == null || request.getPassword() == null) {
                return ResponseEntity.badRequest().body("Username and password cannot be null");
            }
            AuthResponse authResponse = userService.authenticate(request);
            return ResponseEntity.ok(authResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid input: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = userService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }


    @GetMapping
    public ResponseEntity<?> findAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        try {
            UserPage userPage = userService.findAllUsers(page, size);
            return ResponseEntity.ok(userPage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi lấy danh sách user: " + e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        try {
            User.Role enumRole = (role != null && !role.isEmpty()) ? User.Role.valueOf(role.toUpperCase()) : null;
            UserPage userPage = userService.searchUsers(name, enumRole, page, size);
            return ResponseEntity.ok(userPage);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ (có thể role không tồn tại): " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi tìm kiếm user: " + e.getMessage());
        }
    }


}
