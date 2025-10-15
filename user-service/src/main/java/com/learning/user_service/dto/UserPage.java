package com.learning.user_service.dto;

import com.learning.user_service.entity.User;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserPage {
    private List<UserResponse> user;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
