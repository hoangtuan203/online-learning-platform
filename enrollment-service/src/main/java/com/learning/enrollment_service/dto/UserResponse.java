package com.learning.enrollment_service.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String name;
    String password;
    String email;
    String role;
    String avatarUrl;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
