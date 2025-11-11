package com.learning.user_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learning.user_service.dto.*;
import com.learning.user_service.entity.User;
import com.learning.user_service.service.CloudinaryService;
import com.learning.user_service.service.UserService;
import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.text.ParseException;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;

    @Autowired
    private final RestTemplate restTemplate;


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

            User createdUser = userService.createUserWithOtp(request);
            return ResponseEntity.ok(Map.of("message", "Tài khoản đã tạo, kiểm tra email để nhận OTP", "email", createdUser.getEmail()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi tạo user: " + e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body("Email và OTP không được null");
        }

        boolean isValid = userService.verifyOtp(email, otp);
        if (isValid) {
            return ResponseEntity.ok(Map.of("message", "Xác thực thành công! Bạn có thể đăng nhập."));
        } else {
            return ResponseEntity.badRequest().body("OTP không hợp lệ hoặc hết hạn");
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


    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof DefaultOAuth2User oAuth2User) {
            String email = oAuth2User.getAttribute("email");
            Optional<User> user = userService.findByEmail(email);  // Thêm method findByEmail trong UserService
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            }
        }
        return ResponseEntity.notFound().build();
    }


    @PostMapping("/oauth2/callback/google")
    public ResponseEntity<?> handleGoogleCallback(@RequestBody Map<String, String> body) {

        return userService.authenticateWithGoogle(body.get("code"));
    }

    //login facebook
    @PostMapping("/oauth2/callback/facebook")
    public ResponseEntity<?> handleFacebookCallback(@RequestBody Map<String, String> body) {
        return userService.authenticateWithFacebook(body.get("code"));
    }


    @PostMapping("/refresh")
    ApiResponse<AuthResponse> authenticate(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        var result = userService.refreshToken(request);
        return ApiResponse.<AuthResponse>builder().result(result).build();
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

    @GetMapping("/{userId}")
    public ResponseEntity<?> findUserById(@PathVariable Long userId) {
        var result = userService.getInfoUserById(userId);
        return ResponseEntity.ok(result);
    }


    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        try {
            UserResponse updatedUser = userService.updateUser(id, request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi cập nhật user: " + e.getMessage());
        }
    }

}
