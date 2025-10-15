package com.learning.user_service.dto;

import com.learning.user_service.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private User user;
    private boolean authenticated = true;
    private String expiryTime;
}