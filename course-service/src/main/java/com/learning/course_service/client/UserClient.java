package com.learning.course_service.client;

import com.learning.course_service.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "user-service")
public interface UserClient {

    @PostMapping("/graphql")
    Map<String, Object> executeGraphQL(@RequestBody Map<String, Object> requestBody, @RequestHeader(value = "Authorization", required = false) String authHeader);

    default UserDTO getUserById(Long id, String token) {
        String query = String.format("{ getUserById(id: %d) { id username email role } }", id);
        Map<String, Object> request = Map.of("query", query);

        String authHeader = (token != null && !token.isEmpty()) ? "Bearer " + token : null;

        Map<String, Object> response;
        try {
            response = executeGraphQL(request, authHeader);
        } catch (Exception e) {
            throw new RuntimeException("Feign call to user-service failed: " + e.getMessage());
        }

        if (response.containsKey("errors")) {
            Object errors = response.get("errors");
            throw new RuntimeException("GraphQL error in user-service: " + errors.toString());
        }
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data == null || !data.containsKey("getUserById")) {
            return null;
        }

        Map<String, Object> userMap = (Map<String, Object>) data.get("getUserById");
        UserDTO user = new UserDTO();

        Object idObj = userMap.get("id");
        if (idObj instanceof String idStr) {
            try {
                user.setId(Long.parseLong(idStr));
            } catch (NumberFormatException e) {
                throw new RuntimeException("Invalid ID format from user-service: " + idStr);
            }
        } else {
            user.setId(null);
        }

        user.setUsername((String) userMap.get("username"));
        user.setEmail((String) userMap.get("email"));
        user.setRole((String) userMap.get("role"));
        return user;
    }
}