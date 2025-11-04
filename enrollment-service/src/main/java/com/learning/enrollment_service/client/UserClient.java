package com.learning.enrollment_service.client;

import com.learning.enrollment_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${app.services.user.url}")
public interface UserClient  {
    @GetMapping("/users/{userId}")
    ResponseEntity<UserResponse> getUserById(@PathVariable("userId") Long userId);
}
