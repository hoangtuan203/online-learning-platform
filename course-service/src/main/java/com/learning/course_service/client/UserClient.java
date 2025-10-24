package com.learning.course_service.client;

import com.learning.course_service.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "user-service",url = "${app.services.profile.url}")
public interface UserClient {

    public static final String APPLICATION_JSON = MediaType.APPLICATION_JSON_VALUE;

    @PostMapping(value = "/graphql", consumes = APPLICATION_JSON)
    Map<String, Object> executeGraphQL(@RequestBody Map<String, Object> requestBody);

    default UserDTO getUserById(Long id, String token) {
        Map<String, Object> variables = Map.of("id", id.toString());
        Map<String, Object> request = Map.of(
                "query", """
                query GetUser($id: ID!) {
                    getUserById(id: $id) { id username email role }
                }
                """,
                "variables", variables
        );

        try {
            Map<String, Object> response = executeGraphQL(request);
            return parseUserResponse(response);
        } catch (Exception e) {
            throw new RuntimeException("Feign call to user-service failed: " + e.getMessage());
        }
    }

    private UserDTO parseUserResponse(Map<String, Object> response) {
        if (response.get("errors") != null) {
            throw new RuntimeException("GraphQL error in user-service: " + response.get("errors"));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = (Map<String, Object>) data.get("getUserById");
        if (userMap == null) return null;

        UserDTO user = new UserDTO();
        user.setId(Long.valueOf((String) userMap.get("id")));
        user.setUsername((String) userMap.get("username"));
        user.setEmail((String) userMap.get("email"));
        user.setRole((String) userMap.get("role"));
        return user;
    }
}