package com.learning.user_service.dto;

import com.learning.user_service.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddUserRequest {
    String username;
    String password;
    String name;
    String email;
    User.Role role;
    String avatarUrl;
}
